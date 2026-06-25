"""
traceability/urls.py
====================
All application routes for the Cattle Traceability & Marketplace Platform.

Route groups
────────────
  /                       Public (landing, auth)
  /dashboard/             Dashboard
  /animals/               Animal registration & profiles
  /health/<tag>/          Health records (nested under animal)
  /movements/             Movement tracking & permits
  /slaughter/             Slaughter records & abattoirs
  /marketplace/           Marketplace listings, inquiries, transactions
  /notifications/         Notification centre
  /reports/               Reports & analytics
  /farms/                 Farm management
  /profile/               User profile & settings
"""

from django.urls import path
from . import views

app_name = "CattleTrace"

urlpatterns =[

# ──────────────────────────────────────────
# PUBLIC — no login required
# ──────────────────────────────────────────
path("", views.landing, name="landing"),
path("login/", views.login_view, name="login"),
path("logout/", views.logout_view, name="logout"),
path("register/", views.register_user, name="register"),

# ──────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────
path("dashboard/", views.dashboard, name="dashboard"),

# ──────────────────────────────────────────
# ANIMAL REGISTRATION & PROFILES
# ──────────────────────────────────────────
path("animals/", views.animal_list, name="animal-list"),
path("animals/register/", views.animal_register, name="animal-register"),
path("animals/<str:tag_number>/", views.animal_profile, name="animal-profile"),
path("animals/<str:tag_number>/edit/", views.animal_edit, name="animal-edit"),
path("animals/<str:tag_number>/delete/", views.animal_delete, name="animal-delete"),
path("animals/<str:tag_number>/weight/", views.animal_weight_add, name="animal-weight-add"),

# ──────────────────────────────────────────
# HEALTH RECORDS  (nested under /animals/<tag>/)
# ──────────────────────────────────────────
path("animals/<str:tag_number>/health/",
views.health_record_list, name="health-list"),
path("animals/<str:tag_number>/health/add/",
views.health_record_add, name="health-add"),
path("animals/<str:tag_number>/health/<int:pk>/",
views.health_record_detail, name="health-detail"),
path("animals/<str:tag_number>/health/<int:pk>/edit/",
views.health_record_edit, name="health-edit"),
path("animals/<str:tag_number>/health/<int:pk>/delete/",
views.health_record_delete, name="health-delete"),

# ──────────────────────────────────────────
# MOVEMENT TRACKING
# ──────────────────────────────────────────
path("movements/", views.movement_list, name="movement-list"),
path("movements/<int:pk>/", views.movement_detail, name="movement-detail"),
path("animals/<str:tag_number>/movements/add/", views.movement_record_add, name="movement-add"),

# Permits
path("movements/permits/", views.permit_list, name="permit-list"),
path("movements/permits/request/", views.permit_request, name="permit-request"),
path("movements/permits/<int:pk>/", views.permit_detail, name="permit-detail"),
path("movements/permits/<int:pk>/approve/", views.permit_approve, name="permit-approve"),
path("movements/permits/<int:pk>/reject/", views.permit_reject, name="permit-reject"),

# ──────────────────────────────────────────
# SLAUGHTER RECORDS
# ──────────────────────────────────────────
path("slaughter/", views.slaughter_list, name="slaughter-list"),
path("slaughter/<int:pk>/", views.slaughter_record_detail, name="slaughter-detail"),
path("animals/<str:tag_number>/slaughter/add/", views.slaughter_record_add, name="slaughter-add"),
path("slaughter/abattoirs/", views.abattoir_list, name="abattoir-list"),

# ──────────────────────────────────────────
# MARKETPLACE
# ──────────────────────────────────────────
path("marketplace/", views.marketplace_home, name="marketplace-home"),
path("marketplace/listings/<int:pk>/", views.marketplace_listing_detail, name="listing-detail"),
path("marketplace/listings/create/", views.marketplace_listing_create, name="listing-create"),
path("marketplace/listings/<int:pk>/edit/", views.marketplace_listing_edit, name="listing-edit"),
path("marketplace/listings/<int:pk>/delete/", views.marketplace_listing_delete, name="listing-delete"),
path("marketplace/my-listings/", views.marketplace_my_listings, name="my-listings"),

# Inquiries
path("marketplace/listings/<int:pk>/inquire/", views.marketplace_inquiry_send, name="inquiry-send"),
path("marketplace/inquiries/", views.marketplace_inquiries, name="inquiries"),

# Transactions
path("marketplace/listings/<int:listing_pk>/purchase/", views.transaction_create, name="transaction-create"),
path("marketplace/transactions/<int:pk>/", views.transaction_detail, name="transaction-detail"),

# ──────────────────────────────────────────
# NOTIFICATIONS
# ──────────────────────────────────────────
path("notifications/", views.notification_list, name="notification-list"),
path("notifications/<int:pk>/", views.notification_detail, name="notification-detail"),
path("notifications/mark-all-read/", views.notification_mark_all_read, name="notification-mark-all-read"),

# ──────────────────────────────────────────
# REPORTS & ANALYTICS
# ──────────────────────────────────────────
path("reports/", views.reports_home, name="reports-home"),
path("reports/herd/", views.report_herd_summary, name="report-herd"),
path("reports/health/", views.report_health, name="report-health"),
path("reports/movements/", views.report_movements, name="report-movements"),
path("reports/marketplace/", views.report_marketplace, name="report-marketplace"),
path("reports/disease-outbreaks/", views.report_disease_outbreaks, name="report-outbreaks"),
path("reports/slaughter/", views.report_slaughter, name="report-slaughter"),

# ──────────────────────────────────────────
# FARM MANAGEMENT
# ──────────────────────────────────────────
path("farms/", views.farm_list, name="farm-list"),
path("farms/create/", views.farm_create, name="farm-create"),
path("farms/<int:pk>/", views.farm_detail, name="farm-detail"),
path("farms/<int:pk>/edit/", views.farm_edit, name="farm-edit"),

# ──────────────────────────────────────────
# USER PROFILE & SETTINGS
# ──────────────────────────────────────────
path("profile/", views.profile_view, name="profile"),
path("profile/edit/", views.profile_edit, name="profile-edit"),
path("profile/password/", views.change_password, name="change-password"),
]

