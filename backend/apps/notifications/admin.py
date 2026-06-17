from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display   = ["id", "recipient", "actor", "notification_type", "short_message", "is_read", "created_at"]
    list_filter    = ["notification_type", "is_read", "created_at"]
    search_fields  = ["recipient__email", "actor__email", "message"]
    readonly_fields = ["created_at", "content_type", "object_id"]

    def short_message(self, obj):
        return obj.message[:70] + "…" if len(obj.message) > 70 else obj.message
    short_message.short_description = "Message"