from django import forms
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_http_methods, require_POST

from .models import (
    Abattoir,
    Animal,
    AnimalHealthWorker,
    HealthEvent,
    Holding,
    MovementRecord,
    Owner,
    SlaughterRecord,
    Transaction,
)


class StyledModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            widget = field.widget
            existing_classes = widget.attrs.get("class", "")
            if isinstance(widget, forms.CheckboxInput):
                widget.attrs["class"] = f"{existing_classes} form-check".strip()
            else:
                widget.attrs["class"] = f"{existing_classes} form-control".strip()


class OwnerForm(StyledModelForm):
    class Meta:
        model = Owner
        fields = ["national_id", "name", "phone_number", "county", "sub_county", "owner_type"]


class HoldingForm(StyledModelForm):
    class Meta:
        model = Holding
        fields = ["owner", "county", "sub_county", "ward", "gps_coordinates", "holding_type", "owner_type"]


class AnimalForm(StyledModelForm):
    class Meta:
        model = Animal
        fields = [
            "rfid_number",
            "species",
            "sex",
            "current_owner",
            "current_holding",
            "birth_holding",
            "age_class",
            "breed",
            "physical_description",
            "animal_status",
            "estimated_live_weight",
            "photo",
        ]


class AnimalHealthWorkerForm(StyledModelForm):
    class Meta:
        model = AnimalHealthWorker
        fields = [
            "name",
            "dvs_number",
            "phone_number",
            "county",
            "sub_county",
            "worker_type",
            "verified",
            "assigned_zone",
        ]


class HealthEventForm(StyledModelForm):
    class Meta:
        model = HealthEvent
        fields = [
            "animal",
            "event_type",
            "disease_name",
            "vaccine_name",
            "treatment_given",
            "cause_of_death",
            "date_of_event",
            "recorded_by",
            "credential_level",
            "notes",
        ]
        widgets = {"date_of_event": forms.DateInput(attrs={"type": "date"})}


class TransactionForm(StyledModelForm):
    class Meta:
        model = Transaction
        fields = [
            "seller",
            "buyer",
            "animal",
            "asking_price",
            "agreed_price",
            "payment_status",
            "sale_channel",
            "delivery_arrangement",
            "sale_date",
        ]
        widgets = {"sale_date": forms.DateInput(attrs={"type": "date"})}


class MovementRecordForm(StyledModelForm):
    class Meta:
        model = MovementRecord
        fields = [
            "animal",
            "from_holding",
            "to_holding",
            "movement_date",
            "purpose_of_movement",
            "country_crossing",
            "permit_number",
            "movement_status",
            "linked_transaction",
        ]
        widgets = {"movement_date": forms.DateInput(attrs={"type": "date"})}


class AbattoirForm(StyledModelForm):
    class Meta:
        model = Abattoir
        fields = ["license_number", "holding", "county", "sub_county", "phone_number"]


class SlaughterRecordForm(StyledModelForm):
    class Meta:
        model = SlaughterRecord
        fields = [
            "animal",
            "abattoir",
            "last_holding",
            "chain_number",
            "carcass_feedback",
            "batch_number",
            "date_of_slaughter",
        ]
        widgets = {"date_of_slaughter": forms.DateInput(attrs={"type": "date"})}


