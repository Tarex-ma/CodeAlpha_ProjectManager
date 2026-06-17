from django.contrib import admin

# Register your models here.
"""
apps/projects/admin.py
"""

from django.contrib import admin
from .models import Project, ProjectMember


class ProjectMemberInline(admin.TabularInline):
    model       = ProjectMember
    extra       = 0
    fields      = ["user", "role", "joined_at"]
    readonly_fields = ["joined_at"]
    autocomplete_fields = ["user"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display  = ["title", "owner", "member_count", "created_at"]
    list_filter   = ["created_at"]
    search_fields = ["title", "owner__email"]
    readonly_fields = ["created_at", "updated_at"]
    inlines       = [ProjectMemberInline]

    def member_count(self, obj):
        return obj.projectmember_set.count()
    member_count.short_description = "Members"


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display  = ["user", "project", "role", "joined_at"]
    list_filter   = ["role"]
    search_fields = ["user__email", "project__title"]
    readonly_fields = ["joined_at"]