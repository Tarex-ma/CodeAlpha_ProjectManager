# ============================================================
# apps/accounts/signals.py
# ============================================================
# Profile is created inside RegisterSerializer.create() so you
# have explicit control. If you prefer signals, use this instead
# and remove the Profile.objects.create() call from the serializer.

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance: User, created: bool, **kwargs) -> None:
    if created:
        Profile.objects.get_or_create(user=instance)


# ============================================================
# apps/accounts/apps.py
# ============================================================

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"

    def ready(self) -> None:
        import apps.accounts.signals  # noqa: F401 — connect signal handlers


# ============================================================
# config/settings/base.py  — relevant additions only
# ============================================================
#
# AUTH_USER_MODEL = "accounts.User"
#
# INSTALLED_APPS = [
#     ...
#     "rest_framework_simplejwt.token_blacklist",  # required for logout blacklisting
#     "apps.accounts",
#     ...
# ]
#
# REST_FRAMEWORK = {
#     "DEFAULT_AUTHENTICATION_CLASSES": (
#         "rest_framework_simplejwt.authentication.JWTAuthentication",
#     ),
#     "DEFAULT_PERMISSION_CLASSES": (
#         "rest_framework.permissions.IsAuthenticated",
#     ),
#     "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",  # optional
# }
#
# from datetime import timedelta
# SIMPLE_JWT = {
#     "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
#     "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
#     "ROTATE_REFRESH_TOKENS": True,
#     "BLACKLIST_AFTER_ROTATION": True,
#     "AUTH_HEADER_TYPES": ("Bearer",),
#     "USER_ID_FIELD": "id",
#     "USER_ID_CLAIM": "user_id",
# }
#
# AUTH_PASSWORD_VALIDATORS = [
#     {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
#     {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
#      "OPTIONS": {"min_length": 8}},
#     {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
#     {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
# ]
#
# MEDIA_URL = "/media/"
# MEDIA_ROOT = BASE_DIR / "media"

# ============================================================
# config/urls.py  — wire the accounts app
# ============================================================
#
# from django.conf import settings
# from django.conf.urls.static import static
#
# urlpatterns = [
#     ...
#     path("api/v1/auth/", include("apps.accounts.urls", namespace="accounts")),
# ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)