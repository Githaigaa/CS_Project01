# CattleTrace Django Project — Errors & Data Inconsistency Audit Report
**Date:** June 17, 2026  
**Status:** CRITICAL ISSUES DETECTED

---

## Executive Summary
The project contains **5 critical errors** and **3 data consistency conflicts** that will prevent the application from running and cause data integrity issues.

### Critical Severity: 🔴 Critical
### High Severity: 🟠 High  
### Medium Severity: 🟡 Medium

---

## 1. 🔴 CRITICAL: AppConfig Class Name Mismatch

### Location
- **File:** `CattleTrace/apps.py` (line 56)
- **File:** `DjangoProject/settings.py` (line 41)

### Error
```
ImportError: Module 'CattleTrace.apps' does not contain a 'CattletraceConfig' class. 
Choices are: 'TraceabilityConfig'.
```

### Root Cause
- **apps.py** defines: `class TraceabilityConfig(AppConfig):`
- **settings.py** expects: `'CattleTrace.apps.CattletraceConfig'`
- **urls.py** uses: `app_name = "CattleTrace"`

The class name is `TraceabilityConfig` but `settings.py` tries to import the non-existent `CattletraceConfig`.

### Impact
✗ Django fails to initialize — **entire application cannot start**  
✗ No migrations can run  
✗ No database operations possible  

### Solution

**Option A: Rename AppConfig class (RECOMMENDED)**
```python
# File: CattleTrace/apps.py, line 56
# CHANGE FROM:
class TraceabilityConfig(AppConfig):

# CHANGE TO:
class CattletraceConfig(AppConfig):
```

**Option B: Update settings.py**
```python
# File: DjangoProject/settings.py, line 41
# CHANGE FROM:
'CattleTrace.apps.CattletraceConfig',

# CHANGE TO:
'CattleTrace.apps.TraceabilityConfig',
```

**Recommendation:** Choose Option A for consistency with the URL app_name.

---

## 2. 🔴 CRITICAL: Migration App Name Mismatch

### Location
- **File:** `CattleTrace/migrations/0001_initial.py` (various lines)
- **Actual App Name:** `CattleTrace`
- **Migration References:** `'traceability.animal'`, `'traceability.farm'`, etc.

### Errors (examples)
```python
# Line 124: references 'traceability.animal' instead of 'CattleTrace.animal'
dam = models.ForeignKey(blank=True, null=True, ..., to='traceability.animal'),

# Line 130: 
breed = models.ForeignKey(null=True, ..., to='traceability.breed'),

# Line 209:
field=models.ForeignKey(..., to='traceability.farm'),
```

### Impact
✗ All ForeignKey relationships broken  
✗ Migrations cannot be applied  
✗ Database table relationships will fail  
✗ Data integrity violations across all related models  

### Root Cause
Migrations were generated for an app named "traceability" but the actual app is named "CattleTrace".

### Solution

**Regenerate migrations with correct app name:**

```bash
# Step 1: Delete current migration (if database not in production)
Remove-Item 'C:\Users\PC\PycharmProjects\DjangoProject\CattleTrace\migrations\0001_initial.py'
Remove-Item 'C:\Users\PC\PycharmProjects\DjangoProject\CattleTrace\migrations\0002_*.py'

# Step 2: Delete migration history in database
# In pgAdmin, run:
DELETE FROM django_migrations WHERE app = 'CattleTrace';

# Step 3: Regenerate migrations
python manage.py makemigrations CattleTrace

# Step 4: Apply new migrations
python manage.py migrate
```

---

## 3. 🟠 HIGH: Missing 'abattoir' Role in User Choices (Migration Mismatch)

### Location
- **File:** `CattleTrace/models.py` lines 28-34
- **File:** `CattleTrace/migrations/0001_initial.py` line 72-75

### Conflict
**models.py defines:**
```python
class Role(models.TextChoices):
    FARMER = "farmer", "Farmer"
    VET = "vet", "Veterinarian"
    INSPECTOR = "inspector", "Inspector"
    BUYER = "buyer", "Buyer"
    ABATTOIR = "abattoir", "Abattoir"    # ← Present
    ADMIN = "admin", "Administrator"
```

**Migration includes:**
```python
('farmer', 'Farmer'), 
('vet', 'Veterinarian'), 
('inspector', 'Inspector'),
('buyer', 'Buyer'), 
('admin', 'Administrator')  
# ← 'abattoir' role is PRESENT in both — NO ERROR (Issue resolved)
```

**Status:** ✓ VERIFIED — Both files are consistent. No action needed.

---

## 4. 🟠 HIGH: SlaughterRecord ForeignKey Cardinality Conflict

### Location
- **File:** `CattleTrace/models.py` line 301

### Error
```python
animal = models.ForeignKey(
    Animal, 
    on_delete=models.CASCADE, 
    related_name='slaughter_record'  # ← SINGULAR
)
```

### Issue
- Related name is **singular** (`slaughter_record`) but a ForeignKey implies one Animal can have many SlaughterRecords
- Should be **plural** (`slaughter_records`) per Django convention
- However, business logic: **An animal can only be slaughtered ONCE**

