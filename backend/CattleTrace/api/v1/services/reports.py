"""Report aggregation and export helpers."""

import csv
import io
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from CattleTrace.models import (
    Animal,
    DiseaseOutbreak,
    Farm,
    HealthRecord,
    MarketplaceListing,
    MovementRecord,
    SlaughterRecord,
    Transaction,
    User,
)

STAFF_ROLES = (
    User.Role.ADMIN,
    User.Role.INSPECTOR,
    User.Role.VET,
)

REPORT_TYPES = (
    'herd',
    'health',
    'movement',
    'marketplace',
    'slaughter',
    'outbreak',
)

DISEASE_COLORS = (
    '#DC2626',
    '#F59E0B',
    '#0EA5E9',
    '#8B5CF6',
    '#64748B',
    '#2E7D32',
    '#1565C0',
)


def _parse_date_range(params):
    today = timezone.now().date()
    start_date = params.get('start_date')
    end_date = params.get('end_date')
    preset = params.get('range')

    if end_date:
        end = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
    else:
        end = today

    if start_date:
        start = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
    elif preset in {'30', '30d'}:
        start = end - timedelta(days=30)
    elif preset in {'90', '90d'}:
        start = end - timedelta(days=90)
    elif preset in {'180', '180d', '6m'}:
        start = end - timedelta(days=180)
    elif preset in {'365', '365d', '1y'}:
        start = end - timedelta(days=365)
    else:
        start = end - timedelta(days=180)

    return start, end


def _animals_queryset(user):
    queryset = Animal.objects.select_related('breed', 'current_farm', 'current_owner')
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.FARMER:
        return queryset.filter(current_owner=user)
    if user.role == User.Role.BUYER:
        return queryset.filter(status=Animal.Status.ALIVE)
    return queryset.none()


def _farms_queryset(user):
    queryset = Farm.objects.all()
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.FARMER:
        return queryset.filter(owner=user)
    return queryset.none()


def _health_queryset(user):
    queryset = HealthRecord.objects.select_related('animal', 'diagnosis', 'vet')
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.FARMER:
        return queryset.filter(animal__current_owner=user)
    return queryset.none()


def _movements_queryset(user):
    queryset = MovementRecord.objects.select_related('animal', 'origin_farm', 'destination_farm')
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.FARMER:
        return queryset.filter(animal__current_owner=user)
    return queryset.none()


def _transactions_queryset(user):
    queryset = Transaction.objects.select_related('listing', 'listing__animal', 'buyer', 'seller')
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.FARMER:
        return queryset.filter(seller=user)
    if user.role == User.Role.BUYER:
        return queryset.filter(buyer=user)
    return queryset.none()


def _listings_queryset(user):
    queryset = MarketplaceListing.objects.select_related('animal', 'seller')
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.FARMER:
        return queryset.filter(seller=user)
    if user.role == User.Role.BUYER:
        return queryset.filter(status=MarketplaceListing.ListingStatus.ACTIVE)
    return queryset.none()


def _slaughter_queryset(user):
    queryset = SlaughterRecord.objects.select_related('animal', 'abattoir', 'inspector')
    if user.role in STAFF_ROLES:
        return queryset
    if user.role == User.Role.ABATTOIR:
        return queryset.filter(abattoir__is_active=True)
    if user.role == User.Role.FARMER:
        return queryset.filter(animal__current_owner=user)
    return queryset.none()


def _outbreaks_queryset(user):
    if user.role in STAFF_ROLES or user.role == User.Role.VET:
        return DiseaseOutbreak.objects.select_related('disease', 'reported_by')
    return DiseaseOutbreak.objects.none()


def _decimal(value):
    if value is None:
        return 0
    if isinstance(value, Decimal):
        return float(value)
    return value


