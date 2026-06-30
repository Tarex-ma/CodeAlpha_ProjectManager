from django.contrib import admin
from .models import Team, TeamMember, TeamInvitation

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at", "updated_at")
    search_fields = ("name",)

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("user", "team", "role", "joined_at", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("user__email", "team__name")

@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "team", "role", "status", "created_at", "expires_at")
    list_filter = ("status",)
    search_fields = ("email", "team__name")
