"""Serializers for frontend-compatible authentication APIs."""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from CattleTrace.api.auth.services import UserRegistrationService
from CattleTrace.models import User


class AuthenticatedUserSerializer(serializers.ModelSerializer):
    """Safe user representation returned to the React application."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "phone_number",
            "national_id",
            "location",
            "is_verified",
            "date_joined",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Validate and create users without exposing passwords."""

    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "role",
            "phone_number",
            "national_id",
            "first_name",
            "last_name",
            "location",
        )
        extra_kwargs = {
            "email": {"required": True, "allow_blank": False},
            "role": {"required": False},
        }

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_role(self, value: str) -> str:
        allowed_roles = {
            User.Role.FARMER,
            User.Role.BUYER,
            User.Role.VET,
            User.Role.ABATTOIR,
        }
        if value not in allowed_roles:
            raise serializers.ValidationError("Registration is not allowed for this role.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data: dict[str, object]) -> User:
        return UserRegistrationService.create_user(validated_data)

    def to_representation(self, instance: User) -> dict[str, object]:
        return AuthenticatedUserSerializer(instance, context=self.context).data


class ChangePasswordSerializer(serializers.Serializer):
    """Validate an authenticated password change request."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value: str) -> str:
        validate_password(value, self.context["request"].user)
        return value

    def save(self, **kwargs: object) -> User:
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Return JWT tokens plus the authenticated user's public profile."""

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        data = super().validate(attrs)
        data["user"] = AuthenticatedUserSerializer(self.user, context=self.context).data
        return data
