import { Link } from "react-router";
import { User, Award, TrendingUp, Settings, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";

export function ProfileScreen() {
  const stats = [
    { label: "Total Waste", value: "48.5kg", icon: TrendingUp },
    { label: "Points", value: "1,250", icon: Award },
    { label: "Rank", value: "#2", icon: User },
  ];

  const badges = [
    { name: "Eco Warrior", icon: "🌟" },
    { name: "Zero Waste", icon: "♻️" },
    { name: "Green Leader", icon: "🏆" },
  ];

  const menuItems = [
    { icon: User, label: "Edit Profile", path: "/app/profile/edit" },
    { icon: Bell, label: "Notifications", path: "/app/profile/notifications" },
    { icon: TrendingUp, label: "Analytics", path: "/app/analytics" },
    { icon: Settings, label: "Settings", path: "/app/profile/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/app/help" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="bg-primary-foreground text-primary text-2xl">
              SJ
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Sarah Johnson</h1>
            <p className="text-sm opacity-90">sarah.j@email.com</p>
            <Badge className="mt-2">Level 5 Eco Champion</Badge>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Impact</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-4 text-center">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Achievement Badges</h2>
            <Link to="/app/profile/achievements" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge, idx) => (
              <Card key={idx} className="p-4 text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-xs font-medium">{badge.name}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <Card className="divide-y">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </Card>
        </div>

        {/* Logout */}
        <button
          className="flex items-center justify-center gap-2 w-full p-4 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          onClick={() => window.location.href = '/'}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}
