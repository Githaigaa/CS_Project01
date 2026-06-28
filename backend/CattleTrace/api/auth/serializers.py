"""Serializers for frontend-compatible authentication APIs."""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from CattleTrace.api.auth.services import UserRegistrationService
from CattleTrace.models import User, default_notification_preferences

ALLOWED_AVATAR_CONTENT_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
}
MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024


class AuthenticatedUserSerializer(serializers.ModelSerializer):
    """Safe user representation returned to the React application."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)
    profile_photo = serializers.SerializerMethodField()

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
            "bio",
            "profile_photo",
            "notification_preferences",
            "is_verified",
            "date_joined",
        )
        read_only_fields = fields

    def get_profile_photo(self, obj: User) -> str | None:
        if not obj.profile_photo:
            return None
        request = self.context.get("request")
        url = obj.profile_photo.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def to_representation(self, instance: User) -> dict[str, object]:
        data = super().to_representation(instance)
        if not data.get("notification_preferences"):
            data["notification_preferences"] = default_notification_preferences()
        return data


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "national_id",
            "location",
            "bio",
        )

    def validate_email(self, value: str) -> str:
        user = self.context["request"].user
        if User.objects.exclude(pk=user.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class AvatarUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("profile_photo",)

    def validate_profile_photo(self, value):
        if value.size > MAX_AVATAR_SIZE_BYTES:
            raise serializers.ValidationError("Avatar must be 2MB or smaller.")
        content_type = getattr(value, "content_type", "")
        if content_type and content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
            raise serializers.ValidationError("Avatar must be a JPG, PNG, or GIF image.")
        return value


class NotificationPreferencesSerializer(serializers.Serializer):
    email = serializers.DictField(child=serializers.BooleanField(), required=False)
    sms = serializers.DictField(child=serializers.BooleanField(), required=False)

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        current = default_notification_preferences()
        if self.instance is not None:
            current = {
                **current,
                **(self.instance.notification_preferences or {}),
            }

        email = {**current.get("email", {}), **attrs.get("email", {})}
        sms = {**current.get("sms", {}), **attrs.get("sms", {})}
        return {"email": email, "sms": sms}

    def update(self, instance: User, validated_data: dict[str, object]) -> User:
        instance.notification_preferences = validated_data
        instance.save(update_fields=["notification_preferences", "updated_at"])
        return instance

class RegisterSerializer(serializers.ModelSerializer):