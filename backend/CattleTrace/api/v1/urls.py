"""
CattleTrace API v1 URL configuration.
"""

from django.urls import path

from CattleTrace.api.v1.router import router
from CattleTrace.api.v1.views import (
    APIRootView,
    ChangePasswordView,
    MeView,
    RegisterView,
    TokenObtainPairView,
    TokenRefreshView,
)

app_name = 'api-v1'

urlpatterns = [
    path('', APIRootView.as_view(), name='root'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    *router.urls,
]