def build_overview(user, params):
    start, end = _parse_date_range(params)
    animals = _animals_queryset(user)
    farms = _farms_queryset(user)
    health_records = _health_queryset(user).filter(date__gte=start, date__lte=end)
    transactions = _transactions_queryset(user).filter(
        transaction_date__date__gte=start,
        transaction_date__date__lte=end,
    )

    regional = (
        animals.filter(current_farm__isnull=False)
        .values('current_farm__county')
        .annotate(count=Count('id'))
        .order_by('-count')[:8]
    )
    regional_data = [
        {
            'region': row['current_farm__county'] or 'Unknown',
            'count': row['count'],
        }
        for row in regional
    ]

    monthly = (
        transactions.annotate(month=TruncMonth('transaction_date'))
        .values('month')
        .annotate(revenue=Sum('agreed_price'))
        .order_by('month')
    )
    monthly_revenue = [
        {
            'month': row['month'].strftime('%b') if row['month'] else '',
            'revenue': _decimal(row['revenue']),
        }
        for row in monthly
    ]

    disease_rows = (
        health_records.filter(diagnosis__isnull=False)
        .values('diagnosis__name')
        .annotate(cases=Count('id'))
        .order_by('-cases')[:6]
    )
    disease_data = [
        {
            'disease': row['diagnosis__name'],
            'cases': row['cases'],
            'color': DISEASE_COLORS[index % len(DISEASE_COLORS)],
        }
        for index, row in enumerate(disease_rows)
    ]

    total_animals = animals.count()
    active_holdings = farms.count()
    traceable = animals.filter(rfid_tag__isnull=False).exclude(rfid_tag='').count()
    compliance_rate = round((traceable / total_animals) * 100, 1) if total_animals else 0.0

    return {
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'regional_data': regional_data,
        'monthly_revenue': monthly_revenue,
        'disease_data': disease_data,
        'compliance': {
            'traceability_rate': compliance_rate,
            'total_animals': total_animals,
            'active_holdings': active_holdings,
        },
    }


def build_herd_report(user, params):
    start, end = _parse_date_range(params)
    animals = _animals_queryset(user).filter(
        registration_date__gte=start,
        registration_date__lte=end,
    )
    rows = [
        {
            'tag_number': animal.tag_number,
            'breed': animal.breed.name if animal.breed else '',
            'sex': animal.get_sex_display(),
            'status': animal.get_status_display(),
            'county': animal.current_farm.county if animal.current_farm else '',
            'registration_date': animal.registration_date.isoformat(),
        }
        for animal in animals.order_by('-registration_date')[:500]
    ]
    by_status = (
        animals.values('status')
        .annotate(count=Count('id'))
        .order_by('status')
    )
    return {
        'report_type': 'herd',
        'title': 'Herd Report',
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'summary': {
            'total_animals': animals.count(),
            'by_status': {row['status']: row['count'] for row in by_status},
        },
        'rows': rows,
        'columns': ['tag_number', 'breed', 'sex', 'status', 'county', 'registration_date'],
    }


def build_health_report(user, params):
    start, end = _parse_date_range(params)
    records = _health_queryset(user).filter(date__gte=start, date__lte=end)
    rows = [
        {
            'animal_tag': record.animal.tag_number,
            'record_type': record.get_record_type_display(),
            'diagnosis': record.diagnosis.name if record.diagnosis else '',
            'date': record.date.isoformat(),
            'vet': record.vet.username if record.vet else '',
        }
        for record in records.order_by('-date')[:500]
    ]
    return {
        'report_type': 'health',
        'title': 'Health Report',
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'summary': {
            'total_records': records.count(),
            'vaccinations': records.filter(record_type=HealthRecord.RecordType.VACCINATION).count(),
            'treatments': records.filter(record_type=HealthRecord.RecordType.TREATMENT).count(),
        },
        'rows': rows,
        'columns': ['animal_tag', 'record_type', 'diagnosis', 'date', 'vet'],
    }


def build_movement_report(user, params):
    start, end = _parse_date_range(params)
    movements = _movements_queryset(user).filter(move_date__gte=start, move_date__lte=end)
    rows = [
        {
            'animal_tag': movement.animal.tag_number,
            'origin_county': movement.origin_county,
            'destination_county': movement.destination_county,
            'move_date': movement.move_date.isoformat(),
            'purpose': movement.purpose,
        }
        for movement in movements.order_by('-move_date')[:500]
    ]
    return {
        'report_type': 'movement',
        'title': 'Movement Report',
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'summary': {
            'total_movements': movements.count(),
            'cross_county': movements.exclude(origin_county=F('destination_county')).count(),
        },
        'rows': rows,
        'columns': ['animal_tag', 'origin_county', 'destination_county', 'move_date', 'purpose'],
    }


def build_marketplace_report(user, params):
    start, end = _parse_date_range(params)
    transactions = _transactions_queryset(user).filter(
        transaction_date__date__gte=start,
        transaction_date__date__lte=end,
    )
    listings = _listings_queryset(user).filter(
        listed_on__date__gte=start,
        listed_on__date__lte=end,
    )
    rows = [
        {
            'animal_tag': txn.listing.animal.tag_number,
            'buyer': txn.buyer.username,
            'seller': txn.seller.username,
            'agreed_price': _decimal(txn.agreed_price),
            'payment_method': txn.get_payment_method_display(),
            'transaction_date': txn.transaction_date.date().isoformat(),
        }
        for txn in transactions.order_by('-transaction_date')[:500]
    ]
    total_revenue = transactions.aggregate(total=Sum('agreed_price'))['total'] or 0
    return {
        'report_type': 'marketplace',
        'title': 'Marketplace Report',
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'summary': {
            'total_transactions': transactions.count(),
            'active_listings': listings.filter(status=MarketplaceListing.ListingStatus.ACTIVE).count(),
            'total_revenue': _decimal(total_revenue),
        },
        'rows': rows,
        'columns': ['animal_tag', 'buyer', 'seller', 'agreed_price', 'payment_method', 'transaction_date'],
    }


