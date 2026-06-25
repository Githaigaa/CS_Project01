"""
apps.py — Cattle Traceability & Marketplace Platform
=====================================================
AppConfig with a ready() method that connects all Django signals.

Data-consistency guarantees enforced here
──────────────────────────────────────────
ANIMAL
  • An animal whose status transitions to SOLD, SLAUGHTERED, or DECEASED
    must have any active marketplace listing automatically withdrawn.
  • An animal cannot be listed twice; duplicate active listings are blocked.
  • Lineage guard: dam must be Female, sire must be Male.
  • An animal's date_of_birth must not be in the future.

HEALTH RECORDS
  • A health record's date must not be in the future.
  • When a HealthRecord with next_due_date is saved, a VACCINATION_DUE or
    HEALTH_DUE Notification is created (or refreshed) for the owner.
  • When a notifiable Disease is diagnosed, a DISEASE_ALERT Notification
    is broadcast to all Inspectors and Admins.

MOVEMENT RECORDS
  • A movement permit that has passed its valid_until date is automatically
    set to EXPIRED before any MovementRecord references it.
  • Moving an animal updates its current_farm to destination_farm (if given).

SLAUGHTER RECORDS
  • Slaughter carcass weight must not exceed live weight.
  • SlaughterRecord creation withdraws any active marketplace listing for
    the animal and sets status = SLAUGHTERED (belt-and-braces with model.save).

MARKETPLACE LISTINGS
  • Only ALIVE animals may be listed.
  • A listing's expires_on date, if past, flips status to EXPIRED on save.
  • When a Transaction is committed, both the listing and the animal
    statuses are synchronised (belt-and-braces with Transaction.save).

PERMITS
  • Expired permits (valid_until < today) are auto-set to EXPIRED.

USER
  • A user demoted from FARMER role has their active listings withdrawn.

AUDIT
  • Every signal handler that mutates data writes an AuditLog row.
"""

import logging

from django.apps import AppConfig
from django.utils import timezone

logger = logging.getLogger(__name__)


