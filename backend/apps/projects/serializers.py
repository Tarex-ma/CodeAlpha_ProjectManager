"""
apps/projects/serializers.py
──────────────────────────────
Serializers
-----------
ProjectMemberSerializer     — nested read: user summary + role + joined_at
InviteMemberSerializer      — write: add a user by email with an optional role
UpdateMemberRoleSerializer  — write: change an existing member's role
ProjectSerializer           — main serializer: list + detail + create
ProjectUpdateSerializer     — write: partial update of title/description
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Project, ProjectMember

User = get_user_model()


# ── Inline user summary embedded inside member rows ──────────────────────

class MemberUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields


# ── ProjectMember read ────────────────────────────────────────────────────

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = MemberUserSerializer(read_only=True)

    class Meta:
        model  = ProjectMember
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = fields


# ── Invite a new member by email ─────────────────────────────────────────

class InviteMemberSerializer(serializers.Serializer):
    """
    POST /api/v1/projects/{id}/invite/
    {
        "email": "grace@example.com",
        "role": "member"          ← optional, defaults to "member"
    }
    """

    email = serializers.EmailField()
    role  = serializers.ChoiceField(
        choices=[
            ProjectMember.Role.ADMIN,
            ProjectMember.Role.MEMBER,
            ProjectMember.Role.VIEWER,
        ],
        default=ProjectMember.Role.MEMBER,
    )

    def validate_email(self, value: str) -> str:
        try:
            self._invited_user = User.objects.get(email=value.lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address.")
        return value.lower()

    def validate(self, attrs: dict) -> dict:
        project = self.context["project"]
        user    = self._invited_user

        if ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError(
                {"email": "This user is already a member of the project."}
            )
        attrs["user"] = user
        return attrs

    def save(self, **kwargs) -> ProjectMember:
        return ProjectMember.objects.create(
            project=self.context["project"],
            user=self.validated_data["user"],
            role=self.validated_data["role"],
        )


# ── Change an existing member's role ─────────────────────────────────────

class UpdateMemberRoleSerializer(serializers.ModelSerializer):
    """
    PATCH /api/v1/projects/{id}/members/{member_id}/
    { "role": "admin" }
    """

    class Meta:
        model  = ProjectMember
        fields = ["role"]

    def validate_role(self, value: str) -> str:
        # Prevent promoting someone to "owner" via the API
        if value == ProjectMember.Role.OWNER:
            raise serializers.ValidationError(
                "The owner role cannot be assigned via the API."
            )
        return value


# ── Main project serializer ───────────────────────────────────────────────

class ProjectSerializer(serializers.ModelSerializer):
    """
    Used for list, retrieve, and create.
    owner is read-only and injected from request.user in the view.
    members is a nested list of ProjectMemberSerializer rows.
    member_count is an annotation added in the view queryset.
    """

    owner        = MemberUserSerializer(read_only=True)
    members      = ProjectMemberSerializer(
        source="projectmember_set",
        many=True,
        read_only=True,
    )
    member_count = serializers.IntegerField(read_only=True, default=0)
    # Expose the requesting user's own role in this project
    my_role      = serializers.SerializerMethodField()

    class Meta:
        model  = Project
        fields = [
            "id",
            "title",
            "description",
            "owner",
            "members",
            "member_count",
            "my_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def get_my_role(self, obj: Project) -> str | None:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        return obj.get_member_role(request.user)

    def create(self, validated_data: dict) -> Project:
        owner = self.context["request"].user
        project = Project.objects.create(owner=owner, **validated_data)
        # Auto-add owner as a member with OWNER role
        ProjectMember.objects.create(
            project=project,
            user=owner,
            role=ProjectMember.Role.OWNER,
        )
        return project


# ── Partial update serializer ─────────────────────────────────────────────

class ProjectUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/v1/projects/{id}/
    Only title and description are mutable; ownership/membership is separate.
    """

    class Meta:
        model  = Project
        fields = ["title", "description"]

    def validate_title(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value.strip()