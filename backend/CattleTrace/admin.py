"""
admin.py — Cattle Traceability & Marketplace Platform
Full admin registration for all 20 models with:
  - list_display, list_filter, search_fields, date_hierarchy
  - Inlines for related child records
  - readonly_fields for auto-computed / immutable fields
  - Custom actions (mark verified, mark resolved, etc.)
  - Fieldset grouping for large models
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count

from .models import (
User, Farm,
Breed, Animal, AnimalWeight,
Disease, Vaccine, HealthRecord,
MovementPermit, MovementRecord,
Abattoir, SlaughterRecord,
MarketplaceListing, ListingImage, MarketplaceInquiry, Transaction,
Notification,
DiseaseOutbreak, AuditLog,
)


# ─────────────────────────────────────────────
# SITE CUSTOMISATION
# ─────────────────────────────────────────────

admin.site.site_header  = "Cattle Traceability Platform"
admin.site.site_title   = "CTP Admin"
admin.site.index_title  = "Platform Administration"

# ─────────────────────────────────────────────
# HELPERS / MIXINS
# ─────────────────────────────────────────────


class ReadOnlyMixin:
    """Make all fields read-only (for audit-trail models)."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ─────────────────────────────────────────────
# 1. USER & FARM
# ─────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "get_full_name", "role", "phone_number",
                    "is_verified", "is_active", "date_joined")
    list_filter = ("role", "is_verified", "is_active", "is_staff")
    search_fields = ("username", "first_name", "last_name", "email",
                     "phone_number", "national_id")
    date_hierarchy = "date_joined"
    ordering = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login", "created_at", "updated_at")

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Platform Profile", {
            "fields": ("role", "phone_number", "national_id",
                       "profile_photo", "location", "is_verified"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Platform Profile", {
            "fields": ("role", "phone_number", "national_id", "location"),
        }),
    )

    actions = ["mark_verified", "mark_unverified"]

    @admin.action(description="Mark selected users as verified")
    def mark_verified(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"{updated} user(s) marked as verified.")

    @admin.action(description="Mark selected users as unverified")
    def mark_unverified(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f"{updated} user(s) marked as unverified.")