class CattletraceConfig(AppConfig):
    name            = "CattleTrace"
    verbose_name    = "Cattle Trace & Marketplace"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        """
        Connect all signal handlers.
        Imported inside ready() to avoid touching the ORM before Django
        is fully initialised (guards against AppRegistryNotReady errors).
        """
        # Local import — models are safe to import here
        from django.db.models.signals import pre_save, post_save, pre_delete

        from .models import (
            Animal, AnimalWeight,
            HealthRecord, Disease,
            MovementPermit, MovementRecord,
            SlaughterRecord,
            MarketplaceListing, Transaction,
            Notification, User, AuditLog,
        )

        # ── helpers ────────────────────────────────────────────────────

        def _audit_signal(action, obj):
            """Write a lightweight AuditLog row from within a signal."""
            try:
                AuditLog.objects.create(
                    user=None,          # no request context in signals
                    action=action,
                    model_name=obj.__class__.__name__,
                    object_id=str(obj.pk),
                )
            except Exception:
                logger.exception("AuditLog write failed in signal for %s", action)

        def _notify(recipient, n_type, title, message, animal=None, listing=None):
            """Create an in-app notification, deduplicating by title+recipient."""
            try:
                Notification.objects.get_or_create(
                    recipient=recipient,
                    notification_type=n_type,
                    title=title,
                    is_read=False,
                    defaults={
                        "message":        message,
                        "related_animal":  animal,
                        "related_listing": listing,
                    },
                )
            except Exception:
                logger.exception("Notification creation failed: %s → %s", n_type, recipient)

        def _broadcast_disease_alert(disease, animal):
            """Send a DISEASE_ALERT notification to every Inspector and Admin."""
            try:
                recipients = User.objects.filter(
                    role__in=[User.Role.INSPECTOR, User.Role.ADMIN],
                    is_active=True,
                )
                for recipient in recipients:
                    _notify(
                        recipient,
                        Notification.NotificationType.DISEASE_ALERT,
                        f"Notifiable disease: {disease.name}",
                        f"Animal {animal.tag_number} was diagnosed with the notifiable "
                        f"disease '{disease.name}'. Immediate inspection may be required.",
                        animal=animal,
                    )
            except Exception:
                logger.exception("Disease alert broadcast failed for %s", disease)

        def _withdraw_listing(animal, reason="status_change"):
            """
            Withdraw any active MarketplaceListing for an animal.
            Returns True if a listing was withdrawn.
            """
            try:
                updated = MarketplaceListing.objects.filter(
                    animal=animal,
                    status=MarketplaceListing.ListingStatus.ACTIVE,
                ).update(status=MarketplaceListing.ListingStatus.WITHDRAWN)
                if updated:
                    _audit_signal(f"listing.auto_withdrawn.{reason}", animal)
                return bool(updated)
            except Exception:
                logger.exception("Listing withdrawal failed for animal %s", animal)
                return False

        def _expire_permit(permit):
            """Set a permit to EXPIRED if its valid_until date has passed."""
            try:
                if (
                    permit.status == MovementPermit.Status.APPROVED
                    and permit.valid_until < timezone.now().date()
                ):
                    permit.status = MovementPermit.Status.EXPIRED
                    MovementPermit.objects.filter(pk=permit.pk).update(
                        status=MovementPermit.Status.EXPIRED
                    )
                    _audit_signal("permit.auto_expired", permit)
            except Exception:
                logger.exception("Permit expiry check failed for %s", permit)

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: Animal — pre_save
        # Validates business rules before the record hits the database.
        # ══════════════════════════════════════════════════════════════
        def on_animal_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            # 1. Date of birth must not be in the future
            if instance.date_of_birth and instance.date_of_birth > timezone.now().date():
                raise ValidationError(
                    f"Animal {instance.tag_number}: date_of_birth cannot be in the future."
                )

            # 2. Lineage sex guards
            if instance.dam_id:
                try:
                    dam = Animal.objects.get(pk=instance.dam_id)
                    if dam.sex != Animal.Sex.FEMALE:
                        raise ValidationError(
                            f"Dam ({dam.tag_number}) must be Female."
                        )
                except Animal.DoesNotExist:
                    pass

            if instance.sire_id:
                try:
                    sire = Animal.objects.get(pk=instance.sire_id)
                    if sire.sex != Animal.Sex.MALE:
                        raise ValidationError(
                            f"Sire ({sire.tag_number}) must be Male."
                        )
                except Animal.DoesNotExist:
                    pass

            # 3. Self-reference guard (animal cannot be its own parent)
            if instance.pk:
                if instance.dam_id == instance.pk or instance.sire_id == instance.pk:
                    raise ValidationError("An animal cannot be its own dam or sire.")

        pre_save.connect(on_animal_pre_save, sender=Animal,
                         dispatch_uid="traceability.animal.pre_save.validation")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: Animal — post_save
        # Reacts to status changes after a successful save.
        # ══════════════════════════════════════════════════════════════
        def on_animal_post_save(sender, instance, created, **kwargs):
            terminal_statuses = {
                Animal.Status.SOLD,
                Animal.Status.SLAUGHTERED,
                Animal.Status.DECEASED,
            }

            if not created and instance.status in terminal_statuses:
                _withdraw_listing(instance, reason=instance.status)

        post_save.connect(on_animal_post_save, sender=Animal,
                          dispatch_uid="traceability.animal.post_save.listing_withdrawal")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: HealthRecord — pre_save
        # Validates dates and enforces logical constraints.
        # ══════════════════════════════════════════════════════════════
        def on_health_record_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            today = timezone.now().date()

            # 1. Health record date must not be in the future
            if instance.date and instance.date > today:
                raise ValidationError(
                    "Health record date cannot be in the future."
                )

            # 2. next_due_date must be after the record date
            if instance.next_due_date and instance.date:
                if instance.next_due_date <= instance.date:
                    raise ValidationError(
                        "next_due_date must be after the record date."
                    )

            # 3. Animal must not be deceased or slaughtered
            if instance.animal_id:
                try:
                    animal = Animal.objects.get(pk=instance.animal_id)
                    if animal.status in (Animal.Status.SLAUGHTERED, Animal.Status.DECEASED):
                        raise ValidationError(
                            f"Cannot add health records to a {animal.status} animal."
                        )
                except Animal.DoesNotExist:
                    pass

        pre_save.connect(on_health_record_pre_save, sender=HealthRecord,
                         dispatch_uid="traceability.healthrecord.pre_save.validation")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: HealthRecord — post_save
        # Fires notifications for due dates and notifiable diseases.
        # ══════════════════════════════════════════════════════════════
        def on_health_record_post_save(sender, instance, created, **kwargs):
            if not created:
                return  # Only fire on new records

            animal = instance.animal
            owner  = animal.current_owner

            # 1. Schedule a due-date notification for the animal's owner
            if instance.next_due_date and owner:
                n_type = (
                    Notification.NotificationType.VACCINATION_DUE
                    if instance.record_type == HealthRecord.RecordType.VACCINATION
                    else Notification.NotificationType.HEALTH_DUE
                )
                _notify(
                    owner,
                    n_type,
                    f"Upcoming {instance.get_record_type_display()} for {animal.tag_number}",
                    f"Animal {animal.tag_number} is due for a "
                    f"{instance.get_record_type_display()} on {instance.next_due_date}.",
                    animal=animal,
                )

            # 2. Broadcast disease alert for notifiable diagnoses
            if instance.diagnosis_id:
                try:
                    disease = Disease.objects.get(pk=instance.diagnosis_id)
                    if disease.is_notifiable:
                        _broadcast_disease_alert(disease, animal)
                except Disease.DoesNotExist:
                    pass

        post_save.connect(on_health_record_post_save, sender=HealthRecord,
                          dispatch_uid="traceability.healthrecord.post_save.notifications")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: MovementPermit — pre_save
        # Auto-expires permits whose valid_until date has passed.
        # ══════════════════════════════════════════════════════════════
        def on_permit_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            # 1. Auto-expire if past valid_until
            if (
                instance.pk
                and instance.status == MovementPermit.Status.APPROVED
                and instance.valid_until < timezone.now().date()
            ):
                instance.status = MovementPermit.Status.EXPIRED

            # 2. valid_until must be after issued_on
            if instance.valid_until and instance.issued_on:
                if instance.valid_until <= instance.issued_on:
                    raise ValidationError(
                        "valid_until must be after issued_on date."
                    )

        pre_save.connect(on_permit_pre_save, sender=MovementPermit,
                         dispatch_uid="traceability.permit.pre_save.expiry")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: MovementRecord — pre_save
        # Validates the associated permit and movement logic.
        # ══════════════════════════════════════════════════════════════
        def on_movement_record_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            # 1. Animal must be alive or quarantined to move
            if instance.animal_id:
                try:
                    animal = Animal.objects.get(pk=instance.animal_id)
                    if animal.status in (Animal.Status.SLAUGHTERED, Animal.Status.DECEASED):
                        raise ValidationError(
                            f"Cannot record a movement for a {animal.status} animal."
                        )
                except Animal.DoesNotExist:
                    pass

            # 2. If a permit is attached, check it is approved and not expired
            if instance.permit_id:
                try:
                    permit = MovementPermit.objects.get(pk=instance.permit_id)
                    _expire_permit(permit)   # auto-expire before checking
                    permit.refresh_from_db()
                    if permit.status != MovementPermit.Status.APPROVED:
                        raise ValidationError(
                            f"Permit {permit.permit_number} is not approved "
                            f"(status: {permit.status})."
                        )
                except MovementPermit.DoesNotExist:
                    pass

            # 3. Move date must not be in the future
            if instance.move_date and instance.move_date > timezone.now().date():
                raise ValidationError("Movement date cannot be in the future.")

        pre_save.connect(on_movement_record_pre_save, sender=MovementRecord,
                         dispatch_uid="traceability.movementrecord.pre_save.validation")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: MovementRecord — post_save
        # Keeps animal.current_farm in sync with the movement destination.
        # ══════════════════════════════════════════════════════════════
        def on_movement_record_post_save(sender, instance, created, **kwargs):
            if created and instance.destination_farm_id:
                Animal.objects.filter(pk=instance.animal_id).update(
                    current_farm_id=instance.destination_farm_id
                )
                _audit_signal("animal.farm_updated_by_movement", instance)

        post_save.connect(on_movement_record_post_save, sender=MovementRecord,
                          dispatch_uid="traceability.movementrecord.post_save.farm_sync")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: SlaughterRecord — pre_save
        # Guards carcass weight and ensures the animal is eligible.
        # ══════════════════════════════════════════════════════════════
        def on_slaughter_record_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            # 1. Carcass weight must not exceed live weight
            if instance.live_weight_kg and instance.carcass_weight_kg:
                if instance.carcass_weight_kg > instance.live_weight_kg:
                    raise ValidationError(
                        "Carcass weight cannot exceed live weight."
                    )

            # 2. Animal must not already be slaughtered (prevent duplicates)
            if instance.animal_id and not instance.pk:
                try:
                    animal = Animal.objects.get(pk=instance.animal_id)
                    if animal.status == Animal.Status.SLAUGHTERED:
                        raise ValidationError(
                            f"Animal {animal.tag_number} is already recorded as slaughtered."
                        )
                    if animal.status == Animal.Status.DECEASED:
                        raise ValidationError(
                            f"Animal {animal.tag_number} is already deceased."
                        )
                except Animal.DoesNotExist:
                    pass

            # 3. Slaughter date must not be in the future
            if instance.slaughter_date and instance.slaughter_date > timezone.now().date():
                raise ValidationError("Slaughter date cannot be in the future.")

        pre_save.connect(on_slaughter_record_pre_save, sender=SlaughterRecord,
                         dispatch_uid="traceability.slaughterrecord.pre_save.validation")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: SlaughterRecord — post_save
        # Belt-and-braces: ensure listing is withdrawn and status set.
        # (model.save() also does this; signal makes it unconditional)
        # ══════════════════════════════════════════════════════════════
        def on_slaughter_record_post_save(sender, instance, created, **kwargs):
            if created:
                # Withdraw any live marketplace listing
                _withdraw_listing(instance.animal, reason="slaughtered")

                # Guarantee animal status (handles bulk updates that skip model.save)
                Animal.objects.filter(pk=instance.animal_id).update(
                    status=Animal.Status.SLAUGHTERED
                )
                _audit_signal("animal.status_set_slaughtered", instance)

        post_save.connect(on_slaughter_record_post_save, sender=SlaughterRecord,
                          dispatch_uid="traceability.slaughterrecord.post_save.consistency")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: MarketplaceListing — pre_save
        # Validates eligibility and handles automatic expiry.
        # ══════════════════════════════════════════════════════════════
        def on_listing_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            # 1. Only ALIVE animals may be listed
            if instance.animal_id:
                try:
                    animal = Animal.objects.get(pk=instance.animal_id)
                    if animal.status != Animal.Status.ALIVE:
                        raise ValidationError(
                            f"Only alive animals can be listed. "
                            f"Animal {animal.tag_number} has status '{animal.status}'."
                        )
                except Animal.DoesNotExist:
                    pass

            # 2. Auto-expire if past expires_on date
            if (
                instance.expires_on
                and instance.expires_on < timezone.now().date()
                and instance.status == MarketplaceListing.ListingStatus.ACTIVE
            ):
                instance.status = MarketplaceListing.ListingStatus.EXPIRED

            # 3. Asking price must be positive
            if instance.asking_price is not None and instance.asking_price <= 0:
                raise ValidationError("Asking price must be a positive value.")

        pre_save.connect(on_listing_pre_save, sender=MarketplaceListing,
                         dispatch_uid="traceability.listing.pre_save.validation")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: Transaction — pre_save
        # Final consistency checks before a sale is committed.
        # ══════════════════════════════════════════════════════════════
        def on_transaction_pre_save(sender, instance, **kwargs):
            from django.core.exceptions import ValidationError

            if instance.pk:
                return  # Allow updates (not re-validating existing transactions)

            # 1. Listing must still be ACTIVE
            try:
                listing = MarketplaceListing.objects.select_related("animal").get(
                    pk=instance.listing_id
                )
                if listing.status != MarketplaceListing.ListingStatus.ACTIVE:
                    raise ValidationError(
                        f"Listing is no longer active (status: {listing.status})."
                    )

                # 2. Buyer must not be the seller
                if instance.buyer_id == listing.seller_id:
                    raise ValidationError("Buyer and seller cannot be the same user.")

                # 3. Agreed price must be positive
                if instance.agreed_price is not None and instance.agreed_price <= 0:
                    raise ValidationError("Agreed price must be a positive value.")

            except MarketplaceListing.DoesNotExist:
                pass

        pre_save.connect(on_transaction_pre_save, sender=Transaction,
                         dispatch_uid="traceability.transaction.pre_save.validation")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: Transaction — post_save
        # Belt-and-braces ownership transfer and listing closure.
        # (Transaction.model.save() also does this; signal makes it
        #  unconditional even when using bulk_create or update)
        # ══════════════════════════════════════════════════════════════
        def on_transaction_post_save(sender, instance, created, **kwargs):
            if not created:
                return

            try:
                listing = MarketplaceListing.objects.select_related("animal").get(
                    pk=instance.listing_id
                )
                # Close listing
                MarketplaceListing.objects.filter(pk=listing.pk).update(
                    status=MarketplaceListing.ListingStatus.SOLD
                )
                # Transfer ownership and update animal status
                Animal.objects.filter(pk=listing.animal_id).update(
                    status=Animal.Status.SOLD,
                    current_owner_id=instance.buyer_id,
                )
                _audit_signal("transaction.ownership_transferred", instance)

            except MarketplaceListing.DoesNotExist:
                logger.error("Transaction %s references missing listing.", instance.pk)

        post_save.connect(on_transaction_post_save, sender=Transaction,
                          dispatch_uid="traceability.transaction.post_save.ownership")

        # ══════════════════════════════════════════════════════════════
        # SIGNAL: User — post_save
        # When a user's role changes away from FARMER, withdraw their listings.
        # ══════════════════════════════════════════════════════════════
        def on_user_post_save(sender, instance, created, **kwargs):
            if created:
                return
            if instance.role != User.Role.FARMER:
                withdrawn = MarketplaceListing.objects.filter(
                    seller=instance,
                    status=MarketplaceListing.ListingStatus.ACTIVE,
                ).update(status=MarketplaceListing.ListingStatus.WITHDRAWN)
                if withdrawn:
                    _audit_signal("listing.auto_withdrawn.role_change", instance)

        post_save.connect(on_user_post_save, sender=User,
                          dispatch_uid="traceability.user.post_save.listing_cleanup")

        logger.info(
            "Traceability signals connected: animal, health, movement, "
            "permit, slaughter, listing, transaction, user."
        )

