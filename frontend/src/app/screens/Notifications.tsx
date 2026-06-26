import { useCallback, useEffect, useState } from "react";
import { Bell, AlertTriangle, CheckCircle, Info, TrendingUp, Heart, Users, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { formatDateTime } from "../lib/utils";
import {
  mapApiNotificationToUi,
  type NotificationFilter,
  type UiNotification,
} from "../lib/api/notifications";
import { notificationsApi } from "../services/api/notifications";
import { getApiErrorMessage } from "../services/api/errors";

const PAGE_SIZE = 10;

export function Notifications() {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionRequiredCount, setActionRequiredCount] = useState(0);
  const [diseaseAlertsCount, setDiseaseAlertsCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await notificationsApi.getUnreadCount();
      setUnreadCount(stats.count);
      setActionRequiredCount(stats.action_required_count);
      setDiseaseAlertsCount(stats.disease_alerts_count);
      setPendingApprovalsCount(stats.pending_approvals_count);
    } catch {
      // Stats failure should not block the list from rendering.
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationsApi.listNotifications({
        page,
        pageSize: PAGE_SIZE,
        filter,
      });

      setNotifications(response.results.map(mapApiNotificationToUi));
      setTotalCount(response.count);
      setHasNext(Boolean(response.next));
      setHasPrev(Boolean(response.previous));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load notifications. Please try again."));
      setNotifications([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      await fetchNotifications();
      if (!isCurrent) return;
      await refreshStats();
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [fetchNotifications, refreshStats]);

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    setActionError(null);

    try {
      await notificationsApi.markAllAsRead();
      await Promise.all([fetchNotifications(), refreshStats()]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to mark all notifications as read."));
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setBusyNotificationId(notificationId);
    setActionError(null);

    try {
      await notificationsApi.markAsRead(notificationId);
      await Promise.all([fetchNotifications(), refreshStats()]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to mark notification as read."));
    } finally {
      setBusyNotificationId(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setBusyNotificationId(notificationId);
    setActionError(null);

    try {
      await notificationsApi.deleteNotification(notificationId);
      await Promise.all([fetchNotifications(), refreshStats()]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to delete notification."));
    } finally {
      setBusyNotificationId(null);
    }
  };

  const getIcon = (type: UiNotification["type"]) => {
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

  const getBgColor = (type: UiNotification["type"]) => {
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
        <Button
          variant="outline"
          disabled={markingAllRead || unreadCount === 0}
          onClick={handleMarkAllAsRead}
        >
          {markingAllRead && <Loader2 className="w-4 h-4 animate-spin" />}
          Mark All as Read
        </Button>
      </div>

      {(error || actionError) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || actionError}
        </div>
      )}

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
                <div className="text-3xl font-semibold">{diseaseAlertsCount}</div>
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
                <div className="text-3xl font-semibold">{pendingApprovalsCount}</div>
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
              <Button
                variant={filter === "all" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Unread
              </Button>
              <Button
                variant={filter === "action_required" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setFilter("action_required")}
              >
                Action Required
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading notifications" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No notifications found.
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}
              >
                <CardContent className="p-4">
                  <div
                    className={`flex items-start gap-4 ${!notification.read ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (!notification.read && busyNotificationId !== notification.id) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
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
                            <Button
                              size="sm"
                              disabled={busyNotificationId === notification.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              View Details
                            </Button>
                          )}
                          {notification.type === "approval" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyNotificationId === notification.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyNotificationId === notification.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {notification.type === "offer" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyNotificationId === notification.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Accept Offer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyNotificationId === notification.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Counter Offer
                              </Button>
                            </>
                          )}
                          {notification.type === "transfer" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyNotificationId === notification.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Review Request
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyNotificationId === notification.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {!loading && totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                Page {page} · {totalCount} notification{totalCount !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || !hasPrev}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || !hasNext}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
