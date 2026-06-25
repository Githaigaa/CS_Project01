"""
DjangoProject/urls.py
=======================
Root URL configuration.

  /          → traceability app (landing page at /)
  /admin/    → Django admin
  /media/    → Served in development via django.conf.urls.static
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns =[
# Django admin
path("admin/", admin.site.urls),

# REST API v1
path("api/v1/", include("CattleTrace.api.v1.urls")),

# All platform routes (app_name="CattleTrace")
path("", include("CattleTrace.urls")),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

