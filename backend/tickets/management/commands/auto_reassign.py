import json
import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tickets.models import Ticket, AssigneeTicket, Notification
from tickets.ai_service import AIService

class Command(BaseCommand):
    help = 'Automatically reassigns High or Critical tickets that have not been moved to In Progress within 2 hours.'

    def handle(self, *args, **options):
        # 2 hours threshold
        threshold_time = timezone.now() - timedelta(hours=2)

        # Query tickets with high/critical severity that are not In Progress/Solved
        # and were either created/assigned more than 2 hours ago
        tickets_to_check = Ticket.objects.filter(
            severity__in=['HIGH', 'CRITICAL']
        ).exclude(
            status__in=['In Progress', 'Solved']
        ).filter(
            created_at__lt=threshold_time
        )

        if not tickets_to_check.exists():
            self.stdout.write(self.style.SUCCESS('No tickets require reassignment at this time.'))
            return

        # Load Employee Directory
        dir_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'employees.json')
        try:
            with open(dir_path, 'r') as f:
                employee_directory = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to load employee directory: {str(e)}'))
            return

        for ticket in tickets_to_check:
            self.stdout.write(f'Reassigning Ticket: {ticket.id} - {ticket.title}')

            # Deactivate current assignment if it exists
            current_assignment = AssigneeTicket.objects.filter(ticket=ticket, is_active=True).first()
            current_email = current_assignment.assignee_email if current_assignment else None

            # Prepare reassignment context (exclude current employee if possible)
            filtered_directory = [e for e in employee_directory if e['email'] != current_email]
            
            ticket_context = {
                "department": ticket.department,
                "issue_summary": ticket.summary,
                "required_skills": [ticket.category]
            }

            try:
                assignment = AIService.assign_employee(ticket_context, filtered_directory)
                
                if assignment.selected_employee:
                    if current_assignment:
                        current_assignment.is_active = False
                        current_assignment.save()

                    # Save new employee info to ticket
                    ticket.employee = f"{assignment.selected_employee.name} ({assignment.selected_employee.email})"
                    
                    profile = next((e for e in employee_directory if e['email'] == assignment.selected_employee.email), None)
                    if profile:
                        ticket.assigned_profile = profile
                    
                    ticket.status = 'Assigned' # Reset status to Assigned
                    ticket.save()

                    # Create new AssigneeTicket
                    AssigneeTicket.objects.create(
                        ticket=ticket,
                        assignee_email=assignment.selected_employee.email,
                        notes=f"Automatically reassigned from {current_email} due to inactivity."
                    )

                    # Notify user
                    if ticket.user:
                        Notification.objects.create(
                            user=ticket.user,
                            ticket=ticket,
                            message=f"Your ticket '{ticket.title}' has been automatically reassigned to {assignment.selected_employee.name} to ensure a faster resolution."
                        )

                    self.stdout.write(self.style.SUCCESS(f'Successfully reassigned ticket {ticket.id} to {assignment.selected_employee.email}'))
                else:
                    self.stdout.write(self.style.WARNING(f'No alternative employee found for reassignment of ticket {ticket.id}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to reassign ticket {ticket.id}: {str(e)}'))
