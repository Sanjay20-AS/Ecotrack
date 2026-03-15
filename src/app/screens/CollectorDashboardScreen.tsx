import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router";
import {
  Truck, Package, MapPin, CheckCircle2, Clock, TrendingUp,
  ChevronRight, AlertTriangle, Recycle, ArrowRight, Leaf, History, Gauge
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { wasteAPI, wastePriorityAPI, userAPI } from "../services/apiService";
import toast from "react-hot-toast";

interface WasteEntry {
  id: number;
  type: string;
  quantity: number;
  description: string;
  status: string;
  locationAddress?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  createdAt: string;
  user?: { id: number; name: string };
}

interface DashboardStats {
  todayKg: number;
  todayPickups: number;
  weeklyKg: number;
  monthlyKg: number;
  totalKg: number;
  totalPickups: number;
  pendingCount: number;
  inProgressCount: number;
  urgentCount: number;
  co2Saved: number;
}

export function CollectorDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingWaste, setPendingWaste] = useState<WasteEntry[]>([]);
  const [inProgressWaste, setInProgressWaste] = useState<WasteEntry[]>([]);
  const [priorityScores, setPriorityScores] = useState<Record<number, { priorityScore: number; priorityLevel: string }>>({});
  const [loading, setLoading] = useState(true);

  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [accountStatus, setAccountStatus] = useState(localStorage.getItem("accountStatus") || "ACTIVE");
  const isActive = accountStatus === "ACTIVE";
  const DAILY_GOAL_KG = 20;

  useEffect(() => {
    loadDashboardData();
    // Fetch fresh account status from server (optional, silently fail if error)
    if (userId > 0) {
      userAPI.getUserById(userId)
        .then((u: any) => {
          if (u && u.accountStatus) {
            setAccountStatus(u.accountStatus);
            localStorage.setItem("accountStatus", u.accountStatus);
          }
        })
        .catch((err) => {
          // Silently ignore errors from status refresh
          console.log("Status refresh failed (non-critical):", err);
        });
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));

      const [dashStats, pending, inProgress] = await Promise.all([
        wasteAPI.getCollectorDashboardStats(userId).catch(() => null),
        wasteAPI.getWasteByStatus("PENDING").catch(() => []),
        wasteAPI.getWasteByStatus("IN_PROGRESS").catch(() => []),
      ]);

      if (dashStats) setStats(dashStats);
      setPendingWaste(pending);
      setInProgressWaste(inProgress);

      // Compute priority scores for pending items
      const scores: Record<number, { priorityScore: number; priorityLevel: string }> = {};
      await Promise.all(
        (pending as WasteEntry[]).slice(0, 10).map(async (w) => {
          const daysOld = Math.floor((Date.now() - new Date(w.createdAt).getTime()) / 86400000);
          try {
            const prio = await wastePriorityAPI.calculatePriority(w.type, w.quantity, daysOld, 0);
            if (prio) scores[w.id] = prio;
          } catch { /* ignore */ }
        })
      );
      setPriorityScores(scores);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const goalPercent = stats
    ? Math.min(Math.round((stats.todayKg / DAILY_GOAL_KG) * 100), 100)
    : 0;

  // Urgency: items pending > 3 days
  const urgentItems = pendingWaste.filter((w) => {
    const daysOld = (Date.now() - new Date(w.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 3;
  });

  const overviewStats = [
    {
      label: "Today",
      value: `${stats?.todayKg?.toFixed(1) || "0"} kg`,
      sub: `${stats?.todayPickups || 0} pickups`,
      icon: Clock,
      color: "text-primary",
    },
    {
      label: "This Week",
      value: `${stats?.weeklyKg?.toFixed(1) || "0"} kg`,
      sub: "collected",
      icon: TrendingUp,
      color: "text-secondary",
    },
    {
      label: "This Month",
      value: `${stats?.monthlyKg?.toFixed(1) || "0"} kg`,
      sub: "collected",
      icon: CheckCircle2,
      color: "text-accent",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Truck className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Safety check: Redirect if not approved
  if (!isActive) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm opacity-90">Good {getGreeting()},</p>
            <h1 className="text-2xl font-bold">{user?.name || "Collector"}</h1>
            <p className="text-xs opacity-80 mt-0.5">🚛 Waste Collection Dashboard</p>
          </div>
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
        </div>

        {/* Daily Goal Card */}
        <Card className="bg-card/95 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground font-medium">Daily Collection Goal</span>
            <span className="text-sm font-bold text-foreground">{goalPercent}%</span>
          </div>
          <Progress value={goalPercent} className="h-2.5 mb-2" />
          <p className="text-xs text-muted-foreground">
            {stats?.todayKg?.toFixed(1) || "0"} of {DAILY_GOAL_KG} kg collected today
          </p>
        </Card>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Account Status Warning */}
        {!isActive && (
          <Card className="bg-amber-50 border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">
                  {accountStatus === "PENDING_APPROVAL" ? "Account Pending Approval" : "Account Rejected"}
                </h3>
                <p className="text-sm text-amber-600 mt-0.5">
                  {accountStatus === "PENDING_APPROVAL"
                    ? "Your account is being reviewed. You cannot claim pickups yet."
                    : "Your account has been rejected. Contact support for assistance."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Urgent Alert */}
        {urgentItems.length > 0 && (
          <Card className="bg-red-50 border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  {urgentItems.length} Urgent Pickup{urgentItems.length > 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-red-600 mt-0.5">
                  {urgentItems.length} waste item{urgentItems.length > 1 ? "s" : ""} pending
                  for more than 3 days
                </p>
                <Link to="/app/pickups?filter=urgent">
                  <Button size="sm" variant="outline" className="mt-2 border-red-300 text-red-700 hover:bg-red-100">
                    View Urgent <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-3 gap-3">
            {overviewStats.map((stat, idx) => (
              <Card key={idx} className="p-4 text-center">
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link to={isActive ? "/app/pickups" : "#"} onClick={(e) => { if (!isActive) { e.preventDefault(); toast.error("Account not active. Actions disabled."); } }}>
              <div className={`flex flex-col items-center gap-2 ${!isActive ? "opacity-50" : ""}`}>
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Package className="h-7 w-7" />
                </div>
                <span className="text-xs text-center">View Pickups</span>
              </div>
            </Link>
            <Link to={isActive ? "/app/routes" : "#"} onClick={(e) => { if (!isActive) { e.preventDefault(); toast.error("Account not active. Actions disabled."); } }}>
              <div className={`flex flex-col items-center gap-2 ${!isActive ? "opacity-50" : ""}`}>
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <MapPin className="h-7 w-7" />
                </div>
                <span className="text-xs text-center">Routes</span>
              </div>
            </Link>
            <Link to="/app/analytics">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-accent-foreground shadow-lg">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <span className="text-xs text-center">Analytics</span>
              </div>
            </Link>
            <Link to="/app/collector-history">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-primary/80 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <History className="h-7 w-7" />
                </div>
                <span className="text-xs text-center">History</span>
              </div>
            </Link>
          </div>
        </div>

        {/* CO2 Impact */}
        {stats && stats.co2Saved > 0 && (
          <Card className="bg-green-50 border-green-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">CO₂ Impact</h3>
                <p className="text-lg font-bold text-green-700">{stats.co2Saved.toFixed(1)} kg CO₂ saved</p>
                <p className="text-xs text-green-600">By collecting and recycling waste</p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Pending Pickups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">New Pickups</h2>
            <Link to="/app/pickups" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {pendingWaste.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">All clear!</p>
              <p className="text-sm">No pending pickups right now.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingWaste.slice(0, 3).map((entry) => (
                <Link key={entry.id} to={`/app/pickups?id=${entry.id}`}>
                  <Card className={`p-4 hover:shadow-md transition-shadow ${
                    priorityScores[entry.id]?.priorityLevel === "HIGH"
                      ? "border-orange-200 bg-orange-50/30"
                      : priorityScores[entry.id]?.priorityLevel === "MEDIUM"
                      ? "border-amber-200 bg-amber-50/20"
                      : ""
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {entry.type}
                          </Badge>
                          <span className="text-sm font-bold">{entry.quantity} kg</span>
                          <span className="text-xs text-warning font-medium">PENDING</span>
                          {priorityScores[entry.id] && (
                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              priorityScores[entry.id].priorityLevel === "HIGH"
                                ? "bg-orange-100 text-orange-800"
                                : priorityScores[entry.id].priorityLevel === "MEDIUM"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              <Gauge className="h-2.5 w-2.5" /> {priorityScores[entry.id].priorityLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{entry.description}</p>
                        {entry.locationAddress && (
                          <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {entry.locationAddress}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getRelativeTime(entry.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* In-Progress */}
        {inProgressWaste.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">In Progress</h2>
              <Badge variant="secondary">{inProgressWaste.length}</Badge>
            </div>
            <div className="space-y-3">
              {inProgressWaste.slice(0, 2).map((entry) => (
                <Link key={entry.id} to={`/app/pickups?id=${entry.id}`}>
                  <Card className="p-4 border-accent bg-accent/10 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {entry.type}
                          </Badge>
                          <span className="text-sm font-bold">{entry.quantity} kg</span>
                          <span className="text-xs text-secondary font-medium">IN PROGRESS</span>
                        </div>
                        <p className="text-sm font-medium truncate">{entry.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Eco Tip */}
        <Card className="bg-accent/10 border-accent/20 p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Recycle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Collection Tip</h3>
              <p className="text-sm text-muted-foreground">
                Always sort collected waste by category at drop-off. Proper sorting
                increases recycling efficiency and reduces contamination.
              </p>
            </div>
          </div>
        </Card>

        {/* Performance Summary */}
        <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-6">
          <div className="flex items-center gap-4">
            <Recycle className="h-12 w-12 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">Total Impact</h3>
              <p className="text-2xl font-bold">{stats?.totalKg?.toFixed(1) || "0"} kg</p>
              <p className="text-sm opacity-90">{stats?.totalPickups || 0} pickups completed</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getRelativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
