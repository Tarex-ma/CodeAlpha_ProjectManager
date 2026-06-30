from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Team, TeamMember, TeamInvitation, TeamActivity
from apps.projects.models import Project
from apps.tasks.models import Task

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name']

class TeamSerializer(serializers.ModelSerializer):
    owner_details = UserMinimalSerializer(source='owner', read_only=True)
    logo_url = serializers.SerializerMethodField()
    total_members = serializers.SerializerMethodField()
    active_members = serializers.SerializerMethodField()
    pending_invitations = serializers.SerializerMethodField()
    total_projects = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'owner', 'owner_details',
            'logo', 'logo_url', 'created_at', 'updated_at',
            'total_members', 'active_members', 'pending_invitations',
            'total_projects', 'total_tasks'
        ]
        read_only_fields = ['owner']

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

    def get_total_members(self, obj):
        return obj.members.count()

    def get_active_members(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_pending_invitations(self, obj):
        return obj.invitations.filter(status='pending').count()

    def get_total_projects(self, obj):
        return obj.projects.count()

    def get_total_tasks(self, obj):
        return Task.objects.filter(project__team=obj).count()

class TeamMemberSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    assigned_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'user', 'user_full_name', 'user_email',
            'avatar_url', 'role', 'joined_at', 'is_active',
            'assigned_tasks_count'
        ]

    def get_avatar_url(self, obj):
        try:
            if obj.user.profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.user.profile.avatar.url)
                return obj.user.profile.avatar.url
        except Exception:
            pass
        return None

    def get_assigned_tasks_count(self, obj):
        return Task.objects.filter(project__team=obj.team, assignees=obj.user).count()

class TeamInvitationSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source='invited_by.get_full_name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = TeamInvitation
        fields = [
            'id', 'team', 'email', 'role', 'status',
            'created_at', 'expires_at', 'invited_by',
            'invited_by_name', 'invited_by_email'
        ]
        read_only_fields = ['invited_by', 'status']

class TeamActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    actor_email = serializers.EmailField(source='actor.email', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)

    class Meta:
        model = TeamActivity
        fields = [
            'id', 'team', 'actor', 'actor_name', 'actor_email',
            'action_type', 'action_type_display', 'target',
            'timestamp', 'description'
        ]
