"""
Django settings for DjangoProject project.
Supports both local development (via .env) and Vercel production deployment
(via environment variables set in the Vercel dashboard).
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env in development — no-op on Vercel (file won't exist there)
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-fallback-key-change-me")
DEBUG = os.environ.get("DEBUG", "True") == "True"

# In production Vercel sets VERCEL_URL automatically (e.g. "cs-project01.vercel.app")
_vercel_url = os.environ.get("VERCEL_URL", "")
_extra_hosts = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

ALLOWED_HOSTS = ["localhost", "127.0.0.1"] + _extra_hosts
if _vercel_url:
    ALLOWED_HOSTS.append(_vercel_url)

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "CattleTrace.apps.CattletraceConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise must come right after SecurityMiddleware to serve static files
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "DjangoProject.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "DjangoProject.wsgi.application"


# ─── Database ───────────────────────────────────────────────────────────────
# Priority order:
#  1. DATABASE_URL env var (Vercel Postgres / Neon provides this)
#  2. Individual POSTGRES_* env vars (also set by Vercel Postgres)
#  3. Local defaults for development
import dj_database_url  # noqa: E402

_db_url = os.environ.get("DATABASE_URL", "")
if _db_url:
    DATABASES = {"default": dj_database_url.config(default=_db_url, conn_max_age=60, ssl_require=True)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "cattletrace"),
            "USER": os.environ.get("POSTGRES_USER", "postgres"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "admin123"),
            "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": int(os.environ.get("POSTGRES_CONN_MAX_AGE", "60")),
        }
    }


# ─── Password validation ──────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ─── Internationalisation ─────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ─── Static files ─────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ─── Media files (uploaded by users) ─────────────────────────────────────
# Note: Vercel's filesystem is ephemeral — uploaded files won't persist between
# function invocations. For persistent media storage in production, configure
# an external service (e.g. Cloudinary or AWS S3) and update MEDIA_URL/MEDIA_ROOT.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ─── Custom user model ────────────────────────────────────────────────────
AUTH_USER_MODEL = "CattleTrace.User"


# ─── Django REST Framework ────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1"],
    "VERSION_PARAM": "version",
    "DEFAULT_PAGINATION_CLASS": "CattleTrace.api.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 10,
}

# ─── Simple JWT ───────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "CattleTrace.api.auth.serializers.CustomTokenObtainPairSerializer",
}

# ─── Email ────────────────────────────────────────────────────────────────
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "CattleTrace <noreply@cattletrace.ke>")

# ─── CORS ─────────────────────────────────────────────────────────────────
_cors_extra = [h.strip() for h in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if h.strip()]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
] + _cors_extra

# Also allow the Vercel deployment URL automatically
if _vercel_url:
    CORS_ALLOWED_ORIGINS.append(f"https://{_vercel_url}")

# On Vercel, frontend and backend share the same domain so same-origin requests
# don't hit CORS at all — but allow all vercel.app subdomains for preview deploys.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]
