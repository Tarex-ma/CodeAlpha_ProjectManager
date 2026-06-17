from django.contrib import admin
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display   = ["id", "task", "author", "short_content", "is_edited", "created_at"]
    list_filter    = ["is_edited", "created_at"]
    search_fields  = ["content", "author__email", "task__title"]
    readonly_fields = ["created_at", "updated_at", "is_edited"]

    def short_content(self, obj):
        return obj.content[:60] + "…" if len(obj.content) > 60 else obj.content
    short_content.short_description = "Content"