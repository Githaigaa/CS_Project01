"""
Vercel Python serverless entry point.
Wraps the Django WSGI application so Vercel can route requests to it.
"""
import os
import sys

# Ensure the backend directory is on the Python path
# so that `DjangoProject` and `CattleTrace` packages are importable.
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "DjangoProject.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

app = get_wsgi_application()
