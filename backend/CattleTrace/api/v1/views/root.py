"""API v1 root / discovery endpoint."""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class APIRootView(APIView):
    """Public discovery payload for API v1 (no business resources yet)."""

    permission_classes = (AllowAny,)
    versioning_class = None

    def get(self, request):
        return Response(
            {
                'name': 'CattleTrace API',
                'version': 'v1',
                'authentication': 'JWT (Bearer token)',
                'endpoints': {
                    'root': '/api/v1/',
                    'token_obtain': '/api/v1/auth/token/',
                    'token_refresh': '/api/v1/auth/token/refresh/',
                    'register': '/api/v1/auth/register/',
                    'me': '/api/v1/auth/me/',
                    'change_password': '/api/v1/auth/change-password/',
                    'animals': '/api/v1/animals/',
                    'holdings': '/api/v1/holdings/',
                    'marketplace_listings': '/api/v1/marketplace/listings/',
                    'marketplace_inquiries': '/api/v1/marketplace/inquiries/',
                    'marketplace_transactions': '/api/v1/marketplace/transactions/',
                    'health_events': '/api/v1/health-events/',
                    'movements': '/api/v1/movements/',
                    'movement_permits': '/api/v1/movement-permits/',
                    'slaughter_records': '/api/v1/slaughter-records/',
                    'abattoirs': '/api/v1/abattoirs/',
                    'notifications': '/api/v1/notifications/',
                    'reports': '/api/v1/reports/',
                },
            }
        )
