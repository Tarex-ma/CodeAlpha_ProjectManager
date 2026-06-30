from django.db import models
from django.conf import settings
from django.utils import timezone

class Team(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_teams')
    logo = models.ImageField(upload_to='team_logos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TeamMember(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner 👑'
        MEMBER = 'member', 'Member 👤'
        CLIENT = 'client', 'Client 👁️'

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('team', 'user')

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_role_display()})"

class TeamInvitation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_invitations')
    role = models.CharField(max_length=10, choices=TeamMember.Role.choices, default=TeamMember.Role.MEMBER)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Invitation to {self.email} for {self.team.name}"

class TeamActivity(models.Model):
    class ActionType(models.TextChoices):
        CREATED = 'created', 'Team Created'
        MEMBER_ADDED = 'member_added', 'Member Added'
        MEMBER_REMOVED = 'member_removed', 'Member Removed'
        ROLE_CHANGED = 'role_changed', 'Role Changed'
        INVITATION_SENT = 'invitation_sent', 'Invitation Sent'
        INVITATION_ACCEPTED = 'invitation_accepted', 'Invitation Accepted'

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='activities')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    target = models.CharField(max_length=255, blank=True)  # e.g., user email or name
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_action_type_display()} by {self.actor} on {self.team}";
