import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Check, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Waste Pickup Scheduled",
      description: "Your plastic waste pickup is scheduled for tomorrow at 10:00 AM",
      type: "pickup",
      time: "2 hours ago",
      read: false,
      icon: "🚚",
    },
    {
      id: 2,
      title: "Achievement Unlocked!",
      description: "You've reached 50kg of waste recycled. Eco Warrior badge earned!",
      type: "achievement",
      time: "1 day ago",
      read: false,
      icon: "🏆",
    },
    {
      id: 3,
      title: "New Community Event",
      description: "Beach cleanup event in your area. Join us this weekend!",
      type: "community",
      time: "3 days ago",
      read: true,
      icon: "🌍",
    },
    {
      id: 4,
      title: "Facility Update",
      description: "The e-waste facility near you now accepts more device types",
      type: "facility",
      time: "1 week ago",
      read: true,
      icon: "🏭",
    },
  ]);

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/app/profile" className="hover:opacity-80">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm opacity-90">
              {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            size="sm"
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="px-6 py-6 space-y-3">
        {notifications.length === 0 ? (
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
                        {notification.time}
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
