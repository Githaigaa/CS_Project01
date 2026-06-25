# CattleTrace — Implementation Guide for Fixed Issues
**Status:** CRITICAL ISSUES FIXED  
**Date:** June 17, 2026

---

## What Was Fixed

### ✅ FIXED — AppConfig Class Name Mismatch
- **Before:** `class TraceabilityConfig(AppConfig):`  
- **After:** `class CattletraceConfig(AppConfig):`
- **File:** `CattleTrace/apps.py` line 56
- **Status:** RESOLVED

### ✅ FIXED — Custom User Model Reverse Accessor Clash
- **Issue:** Custom User model had reverse accessor clashes with auth.User model
- **Solution:** Added explicit `related_name` to groups and user_permissions  
- **File:** `CattleTrace/models.py` lines 45-57
- **Added:** `AUTH_USER_MODEL = 'CattleTrace.User'` in settings.py
- **Status:** RESOLVED

### ✅ FIXED — Views.py File Was URLs Not Views
- **Issue:** `views.py` contained URL patterns instead of view functions
- **Solution:** Created proper `views.py` with stub implementations for all views
- **File:** `CattleTrace/views.py` (completely rewritten)
- **Status:** RESOLVED

### ✅ FIXED — App Namespace Inconsistency
- **Before:** Root URLs used `namespace="cattletrace"` but app used `app_name = "CattleTrace"`
- **After:** Removed explicit namespace from root URLs (uses app_name automatically)
- **File:** `DjangoProject/urls.py` line 21
- **Status:** RESOLVED

### ✅ PARTIALLY FIXED — Migration App Name Mismatch
- **Issue:** Old migrations referenced 'traceability' app instead of 'CattleTrace'
- **Solution:** Deleted old incorrect migrations and regenerated with correct app name
- **File:** `CattleTrace/migrations/0001_initial.py`
- **Status:** Regenerated (need to apply to PostgreSQL)

---

## Next Steps to Complete Implementation

### Step 1: Clear PostgreSQL and Apply New Migrations

**Warning:** This will reset ALL data in the database!

```bash
# Option A: Using psql directly (on Linux/Mac)
psql -U postgres -d cattletrace -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Option B: Using DBeaver or pgAdmin
# 1. Connect to PostgreSQL
# 2. Right-click database 'cattletrace'
# 3. Select "Truncate all tables"
# 4. Confirm
```

**Then run:**
```bash
python manage.py migrate
```

### Step 2: Create Superuser

```bash
python manage.py createsuperuser
# Enter username, email, password
```

### Step 3: Run Development Server

```bash
python manage.py runserver 0.0.0.0:8000
```

Then visit:
- http://127.0.0.1:8000/ — Application home
- http://127.0.0.1:8000/admin/ — Django admin (use superuser credentials)

---

## Remaining Issues & Solutions

### 🟠 Issue #4: SlaughterRecord related_name

**Current:** `related_name='slaughter_record'` (singular)  
**Should be:** `related_name='slaughter_records'` (plural for clarity)

**Fix:**
```python
# File: CattleTrace/models.py, line 301
animal = models.ForeignKey(
    Animal,
    on_delete=models.CASCADE,
    related_name='slaughter_records'  # ← Changed
)
```

**Then regenerate migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

---

### 🟠 Issue #5: Database Password Hardcoded

**Current:** `'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'admin123')`  
**Problem:** Hardcoded default password

**Fix:**

**Step 1: Create `.env` file**
```bash
# File: DjangoProject/.env (create this file)
POSTGRES_DB=cattletrace
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_real_secure_password_123
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**Step 2: Update `.gitignore`**
```bash
# Add these lines to DjangoProject/.gitignore
.env
*.env
.env.local
```

**Step 3: Install python-dotenv**
```bash
pip install python-dotenv
pip freeze > requirements.txt
```

**Step 4: Update settings.py**
```python
# File: DjangoProject/settings.py, lines 1-20
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # ← Add this line

BASE_DIR = Path(__file__).resolve().parent.parent
# ... rest of settings
```

**Step 5: Remove default password**
```python
# File: DjangoProject/settings.py, line 83
# CHANGE FROM:
'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'admin123'),
# CHANGE TO:
'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),  # No default!
```

---

### 🟡 Issue #6: Data Consistency Signal Gaps

**Problem:** SlaughterRecord.save() is called but deletion doesn't reset animal status

**Fix: Add pre_delete signal**

```python
# File: CattleTrace/apps.py, around line 540 (in ready() method)
# Add this before the logger.info() call

def on_slaughter_record_pre_delete(sender, instance, **kwargs):
    """Reset animal status when slaughter record is deleted."""
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

---

### 🟡 Issue #7: Missing Database Constraints

**Problem:** Validations only happen in Django signals; database can be corrupted by direct SQL inserts

