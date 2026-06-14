from django.contrib import admin

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


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ("owner_id", "name", "national_id", "phone_number", "county", "sub_county", "owner_type")
    list_filter = ("owner_type", "county", "sub_county")
    search_fields = ("owner_id", "name", "national_id", "phone_number")
    ordering = ("name",)


@admin.register(Holding)
class HoldingAdmin(admin.ModelAdmin):
    list_display = ("holding_id", "owner", "county", "sub_county", "ward", "holding_type", "registered_at")
    list_filter = ("holding_type", "owner_type", "county", "sub_county")
    search_fields = ("holding_id", "owner__name", "owner__owner_id", "county", "sub_county", "ward")
    autocomplete_fields = ("owner",)
    date_hierarchy = "registered_at"


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = (
        "animal_id",
        "rfid_number",
        "species",
        "sex",
        "current_owner",
        "current_holding",
        "animal_status",
        "registered_at",
    )
    list_filter = ("species", "sex", "age_class", "animal_status", "registered_at")
    search_fields = (
        "animal_id",
        "rfid_number",
        "breed",
        "current_owner__name",
        "current_owner__owner_id",
        "current_holding__holding_id",
    )
    autocomplete_fields = ("current_owner", "current_holding", "birth_holding")
    date_hierarchy = "registered_at"


@admin.register(AnimalHealthWorker)
class AnimalHealthWorkerAdmin(admin.ModelAdmin):
    list_display = ("worker_id", "name", "dvs_number", "phone_number", "county", "sub_county", "worker_type", "verified")
    list_filter = ("verified", "worker_type", "county", "sub_county")
    search_fields = ("worker_id", "name", "dvs_number", "phone_number", "assigned_zone")
    date_hierarchy = "registered_at"


@admin.register(HealthEvent)
class HealthEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "animal", "event_type", "date_of_event", "recorded_by", "credential_level")
    list_filter = ("event_type", "credential_level", "date_of_event")
    search_fields = (
        "event_id",
        "animal__animal_id",
        "animal__rfid_number",
        "recorded_by__name",
        "recorded_by__worker_id",
        "disease_name",
        "vaccine_name",
    )
    autocomplete_fields = ("animal", "recorded_by")
    date_hierarchy = "date_of_event"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("transaction_id", "animal", "seller", "buyer", "agreed_price", "payment_status", "sale_channel", "sale_date")
    list_filter = ("payment_status", "sale_channel", "sale_date")
    search_fields = (
        "transaction_id",
        "animal__animal_id",
        "animal__rfid_number",
        "seller__name",
        "buyer__name",
    )
    autocomplete_fields = ("seller", "buyer", "animal")
    date_hierarchy = "sale_date"


@admin.register(MovementRecord)
class MovementRecordAdmin(admin.ModelAdmin):
    list_display = ("movement_id", "animal", "from_holding", "to_holding", "movement_date", "movement_status", "country_crossing")
    list_filter = ("movement_status", "purpose_of_movement", "country_crossing", "movement_date")
    search_fields = (
        "movement_id",
        "animal__animal_id",
        "animal__rfid_number",
        "from_holding__holding_id",
        "to_holding__holding_id",
        "permit_number",
    )
    autocomplete_fields = ("animal", "from_holding", "to_holding", "linked_transaction")
    date_hierarchy = "movement_date"


@admin.register(Abattoir)
class AbattoirAdmin(admin.ModelAdmin):
    list_display = ("abattoir_id", "license_number", "holding", "county", "sub_county", "phone_number", "registered_at")
    list_filter = ("county", "sub_county", "registered_at")
    search_fields = ("abattoir_id", "license_number", "holding__holding_id", "phone_number")
    autocomplete_fields = ("holding",)
    date_hierarchy = "registered_at"


@admin.register(SlaughterRecord)
class SlaughterRecordAdmin(admin.ModelAdmin):
    list_display = ("slaughter_record_id", "animal", "abattoir", "last_holding", "batch_number", "date_of_slaughter")
    list_filter = ("date_of_slaughter", "abattoir")
    search_fields = (
        "slaughter_record_id",
        "animal__animal_id",
        "animal__rfid_number",
        "abattoir__abattoir_id",
        "batch_number",
        "chain_number",
    )
    autocomplete_fields = ("animal", "abattoir", "last_holding")
    date_hierarchy = "date_of_slaughter"