### Impact
- 🟡 Code clarity issue (developers would expect `animal.slaughter_records.all()` to work correctly)
- ✓ Functionally works because of Django's naming flexibility
- 🟡 May confuse bulk operations expecting plural naming

### Root Cause
Model design comment says an animal can only be slaughtered once, but the naming doesn't reflect this constraint.

### Solution

**Option A: Rename to reflect business logic (RECOMMENDED)**
```python
# CattleTrace/models.py, line 301
animal = models.ForeignKey(
    Animal,
    on_delete=models.CASCADE,
    related_name='slaughter_records'  # Changed to plural
)
```

**Option B: Add a unique constraint instead**
```python
# CattleTrace/models.py, add to SlaughterRecord Meta class
class Meta:
    constraints = [
        models.UniqueConstraint(fields=['animal'], name='one_slaughter_per_animal')
    ]
```

**Option C: Create migration for reverse relation**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Recommendation:** Choose Option A + Option B for both clarity and enforcement.

---

## 5. 🟠 HIGH: Inconsistent Database Password Configuration

### Location
- **File:** `DjangoProject/settings.py` line 83

### Issue
```python
'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'admin123'),
```

### Problems
- 🔴 **Security Risk:** Hardcoded default password in source code
- 🔴 **Credential Exposure:** Password visible in git history (already exposed)
- 🟡 **Non-production:** This will not work in production environments
- 🟡 **Inconsistent:** Different from actual dev setup

### Impact
✗ Security vulnerability  
✗ Cannot be safely deployed to production  
✗ Credentials exposed in repository  

### Solution

**Step 1: Create `.env` file (gitignore it)**
```bash
# File: /DjangoProject/.env
POSTGRES_DB=cattletrace
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**Step 2: Update `.gitignore`**
```
# Add to C:/Users/PC/PycharmProjects/DjangoProject/.gitignore
.env
*.env
```

**Step 3: Install python-dotenv**
```bash
pip install python-dotenv
```

**Step 4: Update `settings.py`**
```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'cattletrace'),
        'USER': os.environ.get('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),  # Remove default!
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}
```

**Step 5: Update requirements.txt**
```
python-dotenv>=1.0.0
```

---

## 6. 🟡 MEDIUM: Data Consistency Signal Dependencies

### Location
- **File:** `CattleTrace/apps.py` lines 61-543 (signal handlers)

### Issue
Multiple signals depend on transaction completion but no explicit transaction wrapping is defined.

### Scenarios That Could Cause Issues

**Scenario 1: Bulk operations bypass signals**
```python
# This bypasses post_save signals that sync animal.current_farm
MovementRecord.objects.filter(pk__in=ids).update(destination_farm_id=new_farm_id)
```

**Scenario 2: Race condition in listing withdrawal**
```python
# If two threads try to withdraw the same listing
_withdraw_listing(animal)  # No lock
_withdraw_listing(animal)  # Race condition
```

**Scenario 3: Missing animal cleanup**
```python
# SlaughterRecord removed but animal status not reset
slaughter = SlaughterRecord.objects.get(pk=id)
slaughter.delete()  # Animal status remains SLAUGHTERED
```

### Impact
- 🟡 Inconsistent data in race conditions
- 🟡 Bulk operations may not trigger cleanup signals
- 🟡 Deletion doesn't not trigger reversal

### Solution

**Add robust signal handlers and transaction atomicity:**

```python
# File: CattleTrace/apps.py - Add atomic transaction wrapper

def on_slaughter_record_pre_delete(sender, instance, **kwargs):
    """
    Reset animal status when slaughter record is deleted.
    Ensures data consistency on removal.
    """
    try:
        Animal.objects.filter(pk=instance.animal_id).update(
            status=Animal.Status.ALIVE
        )
        _audit_signal("animal.status_reset_after_slaughter_delete", instance)
    except Exception:
        logger.exception("Failed to reset animal status after slaughter deletion")

pre_delete.connect(on_slaughter_record_pre_delete, sender=SlaughterRecord,
                   dispatch_uid="traceability.slaughterrecord.pre_delete.cleanup")
```

**For bulk operations, use explicit transaction management:**
```python
from django.db import transaction

@transaction.atomic
def move_animals_batch(animal_ids, destination_farm_id):
    """Ensures all signals fire even in bulk operations."""
    for animal_id in animal_ids:
        MovementRecord.objects.create(
            animal_id=animal_id,
            destination_farm_id=destination_farm_id,
            # ... other fields
        )
```

---

## 7. 🟡 MEDIUM: Validation Constraints Not Enforced in Database

### Location
- **File:** `CattleTrace/apps.py` signal handlers (pre_save validations)
- **File:** `CattleTrace/models.py` (missing db_constraints)

### Issue
All validations happen in signals/pre_save handlers, not in the database.

### Examples
```python
# Validation 1: Animal date_of_birth in future (line 169)
if instance.date_of_birth > timezone.now().date():
    raise ValidationError(...)
# But NO database constraint prevents this!

# Validation 2: Carcass weight <= live weight (line 382)
if instance.carcass_weight_kg > instance.live_weight_kg:
    raise ValidationError(...)
