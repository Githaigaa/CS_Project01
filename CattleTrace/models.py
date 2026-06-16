import uuid

from django.db import models


def prefixed_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


def owner_id():
    return prefixed_id("OWN")


def holding_id():
    return prefixed_id("HLD")


def animal_id():
    return prefixed_id("ANM")


def worker_id():
    return prefixed_id("WRK")


def health_event_id():
    return prefixed_id("HEV")


def movement_id():
    return prefixed_id("MOV")


def transaction_id():
    return prefixed_id("TRX")


def abattoir_id():
    return prefixed_id("ABT")


def slaughter_record_id():
    return prefixed_id("SLR")


class OwnerType(models.TextChoices):
    INDIVIDUAL = "individual", "Individual"
    COMPANY = "company", "Company"
    COOPERATIVE = "cooperative", "Cooperative"
    GOVERNMENT = "government", "Government"
    OTHER = "other", "Other"


class HoldingType(models.TextChoices):
    FARM = "farm", "Farm"
    MARKET = "market", "Market"
    QUARANTINE = "quarantine", "Quarantine"
    ABATTOIR = "abattoir", "Abattoir"
    OTHER = "other", "Other"


class Species(models.TextChoices):
    CATTLE = "cattle", "Cattle"
    GOAT = "goat", "Goat"
    SHEEP = "sheep", "Sheep"
    OTHER = "other", "Other"


class Sex(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    UNKNOWN = "unknown", "Unknown"


class AgeClass(models.TextChoices):
    CALF = "calf", "Calf"
    WEANER = "weaner", "Weaner"
    YEARLING = "yearling", "Yearling"
    ADULT = "adult", "Adult"


class AnimalStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    SOLD = "sold", "Sold"
    TRANSFERRED = "transferred", "Transferred"
    SLAUGHTERED = "slaughtered", "Slaughtered"
    DEAD = "dead", "Dead"
    LOST = "lost", "Lost"


class EventType(models.TextChoices):
    VACCINATION = "vaccination", "Vaccination"
    TREATMENT = "treatment", "Treatment"
    DISEASE = "disease", "Disease"
    DEATH = "death", "Death"
    INSPECTION = "inspection", "Inspection"
    OTHER = "other", "Other"


class CredentialLevel(models.TextChoices):
    COMMUNITY = "community", "Community"
    TECHNICIAN = "technician", "Technician"
    VETERINARY_OFFICER = "veterinary_officer", "Veterinary Officer"
    ADMIN = "admin", "Admin"


class MovementPurpose(models.TextChoices):
    SALE = "sale", "Sale"
    GRAZING = "grazing", "Grazing"
    BREEDING = "breeding", "Breeding"
    SLAUGHTER = "slaughter", "Slaughter"
    TREATMENT = "treatment", "Treatment"
    OTHER = "other", "Other"


class MovementStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    IN_TRANSIT = "in_transit", "In Transit"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class SaleChannel(models.TextChoices):
    DIRECT = "direct", "Direct"
    MARKET = "market", "Market"
    ONLINE = "online", "Online"
    AUCTION = "auction", "Auction"
    OTHER = "other", "Other"


class Owner(models.Model):
    owner_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=owner_id,
        editable=False,
        db_column="owner_ID",
    )
    national_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, unique=True)
    county = models.CharField(max_length=255)
    sub_county = models.CharField(max_length=255)
    owner_type = models.CharField(max_length=30, choices=OwnerType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "owners"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.owner_id})"

    def update_contact(self, phone_number=None, county=None, sub_county=None):
        if phone_number:
            self.phone_number = phone_number
        if county:
            self.county = county
        if sub_county:
            self.sub_county = sub_county
        self.save()

    def get_holdings(self):
        return self.holdings.all()

    def get_animals(self):
        return self.animals.all()


class Holding(models.Model):
    holding_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=holding_id,
        editable=False,
        db_column="holding_ID",
    )
    owner = models.ForeignKey(
        Owner,
        on_delete=models.CASCADE,
        related_name="holdings",
        db_column="owner_ID",
    )
    county = models.CharField(max_length=255)
    sub_county = models.CharField(max_length=255)
    ward = models.CharField(max_length=255)
    gps_coordinates = models.CharField(max_length=100)
    holding_type = models.CharField(max_length=30, choices=HoldingType.choices)
    owner_type = models.CharField(max_length=30, choices=OwnerType.choices)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "holdings"
        ordering = ["county", "sub_county", "ward", "holding_id"]

    def __str__(self):
        return f"{self.holding_id} - {self.county}, {self.sub_county}, {self.ward}"

    def get_animals(self):
        return self.current_animals.all()

    def get_current_count(self):
        return self.current_animals.count()


