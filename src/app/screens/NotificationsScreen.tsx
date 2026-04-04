import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import TopBar from "../components/TopBar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { notificationAPI } from "../services/apiService";
import toast from "react-hot-toast";

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  type: string;
  icon: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

export function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = Number(localStorage.getItem("userId"));

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const data = await notificationAPI.getUserNotifications(userId);
      setNotifications(data);
    } catch {
      // errors handled by apiService
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar
        variant="banner"
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        showBack
        onBack={() => navigate("/app/profile")}
        bannerAccessory={
          unreadCount > 0 ? (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="w-full mt-1"
            >
              Mark all as read
            </Button>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-colors ${
                !notification.read ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className="text-3xl flex-shrink-0">{notification.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm leading-tight">
                        {notification.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge className="flex-shrink-0 bg-primary">New</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 justify-end">
                {!notification.read && (
                  <Button
                    onClick={() => handleMarkAsRead(notification.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Read
                  </Button>
                )}
                <Button
                  onClick={() => handleDelete(notification.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
