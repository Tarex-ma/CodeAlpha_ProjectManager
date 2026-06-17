from django.urls import path
from .dashboard_views import DashboardStatsView, DashboardActivityView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('activity/', DashboardActivityView.as_view(), name='dashboard-activity'),
]
