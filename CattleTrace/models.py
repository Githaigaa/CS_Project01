"""
models.py — Cattle Traceability & Marketplace Platform
Django ORM models covering all platform modules:
  - User & Farm
  - Animal Registration & Profile
  - Health Records
  - Movement Tracking
  - Slaughter Records
  - Marketplace Listings
  - Notifications
  - Reports & Analytics (aggregation helpers)
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

# ─────────────────────────────────────────────
# 1. USER & FARM
# ─────────────────────────────────────────────


class User(AbstractUser):
    """Extended user with role-based access."""

    class Role(models.TextChoices):
        FARMER = "farmer", "Farmer"
        VET = "vet", "Veterinarian"
        INSPECTOR = "inspector", "Inspector"
        BUYER = "buyer", "Buyer"
        ABATTOIR = "abattoir", "Abattoir"
        ADMIN = "admin", "Administrator"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.FARMER)
    phone_number = models.CharField(max_length=20, blank=True)
    national_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    profile_photo = models.ImageField(upload_to="users/photos/", blank=True, null=True)
    location = models.CharField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Override AbstractUser fields to avoid reverse accessor clashes with auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        related_name='cattletrace_user_set',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name='cattletrace_user_set',
    )

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class Farm(models.Model):
    """Registered farm / holding."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="farms")
    name = models.CharField(max_length=255)
    registration_no = models.CharField(max_length=100, unique=True)
    county = models.CharField(max_length=100)
    sub_county = models.CharField(max_length=100, blank=True)
    ward = models.CharField(max_length=100, blank=True)
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    total_area_acres = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.registration_no})"


# ─────────────────────────────────────────────
# 2. ANIMAL REGISTRATION & PROFILE
# ─────────────────────────────────────────────

class Breed(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Animal(models.Model):
    """Core animal record — the traceability anchor."""

    class Sex(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"

    class Status(models.TextChoices):
        ALIVE = "alive", "Alive"
        SOLD = "sold", "Sold"
        SLAUGHTERED = "slaughtered", "Slaughtered"
        DECEASED = "deceased", "Deceased"
        QUARANTINED = "quarantined", "Quarantined"

    # Identity
    tag_number = models.CharField(max_length=50, unique=True)
    rfid_tag = models.CharField(max_length=100, unique=True, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True)
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Classification
    breed = models.ForeignKey(Breed, on_delete=models.SET_NULL, null=True)
    sex = models.CharField(max_length=1, choices=Sex.choices)
    date_of_birth = models.DateField()
    color = models.CharField(max_length=50, blank=True)
    markings = models.TextField(blank=True, help_text="Physical distinguishing features")

    # Ownership & location
    current_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="animals")
    current_farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, related_name="animals")

    # Lineage
    dam = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="calves_as_dam"
    )
    sire = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="calves_as_sire"
    )

    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ALIVE)
    photo = models.ImageField(upload_to="animals/photos/", blank=True, null=True)

    # Registration meta
    registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="registered_animals")
    registration_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-registration_date"]

    def __str__(self):
        return f"{self.tag_number} — {self.breed} ({self.sex})"

    @property
    def age_months(self):
        delta = timezone.now().date() - self.date_of_birth
        return delta.days // 30


class AnimalWeight(models.Model):
    """Weight measurements over time."""

    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name="weights")
    weight_kg = models.DecimalField(max_digits=7, decimal_places=2)
    recorded_on = models.DateField(default=timezone.now)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-recorded_on"]

    def __str__(self):
        return f"{self.animal.tag_number}: {self.weight_kg} kg on {self.recorded_on}"


# ─────────────────────────────────────────────
# 3. HEALTH RECORDS
# ─────────────────────────────────────────────