class Animal(models.Model):
    animal_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=animal_id,
        editable=False,
        db_column="animal_ID",
    )
    rfid_number = models.CharField(max_length=50, unique=True)
    species = models.CharField(max_length=30, choices=Species.choices)
    sex = models.CharField(max_length=10, choices=Sex.choices)
    current_owner = models.ForeignKey(
        Owner,
        on_delete=models.PROTECT,
        related_name="animals",
        db_column="current_owner_ID",
    )
    current_holding = models.ForeignKey(
        Holding,
        on_delete=models.PROTECT,
        related_name="current_animals",
        db_column="current_holding_ID",
    )
    birth_holding = models.ForeignKey(
        Holding,
        on_delete=models.PROTECT,
        related_name="born_animals",
        db_column="birth_holding_ID",
    )
    age_class = models.CharField(max_length=30, choices=AgeClass.choices)
    breed = models.CharField(max_length=255)
    physical_description = models.CharField(max_length=255)
    animal_status = models.CharField(
        max_length=30,
        choices=AnimalStatus.choices,
        default=AnimalStatus.ACTIVE,
    )
    estimated_live_weight = models.FloatField()
    photo = models.CharField(max_length=255, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "animals"
        ordering = ["rfid_number"]
        permissions = (
            ("upload_animal_photo", "Can upload animal photo"),
        )

    def __str__(self):
        return f"{self.rfid_number} - {self.species}"

    def transfer(self, new_owner, new_holding):
        self.current_owner = new_owner
        self.current_holding = new_holding
        self.animal_status = AnimalStatus.TRANSFERRED
        self.save(update_fields=["current_owner", "current_holding", "animal_status"])

    def report_stolen(self):
        self.animal_status = AnimalStatus.LOST
        self.save(update_fields=["animal_status"])

    def close_lifecycle(self, status=AnimalStatus.SLAUGHTERED):
        self.animal_status = status
        self.save(update_fields=["animal_status"])

    def get_health_history(self):
        return self.health_events.all()

    def get_ownership_history(self):
        return self.transactions.all()


class AnimalHealthWorker(models.Model):
    worker_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=worker_id,
        editable=False,
        db_column="worker_ID",
    )
    name = models.CharField(max_length=255)
    dvs_number = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=20, unique=True)
    county = models.CharField(max_length=255)
    sub_county = models.CharField(max_length=255)
    worker_type = models.CharField(max_length=60)
    verified = models.BooleanField(default=False)
    assigned_zone = models.CharField(max_length=255)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "animal_health_workers"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.worker_id})"

    def record_health_event(self, **kwargs):
        return HealthEvent.objects.create(recorded_by=self, **kwargs)

    def escalate_to_vet(self, health_event):
        health_event.notes = f"{health_event.notes}\nEscalated to vet.".strip()
        health_event.save(update_fields=["notes"])

    def get_event_history(self):
        return self.health_events.all()


class HealthEvent(models.Model):
    event_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=health_event_id,
        editable=False,
        db_column="event_ID",
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="health_events",
        db_column="animal_ID",
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    disease_name = models.CharField(max_length=255, blank=True)
    vaccine_name = models.CharField(max_length=255, blank=True)
    treatment_given = models.CharField(max_length=255, blank=True)
    cause_of_death = models.CharField(max_length=255, blank=True)
    date_of_event = models.DateField()
    recorded_by = models.ForeignKey(
        AnimalHealthWorker,
        on_delete=models.PROTECT,
        related_name="health_events",
        db_column="recorded_by",
    )
    credential_level = models.CharField(max_length=30, choices=CredentialLevel.choices)
    notes = models.TextField(blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "health_events"
        ordering = ["-date_of_event", "-registered_at"]

    def __str__(self):
        return f"{self.event_type} for {self.animal_id} on {self.date_of_event}"

    def trigger_alert(self):
        return self.event_type in {EventType.DISEASE, EventType.DEATH}


class Transaction(models.Model):
    transaction_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=transaction_id,
        editable=False,
        db_column="transaction_ID",
    )
    seller = models.ForeignKey(
        Owner,
        on_delete=models.PROTECT,
        related_name="sales",
        db_column="seller_ID",
    )
    buyer = models.ForeignKey(
        Owner,
        on_delete=models.PROTECT,
        related_name="purchases",
        db_column="buyer_ID",
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.PROTECT,
        related_name="transactions",
        db_column="animal_ID",
    )
    asking_price = models.DecimalField(max_digits=12, decimal_places=2)
    agreed_price = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    sale_channel = models.CharField(max_length=30, choices=SaleChannel.choices)
    delivery_arrangement = models.CharField(max_length=255)
    sale_date = models.DateField()
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-sale_date", "-registered_at"]

    def __str__(self):
        return f"{self.transaction_id} - {self.animal_id}"

    def make_offer(self, agreed_price):
        self.agreed_price = agreed_price
        self.save(update_fields=["agreed_price"])

    def confirm_payment(self):
        self.payment_status = PaymentStatus.PAID
        self.save(update_fields=["payment_status"])

    def trigger_transfer(self):
        self.animal.transfer(self.buyer, self.animal.current_holding)


