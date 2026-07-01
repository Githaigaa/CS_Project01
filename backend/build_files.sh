#!/bin/bash
# Vercel build script for the Django backend.
# Runs during each deployment — installs dependencies, collects static files,
# and applies any pending database migrations.
set -e

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
