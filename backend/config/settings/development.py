from .base import *
from .base import env
# Development settings
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Database
# Uses SQLite for fast local development
# Replace with PostgreSQL later if needed

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Email backend for development
# Emails print in terminal instead of sending

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Static files
STATIC_URL = "/static/"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# CORS (for React frontend)
# Install:
# pip install django-cors-headers

CORS_ALLOW_ALL_ORIGINS = True

# Optional trusted origins for CSRF
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Development security settings
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Django REST Framework debug settings
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] += (
    "rest_framework.renderers.BrowsableAPIRenderer",
)