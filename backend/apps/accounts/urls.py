from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    UpdateProfileView,
)

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # Token management (SimpleJWT built-in)
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Profile
    path("me/", MeView.as_view(), name="me"),
    path("me/update/", UpdateProfileView.as_view(), name="update_profile"),
    path("me/change-password/", ChangePasswordView.as_view(), name="change_password"),
]