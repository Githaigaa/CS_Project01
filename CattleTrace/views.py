from django import forms
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404, redirect
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


class OwnerForm(forms.ModelForm):
    class Meta:
        model = Owner
        fields = ["national_id", "name", "phone_number", "county", "sub_county", "owner_type"]


class HoldingForm(forms.ModelForm):
    class Meta:
        model = Holding
        fields = ["owner", "county", "sub_county", "ward", "gps_coordinates", "holding_type", "owner_type"]


class AnimalForm(forms.ModelForm):
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


class AnimalHealthWorkerForm(forms.ModelForm):
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


class HealthEventForm(forms.ModelForm):
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


class TransactionForm(forms.ModelForm):
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


class MovementRecordForm(forms.ModelForm):
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


class AbattoirForm(forms.ModelForm):
    class Meta:
        model = Abattoir
        fields = ["license_number", "holding", "county", "sub_county", "phone_number"]


class SlaughterRecordForm(forms.ModelForm):
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
        "pk": "owner_id",
        "list_fields": ["owner_id", "name", "national_id", "phone_number", "county", "sub_county", "owner_type"],
        "search_fields": ["owner_id", "name", "national_id", "phone_number", "county", "sub_county"],
    },
    "holdings": {
        "model": Holding,
        "form": HoldingForm,
        "title": "Holdings",
        "pk": "holding_id",
        "list_fields": ["holding_id", "owner", "county", "sub_county", "ward", "holding_type"],
        "search_fields": ["holding_id", "owner__name", "county", "sub_county", "ward"],
    },
    "animals": {
        "model": Animal,
        "form": AnimalForm,
        "title": "Animals",
        "pk": "animal_id",
        "list_fields": ["animal_id", "rfid_number", "species", "sex", "current_owner", "animal_status"],
        "search_fields": ["animal_id", "rfid_number", "breed", "current_owner__name"],
    },
    "health_workers": {
        "model": AnimalHealthWorker,
        "form": AnimalHealthWorkerForm,
        "title": "Animal Health Workers",
        "pk": "worker_id",
        "list_fields": ["worker_id", "name", "dvs_number", "phone_number", "county", "worker_type", "verified"],
        "search_fields": ["worker_id", "name", "dvs_number", "phone_number", "county", "worker_type"],
    },
    "health_events": {
        "model": HealthEvent,
        "form": HealthEventForm,
        "title": "Health Events",
        "pk": "event_id",
        "list_fields": ["event_id", "animal", "event_type", "date_of_event", "recorded_by", "credential_level"],
        "search_fields": ["event_id", "animal__rfid_number", "recorded_by__name", "disease_name", "vaccine_name"],
    },
    "movements": {
        "model": MovementRecord,
        "form": MovementRecordForm,
        "title": "Movement Records",
        "pk": "movement_id",
        "list_fields": ["movement_id", "animal", "from_holding", "to_holding", "movement_date", "movement_status"],
        "search_fields": ["movement_id", "animal__rfid_number", "from_holding__holding_id", "to_holding__holding_id"],
    },
    "transactions": {
        "model": Transaction,
        "form": TransactionForm,
        "title": "Transactions",
        "pk": "transaction_id",
        "list_fields": ["transaction_id", "animal", "seller", "buyer", "agreed_price", "payment_status", "sale_date"],
        "search_fields": ["transaction_id", "animal__rfid_number", "seller__name", "buyer__name"],
    },
    "abattoirs": {
        "model": Abattoir,
        "form": AbattoirForm,
        "title": "Abattoirs",
        "pk": "abattoir_id",
        "list_fields": ["abattoir_id", "license_number", "holding", "county", "sub_county", "phone_number"],
        "search_fields": ["abattoir_id", "license_number", "holding__holding_id", "county", "sub_county"],
    },
    "slaughter_records": {
        "model": SlaughterRecord,
        "form": SlaughterRecordForm,
        "title": "Slaughter Records",
        "pk": "slaughter_record_id",
        "list_fields": ["slaughter_record_id", "animal", "abattoir", "last_holding", "batch_number", "date_of_slaughter"],
        "search_fields": ["slaughter_record_id", "animal__rfid_number", "abattoir__license_number", "batch_number"],
    },
}


def wants_json(request):
    return request.GET.get("format") == "json" or "application/json" in request.headers.get("Accept", "")


def page(title, body):
    return f"""
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{title} | CattleTrace</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 32px; color: #1f2933; }}
            nav a, .actions a {{ margin-right: 12px; }}
            table {{ border-collapse: collapse; width: 100%; margin-top: 16px; }}
            th, td {{ border: 1px solid #d9e2ec; padding: 8px; text-align: left; }}
            th {{ background: #f0f4f8; }}
            label {{ display: block; font-weight: 600; margin-top: 12px; }}
            input, select, textarea {{ box-sizing: border-box; max-width: 520px; width: 100%; padding: 8px; }}
            button {{ margin-top: 16px; padding: 8px 14px; cursor: pointer; }}
            .errorlist {{ color: #b91c1c; }}
        </style>
    </head>
    <body>
        <nav>
            <a href="{reverse("cattletrace:home")}">Dashboard</a>
            <a href="{reverse("cattletrace:owners")}">Owners</a>
            <a href="{reverse("cattletrace:holdings")}">Holdings</a>
            <a href="{reverse("cattletrace:animals")}">Animals</a>
            <a href="{reverse("cattletrace:health_workers")}">Health Workers</a>
            <a href="{reverse("cattletrace:health_events")}">Health Events</a>
            <a href="{reverse("cattletrace:movements")}">Movements</a>
            <a href="{reverse("cattletrace:transactions")}">Transactions</a>
            <a href="{reverse("cattletrace:abattoirs")}">Abattoirs</a>
            <a href="{reverse("cattletrace:slaughter_records")}">Slaughter Records</a>
        </nav>
        {body}
    </body>
    </html>
    """


