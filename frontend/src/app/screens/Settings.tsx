import { useEffect, useRef, useState } from "react";
import { User, Building2, Shield, Bell, Lock, Key, FileText, Save, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { useAuth } from "../context/AuthContext";
import type { NotificationPreferences } from "../lib/api/types";
import {
  EMAIL_PREFERENCE_KEYS,
  EMAIL_PREFERENCE_LABELS,
  SMS_PREFERENCE_KEYS,
  SMS_PREFERENCE_LABELS,
  getUserInitials,
  normalizeNotificationPreferences,
  settingsApi,
} from "../services/api/settings";
import { getApiErrorMessage, getApiFieldErrors } from "../services/api/errors";
import { holdingsApi } from "../services/api/holdings";
import type { ApiFarm } from "../lib/api/holdings";
import { notificationsApi } from "../services/api/notifications";
import type { ApiNotification } from "../lib/api/notifications";
import { formatDate } from "../lib/utils";

interface ProfileFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  location: string;
  bio: string;
}

interface PasswordFormState {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface OrgFormState {
  name: string;
  registration_no: string;
  county: string;
  sub_county: string;
  ward: string;
  total_area_acres: string;
}

const EMPTY_PROFILE: ProfileFormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  location: "",
  bio: "",
};

const EMPTY_PASSWORD: PasswordFormState = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

const EMPTY_ORG: OrgFormState = {
  name: "",
  registration_no: "",
  county: "",
  sub_county: "",
  ward: "",
  total_area_acres: "",
};

const ROLE_LABELS: Record<string, string> = {
  farmer: "Farmer / Owner",
  buyer: "Buyer / Trader",
  vet: "Veterinarian",
  cahw: "Community Animal Health Worker",
  dvs: "DVS Officer",
  inspector: "Inspector",
  abattoir: "Abattoir Operator",
  admin: "Administrator",
};

