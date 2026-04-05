from django.db import models
from django.contrib.auth.models import User

class Ticket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    STATUS_CHOICES = [
        ('Raised', 'Raised'),
        ('Assigned', 'Assigned'),
        ('In Progress', 'In Progress'),
        ('Solved', 'Solved'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='New')
    created_at = models.DateTimeField(auto_now_add=True)

    # AI Analysis Fields
    category = models.CharField(max_length=100, null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    severity = models.CharField(max_length=50, null=True, blank=True)
    resolution = models.CharField(max_length=50, null=True, blank=True)
    sentiment = models.CharField(max_length=50, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    employee = models.CharField(max_length=255, null=True, blank=True)  # Keeping as string/null for now
    confidence = models.FloatField(null=True, blank=True)
    # Module 2: Auto-resolution & Feedback
    ai_answer = models.TextField(null=True, blank=True)
    is_helpful = models.BooleanField(null=True, blank=True)
    estimated_time = models.CharField(max_length=100, null=True, blank=True)
    assigned_profile = models.JSONField(null=True, blank=True)
    is_auto_resolved = models.BooleanField(default=False)
    is_escalated = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class AssigneeTicket(models.Model):
    """
    A separate table to store assignments for employees.
    Provides role-based access to tickets for specific assignees.
    """
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='assignments')
    assignee_email = models.EmailField()
    assigned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.assignee_email} assigned to {self.ticket.title}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"To {self.user.username}: {self.message}"

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('assignee', 'Assignee'),
        ('admin', 'Admin'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')

    def __str__(self):
        return f"{self.user.username} - {self.role}"