def build_slaughter_report(user, params):
    start, end = _parse_date_range(params)
    records = _slaughter_queryset(user).filter(slaughter_date__gte=start, slaughter_date__lte=end)
    rows = [
        {
            'slaughter_no': record.slaughter_no,
            'animal_tag': record.animal.tag_number,
            'abattoir': record.abattoir.name if record.abattoir else '',
            'slaughter_date': record.slaughter_date.isoformat(),
            'live_weight_kg': _decimal(record.live_weight_kg),
            'carcass_weight_kg': _decimal(record.carcass_weight_kg),
            'inspection_result': record.get_inspection_result_display(),
        }
        for record in records.order_by('-slaughter_date')[:500]
    ]
    return {
        'report_type': 'slaughter',
        'title': 'Slaughter Report',
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'summary': {
            'total_slaughters': records.count(),
            'passed': records.filter(
                inspection_result=SlaughterRecord.InspectionResult.PASSED,
            ).count(),
        },
        'rows': rows,
        'columns': [
            'slaughter_no',
            'animal_tag',
            'abattoir',
            'slaughter_date',
            'live_weight_kg',
            'carcass_weight_kg',
            'inspection_result',
        ],
    }


def build_outbreak_report(user, params):
    start, end = _parse_date_range(params)
    outbreaks = _outbreaks_queryset(user).filter(reported_on__gte=start, reported_on__lte=end)
    rows = [
        {
            'disease': outbreak.disease.name if outbreak.disease else '',
            'county': outbreak.county,
            'severity': outbreak.get_severity_display(),
            'reported_on': outbreak.reported_on.isoformat(),
            'animals_affected': outbreak.animals_affected,
            'is_active': outbreak.is_active,
        }
        for outbreak in outbreaks.order_by('-reported_on')[:500]
    ]
    return {
        'report_type': 'outbreak',
        'title': 'Outbreak Report',
        'date_range': {'start': start.isoformat(), 'end': end.isoformat()},
        'summary': {
            'total_outbreaks': outbreaks.count(),
            'active_outbreaks': outbreaks.filter(is_active=True).count(),
        },
        'rows': rows,
        'columns': ['disease', 'county', 'severity', 'reported_on', 'animals_affected', 'is_active'],
    }


REPORT_BUILDERS = {
    'herd': build_herd_report,
    'health': build_health_report,
    'movement': build_movement_report,
    'marketplace': build_marketplace_report,
    'slaughter': build_slaughter_report,
    'outbreak': build_outbreak_report,
}


def build_report(user, report_type, params):
    builder = REPORT_BUILDERS.get(report_type)
    if not builder:
        raise ValueError(f'Unknown report type: {report_type}')
    return builder(user, params)


def report_to_csv(report):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(report['columns'])
    for row in report['rows']:
        writer.writerow([row.get(column, '') for column in report['columns']])
    return output.getvalue()


def report_to_pdf(report):
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise RuntimeError('PDF export requires reportlab') from exc

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    pdf.setFont('Helvetica-Bold', 14)
    pdf.drawString(50, y, report['title'])
    y -= 20
    pdf.setFont('Helvetica', 10)
    date_range = report['date_range']
    pdf.drawString(50, y, f"Period: {date_range['start']} to {date_range['end']}")
    y -= 20

    for key, value in report.get('summary', {}).items():
        pdf.drawString(50, y, f"{key.replace('_', ' ').title()}: {value}")
        y -= 16
        if y < 80:
            pdf.showPage()
            y = height - 50

    y -= 10
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(50, y, ' | '.join(report['columns']))
    y -= 14
    pdf.setFont('Helvetica', 9)

    for row in report['rows']:
        line = ' | '.join(str(row.get(column, '')) for column in report['columns'])
        if len(line) > 110:
            line = line[:107] + '...'
        pdf.drawString(50, y, line)
        y -= 12
        if y < 50:
            pdf.showPage()
            y = height - 50
            pdf.setFont('Helvetica', 9)

    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()
