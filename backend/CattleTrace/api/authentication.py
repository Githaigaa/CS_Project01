"""
JWT authentication setup for the CattleTrace API.

Default authentication is configured in settings.REST_FRAMEWORK and uses
SimpleJWT's JWTAuthentication. Import from here in views when an explicit
reference is needed.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication

__all__ = ['JWTAuthentication']