class Disease(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    is_notifiable = models.BooleanField(default=False, help_text="Must be reported to authorities")

    def __str__(self):
        return self.name


class Vaccine(models.Model):
    name = models.CharField(max_length=150)
    manufacturer = models.CharField(max_length=150, blank=True)
    target_diseases = models.ManyToManyField(Disease, blank=True)
    validity_days = models.PositiveIntegerField(default=365)

    def __str__(self):
        return self.name


class HealthRecord(models.Model):
    """Veterinary exam, treatment, or vaccination event."""

    class RecordType(models.TextChoices):
        VACCINATION = "vaccination", "Vaccination"
        TREATMENT = "treatment", "Treatment"
        EXAMINATION = "examination", "Examination"
        DEWORMING = "deworming", "Deworming"
        DIPPING = "dipping", "Dipping"
        OTHER = "other", "Other"

    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name="health_records")
    record_type = models.CharField(max_length=20, choices=RecordType.choices)
    date = models.DateField(default=timezone.now)
    vet = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        limit_choices_to={"role": User.Role.VET}
    )
    diagnosis = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    vaccine_used = models.ForeignKey(Vaccine, on_delete=models.SET_NULL, null=True, blank=True)
    medication = models.CharField(max_length=255, blank=True)
    dosage = models.CharField(max_length=100, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    notes = models.TextField(blank=True)
    certificate_no = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.record_type} — {self.animal.tag_number} on {self.date}"


# ─────────────────────────────────────────────
# 4. MOVEMENT TRACKING
# ─────────────────────────────────────────────

