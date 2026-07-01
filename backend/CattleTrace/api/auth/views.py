"""Views for frontend-compatible authentication APIs."""

from __future__ import annotations

import hashlib
import random
import string

from django.core.mail import send_mail
from django.core import signing
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import (
    TokenObtainPairView as SimpleJWTTokenObtainPairView,
)

from CattleTrace.api.auth.serializers import (
    AuthenticatedUserSerializer,
    AvatarUploadSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    NotificationPreferencesSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifyOtpSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
)
from CattleTrace.models import User, default_notification_preferences


class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class CustomTokenObtainPairView(SimpleJWTTokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserProfileUpdateSerializer
        return AuthenticatedUserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            AuthenticatedUserSerializer(instance, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class AvatarUploadView(generics.UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = AvatarUploadSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            AuthenticatedUserSerializer(instance, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class PreferencesView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotificationPreferencesSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        return Response(user.notification_preferences or default_notification_preferences())

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            AuthenticatedUserSerializer(instance, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


OTP_EXPIRY_MINUTES = 15


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If that email is registered, a 6-digit code has been sent."})

        otp = _generate_otp()
        user.password_reset_otp = _hash_otp(otp)
        user.password_reset_otp_expires = timezone.now() + timezone.timedelta(minutes=OTP_EXPIRY_MINUTES)
        user.save(update_fields=["password_reset_otp", "password_reset_otp_expires"])

        send_mail(
            subject="CattleTrace — Your Password Reset Code",
            message=(
                f"Hi {user.username},\n\n"
                f"Your password reset code is:\n\n"
                f"  {otp}\n\n"
                f"This code expires in {OTP_EXPIRY_MINUTES} minutes. "
                f"If you didn't request this, you can ignore this email."
            ),
            from_email=None,
            recipient_list=[user.email],
        )

        return Response({"detail": "If that email is registered, a 6-digit code has been sent."})


class PasswordResetVerifyOtpView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetVerifyOtpSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.password_reset_otp or not user.password_reset_otp_expires:
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > user.password_reset_otp_expires:
            return Response({"detail": "Code has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        if _hash_otp(otp) != user.password_reset_otp:
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

        # OTP verified — issue a short-lived signed reset token (10 min)
        reset_token = signing.dumps({"uid": user.pk}, salt="password-reset")
        return Response({"reset_token": reset_token})


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            data = signing.loads(
                serializer.validated_data["reset_token"],
                salt="password-reset",
                max_age=600,  # 10 minutes
            )
            user = User.objects.get(pk=data["uid"])
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, KeyError):
            return Response(
                {"detail": "Invalid or expired session. Please start over."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.password_reset_otp = ""
        user.password_reset_otp_expires = None
        user.save(update_fields=["password", "password_reset_otp", "password_reset_otp_expires"])
        return Response({"detail": "Password has been reset successfully."})


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