class MovementRecord(models.Model):
    movement_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=movement_id,
        editable=False,
        db_column="movement_ID",
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="movement_records",
        to_field="rfid_number",
        db_column="animal_rfid_number",
    )
    from_holding = models.ForeignKey(
        Holding,
        on_delete=models.PROTECT,
        related_name="outgoing_movements",
        db_column="from_holding_ID",
    )
    to_holding = models.ForeignKey(
        Holding,
        on_delete=models.PROTECT,
        related_name="incoming_movements",
        db_column="to_holding_ID",
    )
    movement_date = models.DateField()
    purpose_of_movement = models.CharField(
        max_length=30,
        choices=MovementPurpose.choices,
    )
    country_crossing = models.BooleanField(default=False)
    permit_number = models.CharField(max_length=100, blank=True)
    movement_status = models.CharField(
        max_length=30,
        choices=MovementStatus.choices,
        default=MovementStatus.PENDING,
    )
    linked_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movement_records",
        db_column="linked_transaction_ID",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movement_records"
        ordering = ["-movement_date", "-created_at"]

    def __str__(self):
        return f"{self.animal_id}: {self.from_holding_id} to {self.to_holding_id}"

    def attach_permit(self, permit_number):
        self.permit_number = permit_number
        self.save(update_fields=["permit_number"])

    def confirm(self):
        self.movement_status = MovementStatus.COMPLETED
        self.save(update_fields=["movement_status"])


class Abattoir(models.Model):
    abattoir_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=abattoir_id,
        editable=False,
        db_column="abattoir_ID",
    )
    license_number = models.CharField(max_length=50, unique=True)
    holding = models.ForeignKey(
        Holding,
        on_delete=models.PROTECT,
        related_name="abattoirs",
        db_column="holding_ID",
    )
    county = models.CharField(max_length=255)
    sub_county = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "abattoirs"
        ordering = ["abattoir_id"]

    def __str__(self):
        return f"{self.abattoir_id} - {self.license_number}"

    def get_slaughter_history(self):
        return self.slaughter_records.all()

    def get_batch_report(self, batch_number):
        return self.slaughter_records.filter(batch_number=batch_number)

    def verify_incoming_animal(self, animal):
        return animal.current_holding_id == self.holding_id


class SlaughterRecord(models.Model):
    slaughter_record_id = models.CharField(
        max_length=30,
        primary_key=True,
        default=slaughter_record_id,
        editable=False,
        db_column="slaughter_record_ID",
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.PROTECT,
        related_name="slaughter_records",
        db_column="animal_ID",
    )
    abattoir = models.ForeignKey(
        Abattoir,
        on_delete=models.PROTECT,
        related_name="slaughter_records",
        db_column="abattoir_ID",
    )
    last_holding = models.ForeignKey(
        Holding,
        on_delete=models.PROTECT,
        related_name="slaughter_records",
        db_column="last_holding_ID",
    )
    chain_number = models.CharField(max_length=80)
    carcass_feedback = models.CharField(max_length=255)
    batch_number = models.CharField(max_length=255)
    date_of_slaughter = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "slaughter_records"
        ordering = ["-date_of_slaughter", "-created_at"]

    def __str__(self):
        return f"{self.slaughter_record_id} - {self.animal_id}"

    def attach_carcass_feedback(self, feedback):
        self.carcass_feedback = feedback
        self.save(update_fields=["carcass_feedback"])

    def get_batch_animals(self):
        return SlaughterRecord.objects.filter(batch_number=self.batch_number)

    def notify_last_owner(self):
        return self.animal.current_owner
