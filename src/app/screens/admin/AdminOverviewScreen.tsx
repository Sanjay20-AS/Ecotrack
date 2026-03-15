import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users, Package, TrendingUp, CheckCircle2, Clock, Leaf,
  UserCheck, BarChart3, AlertTriangle, Truck, ArrowRight
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { userAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface PlatformStats {
  totalUsers: number;
  totalDonors: number;
  totalCollectors: number;
  pendingCollectors: number;
  activeCollectors: number;
  totalWaste: number;
  pendingWaste: number;
  inProgressWaste: number;
  collectedWaste: number;
  totalQuantityKg: number;
  totalCommunities: number;
}

export function AdminOverviewScreen() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const adminId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await userAPI.getAdminStats(adminId);
      setStats(data);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform statistics and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={Leaf} label="Donors" value={stats.totalDonors} color="bg-green-500" />
        <StatCard icon={UserCheck} label="Active Collectors" value={stats.activeCollectors} color="bg-emerald-500" />
        <StatCard icon={Clock} label="Pending Approval" value={stats.pendingCollectors} color="bg-amber-500" />
        <StatCard icon={Package} label="Total Waste" value={stats.totalWaste} color="bg-purple-500" />
        <StatCard icon={CheckCircle2} label="Collected" value={stats.collectedWaste} color="bg-teal-500" />
        <StatCard icon={TrendingUp} label="In Progress" value={stats.inProgressWaste} color="bg-orange-500" />
        <StatCard icon={BarChart3} label="Total Qty (kg)" value={Math.round(stats.totalQuantityKg)} color="bg-indigo-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {stats.pendingCollectors > 0 && (
              <Link to="/admin/collectors">
                <Button variant="outline" className="w-full justify-between border-amber-200 text-amber-700 hover:bg-amber-50">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {stats.pendingCollectors} collector(s) awaiting approval
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-between mt-2">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage {stats.totalUsers} users
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/waste">
              <Button variant="outline" className="w-full justify-between mt-2">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  View {stats.totalWaste} waste records
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Waste Status Breakdown */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Waste Status Breakdown</h3>
          <div className="space-y-4">
            <ProgressBar label="Pending" value={stats.pendingWaste} total={stats.totalWaste} color="bg-amber-500" />
            <ProgressBar label="In Progress" value={stats.inProgressWaste} total={stats.totalWaste} color="bg-blue-500" />
            <ProgressBar label="Collected" value={stats.collectedWaste} total={stats.totalWaste} color="bg-green-500" />
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            {stats.totalCommunities} communities active
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} text-white p-2.5 rounded-lg`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
