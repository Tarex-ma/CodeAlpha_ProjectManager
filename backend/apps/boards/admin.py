from django.contrib import admin
from .models import Board


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display  = ["title", "project", "position", "created_at"]
    list_filter   = ["project"]
    search_fields = ["title", "project__title"]
    ordering      = ["project", "position"]
    readonly_fields = ["created_at", "updated_at"]
