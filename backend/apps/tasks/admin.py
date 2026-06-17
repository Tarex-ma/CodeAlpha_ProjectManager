from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display  = ["title", "board", "assignee", "priority", "status", "due_date", "position"]
    list_filter   = ["priority", "status", "due_date"]
    search_fields = ["title", "description", "assignee__email"]
    readonly_fields = ["created_at", "updated_at", "created_by"]
    ordering      = ["board__position", "position"]
    autocomplete_fields = ["assignee"]

    fieldsets = (
        (None, {
            "fields": ("title", "description", "board", "project")
        }),
        ("Assignment", {
            "fields": ("assignee", "created_by")
        }),
        ("Status", {
            "fields": ("priority", "status", "due_date")
        }),
        ("Ordering", {
            "fields": ("position",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )