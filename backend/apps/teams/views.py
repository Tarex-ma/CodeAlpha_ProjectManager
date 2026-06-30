from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import uuid

from .models import Team, TeamMember, TeamInvitation
from .serializers import TeamSerializer, TeamMemberSerializer, TeamInvitationSerializer
from .permissions import IsTeamMember

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
import uuid

from .models import Team, TeamMember, TeamInvitation, TeamActivity
from apps.projects.models import Project
from apps.tasks.models import Task
from .serializers import (
    TeamSerializer,
    TeamMemberSerializer,
    TeamInvitationSerializer,
    TeamActivitySerializer
)
from .permissions import IsTeamMember

class TeamViewSet(viewsets.ModelViewSet):
    """CRUD + custom actions for Team management."""
    serializer_class = TeamSerializer
    permission_classes = [IsTeamMember]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Team.objects.none()
        # Filter teams where the user is an active member or the owner
        return Team.objects.filter(members__user=user, members__is_active=True).distinct()

    def perform_create(self, serializer):
        team = serializer.save(owner=self.request.user)
        # Create Owner TeamMember row
        TeamMember.objects.create(
            team=team,
            user=self.request.user,
            role=TeamMember.Role.OWNER,
            is_active=True
        )
        # Log activity
        TeamActivity.objects.create(
            team=team,
            actor=self.request.user,
            action_type=TeamActivity.ActionType.CREATED,
            target=team.name,
            description=f"Team '{team.name}' was created."
        )

    def perform_destroy(self, instance):
        self._check_owner(self.request.user, instance)
        instance.delete()

    def perform_update(self, serializer):
        self._check_owner(self.request.user, serializer.instance)
        serializer.save()

    def _check_owner(self, user, team):
        if team.owner != user:
            member = TeamMember.objects.filter(team=team, user=user).first()
            if not member or member.role != TeamMember.Role.OWNER:
                raise PermissionDenied("You do not have permission to manage this team.")

    # ── MEMBERS LIST ─────────────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="members")
    def members(self, request, pk=None):
        team = self.get_object()
        members_qs = TeamMember.objects.filter(team=team)
        serializer = TeamMemberSerializer(members_qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ── INVITE USER ──────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="invite")
    def invite(self, request, pk=None):
        team = self.get_object()
        self._check_owner(request.user, team)

        email = request.data.get("email")
        role = request.data.get("role", TeamMember.Role.MEMBER)

        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already a member
        if TeamMember.objects.filter(team=team, user__email__iexact=email).exists():
            return Response({"detail": "User is already a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if active pending invitation exists
        if TeamInvitation.objects.filter(team=team, email__iexact=email, status='pending').exists():
            return Response({"detail": "An active invitation for this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        token = uuid.uuid4().hex
        expires = timezone.now() + timezone.timedelta(days=7)
        invitation = TeamInvitation.objects.create(
            team=team,
            email=email,
            invited_by=request.user,
            role=role,
            token=token,
            expires_at=expires,
        )

        # Log activity
        TeamActivity.objects.create(
            team=team,
            actor=request.user,
            action_type=TeamActivity.ActionType.INVITATION_SENT,
            target=email,
            description=f"Invitation sent to {email} as {role}."
        )

        serializer = TeamInvitationSerializer(invitation, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ── CHANGE ROLE ──────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="change-role")
    def change_role(self, request, pk=None):
        team = self.get_object()
        self._check_owner(request.user, team)

        member_id = request.data.get("member_id")
        new_role = request.data.get("role")

        if new_role not in TeamMember.Role.values:
            return Response({"detail": "Invalid role value."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = TeamMember.objects.get(id=member_id, team=team)
            old_role = member.role

            if member.user == team.owner and new_role != TeamMember.Role.OWNER:
                return Response({"detail": "Cannot change the role of the team owner."}, status=status.HTTP_400_BAD_REQUEST)

            member.role = new_role
            member.save()

            # Log activity
            TeamActivity.objects.create(
                team=team,
                actor=request.user,
                action_type=TeamActivity.ActionType.ROLE_CHANGED,
                target=member.user.email,
                description=f"Changed role of {member.user.get_full_name()} from {old_role} to {new_role}."
            )

            return Response({"status": "role updated"})
        except TeamMember.DoesNotExist:
            return Response({"detail": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

    # ── REMOVE MEMBER ────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="remove-member")
    def remove_member(self, request, pk=None):
        team = self.get_object()
        self._check_owner(request.user, team)

        member_id = request.data.get("member_id")
        try:
            member = TeamMember.objects.get(id=member_id, team=team)

            if member.user == team.owner:
                return Response({"detail": "Cannot remove the team owner."}, status=status.HTTP_400_BAD_REQUEST)

            email = member.user.email
            name = member.user.get_full_name()
            member.delete()

            # Log activity
            TeamActivity.objects.create(
                team=team,
                actor=request.user,
                action_type=TeamActivity.ActionType.MEMBER_REMOVED,
                target=email,
                description=f"Removed member {name}."
            )

            return Response({"status": "member removed"})
        except TeamMember.DoesNotExist:
            return Response({"detail": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

    # ── TEAM PROJECTS ────────────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="projects")
    def projects(self, request, pk=None):
        team = self.get_object()
        projects_qs = Project.objects.filter(team=team)
        results = []
        for p in projects_qs:
            total_tasks = p.tasks.count()
            completed_tasks = p.tasks.filter(status='done').count()
            progress = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
            results.append({
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "color": p.color,
                "icon": p.icon,
                "status": p.status,
                "due_date": p.due_date,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "progress": progress,
                "members_count": p.members.count()
            })
        return Response(results)

    # ── TEAM ACTIVITIES ──────────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="activities")
    def activities(self, request, pk=None):
        team = self.get_object()
        qs = TeamActivity.objects.filter(team=team).order_by("-timestamp")
        serializer = TeamActivitySerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ── INVITATIONS LIST ──────────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="invitations")
    def invitations(self, request, pk=None):
        team = self.get_object()
        # Mark expired
        TeamInvitation.objects.filter(team=team, status='pending', expires_at__lt=timezone.now()).update(status='expired')
        invitations_qs = TeamInvitation.objects.filter(team=team)
        serializer = TeamInvitationSerializer(invitations_qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ── CANCEL INVITATION ──────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="cancel-invitation")
    def cancel_invitation(self, request, pk=None):
        team = self.get_object()
        self._check_owner(request.user, team)

        invitation_id = request.data.get("invitation_id")
        try:
            inv = TeamInvitation.objects.get(id=invitation_id, team=team)
            email = inv.email
            inv.delete()

            # Log activity
            TeamActivity.objects.create(
                team=team,
                actor=request.user,
                action_type=TeamActivity.ActionType.MEMBER_REMOVED,
                target=email,
                description=f"Cancelled invitation to {email}."
            )

            return Response({"status": "invitation cancelled"})
        except TeamInvitation.DoesNotExist:
            return Response({"detail": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)

    # ── RESEND INVITATION ──────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="resend-invitation")
    def resend_invitation(self, request, pk=None):
        team = self.get_object()
        self._check_owner(request.user, team)

        invitation_id = request.data.get("invitation_id")
        try:
            inv = TeamInvitation.objects.get(id=invitation_id, team=team)
            inv.expires_at = timezone.now() + timezone.timedelta(days=7)
            inv.status = 'pending'
            inv.save()

            # Log activity
            TeamActivity.objects.create(
                team=team,
                actor=request.user,
                action_type=TeamActivity.ActionType.INVITATION_SENT,
                target=inv.email,
                description=f"Resent invitation to {inv.email}."
            )

            return Response({"status": "invitation resent"})
        except TeamInvitation.DoesNotExist:
            return Response({"detail": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)

    # ── ACCEPT INVITATION ──────────────────────────────────────────────────
    @action(detail=False, methods=["post"], url_path="accept-invitation")
    def accept_invitation(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inv = TeamInvitation.objects.get(token=token)

            if inv.status != 'pending':
                return Response({"detail": f"This invitation has already been {inv.status}."}, status=status.HTTP_400_BAD_REQUEST)
            if inv.is_expired():
                inv.status = 'expired'
                inv.save()
                return Response({"detail": "This invitation has expired."}, status=status.HTTP_400_BAD_REQUEST)

            if request.user.email.lower() != inv.email.lower():
                return Response({"detail": f"This invitation was sent to {inv.email}, but you are logged in as {request.user.email}."}, status=status.HTTP_400_BAD_REQUEST)

            member, created = TeamMember.objects.get_or_create(
                team=inv.team,
                user=request.user,
                defaults={"role": inv.role, "is_active": True}
            )
            if not created:
                member.is_active = True
                member.role = inv.role
                member.save()

            inv.status = 'accepted'
            inv.save()

            # Log activity
            TeamActivity.objects.create(
                team=inv.team,
                actor=request.user,
                action_type=TeamActivity.ActionType.INVITATION_ACCEPTED,
                target=request.user.email,
                description=f"{request.user.get_full_name()} joined the team."
            )

            return Response({"status": "joined", "team_id": inv.team.id})
        except TeamInvitation.DoesNotExist:
            return Response({"detail": "Invalid token."}, status=status.HTTP_404_NOT_FOUND)

