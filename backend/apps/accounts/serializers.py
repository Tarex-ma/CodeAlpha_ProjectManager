from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile, User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_tokens_for_user(user: User) -> dict:
    """Return a fresh JWT access/refresh token pair for the given user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["avatar", "bio", "job_title", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


# ---------------------------------------------------------------------------
# User (read-only representation, embedded in responses)
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "profile",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.ModelSerializer):
    """
    Validates and creates a new user + profile.

    Password rules are enforced by Django's AUTH_PASSWORD_VALIDATORS.
    confirm_password is write-only and never stored.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "password", "confirm_password"]

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_password(self, value: str) -> str:
        # Delegates to AUTH_PASSWORD_VALIDATORS in settings
        validate_password(value)
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data: dict) -> User:
        user = User.objects.create_user(**validated_data)
        # Auto-create the linked profile
        Profile.objects.create(user=user)
        return user


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    """
    Authenticates via email + password and returns JWT tokens.
    Uses Django's authenticate() to honour is_active and custom backends.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs: dict) -> dict:
        email = attrs.get("email", "").lower()
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            username=email,   # AbstractBaseUser uses USERNAME_FIELD as the kwarg
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": "Invalid email or password."},
                code="authentication_failed",
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": "This account has been deactivated."},
                code="account_inactive",
            )

        attrs["user"] = user
        return attrs


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

class LogoutSerializer(serializers.Serializer):
    """
    Receives the refresh token and blacklists it.
    Requires INSTALLED_APPS to include 'rest_framework_simplejwt.token_blacklist'.
    """

    refresh = serializers.CharField()

    def validate(self, attrs: dict) -> dict:
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs) -> None:
        try:
            RefreshToken(self.token).blacklist()
        except Exception as exc:
            raise serializers.ValidationError({"refresh": "Token is invalid or already expired."}) from exc


# ---------------------------------------------------------------------------
# Profile Update
# ---------------------------------------------------------------------------

class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Allows users to update their own name and profile details in one request.
    Handles nested write to both User and Profile.
    """

    # User fields surfaced at top level
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)

    class Meta:
        model = Profile
        fields = ["first_name", "last_name", "avatar", "bio", "job_title"]

    def update(self, instance: Profile, validated_data: dict) -> Profile:
        # Pop and save nested user fields
        user_data = validated_data.pop("user", {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save(update_fields=list(user_data.keys()) or None)

        # Save profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


# ---------------------------------------------------------------------------
# Password Change
# ---------------------------------------------------------------------------

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    confirm_new_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_old_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError(
                {"confirm_new_password": "New passwords do not match."}
            )
        validate_password(attrs["new_password"], self.context["request"].user)
        return attrs

    def save(self, **kwargs) -> None:
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])