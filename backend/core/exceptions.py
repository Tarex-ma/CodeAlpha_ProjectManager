"""
core/exceptions.py
────────────────────
Custom exception handler for consistent API error responses.

Register in settings:
    REST_FRAMEWORK = {
        ...
        "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    }

Before (DRF default):
    400: { "email": ["This field is required."] }
    403: { "detail": "Permission denied." }

After (with this handler):
    400: { "status": 400, "error": "ValidationError", "detail": { "email": [...] } }
    403: { "status": 403, "error": "PermissionDenied", "detail": "Permission denied." }
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_type = type(exc).__name__
        response.data = {
            "status": response.status_code,
            "error":  error_type,
            "detail": response.data,
        }

    return response