export function Settings() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "organization" | "permissions" | "notifications" | "security" | "api" | "audit"
  >("profile");

  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(EMPTY_PASSWORD);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    normalizeNotificationPreferences(),
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Organization (primary holding)
  const [primaryHolding, setPrimaryHolding] = useState<ApiFarm | null>(null);
  const [orgForm, setOrgForm] = useState<OrgFormState>(EMPTY_ORG);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgMessage, setOrgMessage] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Audit log (recent notifications as activity)
  const [auditLogs, setAuditLogs] = useState<ApiNotification[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditHasMore, setAuditHasMore] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: "profile" as const, label: "Profile Settings", icon: User },
    { id: "organization" as const, label: "Organization", icon: Building2 },
    { id: "permissions" as const, label: "Permissions", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Lock },
    { id: "api" as const, label: "API Access", icon: Key },
    { id: "audit" as const, label: "Audit Logs", icon: FileText },
  ];

  // Load profile
  useEffect(() => {
    let isCurrent = true;
    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const profile = user ?? await settingsApi.getProfile();
        if (!isCurrent) return;
        setProfileForm({
          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          email: profile.email ?? "",
          phone_number: profile.phone_number ?? "",
          location: profile.location ?? "",
          bio: profile.bio ?? "",
        });
        setAvatarPreview(profile.profile_photo ?? null);
        setPreferences(normalizeNotificationPreferences(profile.notification_preferences));
      } catch (err) {
        if (isCurrent) setProfileError(getApiErrorMessage(err, "Unable to load profile."));
      } finally {
        if (isCurrent) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => { isCurrent = false; };
  }, [user]);

  // Load primary holding when Organization tab opens
  useEffect(() => {
    if (activeTab !== "organization") return;
    let isCurrent = true;
    async function loadOrg() {
      setLoadingOrg(true);
      setOrgError(null);
      try {
        const res = await holdingsApi.listHoldings({ pageSize: 1, ordering: "created_at" });
        if (!isCurrent) return;
        const holding = res.results[0] ?? null;
        setPrimaryHolding(holding);
        if (holding) {
          setOrgForm({
            name: holding.name,
            registration_no: holding.registration_no,
            county: holding.county,
            sub_county: holding.sub_county,
            ward: holding.ward ?? "",
            total_area_acres: holding.total_area_acres ?? "",
          });
        }
      } catch (err) {
        if (isCurrent) setOrgError(getApiErrorMessage(err, "Unable to load organisation details."));
      } finally {
        if (isCurrent) setLoadingOrg(false);
      }
    }
    loadOrg();
    return () => { isCurrent = false; };
  }, [activeTab]);

  // Load audit log (notifications as activity feed) when Audit tab opens
  useEffect(() => {
    if (activeTab !== "audit") return;
    let isCurrent = true;
    async function loadAudit() {
      setLoadingAudit(true);
      try {
        const res = await notificationsApi.listNotifications({ page: 1, pageSize: 10 });
        if (!isCurrent) return;
        const items = Array.isArray(res) ? res : res.results ?? [];
        const total = Array.isArray(res) ? res.length : (res.count ?? 0);
        setAuditLogs(items);
        setAuditHasMore(total > items.length);
        setAuditPage(1);
      } catch {
        if (isCurrent) setAuditLogs([]);
      } finally {
        if (isCurrent) setLoadingAudit(false);
      }
    }
    loadAudit();
    return () => { isCurrent = false; };
  }, [activeTab]);

  const handleLoadMoreAudit = async () => {
    const nextPage = auditPage + 1;
    try {
      const res = await notificationsApi.listNotifications({ page: nextPage, pageSize: 10 });
      const items = Array.isArray(res) ? res : res.results ?? [];
      const total = Array.isArray(res) ? res.length : (res.count ?? 0);
      setAuditLogs((prev) => [...prev, ...items]);
      setAuditHasMore(auditLogs.length + items.length < total);
      setAuditPage(nextPage);
    } catch { /* ignore */ }
  };

  const handleProfileChange = (field: keyof ProfileFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProfileForm((c) => ({ ...c, [field]: event.target.value }));
    };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileErrors({});
    setProfileError(null);
    setProfileMessage(null);
    try {
      const updated = await settingsApi.updateProfile(profileForm);
      await refreshUser();
      setProfileForm({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        email: updated.email ?? "",
        phone_number: updated.phone_number ?? "",
        location: updated.location ?? "",
        bio: updated.bio ?? "",
      });
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileErrors(getApiFieldErrors(err));
      setProfileError(getApiErrorMessage(err, "Unable to save profile changes."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setProfileError(null);
    setProfileMessage(null);
    setProfileErrors({});
    try {
      const updated = await settingsApi.uploadAvatar(file);
      await refreshUser();
      setAvatarPreview(updated.profile_photo ?? null);
      setProfileMessage("Profile photo updated successfully.");
    } catch (err) {
      setProfileErrors(getApiFieldErrors(err));
      setProfileError(getApiErrorMessage(err, "Unable to upload profile photo."));
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    setPreferencesError(null);
    setPreferencesMessage(null);
    try {
      const updated = await settingsApi.updatePreferences(preferences);
      await refreshUser();
      setPreferences(normalizeNotificationPreferences(updated.notification_preferences));
      setPreferencesMessage("Notification preferences saved.");
    } catch (err) {
      setPreferencesError(getApiErrorMessage(err, "Unable to save notification preferences."));
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordErrors({});
    setPasswordError(null);
    setPasswordMessage(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: "Passwords do not match." });
      return;
    }
    setSavingPassword(true);
    try {
      await settingsApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm(EMPTY_PASSWORD);
      setPasswordMessage("Password updated successfully.");
    } catch (err) {
      setPasswordErrors(getApiFieldErrors(err));
      setPasswordError(getApiErrorMessage(err, "Unable to update password."));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!primaryHolding) return;
    setSavingOrg(true);
    setOrgError(null);
    setOrgMessage(null);
    try {
      await holdingsApi.updateHolding(primaryHolding.id, {
        name: orgForm.name,
        registration_no: orgForm.registration_no,
        county: orgForm.county,
        sub_county: orgForm.sub_county,
        ward: orgForm.ward,
        total_area_acres: orgForm.total_area_acres || null,
      });
      setOrgMessage("Organisation details updated successfully.");
    } catch (err) {
      setOrgError(getApiErrorMessage(err, "Unable to update organisation details."));
    } finally {
      setSavingOrg(false);
    }
  };

  const initials = getUserInitials(
    user ?? { first_name: profileForm.first_name, last_name: profileForm.last_name, username: "user" },
  );

  // Role-based permissions — derived from actual user role
  const rolePermissions = [
    { name: "Register Animals",      enabled: ["farmer", "admin"].includes(user?.role ?? "") },
    { name: "Edit Animal Records",   enabled: ["farmer", "vet", "cahw", "inspector", "admin"].includes(user?.role ?? "") },
    { name: "Delete Animals",        enabled: user?.role === "admin" },
    { name: "Manage Holdings",       enabled: ["farmer", "admin"].includes(user?.role ?? "") },
    { name: "Record Health Events",  enabled: ["farmer", "vet", "cahw", "admin"].includes(user?.role ?? "") },
    { name: "Approve Movements",     enabled: ["inspector", "dvs", "admin"].includes(user?.role ?? "") },
    { name: "Access Marketplace",    enabled: ["farmer", "buyer", "admin"].includes(user?.role ?? "") },
    { name: "Process Transactions",  enabled: ["buyer", "farmer", "admin"].includes(user?.role ?? "") },
    { name: "Generate Reports",      enabled: ["farmer", "vet", "cahw", "dvs", "inspector", "admin"].includes(user?.role ?? "") },
    { name: "Manage Users",          enabled: user?.role === "admin" },
    { name: "DVS County Functions",  enabled: ["dvs", "admin"].includes(user?.role ?? "") },
    { name: "Slaughter Records",     enabled: ["abattoir", "admin"].includes(user?.role ?? "") },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {profileMessage && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {profileMessage}
                  </div>
                )}
                {profileError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {profileError}
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-semibold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingProfile || uploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {uploadingAvatar && <Loader2 className="w-4 h-4 animate-spin" />}
                      Change Photo
                    </Button>
                    <p className="text-muted-foreground mt-1 text-xs">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                {loadingProfile ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="First Name" value={profileForm.first_name} onChange={handleProfileChange("first_name")} error={profileErrors.first_name} />
                      <Input label="Last Name" value={profileForm.last_name} onChange={handleProfileChange("last_name")} error={profileErrors.last_name} />
                      <Input label="Email" type="email" value={profileForm.email} onChange={handleProfileChange("email")} error={profileErrors.email} />
                      <Input label="Phone" type="tel" value={profileForm.phone_number} onChange={handleProfileChange("phone_number")} error={profileErrors.phone_number} />
                      <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <div className="px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground text-sm">
                          {ROLE_LABELS[user?.role ?? ""] ?? user?.role_display ?? "Unknown"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Role is assigned by an administrator.</p>
                      </div>
                      <Input label="Location" value={profileForm.location} onChange={handleProfileChange("location")} error={profileErrors.location} />
                    </div>
                    <Textarea label="Bio" placeholder="Tell us about yourself..." value={profileForm.bio} onChange={handleProfileChange("bio")} error={profileErrors.bio} />
                    <div className="flex justify-end">
                      <Button disabled={savingProfile} onClick={handleSaveProfile}>
                        {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Organisation ── */}
          {activeTab === "organization" && (
            <Card>
              <CardHeader><CardTitle>Organisation / Primary Holding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {orgMessage && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {orgMessage}
                  </div>
                )}
                {orgError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {orgError}
                  </div>
                )}

                {loadingOrg ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : !primaryHolding ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <Building2 className="w-12 h-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No holdings registered yet.</p>
                    <p className="text-sm text-muted-foreground">Register a holding under <strong>My Holdings</strong> to manage your organisation details here.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Holding Name *"
                        value={orgForm.name}
                        onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
                      />
                      <Input
                        label="Registration Number"
                        value={orgForm.registration_no}
                        onChange={(e) => setOrgForm((f) => ({ ...f, registration_no: e.target.value }))}
                      />
                      <Input
                        label="County"
                        value={orgForm.county}
                        onChange={(e) => setOrgForm((f) => ({ ...f, county: e.target.value }))}
                      />
                      <Input
                        label="Sub-County"
                        value={orgForm.sub_county}
                        onChange={(e) => setOrgForm((f) => ({ ...f, sub_county: e.target.value }))}
                      />
                      <Input
                        label="Ward"
                        value={orgForm.ward}
                        onChange={(e) => setOrgForm((f) => ({ ...f, ward: e.target.value }))}
                      />
                      <Input
                        label="Total Area (acres)"
                        type="number"
                        value={orgForm.total_area_acres}
                        onChange={(e) => setOrgForm((f) => ({ ...f, total_area_acres: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button disabled={savingOrg} onClick={handleSaveOrg}>
                        {savingOrg ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Permissions ── */}
          {activeTab === "permissions" && (
            <Card>
              <CardHeader><CardTitle>Your Permissions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 mb-4">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Permissions are determined by your role (<strong>{ROLE_LABELS[user?.role ?? ""] ?? user?.role_display}</strong>) and cannot be changed here. Contact an administrator to change your role.
                  </p>
                </div>
                <div className="space-y-3">
                  {rolePermissions.map((permission) => (
                    <div key={permission.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="font-medium">{permission.name}</div>
                      <div className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        permission.enabled
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {permission.enabled ? "Allowed" : "Not allowed"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent>
                {preferencesMessage && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400 mb-4">
                    {preferencesMessage}
                  </div>
                )}
                {preferencesError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
                    {preferencesError}
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      {EMAIL_PREFERENCE_KEYS.map((key) => (
                        <label key={key} className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer">
                          <span>{EMAIL_PREFERENCE_LABELS[key]}</span>
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={preferences.email[key] ?? false}
                            onChange={(e) =>
                              setPreferences((c) => ({ ...c, email: { ...c.email, [key]: e.target.checked } }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">SMS Notifications</h3>
                    <div className="space-y-3">
                      {SMS_PREFERENCE_KEYS.map((key) => (
                        <label key={key} className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer">
                          <span>{SMS_PREFERENCE_LABELS[key]}</span>
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={preferences.sms[key] ?? false}
                            onChange={(e) =>
                              setPreferences((c) => ({ ...c, sms: { ...c.sms, [key]: e.target.checked } }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button disabled={savingPreferences || loadingProfile} onClick={handleSavePreferences}>
                      {savingPreferences ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <Card>
              <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {passwordMessage && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {passwordMessage}
                  </div>
                )}
                {passwordError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {passwordError}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm((c) => ({ ...c, current_password: e.target.value }))}
                      error={passwordErrors.current_password}
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm((c) => ({ ...c, new_password: e.target.value }))}
                      error={passwordErrors.new_password}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm((c) => ({ ...c, confirm_password: e.target.value }))}
                      error={passwordErrors.confirm_password}
                    />
                    <Button disabled={savingPassword} onClick={handleUpdatePassword}>
                      {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-2">Account Information</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Username:</span> {user?.username}</p>
                    <p><span className="font-medium text-foreground">Member since:</span> {user?.date_joined ? formatDate(user.date_joined) : "—"}</p>
                    <p><span className="font-medium text-foreground">Account verified:</span> {user?.is_verified ? "Yes" : "Pending verification"}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication adds an extra layer of security to your account. This feature is coming soon.
                      </p>
                    </div>
                    <Button variant="outline" disabled>Enable 2FA (Coming Soon)</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── API Access ── */}
          {activeTab === "api" && (
            <Card>
              <CardHeader><CardTitle>API Access</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">API Key Management</p>
                    <p className="text-sm text-muted-foreground">
                      API key generation for external integrations is coming soon. You can already interact with CattleTrace
                      programmatically using the JWT tokens obtained from <code className="bg-muted px-1 rounded">/api/v1/auth/token/</code>.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Authentication Endpoint</h3>
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    POST /api/v1/auth/token/
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Send your username and password to receive an access token and refresh token.</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Your User ID</h3>
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                    {user?.id ?? "—"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Reference this ID when filtering API results by owner.</p>
                </div>

                <Button disabled>
                  <Key className="w-5 h-5" />
                  Generate API Key (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Audit Logs ── */}
          {activeTab === "audit" && (
            <Card>
              <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
              <CardContent>
                {loadingAudit ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <FileText className="w-12 h-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No activity recorded yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{log.title}</div>
                              {log.message && (
                                <div className="text-sm text-muted-foreground mt-0.5">{log.message}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {log.created_at ? formatDate(log.created_at) : ""}
                              </div>
                            </div>
                            {!log.is_read && (
                              <span className="flex-shrink-0 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">New</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {auditHasMore && (
                      <div className="flex justify-center mt-6">
                        <Button variant="outline" onClick={handleLoadMoreAudit}>Load More</Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
