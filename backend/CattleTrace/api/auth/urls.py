"""Authentication URL routes mounted at /api/v1/auth/."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from CattleTrace.api.auth.views import (
    AvatarUploadView,
    ChangePasswordView,
    CustomTokenObtainPairView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordResetVerifyOtpView,
    PreferencesView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/avatar/", AvatarUploadView.as_view(), name="me_avatar"),
    path("me/preferences/", PreferencesView.as_view(), name="me_preferences"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("password-reset/verify-otp/", PasswordResetVerifyOtpView.as_view(), name="password_reset_verify_otp"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
]
