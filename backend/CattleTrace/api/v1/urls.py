"""
CattleTrace API v1 URL configuration.
"""

from django.urls import include, path

from CattleTrace.api.v1.router import router
from CattleTrace.api.v1.views import (
    APIRootView,
)

app_name = 'api-v1'

urlpatterns = [
    path('', APIRootView.as_view(), name='root'),
    path('auth/', include('CattleTrace.api.auth.urls')),
    *router.urls,
]
