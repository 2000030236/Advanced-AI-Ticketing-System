from django.urls import path
from .views import (
    TicketCreateView, TicketFeedbackView, AssigneeTicketsView, TicketStatusUpdateView, 
    AssigneeTicketNoteUpdateView, CustomerLoginView, CustomerRegisterView, 
    CustomerDashboardView, TicketDeleteView, MarkNotificationsReadView, AdminDashboardView, AnalyticsView
)

urlpatterns = [
    path('auth/register/', CustomerRegisterView.as_view(), name='customer-register'),
    path('auth/login/', CustomerLoginView.as_view(), name='customer-login'),
    path('auth/dashboard/', CustomerDashboardView.as_view(), name='customer-dashboard'),
    path('tickets/', TicketCreateView.as_view(), name='ticket-create'),
    path('tickets/<int:pk>/', TicketDeleteView.as_view(), name='ticket-delete'),
    path('tickets/<int:pk>/notifications/read/', MarkNotificationsReadView.as_view(), name='mark-notifications-read'),

    path('tickets/<int:pk>/feedback/', TicketFeedbackView.as_view(), name='ticket-feedback'),
    path('tickets/<int:pk>/status/', TicketStatusUpdateView.as_view(), name='ticket-status'),
    path('assignee/tickets/', AssigneeTicketsView.as_view(), name='assignee-tickets'),
    path('assignee/tickets/<int:pk>/notes/', AssigneeTicketNoteUpdateView.as_view(), name='assignee-ticket-notes'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