MODEL_CONFIG = {
    "owners": {
        "model": Owner,
        "form": OwnerForm,
        "title": "Owners",
        "subtitle": "Manage farmer and owner identity records",
        "pk": "owner_id",
        "list_fields": ["owner_id", "name", "national_id", "phone_number", "county", "sub_county", "owner_type"],
        "search_fields": ["owner_id", "name", "national_id", "phone_number", "county", "sub_county"],
    },
    "holdings": {
        "model": Holding,
        "form": HoldingForm,
        "title": "Holdings",
        "subtitle": "Track registered farms, markets, and animal locations",
        "pk": "holding_id",
        "list_fields": ["holding_id", "owner", "county", "sub_county", "ward", "holding_type"],
        "search_fields": ["holding_id", "owner__name", "county", "sub_county", "ward"],
    },
    "animals": {
        "model": Animal,
        "form": AnimalForm,
        "title": "Animal Registry",
        "subtitle": "Manage and track all registered animals",
        "pk": "animal_id",
        "list_fields": ["animal_id", "rfid_number", "species", "sex", "current_owner", "animal_status"],
        "search_fields": ["animal_id", "rfid_number", "breed", "current_owner__name"],
    },
    "health_workers": {
        "model": AnimalHealthWorker,
        "form": AnimalHealthWorkerForm,
        "title": "Animal Health Workers",
        "subtitle": "Maintain veterinary and animal health worker records",
        "pk": "worker_id",
        "list_fields": ["worker_id", "name", "dvs_number", "phone_number", "county", "worker_type", "verified"],
        "search_fields": ["worker_id", "name", "dvs_number", "phone_number", "county", "worker_type"],
    },
    "health_events": {
        "model": HealthEvent,
        "form": HealthEventForm,
        "title": "Health Records",
        "subtitle": "Record vaccinations, treatments, disease reports, and inspections",
        "pk": "event_id",
        "list_fields": ["event_id", "animal", "event_type", "date_of_event", "recorded_by", "credential_level"],
        "search_fields": ["event_id", "animal__rfid_number", "recorded_by__name", "disease_name", "vaccine_name"],
    },
    "movements": {
        "model": MovementRecord,
        "form": MovementRecordForm,
        "title": "Animal Movement Tracking",
        "subtitle": "Monitor livestock movements between holdings",
        "pk": "movement_id",
        "list_fields": ["movement_id", "animal", "from_holding", "to_holding", "movement_date", "movement_status"],
        "search_fields": ["movement_id", "animal__rfid_number", "from_holding__holding_id", "to_holding__holding_id"],
    },
    "transactions": {
        "model": Transaction,
        "form": TransactionForm,
        "title": "Transactions",
        "subtitle": "Track animal sales, payments, and ownership transfers",
        "pk": "transaction_id",
        "list_fields": ["transaction_id", "animal", "seller", "buyer", "agreed_price", "payment_status", "sale_date"],
        "search_fields": ["transaction_id", "animal__rfid_number", "seller__name", "buyer__name"],
    },
    "abattoirs": {
        "model": Abattoir,
        "form": AbattoirForm,
        "title": "Abattoir Management",
        "subtitle": "Manage slaughter facilities and processing locations",
        "pk": "abattoir_id",
        "list_fields": ["abattoir_id", "license_number", "holding", "county", "sub_county", "phone_number"],
        "search_fields": ["abattoir_id", "license_number", "holding__holding_id", "county", "sub_county"],
    },
    "slaughter_records": {
        "model": SlaughterRecord,
        "form": SlaughterRecordForm,
        "title": "Slaughter Records",
        "subtitle": "Maintain carcass, batch, and slaughter traceability records",
        "pk": "slaughter_record_id",
        "list_fields": ["slaughter_record_id", "animal", "abattoir", "last_holding", "batch_number", "date_of_slaughter"],
        "search_fields": ["slaughter_record_id", "animal__rfid_number", "abattoir__license_number", "batch_number"],
    },
}


NAV_ITEMS = [
    ("home", "Dashboard", "cattletrace:home", "H"),
    ("animals", "Animals", "cattletrace:animals", "A"),
    ("holdings", "Holdings", "cattletrace:holdings", "P"),
    ("owners", "Owners", "cattletrace:owners", "O"),
    ("movements", "Movements", "cattletrace:movements", "M"),
    ("health_events", "Health Records", "cattletrace:health_events", "R"),
    ("transactions", "Transactions", "cattletrace:transactions", "T"),
    ("abattoirs", "Abattoirs", "cattletrace:abattoirs", "B"),
    ("slaughter_records", "Slaughter Records", "cattletrace:slaughter_records", "S"),
    ("health_workers", "Health Workers", "cattletrace:health_workers", "W"),
]


def wants_json(request):
    return request.GET.get("format") == "json" or "application/json" in request.headers.get("Accept", "")


def template_context(active_key):
    return {"nav_items": NAV_ITEMS, "active_key": active_key}


def label_for(field_name):
    return field_name.replace("_", " ").title()


def value_for(obj, field_name):
    value = getattr(obj, field_name)
    if value is True:
        return "Yes"
    if value is False:
        return "No"
    return str(value) if value is not None else ""


def badge_class(value):
    value = str(value).lower()
    if value in {"active", "completed", "paid", "verified", "yes"}:
        return "badge-success"
    if value in {"pending", "in_transit", "treatment", "inspection"}:
        return "badge-warning"
    if value in {"dead", "lost", "failed", "cancelled", "death", "disease", "no"}:
        return "badge-danger"
    if value in {"sold", "transferred", "refunded", "vaccination"}:
        return "badge-info"
    return "badge-neutral"


def serialize_object(obj, fields=None):
    fields = fields or [field.name for field in obj._meta.fields]
    return {field: value_for(obj, field) for field in fields}


def apply_search(queryset, request, fields):
    query = request.GET.get("q", "").strip()
    if not query:
        return queryset

    filters = Q()
    for field in fields:
        filters |= Q(**{f"{field}__icontains": query})
    return queryset.filter(filters)


