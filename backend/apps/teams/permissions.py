from rest_framework.permissions import BasePermission
from .models import TeamMember

class IsTeamMember(BasePermission):
    """Allow access only to active members of the team."""
    def has_object_permission(self, request, view, obj):
        return TeamMember.objects.filter(team=obj, user=request.user, is_active=True).exists()
