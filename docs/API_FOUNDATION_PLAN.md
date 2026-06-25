# API Foundation — Planned File Modifications

## New dependencies (`backend/requirements.txt`)

| Package | Purpose |
|---------|---------|
| `djangorestframework` | REST API framework |
| `djangorestframework-simplejwt` | JWT authentication |
| `django-cors-headers` | CORS for React dev server |

## Modified files

### `backend/requirements.txt`
- Add the three packages above (pinned minimum versions).

### `backend/DjangoProject/settings.py`
- Add `rest_framework`, `rest_framework_simplejwt`, `corsheaders` to `INSTALLED_APPS`.
- Insert `corsheaders.middleware.CorsMiddleware` before `CommonMiddleware`.
- Add `REST_FRAMEWORK` block: JWT auth, default `IsAuthenticated`, URL-path versioning.
- Add `SIMPLE_JWT` block: lifetimes, rotation, custom token serializer hook.
- Add `CORS_ALLOWED_ORIGINS` for Vite (`http://localhost:5173`, `http://127.0.0.1:5173`).

### `backend/DjangoProject/urls.py`
- Mount `path("api/v1/", include("CattleTrace.api.v1.urls"))`.

## New files

```
backend/CattleTrace/api/
├── __init__.py
├── authentication.py      # JWT auth class re-exports + token serializer hook
├── permissions.py         # Role-based permission foundation
└── v1/
    ├── __init__.py
    ├── urls.py            # auth + API root only
    ├── serializers/
    │   ├── __init__.py
    │   └── user.py        # UserSerializer + CustomTokenObtainPairSerializer
    └── views/
        ├── __init__.py
        ├── auth.py        # Token obtain / refresh (AllowAny)
        └── root.py        # GET /api/v1/ discovery payload (AllowAny)
```

## Out of scope (unchanged)

- `models.py`, `views.py` (MVT), `apps.py` signals, `admin.py`
- Business resource endpoints (animals, farms, marketplace, etc.)

## Endpoints delivered

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/` | Public | Version discovery |
| POST | `/api/v1/auth/token/` | Public | Obtain JWT pair |
| POST | `/api/v1/auth/token/refresh/` | Public | Refresh access token |
