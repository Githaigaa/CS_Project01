import { useEffect, useRef, useState } from "react";
import { User, Building2, Shield, Bell, Lock, Key, FileText, Save, Loader2 } from "lucide-react";
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

export function Settings() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "organization" | "permissions" | "notifications" | "security" | "api" | "audit">("profile");

  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(EMPTY_PASSWORD);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    normalizeNotificationPreferences(),
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
        if (isCurrent) {
          setProfileError(getApiErrorMessage(err, "Unable to load profile. Please try again."));
        }
      } finally {
        if (isCurrent) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => { isCurrent = false; };
  }, [user]);

  const handleProfileChange = (field: keyof ProfileFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setProfileForm((current) => ({ ...current, [field]: event.target.value }));
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

  const initials = getUserInitials(
    user ?? {
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      username: "user",
    },
  );
  const rolePermissions = [
    { name: "Register Animals", enabled: ["farmer", "admin"].includes(user?.role ?? "") },
    { name: "Edit Animal Records", enabled: ["farmer", "vet", "inspector", "admin"].includes(user?.role ?? "") },
    { name: "Delete Animals", enabled: user?.role === "admin" },
    { name: "Manage Holdings", enabled: ["farmer", "admin"].includes(user?.role ?? "") },
    { name: "Record Health Events", enabled: ["farmer", "vet", "admin"].includes(user?.role ?? "") },
    { name: "Approve Movements", enabled: ["inspector", "admin"].includes(user?.role ?? "") },
    { name: "Access Marketplace", enabled: ["farmer", "buyer", "admin"].includes(user?.role ?? "") },
    { name: "Process Transactions", enabled: ["buyer", "farmer", "admin"].includes(user?.role ?? "") },
    { name: "Generate Reports", enabled: ["farmer", "vet", "inspector", "admin"].includes(user?.role ?? "") },
    { name: "Manage Users", enabled: user?.role === "admin" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
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
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
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
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
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
                    <p className="text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                {loadingProfile ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading profile" />
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        value={profileForm.first_name}
                        onChange={handleProfileChange("first_name")}
                        error={profileErrors.first_name}
                      />
                      <Input
                        label="Last Name"
                        value={profileForm.last_name}
                        onChange={handleProfileChange("last_name")}
                        error={profileErrors.last_name}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange("email")}
                        error={profileErrors.email}
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={profileForm.phone_number}
                        onChange={handleProfileChange("phone_number")}
                        error={profileErrors.phone_number}
                      />
                      <Select label="Role" value={user?.role ?? "farmer"} disabled>
                        <option value="farmer">Farmer/Owner</option>
                        <option value="buyer">Buyer/Trader</option>
                        <option value="vet">Animal Health Worker</option>
                        <option value="abattoir">Abattoir</option>
                        <option value="admin">Administrator</option>
                      </Select>
                      <Input
                        label="Location"
                        value={profileForm.location}
                        onChange={handleProfileChange("location")}
                        error={profileErrors.location}
                      />
                    </div>
                    <div>
                      <Textarea
                        label="Bio"
                        placeholder="Tell us about yourself..."
                        value={profileForm.bio}
                        onChange={handleProfileChange("bio")}
                        error={profileErrors.bio}
                      />
                    </div>
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

          {activeTab === "organization" && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Organization Name" defaultValue="Kiambu Dairy Farm" />
                <Input label="Registration Number" defaultValue="KE-REG-12345678" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Select label="Organization Type">
                    <option value="farm">Farm</option>
                    <option value="feedlot">Feedlot</option>
                    <option value="auction">Auction House</option>
                    <option value="abattoir">Abattoir</option>
                    <option value="government">Government Agency</option>
                  </Select>
                  <Input label="KRA PIN" defaultValue="A123456789X" />
                </div>
                <Input label="Address Line 1" defaultValue="Plot 234, Ruiru-Kiambu Road" />
                <Input label="Address Line 2" placeholder="Near Kiambu Town, Landmark" />
                <div className="grid md:grid-cols-3 gap-4">
                  <Input label="County" defaultValue="Kiambu" />
                  <Input label="Sub-County" defaultValue="Kiambu" />
                  <Input label="Postal Code" defaultValue="00900" />
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "permissions" && (
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Register Animals", enabled: true },
                    { name: "Edit Animal Records", enabled: true },
                    { name: "Delete Animals", enabled: false },
                    { name: "Manage Holdings", enabled: true },
                    { name: "Record Health Events", enabled: true },
                    { name: "Approve Movements", enabled: false },
                    { name: "Access Marketplace", enabled: true },
                    { name: "Process Transactions", enabled: true },
                    { name: "Generate Reports", enabled: true },
                    { name: "Manage Users", enabled: false },
                  ].map((permission) => (
                    <div key={permission.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">{permission.name}</div>
                      </div>
                      <input type="checkbox" defaultChecked={permission.enabled} className="rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button>
                    <Save className="w-5 h-5" />
                    Save Permissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
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
                        <label key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <span>{EMAIL_PREFERENCE_LABELS[key]}</span>
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={preferences.email[key] ?? false}
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                email: { ...current.email, [key]: event.target.checked },
                              }))
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
                        <label key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <span>{SMS_PREFERENCE_LABELS[key]}</span>
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={preferences.sms[key] ?? false}
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                sms: { ...current.sms, [key]: event.target.checked },
                              }))
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

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
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
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                      }
                      error={passwordErrors.current_password}
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, new_password: event.target.value }))
                      }
                      error={passwordErrors.new_password}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))
                      }
                      error={passwordErrors.confirm_password}
                    />
                    <Button disabled={savingPassword} onClick={handleUpdatePassword}>
                      {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Authenticator App</div>
                      <div className="text-muted-foreground">Use an app to get verification codes</div>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Current Session</div>
                          <div className="text-muted-foreground">Chrome on macOS · Springfield, IL</div>
                          <div className="text-muted-foreground">Last active: Just now</div>
                        </div>
                        <Button variant="outline" size="sm" disabled>Current</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "api" && (
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-muted-foreground mb-4">
                    Generate API keys to integrate CattleTrace with your existing systems.
                  </p>
                  <Button>
                    <Key className="w-5 h-5" />
                    Generate New API Key
                  </Button>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4">Active API Keys</h3>
                  <div className="space-y-3">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium font-mono">ctk_live_*********************4a2b</div>
                          <div className="text-muted-foreground">Created: June 1, 2026 · Last used: 2 hours ago</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Revoke</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "audit" && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "Animal registered", user: "Kamau Mwangi", timestamp: "2026-06-06 09:30:00", details: "RFID: 254000123456789" },
                    { action: "Movement approved", user: "System", timestamp: "2026-06-06 08:15:00", details: "KE-MV-2026-001234" },
                    { action: "Health event recorded", user: "Dr. Njoroge Macharia", timestamp: "2026-06-05 16:45:00", details: "Vaccination - RFID: 254000234567890" },
                    { action: "Transaction completed", user: "Kamau Mwangi", timestamp: "2026-06-05 14:20:00", details: "TXN-1 - KES 80,000" },
                    { action: "Settings updated", user: "Kamau Mwangi", timestamp: "2026-06-05 11:00:00", details: "Notification preferences" },
                  ].map((log, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{log.action}</div>
                          <div className="text-muted-foreground">{log.details}</div>
                          <div className="text-muted-foreground">
                            {log.user} · {log.timestamp}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <Button variant="outline">Load More</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