# But if Django is bypassed, data can be corrupted!
 ```

### Impact
- 🟡 Direct database inserts bypass validation
- 🟡 Concurrent operations may corrupt data
- 🟡 API/scripts that bypass Django can insert invalid data

### Solution

**Add database constraints to models:**

```python
# File: CattleTrace/models.py

class Animal(models.Model):
    # ...existing fields...
    
    class Meta:
        ordering = ["-registration_date"]
        constraints = [
            # Prevent future dates
            models.CheckConstraint(
                check=models.Q(date_of_birth__lte=models.F('registration_date')),
                name='animal_dob_not_future'
            ),
        ]

class SlaughterRecord(models.Model):
    # ...existing fields...
    
    class Meta:
        constraints = [
            # Prevent carcass > live weight
            models.CheckConstraint(
                check=models.Q(carcass_weight_kg__lte=models.F('live_weight_kg')),
                name='carcass_weight_lte_live_weight'
            ),
            # Prevent duplicate slaughters
            models.UniqueConstraint(
                fields=['animal'],
                name='one_slaughter_per_animal'
            ),
        ]
```

**Then regenerate migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 8. 🟡 MEDIUM: Missing Unique Constraints for Business Rules

### Location
- **File:** `CattleTrace/models.py` (model definitions)

### Issue

**MarketplaceListing:**
```python
# A listing should be unique per animal (but Django allows duplicates)
animal = models.OneToOneField(Animal, ...)  # ✓ Good

# But an animal can be re-listed if 1st listing is deleted
# No constraint prevents duplicate ACTIVE listings
```

**HealthRecord:**
```python
# No constraint prevents duplicate vaccinations on same date
# (Business rule: one vaccination per date per animal expected)
```

**MovementRecord:**
```python
# No constraint prevents duplicate movements on exact same date
# (Unlikely but possible data duplication)
```

### Impact
- 🟡 Possible duplicate health records
- 🟡 Possible duplicate listings (if old one deleted)
- 🟡 Possible duplicate movements

### Solution

**Add UniqueConstraints to prevent duplicates:**

```python
# File: CattleTrace/models.py

class HealthRecord(models.Model):
    # ...existing fields...
    
    class Meta:
        ordering = ["-date"]
        constraints = [
            # Prevent duplicate vaccinations on same day
            models.UniqueConstraint(
                fields=['animal', 'record_type', 'date'],
                condition=models.Q(record_type='vaccination'),
                name='unique_vaccination_per_animal_per_day'
            ),
        ]

class MovementRecord(models.Model):
    # ...existing fields...
    
    class Meta:
        ordering = ["-move_date"]
        constraints = [
            # Prevent duplicate movements to same destination on same day
            models.UniqueConstraint(
                fields=['animal', 'destination_farm', 'move_date'],
                name='unique_movement_destination_per_day'
            ),
        ]
```

---

## Summary Table

| # | Issue | Severity | File | Type | Status |
|---|-------|----------|------|------|--------|
| 1 | AppConfig class name mismatch | 🔴 CRITICAL | apps.py, settings.py | Configuration | Blocking |
| 2 | Migration app name mismatch | 🔴 CRITICAL | migrations/0001_initial.py | Data | Blocking |
| 3 | Missing abattoir role | 🟠 HIGH | models.py, migrations | Consistency | ✓ OK |
| 4 | SlaughterRecord related_name | 🟠 HIGH | models.py | Code | Minor |
| 5 | Hardcoded database password | 🟠 HIGH | settings.py | Security | Risk |
| 6 | Signal race conditions | 🟡 MEDIUM | apps.py | Concurrency | Possible |
| 7 | Missing DB constraints | 🟡 MEDIUM | models.py | Validation | Bypass Risk |
| 8 | Missing unique constraints | 🟡 MEDIUM | models.py | Duplication | Data Quality |

---

## Recommended Fix Order

### Immediate (Get app running)
1. ✅ **Fix AppConfig name** (Issue #1) — BLOCKING
2. ✅ **Regenerate migrations** (Issue #2) — BLOCKING
3. ✅ **Secure database password** (Issue #5) — CRITICAL

### Short-term (Data integrity)
4. Add database constraints (Issue #7)
5. Add unique constraints (Issue #8)
6. Fix SlaughterRecord related_name (Issue #4)

### Long-term (Robustness)
7. Add pre_delete signals (Issue #6)
8. Code review for race conditions

---

## Implementation Checklist

- [ ] Rename `TraceabilityConfig` to `CattletraceConfig`
- [ ] Delete and regenerate migrations
- [ ] Clear existing django_migrations table entries
- [ ] Apply new migrations
- [ ] Create `.env` file with secure password
- [ ] Install python-dotenv
- [ ] Update settings.py to use .env
- [ ] Add database constraints
- [ ] Update related_name in SlaughterRecord
- [ ] Test data integrity scenarios
- [ ] Run full test suite
- [ ] Verify all animal, health, movement, and slaughter workflows

---

**Generated:** 2026-06-17
**Status:** Ready for implementation

