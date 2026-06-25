# CattleTrace

Cattle traceability and digital marketplace platform — built for Kenya's agricultural ecosystem.

## Repository layout

```
backend/     Django application (models, views, admin, templates, API future)
frontend/    React + Vite app (Figma Make design prototype)
docs/        Project audit and implementation guides
```

## Backend (Django)

```bash
cd backend
python manage.py check
python manage.py runserver
```

Environment variables are read from the repo root `.env` (PostgreSQL settings).

Utility scripts:

- `smoke_test_project.py` — route smoke test
- `inspect_schema.py` — database table inspection
- `mark_migration.py` — migration record repair

## Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

See `frontend/README.md` for the Figma design source link.

## Documentation

- [docs/SUMMARY.md](docs/SUMMARY.md)
- [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)
- [docs/ERRORS_AND_CONFLICTS_AUDIT.md](docs/ERRORS_AND_CONFLICTS_AUDIT.md)