class FarmAnimalInline(admin.TabularInline):
    model = Animal
    fields = ("tag_number", "breed", "sex", "status", "registration_date")
    readonly_fields = ("tag_number", "breed", "sex", "status", "registration_date")
    extra = 0
    can_delete = False
    show_change_link = True
    verbose_name_plural = "Animals on this Farm"


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ("name", "registration_no", "owner", "county",
                    "sub_county", "total_area_acres", "created_at")
    list_filter = ("county",)
    search_fields = ("name", "registration_no", "owner__username",
                     "owner__first_name", "county")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)
    inlines = [FarmAnimalInline]

    fieldsets = (
        ("Farm Identity", {
            "fields": ("name", "registration_no", "owner"),
        }),
        ("Location", {
            "fields": ("county", "sub_county", "ward",
                       "gps_latitude", "gps_longitude", "total_area_acres"),
        }),
        ("Meta", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )


# ─────────────────────────────────────────────
# 2. ANIMAL REGISTRATION & PROFILE
# ─────────────────────────────────────────────

@admin.register(Breed)
class BreedAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


class AnimalWeightInline(admin.TabularInline):
    model = AnimalWeight
    fields = ("recorded_on", "weight_kg", "recorded_by", "notes")
    extra = 1
    ordering = ("-recorded_on",)


class HealthRecordInline(admin.TabularInline):
    model = HealthRecord
    fields = ("date", "record_type", "vet", "diagnosis", "next_due_date")
    readonly_fields = ("date",)
    extra = 0
    show_change_link = True
    ordering = ("-date",)


class MovementInline(admin.TabularInline):
    model = MovementRecord
    fields = ("move_date", "origin_county", "destination_county", "purpose", "permit")
    readonly_fields = ("move_date",)
    extra = 0
    show_change_link = True
    ordering = ("-move_date",)


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ("tag_number", "name", "breed", "sex", "status",
                    "current_owner", "current_farm", "age_months_display",
                    "registration_date")
    list_filter = ("status", "sex", "breed", "registration_date")
    search_fields = ("tag_number", "rfid_tag", "name",
                     "current_owner__username", "current_owner__first_name",
                     "current_farm__name")
    date_hierarchy = "registration_date"
    readonly_fields = ("uuid", "age_months_display", "created_at", "updated_at")
    inlines = [AnimalWeightInline, HealthRecordInline, MovementInline]

    fieldsets = (
        ("Identity", {
            "fields": ("tag_number", "rfid_tag", "uuid", "name", "photo"),
        }),
        ("Classification", {
            "fields": ("breed", "sex", "date_of_birth", "age_months_display",
                       "color", "markings"),
        }),
        ("Ownership & Location", {
            "fields": ("current_owner", "current_farm", "status"),
        }),
        ("Lineage", {
            "fields": ("dam", "sire"),
            "classes": ("collapse",),
        }),
        ("Registration", {
            "fields": ("registered_by", "registration_date", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Age (months)")
    def age_months_display(self, obj):
        return obj.age_months


@admin.register(AnimalWeight)
class AnimalWeightAdmin(admin.ModelAdmin):
    list_display = ("animal", "weight_kg", "recorded_on", "recorded_by")
    list_filter = ("recorded_on",)
    search_fields = ("animal__tag_number", "recorded_by__username")
    date_hierarchy = "recorded_on"


# ─────────────────────────────────────────────
# 3. HEALTH RECORDS
# ─────────────────────────────────────────────

@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ("name", "is_notifiable", "description")
    list_filter = ("is_notifiable",)
    search_fields = ("name",)


@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = ("name", "manufacturer", "validity_days")
    search_fields = ("name", "manufacturer")
    filter_horizontal = ("target_diseases",)


@admin.register(HealthRecord)
class HealthRecordAdmin(admin.ModelAdmin):
    list_display = ("animal", "record_type", "date", "vet",
                    "diagnosis", "next_due_date", "certificate_no")
    list_filter = ("record_type", "date", "diagnosis")
    search_fields = ("animal__tag_number", "vet__username",
                     "vet__first_name", "diagnosis__name", "certificate_no")
    date_hierarchy = "date"
    readonly_fields = ("created_at",)

    fieldsets = (
        ("Event", {
            "fields": ("animal", "record_type", "date", "vet"),
        }),
        ("Clinical Details", {
            "fields": ("diagnosis", "temperature", "medication",
                       "dosage", "vaccine_used"),
        }),
        ("Follow-up", {
            "fields": ("next_due_date", "certificate_no", "notes"),
        }),
        ("Meta", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )


# ─────────────────────────────────────────────
# 4. MOVEMENT TRACKING
# ─────────────────────────────────────────────

@admin.register(MovementPermit)
class MovementPermitAdmin(admin.ModelAdmin):
    list_display = ("permit_number", "status", "issued_by",
                    "issued_on", "valid_until")
    list_filter = ("status", "issued_on")
    search_fields = ("permit_number", "issued_by__username")
    date_hierarchy = "issued_on"
    readonly_fields = ("issued_on",)

    actions = ["approve_permits", "reject_permits"]

    @admin.action(description="Approve selected permits")
    def approve_permits(self, request, queryset):
        updated = queryset.filter(status="pending").update(status="approved")
        self.message_user(request, f"{updated} permit(s) approved.")

    @admin.action(description="Reject selected permits")
    def reject_permits(self, request, queryset):
        updated = queryset.filter(status="pending").update(status="rejected")
        self.message_user(request, f"{updated} permit(s) rejected.")


@admin.register(MovementRecord)
class MovementRecordAdmin(admin.ModelAdmin):
    list_display = ("animal", "move_date", "origin_county",
                    "destination_county", "purpose", "permit", "recorded_by")
    list_filter = ("purpose", "move_date", "origin_county", "destination_county")
    search_fields = ("animal__tag_number", "origin_county",
                     "destination_county", "transporter", "vehicle_reg")
    date_hierarchy = "move_date"
    readonly_fields = ("created_at",)

    fieldsets = (
        ("Animal & Permit", {
            "fields": ("animal", "permit"),
        }),
        ("Route", {
            "fields": ("origin_farm", "origin_county",
                       "destination_farm", "destination_county",
                       "move_date", "purpose"),
        }),
        ("Transport", {
            "fields": ("transporter", "vehicle_reg",
                       "gps_latitude", "gps_longitude"),
        }),
        ("Meta", {
            "fields": ("recorded_by", "created_at"),
            "classes": ("collapse",),
        }),
    )


# ─────────────────────────────────────────────
# 5. SLAUGHTER RECORDS
# ─────────────────────────────────────────────

@admin.register(Abattoir)
class AbattoirAdmin(admin.ModelAdmin):
    list_display = ("name", "license_no", "county", "contact", "is_active")
    list_filter = ("county", "is_active")
    search_fields = ("name", "license_no", "county")


@admin.register(SlaughterRecord)
class SlaughterRecordAdmin(admin.ModelAdmin):
    list_display = ("slaughter_no", "animal", "abattoir", "slaughter_date",
                    "live_weight_kg", "carcass_weight_kg",
                    "dressing_pct_display", "inspection_result", "inspector")
    list_filter = ("inspection_result", "slaughter_date", "abattoir")
    search_fields = ("slaughter_no", "animal__tag_number",
                     "abattoir__name", "inspector__username")
    date_hierarchy = "slaughter_date"
    readonly_fields = ("dressing_pct_display", "created_at")

    fieldsets = (
        ("Record Identity", {
            "fields": ("slaughter_no", "animal", "abattoir", "slaughter_date"),
        }),
        ("Carcass Weights", {
            "fields": ("live_weight_kg", "carcass_weight_kg",
                       "dressing_pct_display", "hide_weight_kg", "offal_weight_kg"),
        }),
        ("Inspection", {
            "fields": ("inspector", "inspection_result",
                       "condemnation_reason", "meat_grade"),
        }),
        ("Notes & Meta", {
            "fields": ("notes", "created_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Dressing %")
    def dressing_pct_display(self, obj):
        pct = obj.dressing_percentage
        if pct is None:
            return "—"
        color = "green" if pct >= 50 else "orange"
        return format_html('<b style="color:{}">{} %</b>', color, pct)


# ─────────────────────────────────────────────
# 6. MARKETPLACE
# ─────────────────────────────────────────────

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    fields = ("image", "caption", "is_primary")
    extra = 1


class MarketplaceInquiryInline(admin.TabularInline):
    model = MarketplaceInquiry
    fields = ("buyer", "message", "offer_price", "sent_at", "is_read")
    readonly_fields = ("buyer", "message", "offer_price", "sent_at")
    extra = 0
    can_delete = False


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
    list_display = ("animal", "seller", "asking_price", "is_negotiable",
                    "location_county", "status", "views_count", "listed_on")
    list_filter = ("status", "is_negotiable", "location_county", "listed_on")
    search_fields = ("animal__tag_number", "seller__username",
                     "seller__first_name", "location_county")
    date_hierarchy = "listed_on"
    readonly_fields = ("listed_on", "views_count", "updated_at")
    inlines = [ListingImageInline, MarketplaceInquiryInline]

    fieldsets = (
        ("Listing", {
            "fields": ("animal", "seller", "status"),
        }),
        ("Pricing", {
            "fields": ("asking_price", "is_negotiable"),
        }),
        ("Details", {
            "fields": ("description", "location_county", "expires_on"),
        }),
        ("Stats", {
            "fields": ("views_count", "listed_on", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    actions = ["withdraw_listings"]

    @admin.action(description="Withdraw selected listings")
    def withdraw_listings(self, request, queryset):
        updated = queryset.filter(status="active").update(status="withdrawn")
        self.message_user(request, f"{updated} listing(s) withdrawn.")


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ("listing", "caption", "is_primary", "uploaded_at")
    list_filter = ("is_primary",)
    search_fields = ("listing__animal__tag_number", "caption")


@admin.register(MarketplaceInquiry)
class MarketplaceInquiryAdmin(admin.ModelAdmin):
    list_display = ("listing", "buyer", "offer_price", "sent_at", "is_read")
    list_filter = ("is_read", "sent_at")
    search_fields = ("listing__animal__tag_number", "buyer__username", "buyer__first_name")
    date_hierarchy = "sent_at"
    readonly_fields = ("sent_at",)

    actions = ["mark_read"]

    @admin.action(description="Mark selected inquiries as read")
    def mark_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f"{updated} inquiry/inquiries marked as read.")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("listing", "buyer", "seller", "agreed_price",
                    "payment_method", "payment_ref", "transaction_date")
    list_filter = ("payment_method", "transaction_date")
    search_fields = ("listing__animal__tag_number", "buyer__username",
                     "seller__username", "payment_ref")
    date_hierarchy = "transaction_date"
    readonly_fields = ("transaction_date",)

    fieldsets = (
        ("Sale", {
            "fields": ("listing", "buyer", "seller"),
        }),
        ("Payment", {
            "fields": ("agreed_price", "payment_method", "payment_ref"),
        }),
        ("Notes & Meta", {
            "fields": ("notes", "transaction_date"),
            "classes": ("collapse",),
        }),
    )


# ─────────────────────────────────────────────
# 7. NOTIFICATIONS
# ─────────────────────────────────────────────

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "notification_type", "recipient",
                    "is_read", "related_animal", "created_at")
    list_filter = ("notification_type", "is_read", "created_at")
    search_fields = ("title", "recipient__username", "recipient__first_name",
                     "related_animal__tag_number")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)

    actions = ["mark_all_read"]

    @admin.action(description="Mark selected notifications as read")
    def mark_all_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f"{updated} notification(s) marked as read.")


# ─────────────────────────────────────────────
# 8. REPORTS & ANALYTICS
# ─────────────────────────────────────────────

@admin.register(DiseaseOutbreak)
class DiseaseOutbreakAdmin(admin.ModelAdmin):
    list_display = ("disease", "county", "severity", "reported_on",
                    "animals_affected", "animals_deaths",
                    "is_active", "resolved_on")
    list_filter = ("severity", "is_active", "county", "reported_on")
    search_fields = ("disease__name", "county", "reported_by__username")
    date_hierarchy = "reported_on"
    readonly_fields = ("reported_on",)

    fieldsets = (
        ("Outbreak Details", {
            "fields": ("disease", "county", "severity", "reported_by"),
        }),
        ("Impact", {
            "fields": ("animals_affected", "animals_deaths", "description"),
        }),
        ("Status", {
            "fields": ("is_active", "reported_on", "resolved_on"),
        }),
    )

    actions = ["mark_resolved"]

    @admin.action(description="Mark selected outbreaks as resolved")
    def mark_resolved(self, request, queryset):
        updated = queryset.filter(is_active=True).update(
            is_active=False, resolved_on=timezone.now().date()
        )
        self.message_user(request, f"{updated} outbreak(s) marked as resolved.")


@admin.register(AuditLog)
class AuditLogAdmin(ReadOnlyMixin, admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "model_name",
                    "object_id", "ip_address")
    list_filter = ("action", "model_name", "timestamp")
    search_fields = ("user__username", "action", "model_name", "object_id", "ip_address")
    date_hierarchy = "timestamp"
    readonly_fields = ("timestamp", "user", "action", "model_name",
                       "object_id", "changes", "ip_address")

    fieldsets = (
        ("Event", {
            "fields": ("timestamp", "user", "ip_address"),
        }),
        ("Target", {
            "fields": ("action", "model_name", "object_id"),
        }),
        ("Change Data", {
            "fields": ("changes",),
        }),
    )

