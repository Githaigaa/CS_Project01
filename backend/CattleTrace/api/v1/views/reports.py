"""Reports API views."""

from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.v1.services.reports import (
    REPORT_TYPES,
    build_overview,
    build_report,
    report_to_csv,
    report_to_pdf,
)


class ReportsViewSet(viewsets.ViewSet):
    permission_classes = (IsAuthenticated,)

    def list(self, request):
        """Dashboard overview analytics for charts and compliance cards."""
        data = build_overview(request.user, request.query_params)
        return Response(data)

    def retrieve(self, request, pk=None):
        """Detailed report payload for a specific report type."""
        if pk not in REPORT_TYPES:
            return Response({'detail': 'Invalid report type.'}, status=status.HTTP_404_NOT_FOUND)
        data = build_report(request.user, pk, request.query_params)
        return Response(data)

    @action(detail=True, methods=('get',), url_path='export')
    def export(self, request, pk=None):
        if pk not in REPORT_TYPES:
            return Response({'detail': 'Invalid report type.'}, status=status.HTTP_404_NOT_FOUND)

        export_format = request.query_params.get('format', 'csv').lower()
        report = build_report(request.user, pk, request.query_params)
        filename_base = f"cattletrace-{pk}-report"

        if export_format == 'pdf':
            try:
                content = report_to_pdf(report)
            except RuntimeError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.pdf"'
            return response

        content = report_to_csv(report)
        response = HttpResponse(content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename_base}.csv"'
        return response
