import { Bell, AlertTriangle, CheckCircle, Info, TrendingUp, Heart, Users, FileText } from "lucide-react";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { formatDateTime } from "../lib/utils";

interface Notification {
  id: string;
  type: "alert" | "approval" | "offer" | "transfer" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "Disease Alert: FMD Outbreak",
    message: "Foot and Mouth Disease detected at Nakuru Valley Dairy. 3 animals affected. Immediate quarantine required - DVS notified.",
    timestamp: "2026-06-06T09:30:00",
    read: false,
    actionRequired: true,
  },
  {
    id: "2",
    type: "approval",
    title: "Movement Approval Required",
    message: "Movement request KE-MV-2026-001235 from Kisumu Livestock Ranch to Nakuru Valley Dairy awaiting DVS approval.",
    timestamp: "2026-06-06T08:15:00",
    read: false,
    actionRequired: true,
  },
  {
    id: "3",
    type: "offer",
    title: "New Offer Received",
    message: "Nairobi Beef Processors Ltd made an offer of KES 75,000 for RFID 254000234567890.",
    timestamp: "2026-06-06T07:45:00",
    read: false,
    actionRequired: true,
  },
  {
    id: "4",
    type: "transfer",
    title: "Ownership Transfer Request",
    message: "Kamau Mwangi requests transfer of 5 animals to your holding Kiambu Dairy Farm.",
    timestamp: "2026-06-05T16:20:00",
    read: true,
    actionRequired: true,
  },
  {
    id: "5",
    type: "info",
    title: "Vaccination Due",
    message: "15 animals at Kiambu Dairy Farm are due for FMD and ECF booster vaccinations this week.",
    timestamp: "2026-06-05T14:00:00",
    read: true,
    actionRequired: false,
  },
  {
    id: "6",
    type: "info",
    title: "Market Listing Expiring Soon",
    message: "Your listing for RFID 254000234567890 will expire in 3 days.",
    timestamp: "2026-06-05T10:30:00",
    read: true,
    actionRequired: false,
  },
  {
    id: "7",
    type: "approval",
    title: "Movement Approved",
    message: "Your movement request KE-MV-2026-001234 has been approved by DVS Kenya.",
    timestamp: "2026-06-04T15:45:00",
    read: true,
    actionRequired: false,
  },
  {
    id: "8",
    type: "info",
    title: "Transaction Completed",
    message: "Payment received for transaction TXN-1 (KES 80,000). Animal ownership has been transferred.",
    timestamp: "2026-06-04T11:20:00",
    read: true,
    actionRequired: false,
  },
];

export function Notifications() {
  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const actionRequiredCount = mockNotifications.filter(n => n.actionRequired && !n.read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "approval":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "offer":
        return <TrendingUp className="w-5 h-5 text-amber-600" />;
      case "transfer":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "info":
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return "bg-red-100 dark:bg-red-900/20";
      case "approval":
        return "bg-blue-100 dark:bg-blue-900/20";
      case "offer":
        return "bg-amber-100 dark:bg-amber-900/20";
      case "transfer":
        return "bg-purple-100 dark:bg-purple-900/20";
      case "info":
        return "bg-gray-100 dark:bg-gray-800";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            {actionRequiredCount > 0 && ` · ${actionRequiredCount} require action`}
          </p>
        </div>
        <Button variant="outline">
          Mark All as Read
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground mb-1">Unread</div>
                <div className="text-3xl font-semibold">{unreadCount}</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground mb-1">Action Required</div>
                <div className="text-3xl font-semibold">{actionRequiredCount}</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground mb-1">Disease Alerts</div>
                <div className="text-3xl font-semibold">1</div>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground mb-1">Pending Approvals</div>
                <div className="text-3xl font-semibold">2</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">All Notifications</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="ghost" size="sm">Unread</Button>
              <Button variant="ghost" size="sm">Action Required</Button>
            </div>
          </div>

          {mockNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-muted-foreground">{notification.message}</p>
                        <div className="text-muted-foreground mt-2">
                          {formatDateTime(notification.timestamp)}
                        </div>
                      </div>
                      {notification.actionRequired && !notification.read && (
                        <Badge variant="warning">Action Required</Badge>
                      )}
                    </div>
                    {notification.actionRequired && !notification.read && (
                      <div className="flex gap-2 mt-3">
                        {notification.type === "alert" && (
                          <Button size="sm">View Details</Button>
                        )}
                        {notification.type === "approval" && (
                          <>
                            <Button size="sm">Approve</Button>
                            <Button size="sm" variant="outline">Reject</Button>
                          </>
                        )}
                        {notification.type === "offer" && (
                          <>
                            <Button size="sm">Accept Offer</Button>
                            <Button size="sm" variant="outline">Counter Offer</Button>
                          </>
                        )}
                        {notification.type === "transfer" && (
                          <>
                            <Button size="sm">Review Request</Button>
                            <Button size="sm" variant="outline">Decline</Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Notification Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span>Disease Alerts</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Movement Approvals</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Marketplace Offers</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Transfer Requests</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span>System Updates</span>
                  <input type="checkbox" className="rounded" />
                </label>
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                Update Preferences
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="w-4 h-4" />
                  View All Approvals
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Heart className="w-4 h-4" />
                  Health Alerts Dashboard
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <TrendingUp className="w-4 h-4" />
                  Marketplace Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