class MovementPermit(models.Model):
    """Official movement permit issued by authorities."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"

    permit_number = models.CharField(max_length=100, unique=True)
    issued_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        limit_choices_to={"role": User.Role.INSPECTOR},
        related_name="permits_issued"
    )
    issued_on = models.DateField(default=timezone.now)
    valid_until = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Permit {self.permit_number} ({self.status})"


class MovementRecord(models.Model):
    """Each time an animal moves between farms/locations."""

    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name="movements")
    permit = models.ForeignKey(MovementPermit, on_delete=models.SET_NULL, null=True, blank=True)
    origin_farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, related_name="departures")
    destination_farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, related_name="arrivals")
    origin_county = models.CharField(max_length=100)
    destination_county = models.CharField(max_length=100)
    move_date = models.DateField()
    purpose = models.CharField(
        max_length=50,
        choices=[
            ("sale", "Sale"),
            ("grazing", "Grazing"),
            ("breeding", "Breeding"),
            ("slaughter", "Slaughter"),
            ("exhibition", "Exhibition"),
            ("other", "Other"),
        ]
    )
    transporter = models.CharField(max_length=255, blank=True)
    vehicle_reg = models.CharField(max_length=50, blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-move_date"]

    def __str__(self):
        return f"{self.animal.tag_number}: {self.origin_county} → {self.destination_county} on {self.move_date}"


# ─────────────────────────────────────────────
# 5. SLAUGHTER RECORDS
# ─────────────────────────────────────────────

class Abattoir(models.Model):
    name = models.CharField(max_length=255)
    license_no = models.CharField(max_length=100, unique=True)
    county = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    contact = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.license_no})"


class SlaughterRecord(models.Model):
    # CattleTrace/models.py, add to SlaughterRecord Meta class
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['animal'], name='one_slaughter_per_animal')
        ]
    """Post-mortem & carcass record."""

    class InspectionResult(models.TextChoices):
        PASSED = "passed", "Passed"
        PASSED_PARTIAL = "passed_partial", "Passed (Partial Condemnation)"
        CONDEMNED = "condemned", "Condemned"

    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name="slaughter_records")
    abattoir = models.ForeignKey(Abattoir, on_delete=models.SET_NULL, null=True)
    slaughter_date = models.DateField()
    slaughter_no = models.CharField(max_length=100, unique=True)

    # Carcass data
    live_weight_kg = models.DecimalField(max_digits=7, decimal_places=2)
    carcass_weight_kg = models.DecimalField(max_digits=7, decimal_places=2)
    hide_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    offal_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Inspection
    inspector = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        limit_choices_to={"role": User.Role.INSPECTOR}
    )
    inspection_result = models.CharField(max_length=20, choices=InspectionResult.choices)
    condemnation_reason = models.TextField(blank=True)
    meat_grade = models.CharField(max_length=10, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Slaughter {self.slaughter_no} — {self.animal.tag_number}"

    @property
    def dressing_percentage(self):
        if self.live_weight_kg:
            return round((self.carcass_weight_kg / self.live_weight_kg) * 100, 2)
        return None

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update animal status automatically
        self.animal.status = Animal.Status.SLAUGHTERED
        self.animal.save(update_fields=["status"])


# ─────────────────────────────────────────────
# 6. MARKETPLACE
# ─────────────────────────────────────────────

class MarketplaceListing(models.Model):
    """Animal listed for sale on the marketplace."""

    class ListingStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        WITHDRAWN = "withdrawn", "Withdrawn"
        EXPIRED = "expired", "Expired"

    animal = models.OneToOneField(
        Animal, on_delete=models.CASCADE, related_name="marketplace_listing"
    )
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    asking_price = models.DecimalField(max_digits=12, decimal_places=2)
    is_negotiable = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    location_county = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=ListingStatus.choices, default=ListingStatus.ACTIVE)
    listed_on = models.DateTimeField(auto_now_add=True)
    expires_on = models.DateField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-listed_on"]

    def __str__(self):
        return f"Listing: {self.animal.tag_number} @ KES {self.asking_price}"


class ListingImage(models.Model):
    listing = models.ForeignKey(MarketplaceListing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="marketplace/images/")
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False)


class MarketplaceInquiry(models.Model):
    """Message sent by a buyer about a listing."""

    listing = models.ForeignKey(MarketplaceListing, on_delete=models.CASCADE, related_name="inquiries")
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="inquiries")
    message = models.TextField()
    offer_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return f"Inquiry from {self.buyer} on {self.listing}"


class Transaction(models.Model):
    """Completed sale record."""

    class PaymentMethod(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        BANK = "bank", "Bank Transfer"
        CASH = "cash", "Cash"
        OTHER = "other", "Other"

    listing = models.OneToOneField(MarketplaceListing, on_delete=models.CASCADE, related_name="transaction")
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="purchases")
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sales")
    agreed_price = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    payment_ref = models.CharField(max_length=100, blank=True)
    transaction_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Sale: {self.listing.animal.tag_number} — KES {self.agreed_price}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Mark listing & animal as sold
        self.listing.status = MarketplaceListing.ListingStatus.SOLD
        self.listing.save(update_fields=["status"])
        animal = self.listing.animal
        animal.status = Animal.Status.SOLD
        animal.current_owner = self.buyer
        animal.save(update_fields=["status", "current_owner"])


# ─────────────────────────────────────────────
# 7. NOTIFICATIONS
# ─────────────────────────────────────────────

class Notification(models.Model):
    """In-app notifications for all users."""

    class NotificationType(models.TextChoices):
        HEALTH_DUE = "health_due", "Health Check Due"
        VACCINATION_DUE = "vaccination_due", "Vaccination Due"
        MOVEMENT_APPROVED = "movement_approved", "Movement Permit Approved"
        MOVEMENT_REJECTED = "movement_rejected", "Movement Permit Rejected"
        LISTING_INQUIRY = "listing_inquiry", "New Marketplace Inquiry"
        LISTING_SOLD = "listing_sold", "Animal Sold"
        DISEASE_ALERT = "disease_alert", "Disease Outbreak Alert"
        SYSTEM = "system", "System Notification"

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True)
    related_listing = models.ForeignKey(
        MarketplaceListing, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.notification_type}] → {self.recipient}: {self.title}"

    def mark_read(self):
        self.is_read = True
        self.save(update_fields=["is_read"])


# ─────────────────────────────────────────────
# 8. REPORTS & ANALYTICS (supporting models)
# ─────────────────────────────────────────────

class DiseaseOutbreak(models.Model):
    """Reported disease outbreak in a county."""

    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    disease = models.ForeignKey(Disease, on_delete=models.CASCADE)
    county = models.CharField(max_length=100)
    reported_on = models.DateField(default=timezone.now)
    resolved_on = models.DateField(null=True, blank=True)
    severity = models.CharField(max_length=10, choices=Severity.choices)
    animals_affected = models.PositiveIntegerField(default=0)
    animals_deaths = models.PositiveIntegerField(default=0)
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.disease} outbreak in {self.county} ({self.reported_on})"


class AuditLog(models.Model):
    """Immutable audit trail for traceability compliance."""

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)  # e.g. "animal.create", "movement.approve"
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.timestamp}: {self.user} — {self.action} on {self.model_name}#{self.object_id}"