def build_table_rows(page_obj, config, key):
    rows = []
    for obj in page_obj:
        pk_value = getattr(obj, config["pk"])
        cells = []
        for field in config["list_fields"]:
            value = value_for(obj, field)
            is_badge = field.endswith("status") or field in {"event_type", "verified", "credential_level"}
            cells.append({
                "value": value,
                "is_badge": is_badge,
                "badge_class": badge_class(value),
            })
        rows.append({
            "pk": pk_value,
            "detail_url": reverse(f"cattletrace:{key}_detail", args=[pk_value]),
            "update_url": reverse(f"cattletrace:{key}_update", args=[pk_value]),
            "delete_url": reverse(f"cattletrace:{key}_delete", args=[pk_value]),
            "cells": cells,
        })
    return rows


def resource_list(request, key):
    config = MODEL_CONFIG[key]
    queryset = apply_search(config["model"].objects.all(), request, config["search_fields"])

    if wants_json(request):
        return JsonResponse({
            "results": [serialize_object(obj, config["list_fields"]) for obj in queryset[:100]],
            "count": queryset.count(),
        })

    paginator = Paginator(queryset, 20)
    page_obj = paginator.get_page(request.GET.get("page"))
    context = {
        **template_context(key),
        "config": config,
        "resource_key": key,
        "query": request.GET.get("q", ""),
        "page_obj": page_obj,
        "total_count": queryset.count(),
        "headers": [label_for(field) for field in config["list_fields"]],
        "rows": build_table_rows(page_obj, config, key),
        "create_url": reverse(f"cattletrace:{key}_create"),
    }
    return render(request, "cattletrace/resource_list.html", context)


def resource_detail(request, key, pk):
    config = MODEL_CONFIG[key]
    obj = get_object_or_404(config["model"], pk=pk)

    if wants_json(request):
        return JsonResponse(serialize_object(obj))

    fields = [
        {"label": label_for(field.name), "value": value_for(obj, field.name)}
        for field in obj._meta.fields
    ]
    context = {
        **template_context(key),
        "config": config,
        "object": obj,
        "fields": fields,
        "list_url": reverse(f"cattletrace:{key}"),
        "update_url": reverse(f"cattletrace:{key}_update", args=[pk]),
        "delete_url": reverse(f"cattletrace:{key}_delete", args=[pk]),
    }
    return render(request, "cattletrace/resource_detail.html", context)


