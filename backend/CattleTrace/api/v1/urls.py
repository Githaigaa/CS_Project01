"""
CattleTrace API v1 URL configuration.
"""

from django.urls import include, path

from CattleTrace.api.v1.router import router
from CattleTrace.api.v1.views import APIRootView
from CattleTrace.api.v1.views.dvs import (
    CAHWManagementView,
    CAHWVerifyView,
    CountyCensusView,
    DiseaseTraceReportView,
)

app_name = 'api-v1'

urlpatterns = [
    path('', APIRootView.as_view(), name='root'),
    path('auth/', include('CattleTrace.api.auth.urls')),
    *router.urls,
    # DVS Officer endpoints
    path('dvs/disease-trace/', DiseaseTraceReportView.as_view(), name='dvs-disease-trace'),
    path('dvs/county-census/', CountyCensusView.as_view(), name='dvs-county-census'),
    path('dvs/cahws/', CAHWManagementView.as_view(), name='dvs-cahws'),
    path('dvs/cahws/<int:pk>/verify/', CAHWVerifyView.as_view(), name='dvs-cahw-verify'),
]
