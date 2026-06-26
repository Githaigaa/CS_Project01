"""Service layer for authentication workflows."""

from __future__ import annotations

from typing import Any, Mapping

from CattleTrace.models import User


class UserRegistrationService:
    """Create users through the custom user manager."""

    @staticmethod
    def create_user(validated_data: Mapping[str, Any]) -> User:
        data = dict(validated_data)
        password = data.pop("password")
        return User.objects.create_user(password=password, **data)
