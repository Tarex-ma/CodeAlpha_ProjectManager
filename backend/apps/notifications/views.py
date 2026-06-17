"""
apps/notifications/views.py
─────────────────────────────
NotificationViewSet

  GET    /api/v1/notifications/                  list (own, paginated)
  GET    /api/v1/notifications/{id}/             retrieve one
  PATCH  /api/v1/notifications/{id}/read/        mark one as read
  POST   /api/v1/notifications/mark-all-read/    mark all unread as read
  DELETE /api/v1/notifications/{id}/             delete one
  DELETE /api/v1/notifications/clear/            delete all read

Query params supported on list:
  ?unread=true       — only unread
  ?type=task_assigned|comment_added|project_invitation|task_status_changed
"""

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Notification, NotificationType
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ViewSet):

    permission_classes = [IsAuthenticated]
    http_method_names  = ["get", "post", "patch", "delete", "head", "options"]

    # ── Shared queryset ────────────────────────────────────────────────────

    def _get_queryset(self):
        qs = Notification.objects.for_recipient(self.request.user)

        unread = self.request.query_params.get("unread")
        ntype  = self.request.query_params.get("type")

        if unread and unread.lower() == "true":
            qs = qs.unread()
        if ntype and ntype in NotificationType.values:
            qs = qs.of_type(ntype)

        return qs

    def _get_notification(self, pk: int) -> Notification:
        return get_object_or_404(
            Notification.objects.for_recipient(self.request.user),
            pk=pk,
        )

    # ── LIST ──────────────────────────────────────────────────────────────

    def list(self, request: Request, **kwargs) -> Response:
        """
        GET /api/v1/notifications/

        Returns the authenticated user's notifications, newest first.
        Includes X-Unread-Count header for badge display.

        Query params:
          ?unread=true
          ?type=task_assigned|comment_added|project_invitation|task_status_changed

        Response 200:
        {
          "unread_count": 3,
          "results": [ { "id": 1, "message": "...", "is_read": false, ... }, ... ]
        }
        """
        notifications = self._get_queryset()
        unread_count  = Notification.objects.unread_count(request.user)

        return Response({
            "unread_count": unread_count,
            "results": NotificationSerializer(notifications, many=True).data,
        })

    # ── RETRIEVE ──────────────────────────────────────────────────────────

    def retrieve(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        GET /api/v1/notifications/{id}/

        Response 200: single notification object
        """
        notification = self._get_notification(pk)
        return Response(NotificationSerializer(notification).data)

    # ── MARK ONE READ ──────────────────────────────────────────────────────

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        PATCH /api/v1/notifications/{id}/read/

        Marks a single notification as read.
        No request body required.

        Response 200: updated notification object
        """
        notification = self._get_notification(pk)
        notification.mark_read()
        return Response(NotificationSerializer(notification).data)

    # ── MARK ALL READ ──────────────────────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request: Request, **kwargs) -> Response:
        """
        POST /api/v1/notifications/mark-all-read/

        Marks all unread notifications for the user as read in one DB query.
        No request body required.

        Response 200: { "marked_read": 5 }
        """
        count = Notification.bulk_mark_read(request.user)
        return Response({"marked_read": count})

    # ── DELETE ONE ─────────────────────────────────────────────────────────

    def destroy(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        DELETE /api/v1/notifications/{id}/

        Permanently deletes a single notification.
        Response 204: (no body)
        """
        notification = self._get_notification(pk)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── CLEAR READ ─────────────────────────────────────────────────────────

    @action(detail=False, methods=["delete"], url_path="clear")
    def clear_read(self, request: Request, **kwargs) -> Response:
        """
        DELETE /api/v1/notifications/clear/

        Deletes all READ notifications for the user (inbox cleanup).
        Unread notifications are never deleted by this endpoint.

        Response 200: { "deleted": 12 }
        """
        count, _ = (
            Notification.objects
            .for_recipient(request.user)
            .read()
            .delete()
        )
        return Response({"deleted": count})