**Fix: Add CheckConstraints to models**

```python
# File: CattleTrace/models.py

# For Animal model:
class Animal(models.Model):
    # ... existing fields ...
    
    class Meta:
        ordering = ["-registration_date"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(date_of_birth__lte=models.F('registration_date')),
                name='animal_dob_not_future'
            ),
        ]
        permissions = (
            ("upload_animal_photo", "Can upload animal photo"),
        )

# For SlaughterRecord model:
class SlaughterRecord(models.Model):
    # ... existing fields ...
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(carcass_weight_kg__lte=models.F('live_weight_kg')),
                name='carcass_weight_lte_live_weight'
            ),
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

### 🟡 Issue #8: Missing Unique Constraints  

**Problem:** Can create duplicate health records or movements on same date

**Fix: Add UniqueConstraints**

```python
# File: CattleTrace/models.py

class HealthRecord(models.Model):
    # ... existing fields ...
    
    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(
                fields=['animal', 'record_type', 'date'],
                condition=models.Q(record_type='vaccination'),
                name='unique_vaccination_per_animal_per_day'
            ),
        ]

class MovementRecord(models.Model):
    # ... existing fields ...
    
    class Meta:
        ordering = ["-move_date"]
        constraints = [
            models.UniqueConstraint(
                fields=['animal', 'destination_farm', 'move_date'],
                name='unique_movement_destination_per_day'
            ),
        ]
```

**Then regenerate migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Quick Start Commands

```bash
# 1. Navigate to project
cd C:\Users\PC\PycharmProjects\DjangoProject

# 2. Activate virtual environment (if not already active)
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Run development server
python manage.py runserver
```

---

## Important Files Modified

| File | Change | Status |
|------|--------|--------|
| `CattleTrace/apps.py` | Renamed TraceabilityConfig → CattletraceConfig | ✅ Done |
| `CattleTrace/models.py` | Added User.groups/user_permissions with related_name | ✅ Done |
| `CattleTrace/views.py` | Completely rewritten (was URLs, now views) | ✅ Done |
| `CattleTrace/urls.py` | No changes needed (already correct) | ✓ OK |
| `CattleTrace/migrations/` | Deleted old, regenerated new 0001_initial.py | ✅ Done |
| `DjangoProject/settings.py` | Added AUTH_USER_MODEL, MEDIA_* settings | ✅ Done |
| `DjangoProject/urls.py` | Removed namespace="cattletrace" | ✅ Done |
| `.gitignore` | Should add .env (not done yet) | ⏳ TODO |
| `.env` | Create with actual credentials (not done) | ⏳ TODO |

---

## Validation Checklist

After completing all steps:

- [ ] `python manage.py check` returns "System check identified no issues"
- [ ] `python manage.py migrate` applies all migrations successfully
- [ ] Superuser created successfully
- [ ] Admin interface accessible at `/admin/`
- [ ] Can login with superuser credentials
- [ ] No password warnings in console
- [ ] PostgreSQL database populated with correct app name tables
- [ ] All models load without errors
- [ ] Views are callable (no AttributeError)

---

## Testing the Fixes

```bash
# Test 1: System Check
python manage.py check

# Test 2: Makemigrations (should show "No changes detected")
python manage.py makemigrations CattleTrace

# Test 3: Showmigrations (all should be marked as applied)
python manage.py showmigrations CattleTrace

# Test 4: Queryamigrations (check database integrity)
python manage.py sqlmigrate CattleTrace 0001

# Test 5: List models
python manage.py shell
>>> from CattleTrace.models import *
>>> User, Animal, Farm, HealthRecord  # Should all import
```

---

## Database Reset (If Needed)

```bash
# WARNING: This will DELETE ALL DATA

# Using psql
psql -U postgres -d postgres -c "DROP DATABASE cattletrace;"
psql -U postgres -d postgres -c "CREATE DATABASE cattletrace;"

# Then remigrate
python manage.py migrate
python manage.py createsuperuser
```

---

## Key Improvements Made

1. **✅ Fixed AppConfig naming** — App can now load properly
2. **✅ Fixed User model clash** — Custom User works with auth framework
3. **✅ Fixed views** — All view functions available
4. **✅ Fixed URL routing** — Namespace/app_name consistent
5. **✅ Regenerated migrations** — New migrations have correct 'CattleTrace' references
6. **✅ System check passes** — No immediate errors

## Remaining Work

1. ⏳ Apply migrations to PostgreSQL database
2. ⏳ Secure database password (.env file)
3. ⏳ Add database constraints
4. ⏳ Add unique constraints
5. ⏳ Implement view functions (currently stubs)
6. ⏳ Create templates
7. ⏳ Test end-to-end workflows

---

**Next:** Run the Quick Start Commands above to get the app running!

