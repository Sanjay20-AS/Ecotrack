import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router";
import { Trash2, Apple, Recycle, TrendingDown, Calendar, Lightbulb, Trophy, ChevronRight, Clock, Truck, CheckCircle2, ShoppingBag, BookOpen, Star, Leaf } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { wasteAPI, userAPI, eventsAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

const CO2_RATES: Record<string, number> = {
  FOOD: 2.5,
  "E-WASTE": 1.8,
  PLASTIC: 1.2,
  PAPER: 1.0,
  ORGANIC: 2.0,
};

const ECO_TIPS = [
  {
    title: "Repair Instead of Replace",
    description: "Repair broken electronics instead of discarding them. Many issues can be fixed, extending the life of your devices and reducing e-waste.",
  },
  {
    title: "Compost Food Waste",
    description: "Start composting food scraps at home. Composting reduces methane emissions from landfills and creates nutrient-rich soil for your garden.",
  },
  {
    title: "Use Reusable Shopping Bags",
    description: "Switch to cloth or reusable bags for shopping. One reusable bag can replace hundreds of plastic bags over its lifetime.",
  },
  {
    title: "Reduce Single-Use Plastics",
    description: "Avoid single-use plastics like straws, cups, and utensils. Switching to reusable alternatives can save tons of plastic from oceans.",
  },
  {
    title: "Buy Second-Hand Items",
    description: "Purchase used electronics, furniture, and clothing. Buying second-hand extends product lifecycles and reduces manufacturing waste.",
  },
  {
    title: "Conserve Water",
    description: "Fix leaking taps and take shorter showers. Conserving water protects this precious resource and reduces your carbon footprint.",
  },
  {
    title: "Choose Sustainable Fashion",
    description: "Buy from sustainable brands and swap clothes with friends. The fashion industry generates massive waste—choose quality over quantity.",
  },
  {
    title: "Plant a Tree",
    description: "Trees absorb CO₂ and provide oxygen. Even planting one tree in your community can make a significant environmental impact.",
  },
  {
    title: "Use Public Transport",
    description: "Take buses, trains, or carpool instead of driving alone. Public transport reduces per-person carbon emissions significantly.",
  },
  {
    title: "Recycle Properly",
    description: "Learn your local recycling guidelines. Proper recycling ensures materials are processed correctly and not contaminated.",
  },
  {
    title: "Donate Unused Items",
    description: "Donate clothes, books, and electronics you no longer use. Donation gives items a second life and reduces landfill waste.",
  },
  {
    title: "Use LED Bulbs",
    description: "Switch to LED lighting. LEDs use 75% less energy than traditional bulbs and last much longer.",
  },
  {
    title: "Reduce Food Waste",
    description: "Plan meals and store food properly to minimize waste. Food waste in landfills produces harmful methane gas.",
  },
  {
    title: "Support Local Farmers",
    description: "Buy from local farmers' markets. Local produce requires less transportation, reducing carbon emissions and supporting your community.",
  },
  {
    title: "Unplug Electronics",
    description: "Unplug devices when not in use to reduce phantom power consumption. Even idle devices draw energy and increase your carbon footprint.",
  },
  {
    title: "Use Natural Cleaning Products",
    description: "Choose eco-friendly cleaning products. They're safer for your family and don't pollute waterways like chemical cleaners.",
  },
  {
    title: "Reduce Meat Consumption",
    description: "Eating less meat, especially beef, significantly reduces your carbon footprint. Try Meatless Mondays!",
  },
  {
    title: "Collect Rainwater",
    description: "Install a rainwater collection system for gardening. This conserves tap water and reduces utility bills.",
  },
  {
    title: "Use Digital Billing",
    description: "Switch to paperless billing and digital statements. Going digital saves trees and reduces paper waste.",
  },
  {
    title: "Buy in Bulk",
    description: "Purchase items in bulk to reduce packaging waste. Bulk buying minimizes single-use containers and saves money.",
  },
];

export function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("DONOR");
  const [wasteStats, setWasteStats] = useState({
    eWaste: 0,
    foodWaste: 0,
    plasticWaste: 0,
    co2Saved: 0,
  });
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const userId = parseInt(localStorage.getItem("userId") || "0");

  const loadData = useCallback(async () => {
    try {
      const userData = localStorage.getItem("user");
      const role = localStorage.getItem("userRole") || "DONOR";
      setUserRole(role);
      if (userData) setUser(JSON.parse(userData));

      // Fetch events - try to get location-based events, fallback to all upcoming
      try {
        // Try to get user's location from localStorage or profile
        let location = localStorage.getItem("userLocation") || "Coimbatore";
        
        const eventsData = await eventsAPI.getUpcomingEventsByLocation(location);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error("Failed to load location-based events:", err);
        // Fallback to general upcoming events
        try {
          const eventsData = await eventsAPI.getUpcomingEvents();
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        } catch {
          setEvents([]);
        }
      }

      if (userId) {
        const waste = await wasteAPI.getWasteByUserId(userId);

        let eWaste = 0, foodWaste = 0, plasticWaste = 0, co2 = 0;
        waste.forEach((item: any) => {
          if (item.type === "E-WASTE") eWaste += item.quantity;
          else if (item.type === "FOOD") foodWaste += item.quantity;
          else if (item.type === "PLASTIC") plasticWaste += item.quantity;

          if (item.status === "COLLECTED") {
            co2 += item.quantity * (CO2_RATES[item.type] || 1.0);
          }
        });

        setWasteStats({
          eWaste: parseFloat(eWaste.toFixed(1)),
          foodWaste: parseFloat(foodWaste.toFixed(1)),
          plasticWaste: parseFloat(plasticWaste.toFixed(1)),
          co2Saved: parseFloat(co2.toFixed(1)),
        });

        // Recent 3 non-collected entries for live status
        const active = waste
          .filter((w: any) => w.status !== "COLLECTED")
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        setRecentDonations(active);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            <Clock className="h-2.5 w-2.5" /> Pending
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            <Truck className="h-2.5 w-2.5" /> Assigned
          </span>
        );
      case "COLLECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            <CheckCircle2 className="h-2.5 w-2.5" /> Collected
          </span>
        );
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  const getDonorStats = () => [
    { label: "E-waste", value: wasteStats.eWaste.toString(), unit: "kg", icon: Trash2, color: "text-primary" },
    { label: "Food Waste", value: wasteStats.foodWaste.toString(), unit: "kg", icon: Apple, color: "text-secondary" },
    { label: "CO₂ Saved", value: wasteStats.co2Saved.toString(), unit: "kg", icon: TrendingDown, color: "text-accent" },
  ];

  const getCollectorStats = () => [
    { label: "Collections", value: "12", unit: "today", icon: Trash2, color: "text-primary" },
    { label: "Total Waste", value: "156", unit: "kg", icon: Recycle, color: "text-secondary" },
    { label: "Routes Done", value: "3", unit: "of 5", icon: TrendingDown, color: "text-accent" },
  ];

  const getDonorActions = () => [
    { label: "Log E-waste", icon: Trash2, path: "/app/track?type=ewaste", bg: "bg-primary" },
    { label: "Log Food", icon: Apple, path: "/app/track?type=food", bg: "bg-secondary" },
    { label: "Schedule", icon: Calendar, path: "/app/locations", bg: "bg-accent" },
    { label: "Carbon", icon: Leaf, path: "/app/carbon", bg: "bg-green-600" },
  ];

  const getCollectorActions = () => [
    { label: "Start Route", icon: Trash2, path: "/app/track", bg: "bg-primary" },
    { label: "View Pickups", icon: Calendar, path: "/app/community", bg: "bg-secondary" },
    { label: "Update Status", icon: Recycle, path: "/app/track", bg: "bg-accent" },
  ];

  const stats = userRole === "COLLECTOR" ? getCollectorStats() : getDonorStats();
  const quickActions = userRole === "COLLECTOR" ? getCollectorActions() : getDonorActions();

  // Redirect collectors to their dedicated dashboard (only if approved)
  if (userRole === "COLLECTOR") {
    const accountStatus = localStorage.getItem("accountStatus") || "ACTIVE";
    if (accountStatus === "PENDING_APPROVAL" || accountStatus === "REJECTED") {
      // Show pending/rejected message and redirect to login
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/";
      }, 2000);
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-md mx-auto w-full">
            <Truck className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">
              {accountStatus === "PENDING_APPROVAL" ? "Under Review" : "Application Rejected"}
            </h1>
            <p className="text-muted-foreground">
              {accountStatus === "PENDING_APPROVAL"
                ? "Your collector account is being reviewed by our team. You'll be notified via email once approved (typically 24-48 hours)."
                : "Your collector application was rejected. Please contact support at support@ecotrack.app for details."}
            </p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      );
    }
    return <Navigate to="/app/collector-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Home" subtitle="Your impact at a glance" />

      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-card/90 rounded-2xl border border-border/60 flex items-center justify-center shadow-sm backdrop-blur-sm">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!</h2>
            <div className="text-sm text-muted-foreground">EcoTrack</div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
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

        {/* Rewards Summary */}
        {(() => {
          const totalKg = wasteStats.eWaste + wasteStats.foodWaste + wasteStats.plasticWaste;
          const points = Math.floor(totalKg * 10 + (recentDonations.length > 0 ? recentDonations.length * 5 : 0));
          const nextThreshold = points < 150 ? 150 : points < 300 ? 300 : points < 500 ? 500 : points < 750 ? 750 : 1000;
          const pct = Math.min((points / nextThreshold) * 100, 100);
          return (
            <Link to="/app/rewards">
              <Card className="p-4 hover:shadow-md transition-shadow border-2 hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">Rewards Points</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-600">{points}</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{nextThreshold - points} pts to next reward</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </Link>
          );
        })()}

        {/* Live Donation Status */}
        {recentDonations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Active Donations
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </h2>
              <Link to="/app/my-donations" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentDonations.map((d: any) => (
                <Link key={d.id} to="/app/my-donations">
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Recycle className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.description || d.type}</p>
                          <p className="text-xs text-muted-foreground">{d.type} · {d.quantity} kg</p>
                        </div>
                      </div>
                      {getStatusBadge(d.status)}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

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
        {(() => {
          const today = new Date();
          const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
          const tip = ECO_TIPS[dayOfYear % ECO_TIPS.length];
          return (
            <Card className="bg-accent/10 border-accent/20 p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily Eco-Tip</h3>
                  <p className="text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Upcoming Events */}
        {events && events.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <Link to="/app/community" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {events.slice(0, 2).map((event, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{event.title || event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.date || new Date(event.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Explore — Marketplace & Education */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Explore</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/app/marketplace">
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/30">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Marketplace</h3>
                <p className="text-xs text-muted-foreground mt-1">Buy & sell recycled goods</p>
              </Card>
            </Link>
            <Link to="/app/education">
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-secondary/30">
                <div className="w-10 h-10 bg-secondary/10 rounded-2xl flex items-center justify-center mb-3">
                  <BookOpen className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-semibold text-sm">Education</h3>
                <p className="text-xs text-muted-foreground mt-1">Tips & eco guides</p>
              </Card>
            </Link>
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
