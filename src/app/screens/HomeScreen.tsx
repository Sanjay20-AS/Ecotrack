import { Link } from "react-router";
import { Trash2, Apple, Recycle, TrendingDown, Calendar, Lightbulb, Trophy, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

export function HomeScreen() {
  const stats = [
    { label: "E-waste", value: "12.5", unit: "kg", icon: Trash2, color: "text-primary" },
    { label: "Food Waste", value: "8.3", unit: "kg", icon: Apple, color: "text-secondary" },
    { label: "CO₂ Saved", value: "45", unit: "kg", icon: TrendingDown, color: "text-accent" },
  ];

  const quickActions = [
    { label: "Log E-waste", icon: Trash2, path: "/app/track?type=ewaste", bg: "bg-primary" },
    { label: "Log Food", icon: Apple, path: "/app/track?type=food", bg: "bg-secondary" },
    { label: "Schedule", icon: Calendar, path: "/app/locations", bg: "bg-accent" },
  ];

  const events = [
    { title: "E-waste Collection Drive", date: "Dec 20, 2025", location: "Community Center" },
    { title: "Composting Workshop", date: "Dec 25, 2025", location: "Green Park" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90">Welcome back,</p>
            <h1 className="text-2xl font-bold">Sarah Johnson</h1>
          </div>
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        {/* Community Progress */}
        <Card className="bg-card/95 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">Community Goal</span>
            <span className="text-sm font-medium text-foreground">68%</span>
          </div>
          <Progress value={68} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            680kg of 1000kg monthly waste reduction goal
          </p>
        </Card>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Quick Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">This Week's Impact</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-4 text-center">
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.unit}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.path}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 ${action.bg} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    <action.icon className="h-7 w-7" />
                  </div>
                  <span className="text-xs text-center">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Eco Tip */}
        <Card className="bg-accent/10 border-accent/20 p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Daily Eco-Tip</h3>
              <p className="text-sm text-muted-foreground">
                Repair broken electronics instead of discarding them. Many issues can be fixed,
                extending the life of your devices and reducing e-waste.
              </p>
            </div>
          </div>
        </Card>

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <Link to="/app/community" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {events.map((event, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-6">
          <div className="flex items-center gap-4">
            <Recycle className="h-12 w-12" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">Start Recycling Today</h3>
              <p className="text-sm opacity-90">
                Find recycling centers near you
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link to="/app/locations">Find</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
