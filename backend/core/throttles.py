"""
core/throttles.py
───────────────────
Custom throttle classes.

Setup
─────
Add to config/settings/base.py:

    REST_FRAMEWORK = {
        ...
        "DEFAULT_THROTTLE_CLASSES": [
            "rest_framework.throttling.AnonRateThrottle",
            "rest_framework.throttling.UserRateThrottle",
        ],
        "DEFAULT_THROTTLE_RATES": {
            "anon": "100/hour",
            "user": "2000/hour",
            "auth": "10/minute",
            "token_refresh": "30/minute",
        },
    }

Apply to views:
    class LoginView(APIView):
        throttle_classes = [AuthRateThrottle]
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """
    Strict throttle for login and register endpoints.
    Applies per IP address (anonymous rate throttle base).
    10 requests per minute — prevents brute-force attacks.
    """
    scope = "auth"


class TokenRefreshThrottle(AnonRateThrottle):
    """
    Throttle for /api/token/refresh/.
    Slightly more permissive than auth endpoints.
    """
    scope = "token_refresh"