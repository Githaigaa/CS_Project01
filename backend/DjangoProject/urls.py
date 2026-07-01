"""
DjangoProject/urls.py
=======================
Root URL configuration.

  /          → redirects to React frontend
  /admin/    → Django admin
  /api/v1/   → REST API
  /media/    → Served in development via django.conf.urls.static
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({"status": "ok", "api": "/api/v1/"})


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api/v1/", include("CattleTrace.api.v1.urls")),
]

# Serve uploaded media files during development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
