from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    UserSettingsSerializer,
    get_tokens_for_user,
)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/

    Create a new user account.
    Returns the user object and a JWT token pair on success.

    Example request:
        {
            "email": "ada@example.com",
            "first_name": "Ada",
            "last_name": "Lovelace",
            "password": "Str0ngP@ss!",
            "confirm_password": "Str0ngP@ss!"
        }

    Example response (201):
        {
            "user": { "id": 1, "email": "ada@example.com", ... },
            "tokens": {
                "access": "<jwt_access_token>",
                "refresh": "<jwt_refresh_token>"
            }
        }
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "tokens": get_tokens_for_user(user),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/v1/auth/login/

    Authenticate with email and password, receive JWT tokens.

    Example request:
        {
            "email": "ada@example.com",
            "password": "Str0ngP@ss!"
        }

    Example response (200):
        {
            "user": { "id": 1, "email": "ada@example.com", ... },
            "tokens": {
                "access": "<jwt_access_token>",
                "refresh": "<jwt_refresh_token>"
            }
        }
    """

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer  # for DRF Browsable API / schema generators

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "tokens": get_tokens_for_user(user),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/

    Blacklist the refresh token to invalidate the session.
    The access token will naturally expire per SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].

    Requires 'rest_framework_simplejwt.token_blacklist' in INSTALLED_APPS.

    Example request:
        {
            "refresh": "<jwt_refresh_token>"
        }

    Example response (204): (no body)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        # Optional: blacklist refresh token to invalidate session
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                # If token invalid or blacklist not configured, ignore
                pass
        # Client should discard tokens; we simply return success
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveAPIView):
    """
    GET /api/v1/auth/me/

    Return the currently authenticated user's full profile.

    Example response (200):
        {
            "id": 1,
            "email": "ada@example.com",
            "first_name": "Ada",
            "last_name": "Lovelace",
            "full_name": "Ada Lovelace",
            "profile": {
                "avatar": null,
                "bio": "",
                "job_title": "Engineer",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            "date_joined": "2024-01-01T00:00:00Z"
        }
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    """
    PATCH /api/v1/auth/me/update/

    Update the current user's name and profile fields.
    All fields are optional — send only what you want to change.

    Example request:
        {
            "first_name": "Ada",
            "bio": "Pioneer of computing.",
            "job_title": "Engineer"
        }

    Example response (200):
        {
            "first_name": "Ada",
            "last_name": "Lovelace",
            "avatar": null,
            "bio": "Pioneer of computing.",
            "job_title": "Engineer"
        }
    """

    serializer_class = UpdateProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch"]  # disallow full PUT; partial updates only

    def get_object(self) -> Profile:
        # get_or_create guards against profiles missing due to data migrations
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request: Request, *args, **kwargs) -> Response:
        kwargs["partial"] = True  # always partial
        return super().update(request, *args, **kwargs)

class UserSettingsViewSet(generics.RetrieveUpdateAPIView):
    """Retrieve and update the authenticated user's settings."""
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        from .models import UserSettings
        # Ensure a UserSettings instance exists
        settings_obj, _ = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/

    Change password for the authenticated user.
    After a successful change the client should discard stored tokens and
    prompt the user to log in again (refresh tokens remain valid until expiry
    unless explicitly blacklisted).

    Example request:
        {
            "old_password": "OldP@ss!",
            "new_password": "N3wStr0ng!",
            "confirm_new_password": "N3wStr0ng!"
        }

    Example response (200):
        { "detail": "Password updated successfully." }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )