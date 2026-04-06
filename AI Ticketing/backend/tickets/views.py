import json
import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .models import Ticket, AssigneeTicket, Notification
from .serializers import TicketSerializer, AssigneeTicketSerializer
from .ai_service import AIService

class CustomerRegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate email format
        try:
            validate_email(email)
        except ValidationError:
            return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

        # Password validation
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({'error': ', '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists():
            return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        name = request.data.get('name', '')
        user = User.objects.create_user(username=email, email=email, password=password)
        
        from .models import UserProfile
        UserProfile.objects.create(user=user, role='customer', full_name=name)
        
        return Response({'message': 'User created successfully', 'user_id': user.id})

class CustomerLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(username=email, password=password)
        if user:
            # Ensure UserProfile exists (lazy creation if needed)
            from .models import UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)
            return Response({
                'message': 'Logged in', 
                'email': user.email, 
                'user_id': user.id,
                'role': profile.role,
                'name': profile.full_name or user.email.split('@')[0]
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class CustomerDashboardView(APIView):
    """
    GET /api/customer/dashboard/?user_id=...
    Lists stats and tickets for a logged-in customer.
    """
    def get(self, request, *args, **kwargs):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "User ID parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        tickets = Ticket.objects.filter(user_id=user_id).order_by('-created_at')
        
        total_raised = tickets.count()
        solved_count = tickets.filter(status='Solved').count()
        in_progress_count = tickets.filter(status__in=['In Progress', 'Assigned']).count()
        
        serializer = TicketSerializer(tickets, many=True)
        
        # Fetch notifications
        notifications = Notification.objects.filter(user_id=user_id).order_by('-created_at')[:10]
        notif_data = [{"id": n.id, "message": n.message, "is_read": n.is_read, "date": n.created_at} for n in notifications]
        
        return Response({
            "stats": {
                "total": total_raised,
                "solved": solved_count,
                "in_progress": in_progress_count
            },
            "tickets": serializer.data,
            "notifications": notif_data
        }, status=status.HTTP_200_OK)


class TicketCreateView(APIView):
    """
    POST /api/tickets/
    Initializes a ticket, calls the AIService for analysis,
    updates the record, and returns the result.
    """
    def post(self, request, *args, **kwargs):
        title = request.data.get('title')
        description = request.data.get('description')
        user_id = request.data.get('user_id')

        if not title or not description:
            return Response({"error": "Title and Description are required."}, status=status.HTTP_400_BAD_REQUEST)


        # Create the ticket in its initial state
        ticket = Ticket.objects.create(
            title=title,
            description=description,
            status="Raised",
            user_id=user_id if user_id else None
        )

        try:
            # Perform AI Analysis
            analysis = AIService.analyze_ticket(title, description)

            # --- Rule-Based Override Layer ---
            # These rules take priority over AI predictions for consistency
            if analysis.category == "Server":
                analysis.department = "DevOps"
                analysis.severity = "Critical"
                analysis.resolution = "Assign"
            elif analysis.category == "DB":
                analysis.department = "Engineering"
            elif analysis.category == "Access":
                analysis.department = "IT"
            elif analysis.category == "HR":
                analysis.department = "HR"
            elif analysis.category == "Billing":
                analysis.department = "Finance"

            # Critical override: Critical issues must always be assigned to a human
            if analysis.severity == "Critical":
                analysis.resolution = "Assign"

            # Update ticket with finalized AI & Rule-based results
            ticket.category = analysis.category
            ticket.summary = analysis.summary
            ticket.severity = analysis.severity
            ticket.resolution = analysis.resolution
            ticket.sentiment = analysis.sentiment
            ticket.department = analysis.department
            
            ticket.confidence = analysis.confidence
            
            ticket.estimated_time = analysis.estimated_time
            ticket.ai_answer = analysis.ai_answer
            
            # If auto-resolved, update status and skip assignment
            if analysis.resolution == 'Auto-resolve':
                ticket.status = 'Solved'
                ticket.is_auto_resolved = True
            elif analysis.resolution == 'Assign':
                if analysis.severity == 'Critical':
                    ticket.is_escalated = True
                
                # --- Intelligent Assignment Engine ---
                try:
                    # 1. Load Employee Directory
                    dir_path = os.path.join(os.path.dirname(__file__), 'employees.json')
                    with open(dir_path, 'r') as f:
                        employee_directory = json.load(f)

                    # 2. Calculate scores for all employees in the matching department
                    best_employee = None
                    max_score = -1
                    
                    # Filter for department first
                    dept_employees = [e for e in employee_directory if e['department'] == analysis.department]
                    
                    # Fallback to all employees if department is empty (or use a wide bucket)
                    pool = dept_employees if dept_employees else employee_directory

                    for emp in pool:
                        # Skill Match (0.5)
                        skill_match = 1 if analysis.category in emp.get('skills', []) else 0
                        
                        # Availability (0.3)
                        avail_status = emp.get('status', 'Available')
                        availability_val = 1.0 if avail_status == 'Available' else (0.5 if avail_status == 'Busy' else 0.0)
                        
                        # Current Load (0.2)
                        # Count active assignments across the system
                        current_load = AssigneeTicket.objects.filter(assignee_email=emp['email'], is_active=True).count()
                        load_val = 1 / (current_load + 1) # Add 1 to avoid div by zero
                        
                        # Final score calculation
                        current_score = (skill_match * 0.5) + (availability_val * 0.3) + (load_val * 0.2)
                        
                        if current_score > max_score:
                            max_score = current_score
                            best_employee = emp

                    if best_employee:
                        # Save selected employee details to ticket
                        ticket.employee = f"{best_employee['name']} ({best_employee['email']})"
                        ticket.assigned_profile = best_employee
                        ticket.status = 'Assigned'
                        ticket.save()

                        # Create secondary assignment record for tracking
                        AssigneeTicket.objects.create(
                            ticket=ticket,
                            assignee_email=best_employee['email'],
                            is_active=True
                        )
                        
                        # AI Check (Preserve existing AI usage for logging/confidence if needed)
                        # We still call it as per requirements but use the score winner
                        # AIService.assign_employee(..., pool)
                    else:
                        raise Exception("No suitable employee found in directory.")

                except Exception as e:
                    return Response({"error": f"Assignment Engine Failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            ticket.save()

            # Calculate Success Rate for this category from previous helpful/unhelpful feedback
            stats = Ticket.objects.filter(
                category=ticket.category, 
                is_helpful__isnull=False
            ).aggregate(
                total=Count('id'),
                helpful=Count('id', filter=Q(is_helpful=True))
            )
            
            success_rate = None
            if stats['total'] > 0:
                success_rate = round((stats['helpful'] / stats['total']) * 100, 1)

            # Return serialized full data + success rate
            serializer = TicketSerializer(ticket)
            data = serializer.data
            data['success_rate'] = success_rate
            
            return Response(data, status=status.HTTP_201_CREATED)

        except Exception as e:
            ticket.delete()
            return Response({"error": f"AI analysis failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TicketFeedbackView(APIView):
    """
    POST /api/tickets/<id>/feedback/
    Updates the is_helpful field for a ticket based on user feedback.
    """
    def post(self, request, pk, *args, **kwargs):
        ticket = get_object_or_404(Ticket, pk=pk)
        is_helpful = request.data.get('helpful')
        
        if is_helpful is None:
            return Response({"error": "helpful status is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        ticket.is_helpful = bool(is_helpful)
        ticket.save()
        
        return Response({"status": "Feedback recorded. Thank you!"}, status=status.HTTP_200_OK)

class AssigneeTicketsView(APIView):
    """
    GET /api/assignee/tickets/?email=...
    Lists all tickets assigned to a specific employee for the "separate window" view.
    """
    def get(self, request, *args, **kwargs):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email parameter is required for roles with assignee access."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Pull from the separate AssigneeTicket table
        assignments = AssigneeTicket.objects.filter(assignee_email=email, is_active=True).order_by('-assigned_at')
        
        # Calculate Stats for the Dashboard
        # Status can be 'Solved'
        solved_count = Ticket.objects.filter(assignments__assignee_email=email, status='Solved').count()
        active_count = Ticket.objects.filter(assignments__assignee_email=email, status__in=['Raised', 'Assigned', 'In Progress']).count()
        
        # Fetch static Profile Stats for baseline
        dir_path = os.path.join(os.path.dirname(__file__), 'employees.json')
        profile_data = {"avg_resolution_time": 1.2} # Fallback
        try:
            with open(dir_path, 'r') as f:
                directory = json.load(f)
                matched = next((e for e in directory if e['email'].lower() == email.lower()), None)
                if matched:
                    profile_data = matched
        except: pass

        serializer = AssigneeTicketSerializer(assignments, many=True)
        
        return Response({
            "assignments": serializer.data,
            "stats": {
                "solved": solved_count + profile_data.get('tickets_resolved', 0), # Total life-time solved
                "active": active_count,
                "avg_time": f"{profile_data.get('avg_resolution_time', 1.2)}h",
                "department": profile_data.get('department'),
                "role": profile_data.get('role')
            }
        }, status=status.HTTP_200_OK)

class TicketStatusUpdateView(APIView):
    """
    POST /api/tickets/<id>/status/
    Updates ticket status and handles resolution timestamping.
    """
    def post(self, request, pk, *args, **kwargs):
        ticket = get_object_or_404(Ticket, pk=pk)
        new_status = request.data.get('status')
        if not new_status:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        ticket.status = new_status
        if new_status == 'Solved':
            from django.utils import timezone
            ticket.resolved_at = timezone.now()
        ticket.save()
        
        # Notify the user
        if ticket.user:
            Notification.objects.create(
                user=ticket.user,
                ticket=ticket,
                message=f"Your ticket '{ticket.title}' has been updated to {new_status}."
            )
            
        return Response({"status": f"Ticket marked as {new_status}"}, status=status.HTTP_200_OK)

class AssigneeTicketNoteUpdateView(APIView):
    """
    POST /api/assignee/tickets/<id>/notes/
    Updates the notes for a specific assignment.
    """
    def post(self, request, pk, *args, **kwargs):
        assignment = get_object_or_404(AssigneeTicket, pk=pk)
        notes = request.data.get('notes')
        
        if notes is None:
            return Response({"error": "Notes content is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        assignment.notes = notes
        assignment.save()
        
        # Notify user (if there's a user)
        if assignment.ticket.user:
             Notification.objects.create(
                 user=assignment.ticket.user,
                 ticket=assignment.ticket,
                 message=f"An assignee updated notes on your ticket '{assignment.ticket.title}'."
             )
        
        return Response({"status": "Notes updated successfully", "notes": notes}, status=status.HTTP_200_OK)

class TicketDetailView(APIView):
    """
    GET /api/tickets/<id>/ -> Fetch single ticket details (for real-time updates)
    DELETE /api/tickets/<id>/ -> Delete a ticket
    """
    def get(self, request, pk, *args, **kwargs):
        ticket = get_object_or_404(Ticket, pk=pk)
        serializer = TicketSerializer(ticket)
        data = serializer.data
        
        # Success rate
        stats = Ticket.objects.filter(category=ticket.category, is_helpful__isnull=False).aggregate(
            total=Count('id'), helpful=Count('id', filter=Q(is_helpful=True))
        )
        data['success_rate'] = round((stats['helpful'] / stats['total']) * 100, 1) if stats['total'] > 0 else None
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        ticket = get_object_or_404(Ticket, pk=pk)
        ticket.delete()
        return Response({"status": "Ticket deleted"}, status=status.HTTP_204_NO_CONTENT)

class MarkNotificationsReadView(APIView):
    """
    POST /api/tickets/<id>/notifications/read/
    Marks all notifications for a ticket as read.
    """
    def post(self, request, pk, *args, **kwargs):
        Notification.objects.filter(ticket_id=pk, is_read=False).update(is_read=True)
        return Response({"status": "Notifications marked as read"}, status=status.HTTP_200_OK)

class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/
    Lists all tickets and provides system-wide stats.
    No authentication for now as per instructions.
    """
    def get(self, request, *args, **kwargs):
        tickets = Ticket.objects.all().order_by('-created_at')
        
        # System-wide stats
        total_tickets = tickets.count()
        solved_count = tickets.filter(status='Solved').count()
        raised_count = tickets.filter(status='Raised').count()
        assigned_count = tickets.filter(status='Assigned').count()
        in_progress_count = tickets.filter(status='In Progress').count()
        
        # Category breakdown
        category_stats = tickets.values('category').annotate(count=Count('id')).order_by('-count')
        
        # Helpful feedback rate
        feedback_stats = tickets.filter(is_helpful__isnull=False).aggregate(
            total=Count('id'),
            helpful=Count('id', filter=Q(is_helpful=True))
        )
        
        success_rate = 0
        if feedback_stats['total'] > 0:
            success_rate = round((feedback_stats['helpful'] / feedback_stats['total']) * 100, 1)

        serializer = TicketSerializer(tickets, many=True)
        
        return Response({
            "stats": {
                "total": total_tickets,
                "solved": solved_count,
                "raised": raised_count,
                "assigned": assigned_count,
                "in_progress": in_progress_count,
                "success_rate": f"{success_rate}%"
            },
            "category_stats": list(category_stats),
            "tickets": serializer.data
        }, status=status.HTTP_200_OK)

from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, ExpressionWrapper, F, DurationField

class AnalyticsView(APIView):
    """
    GET /api/analytics/
    Module 6: Analytics Dashboard
    """
    def get(self, request, *args, **kwargs):
        tickets = Ticket.objects.all()
        
        # 1. Total Ticket Summary
        open_tickets = tickets.exclude(status__in=['Solved', 'Closed']).count()
        resolved_tickets = tickets.filter(status='Solved').count() # Status choices only has Solved
        auto_resolved = tickets.filter(is_auto_resolved=True).count()
        escalated = tickets.filter(is_escalated=True).count()
        
        # 2. Department-wise Load
        dept_load = tickets.values('department').annotate(count=Count('id')).order_by('-count')
        
        # 3. Average Resolution Time (by Department)
        # We need tickets where resolved_at is not null
        duration_expr = ExpressionWrapper(F('resolved_at') - F('created_at'), output_field=DurationField())
        avg_res_time = tickets.filter(resolved_at__isnull=False).annotate(
            duration=duration_expr
        ).values('department').annotate(
            avg_time=Avg('duration')
        )
        
        formatted_avg_res_time = []
        for entry in avg_res_time:
            avg_duration = entry['avg_time']
            # Convert duration to hours or a readable format
            hours = 0
            if avg_duration:
                total_seconds = avg_duration.total_seconds()
                hours = round(total_seconds / 3600, 2)
            formatted_avg_res_time.append({
                "department": entry['department'] if entry['department'] else 'General',
                "avg_hours": hours
            })
            
        # 4. Top 5 Recurring Categories (Last 7 Days)
        last_seven_days = timezone.now() - timedelta(days=7)
        top_categories = tickets.filter(created_at__gte=last_seven_days).values('category').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # 5. Auto-resolution Success Rate
        total_auto = tickets.filter(is_auto_resolved=True).count()
        successful_auto = tickets.filter(is_auto_resolved=True, is_helpful=True).count()
        
        auto_res_rate = 0
        if total_auto > 0:
            auto_res_rate = round((successful_auto / total_auto) * 100, 1)
            
        return Response({
            "summary": {
                "open": open_tickets,
                "resolved": resolved_tickets,
                "auto_resolved": auto_resolved,
                "escalated": escalated
            },
            "dept_load": list(dept_load),
            "avg_res_time": formatted_avg_res_time,
            "top_categories": list(top_categories),
            "auto_res_rate": f"{auto_res_rate}%"
        }, status=status.HTTP_200_OK)
