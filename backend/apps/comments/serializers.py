"""
apps/comments/serializers.py
──────────────────────────────
CommentSerializer       — read: full representation with nested author
CommentCreateSerializer — write: content only; author + task injected by view
CommentUpdateSerializer — write: content only (PATCH)
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Comment

User = get_user_model()


# ── Embedded author summary ───────────────────────────────────────────────

class CommentAuthorSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields


# ── Read ──────────────────────────────────────────────────────────────────

class CommentSerializer(serializers.ModelSerializer):
    """
    Full comment representation returned in all responses.
    author is None when the user account has been deleted —
    the serializer surfaces this gracefully as null.
    """

    author = CommentAuthorSerializer(read_only=True)

    class Meta:
        model  = Comment
        fields = [
            "id",
            "task",
            "author",
            "content",
            "is_edited",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# ── Create ────────────────────────────────────────────────────────────────

class CommentCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/

    Only `content` is accepted from the client.
    task and author are injected from the view context.

    Request:  { "content": "Looks good, merging tomorrow." }
    Response: full CommentSerializer representation (201)
    """

    class Meta:
        model  = Comment
        fields = ["content"]

    def validate_content(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment content cannot be blank.")
        if len(value) > 5000:
            raise serializers.ValidationError("Comment cannot exceed 5000 characters.")
        return value

    def create(self, validated_data: dict) -> Comment:
        return Comment.objects.create(
            task=self.context["task"],
            author=self.context["request"].user,
            **validated_data,
        )


# ── Update ────────────────────────────────────────────────────────────────

class CommentUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/{id}/

    Only `content` can be changed. is_edited is set to True automatically.

    Request:  { "content": "Updated thoughts." }
    Response: full CommentSerializer representation (200)
    """

    class Meta:
        model  = Comment
        fields = ["content"]

    def validate_content(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment content cannot be blank.")
        if len(value) > 5000:
            raise serializers.ValidationError("Comment cannot exceed 5000 characters.")
        return value

    def update(self, instance: Comment, validated_data: dict) -> Comment:
        instance.content   = validated_data["content"]
        instance.is_edited = True
        instance.save(update_fields=["content", "is_edited", "updated_at"])
        return instance