@require_http_methods(["GET", "POST"])
def resource_create(request, key):
    config = MODEL_CONFIG[key]
    # include request.FILES so file uploads (ImageField/FileField) are processed
    form = config["form"](request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        obj = form.save()
        if wants_json(request):
            return JsonResponse(serialize_object(obj), status=201)
        return redirect(f"cattletrace:{key}_detail", pk=obj.pk)

    if wants_json(request) and request.method == "POST":
        return JsonResponse({"errors": form.errors}, status=400)

    context = {
        **template_context(key),
        "config": config,
        "form": form,
        "form_title": f"Create {config['title']}",
        "submit_label": "Save record",
        "cancel_url": reverse(f"cattletrace:{key}"),
    }
    return render(request, "cattletrace/resource_form.html", context)


@require_http_methods(["GET", "POST"])
def resource_update(request, key, pk):
    config = MODEL_CONFIG[key]
    obj = get_object_or_404(config["model"], pk=pk)
    # include request.FILES so file uploads replace existing files when updating
    form = config["form"](request.POST or None, request.FILES or None, instance=obj)
    if request.method == "POST" and form.is_valid():
        obj = form.save()
        if wants_json(request):
            return JsonResponse(serialize_object(obj))
        return redirect(f"cattletrace:{key}_detail", pk=obj.pk)

    if wants_json(request) and request.method == "POST":
        return JsonResponse({"errors": form.errors}, status=400)

    context = {
        **template_context(key),
        "config": config,
        "form": form,
        "form_title": f"Edit {config['title']}",
        "submit_label": "Save changes",
        "cancel_url": reverse(f"cattletrace:{key}_detail", args=[pk]),
    }
    return render(request, "cattletrace/resource_form.html", context)


@require_POST
def resource_delete(request, key, pk):
    config = MODEL_CONFIG[key]
    obj = get_object_or_404(config["model"], pk=pk)
    obj.delete()
    if wants_json(request):
        return JsonResponse({"deleted": True})
    return redirect(f"cattletrace:{key}")


def home(request):
    stats = [
        {"label": "Total Animals", "value": Animal.objects.count(), "hint": "Registered animals", "tone": "primary", "icon": "A"},
        {"label": "Active Holdings", "value": Holding.objects.count(), "hint": "Registered properties", "tone": "secondary", "icon": "P"},
        {"label": "Health Alerts", "value": HealthEvent.objects.filter(event_type__in=["disease", "death"]).count(), "hint": "Requires attention", "tone": "danger", "icon": "R"},
        {"label": "Pending Transfers", "value": MovementRecord.objects.filter(movement_status="pending").count(), "hint": "Awaiting approval", "tone": "warning", "icon": "M"},
        {"label": "Recent Transactions", "value": Transaction.objects.count(), "hint": "Sale records", "tone": "success", "icon": "T"},
        {"label": "Abattoirs", "value": Abattoir.objects.count(), "hint": "Processing facilities", "tone": "info", "icon": "B"},
    ]

    if wants_json(request):
        return JsonResponse({item["label"]: item["value"] for item in stats})

    recent_movements = MovementRecord.objects.select_related("animal", "from_holding", "to_holding")[:5]
    recent_health_events = HealthEvent.objects.select_related("animal", "recorded_by")[:5]
    species_counts = [
        {"label": label_for(code), "count": Animal.objects.filter(species=code).count()}
        for code, _ in Animal._meta.get_field("species").choices
    ]
    context = {
        **template_context("home"),
        "stats": stats,
        "recent_movements": recent_movements,
        "recent_health_events": recent_health_events,
        "species_counts": species_counts,
    }
    return render(request, "cattletrace/dashboard.html", context)


def owners(request):
    return resource_list(request, "owners")


def owner_detail(request, pk):
    return resource_detail(request, "owners", pk)


def owner_create(request):
    return resource_create(request, "owners")


def owner_update(request, pk):
    return resource_update(request, "owners", pk)


def owner_delete(request, pk):
    return resource_delete(request, "owners", pk)


def holdings(request):
    return resource_list(request, "holdings")


def holding_detail(request, pk):
    return resource_detail(request, "holdings", pk)


def holding_create(request):
    return resource_create(request, "holdings")


def holding_update(request, pk):
    return resource_update(request, "holdings", pk)


def holding_delete(request, pk):
    return resource_delete(request, "holdings", pk)


def animals(request):
    return resource_list(request, "animals")


def animal_detail(request, pk):
    return resource_detail(request, "animals", pk)


def animal_create(request):
    return resource_create(request, "animals")


def animal_update(request, pk):
    return resource_update(request, "animals", pk)


def animal_delete(request, pk):
    return resource_delete(request, "animals", pk)


def health_workers(request):
    return resource_list(request, "health_workers")


def health_worker_detail(request, pk):
    return resource_detail(request, "health_workers", pk)


def health_worker_create(request):
    return resource_create(request, "health_workers")


def health_worker_update(request, pk):
    return resource_update(request, "health_workers", pk)


def health_worker_delete(request, pk):
    return resource_delete(request, "health_workers", pk)


def health_events(request):
    return resource_list(request, "health_events")


def health_event_detail(request, pk):
    return resource_detail(request, "health_events", pk)


def health_event_create(request):
    return resource_create(request, "health_events")


def health_event_update(request, pk):
    return resource_update(request, "health_events", pk)


def health_event_delete(request, pk):
    return resource_delete(request, "health_events", pk)


def movements(request):
    return resource_list(request, "movements")


def movement_detail(request, pk):
    return resource_detail(request, "movements", pk)


def movement_create(request):
    return resource_create(request, "movements")


def movement_update(request, pk):
    return resource_update(request, "movements", pk)


def movement_delete(request, pk):
    return resource_delete(request, "movements", pk)


def transactions(request):
    return resource_list(request, "transactions")


def transaction_detail(request, pk):
    return resource_detail(request, "transactions", pk)


def transaction_create(request):
    return resource_create(request, "transactions")


def transaction_update(request, pk):
    return resource_update(request, "transactions", pk)


def transaction_delete(request, pk):
    return resource_delete(request, "transactions", pk)


def abattoirs(request):
    return resource_list(request, "abattoirs")


def abattoir_detail(request, pk):
    return resource_detail(request, "abattoirs", pk)


def abattoir_create(request):
    return resource_create(request, "abattoirs")


def abattoir_update(request, pk):
    return resource_update(request, "abattoirs", pk)


def abattoir_delete(request, pk):
    return resource_delete(request, "abattoirs", pk)


def slaughter_records(request):
    return resource_list(request, "slaughter_records")


def slaughter_record_detail(request, pk):
    return resource_detail(request, "slaughter_records", pk)


def slaughter_record_create(request):
    return resource_create(request, "slaughter_records")


def slaughter_record_update(request, pk):
    return resource_update(request, "slaughter_records", pk)


def slaughter_record_delete(request, pk):
    return resource_delete(request, "slaughter_records", pk)
