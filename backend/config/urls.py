"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Import dashboard view classes
from apps.projects.dashboard_views import DashboardStatsView, DashboardActivityView

from apps.tasks.views import TaskViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/projects/", include("apps.projects.urls")),
    path("api/v1/tasks/my/", TaskViewSet.as_view({"get": "my"}), name="task-my"),
    path("api/v1/tasks/", include("apps.tasks.urls")),
    path("api/v1/comments/", include("apps.comments.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    # Dashboard endpoints
    path("api/v1/dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("api/v1/dashboard/activity/", DashboardActivityView.as_view(), name="dashboard-activity"),
    # Global task endpoints (recent)
    path("api/v1/tasks/recent/", TaskViewSet.as_view({"get": "recent"}), name="task-recent"),
]
