import { useState } from "react";
import { User, Building2, Shield, Bell, Lock, Key, FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";

export function Settings() {
  const [activeTab, setActiveTab] = useState<"profile" | "organization" | "permissions" | "notifications" | "security" | "api" | "audit">("profile");

  const tabs = [
    { id: "profile" as const, label: "Profile Settings", icon: User },
    { id: "organization" as const, label: "Organization", icon: Building2 },
    { id: "permissions" as const, label: "Permissions", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Lock },
    { id: "api" as const, label: "API Access", icon: Key },
    { id: "audit" as const, label: "Audit Logs", icon: FileText },
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-semibold">
                    KM
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                    <p className="text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="First Name" defaultValue="Kamau" />
                  <Input label="Last Name" defaultValue="Mwangi" />
                  <Input label="Email" type="email" defaultValue="kamau.mwangi@example.co.ke" />
                  <Input label="Phone" type="tel" defaultValue="+254 712 345 678" />
                  <Select label="Role">
                    <option value="farmer">Farmer/Owner</option>
                    <option value="buyer">Buyer/Trader</option>
                    <option value="health">Animal Health Worker</option>
                    <option value="abattoir">Abattoir</option>
                    <option value="admin">Administrator</option>
                  </Select>
                  <Input label="Location" defaultValue="Kiambu County" />
                </div>
                <div>
                  <Textarea label="Bio" placeholder="Tell us about yourself..." />
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
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      {[
                        "Disease alerts",
                        "Movement approvals",
                        "Marketplace offers",
                        "Transfer requests",
                        "Payment confirmations",
                        "System updates",
                      ].map((item) => (
                        <label key={item} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <span>{item}</span>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">SMS Notifications</h3>
                    <div className="space-y-3">
                      {[
                        "Critical health alerts",
                        "Movement approvals",
                        "High-value offers",
                      ].map((item) => (
                        <label key={item} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <span>{item}</span>
                          <input type="checkbox" className="rounded" />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Save className="w-5 h-5" />
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
                <div>
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input label="Current Password" type="password" />
                    <Input label="New Password" type="password" />
                    <Input label="Confirm New Password" type="password" />
                    <Button>Update Password</Button>
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