def csrf_input(request):
    return f'<input type="hidden" name="csrfmiddlewaretoken" value="{get_token(request)}">'


def serialize_object(obj, fields=None):
    fields = fields or [field.name for field in obj._meta.fields]
    data = {}
    for field in fields:
        value = getattr(obj, field)
        data[field] = str(value) if value is not None else None
    return data


def apply_search(queryset, request, fields):
    query = request.GET.get("q", "").strip()
    if not query:
        return queryset

    from django.db.models import Q

    filters = Q()
    for field in fields:
        filters |= Q(**{f"{field}__icontains": query})
    return queryset.filter(filters)


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
    rows = []
    for obj in page_obj:
        pk_value = getattr(obj, config["pk"])
        detail_url = reverse(f"cattletrace:{key}_detail", args=[pk_value])
        cells = "".join(f"<td>{getattr(obj, field)}</td>" for field in config["list_fields"])
        rows.append(f"<tr>{cells}<td><a href='{detail_url}'>View</a></td></tr>")

    headings = "".join(f"<th>{field.replace('_', ' ').title()}</th>" for field in config["list_fields"])
    body = f"""
        <h1>{config["title"]}</h1>
        <form method="get">
            <input name="q" value="{request.GET.get("q", "")}" placeholder="Search {config["title"].lower()}">
            <button type="submit">Search</button>
        </form>
        <p><a href="{reverse(f"cattletrace:{key}_create")}">Create new</a></p>
        <table>
            <thead><tr>{headings}<th>Actions</th></tr></thead>
            <tbody>{"".join(rows) or "<tr><td colspan='20'>No records found.</td></tr>"}</tbody>
        </table>
        <p>Page {page_obj.number} of {paginator.num_pages}</p>
    """
    return HttpResponse(page(config["title"], body))


def resource_detail(request, key, pk):
    config = MODEL_CONFIG[key]
    obj = get_object_or_404(config["model"], pk=pk)

    if wants_json(request):
        return JsonResponse(serialize_object(obj))

    rows = "".join(
        f"<tr><th>{field.name.replace('_', ' ').title()}</th><td>{getattr(obj, field.name)}</td></tr>"
        for field in obj._meta.fields
    )
    body = f"""
        <h1>{config["title"]} Detail</h1>
        <table>{rows}</table>
        <p class="actions">
            <a href="{reverse(f"cattletrace:{key}_update", args=[pk])}">Edit</a>
            <a href="{reverse(f"cattletrace:{key}")}">Back to list</a>
        </p>
        <form method="post" action="{reverse(f"cattletrace:{key}_delete", args=[pk])}">
            {csrf_input(request)}
            <button type="submit">Delete</button>
        </form>
    """
    return HttpResponse(page(f"{config['title']} Detail", body))


@require_http_methods(["GET", "POST"])
def resource_create(request, key):
    config = MODEL_CONFIG[key]
    form = config["form"](request.POST or None)
    if request.method == "POST" and form.is_valid():
        obj = form.save()
        if wants_json(request):
            return JsonResponse(serialize_object(obj), status=201)
        return redirect(f"cattletrace:{key}_detail", pk=obj.pk)

    if wants_json(request) and request.method == "POST":
        return JsonResponse({"errors": form.errors}, status=400)

    body = f"""
        <h1>Create {config["title"]}</h1>
        <form method="post">
            {csrf_input(request)}
            {form.as_p()}
            <button type="submit">Save</button>
        </form>
        <p><a href="{reverse(f"cattletrace:{key}")}">Back to list</a></p>
    """
    return HttpResponse(page(f"Create {config['title']}", body))


@require_http_methods(["GET", "POST"])
def resource_update(request, key, pk):
    config = MODEL_CONFIG[key]
    obj = get_object_or_404(config["model"], pk=pk)
    form = config["form"](request.POST or None, instance=obj)
    if request.method == "POST" and form.is_valid():
        obj = form.save()
        if wants_json(request):
            return JsonResponse(serialize_object(obj))
        return redirect(f"cattletrace:{key}_detail", pk=obj.pk)

    if wants_json(request) and request.method == "POST":
        return JsonResponse({"errors": form.errors}, status=400)

    body = f"""
        <h1>Edit {config["title"]}</h1>
        <form method="post">
            {csrf_input(request)}
            {form.as_p()}
            <button type="submit">Save changes</button>
        </form>
        <p><a href="{reverse(f"cattletrace:{key}_detail", args=[pk])}">Cancel</a></p>
    """
    return HttpResponse(page(f"Edit {config['title']}", body))


@require_POST
def resource_delete(request, key, pk):
    config = MODEL_CONFIG[key]
    obj = get_object_or_404(config["model"], pk=pk)
    obj.delete()
    if wants_json(request):
        return JsonResponse({"deleted": True})
    return redirect(f"cattletrace:{key}")


def home(request):
    counts = {config["title"]: config["model"].objects.count() for config in MODEL_CONFIG.values()}
    if wants_json(request):
        return JsonResponse(counts)

    cards = "".join(f"<li>{name}: {count}</li>" for name, count in counts.items())
    return HttpResponse(page("Dashboard", f"<h1>CattleTrace Dashboard</h1><ul>{cards}</ul>"))


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
