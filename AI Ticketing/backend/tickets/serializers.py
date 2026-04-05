from rest_framework import serializers
from .models import Ticket, AssigneeTicket

class TicketSerializer(serializers.ModelSerializer):
    notifications = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ('status', 'created_at', 'category', 'summary', 'severity', 'resolution', 'sentiment', 'department', 'employee', 'confidence', 'estimated_time')

    def get_notifications(self, obj):
        # Return all notifications for this ticket backwards sorted
        notifs = obj.notifications.all().order_by('-created_at')
        return [{"id": n.id, "message": n.message, "is_read": n.is_read, "date": n.created_at} for n in notifs]

class AssigneeTicketSerializer(serializers.ModelSerializer):
    ticket = TicketSerializer(read_only=True)
    class Meta:
        model = AssigneeTicket
        fields = ('id', 'ticket', 'assignee_email', 'assigned_at', 'notes', 'is_active')
