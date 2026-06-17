"""
apps/notifications/serializers.py
────────────────────────────────────
NotificationSerializer    — read: full representation
MarkReadSerializer        — write: mark one notification read
MarkAllReadSerializer     — write: mark all unread as read (no input needed)
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Notification

User = get_user_model()


# ── Embedded actor summary ────────────────────────────────────────────────

class NotificationActorSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields


# ── Read ──────────────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    """
    Full notification representation.

    target_type and target_id let the frontend construct a deep-link URL
    (e.g. navigate to the relevant task or project) without having to
    parse the message string.
    """

    actor       = NotificationActorSerializer(read_only=True)
    target_type = serializers.SerializerMethodField()
    target_id   = serializers.IntegerField(source="object_id", read_only=True)

    class Meta:
        model  = Notification
        fields = [
            "id",
            "actor",
            "notification_type",
            "message",
            "is_read",
            "target_type",
            "target_id",
            "created_at",
        ]
        read_only_fields = fields

    def get_target_type(self, obj: Notification) -> str | None:
        if obj.content_type:
            return obj.content_type.model   # e.g. "task", "comment", "project"
        return None


# ── Mark one read ─────────────────────────────────────────────────────────

class MarkReadSerializer(serializers.Serializer):
    """
    PATCH /api/v1/notifications/{id}/read/
    No body required — presence of the request is the signal.
    """
    pass


# ── Mark all read ─────────────────────────────────────────────────────────

class MarkAllReadSerializer(serializers.Serializer):
    """
    POST /api/v1/notifications/mark-all-read/
    No body required.
    """
    pass