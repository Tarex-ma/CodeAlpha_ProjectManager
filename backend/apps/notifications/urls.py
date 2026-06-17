"""
apps/notifications/urls.py
────────────────────────────
  GET    /api/v1/notifications/
  GET    /api/v1/notifications/{id}/
  PATCH  /api/v1/notifications/{id}/read/
  POST   /api/v1/notifications/mark-all-read/
  DELETE /api/v1/notifications/{id}/
  DELETE /api/v1/notifications/clear/

Wire into config/urls.py:
  path("api/v1/notifications/", include("apps.notifications.urls")),
"""

from django.urls import path
from .views import NotificationViewSet

notification_list   = NotificationViewSet.as_view({"get": "list"})
notification_detail = NotificationViewSet.as_view({"get": "retrieve", "delete": "destroy"})
mark_read           = NotificationViewSet.as_view({"patch": "mark_read"})
mark_all_read       = NotificationViewSet.as_view({"post": "mark_all_read"})
clear_read          = NotificationViewSet.as_view({"delete": "clear_read"})

urlpatterns = [
    path("",                  notification_list,   name="notification-list"),
    path("mark-all-read/",    mark_all_read,        name="notification-mark-all-read"),
    path("clear/",            clear_read,           name="notification-clear"),
    path("<int:pk>/",         notification_detail,  name="notification-detail"),
    path("<int:pk>/read/",    mark_read,            name="notification-mark-read"),
]
