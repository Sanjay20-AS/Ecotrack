import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users, Package, TrendingUp, Shield, CheckCircle2, XCircle,
  Clock, Trash2, Search, ChevronDown, ChevronUp, UserCheck, UserX,
  BarChart3, Leaf, AlertTriangle
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { userAPI, wasteAPI } from "../services/apiService";
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

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

interface WasteItem {
  id: number;
  type: string;
  quantity: number;
  description: string;
  status: string;
  createdAt: string;
  locationAddress?: string;
  user?: { id: number; name: string };
  collectedBy?: { id: number; name: string };
}

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [pendingCollectors, setPendingCollectors] = useState<UserItem[]>([]);
  const [allWaste, setAllWaste] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [wasteSearch, setWasteSearch] = useState("");
  const [wasteFilter, setWasteFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const adminId = parseInt(localStorage.getItem("userId") || "0");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (userRole !== "ADMIN") {
      toast.error("Admin access required");
      navigate("/app", { replace: true });
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, pendingData, wasteData] = await Promise.all([
        userAPI.getAdminStats(adminId),
        userAPI.getAllUsers(),
        userAPI.getPendingCollectors(adminId),
        wasteAPI.getAllWaste(),
      ]);
      setStats(statsData);
      setAllUsers(usersData);
      setPendingCollectors(pendingData);
      setAllWaste(wasteData.sort((a: WasteItem, b: WasteItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatus = async (userId: number, status: string) => {
    try {
      await userAPI.updateAccountStatus(userId, status, adminId);
      toast.success(`Account ${status === "ACTIVE" ? "approved" : "rejected"}`);
      loadData();
    } catch {
      toast.error("Failed to update account status");
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (userId === adminId) {
      toast.error("Cannot delete your own account");
      return;
    }
    try {
      await userAPI.deleteUser(userId);
      toast.success(`User "${name}" deleted`);
      loadData();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteWaste = async (wasteId: number) => {
    try {
      await wasteAPI.deleteWaste(wasteId);
      toast.success("Waste record deleted");
      loadData();
    } catch {
      toast.error("Failed to delete waste record");
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole =
      userFilter === "ALL" || u.role === userFilter;
    return matchesSearch && matchesRole;
  });

  const filteredWaste = allWaste.filter((w) => {
    const matchesSearch =
      w.type?.toLowerCase().includes(wasteSearch.toLowerCase()) ||
      w.description?.toLowerCase().includes(wasteSearch.toLowerCase()) ||
      w.locationAddress?.toLowerCase().includes(wasteSearch.toLowerCase());
    const matchesStatus =
      wasteFilter === "ALL" || w.status === wasteFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-6 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-sm opacity-80">Manage users, collectors & waste records</p>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-12 bg-card shadow-md">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="collectors" className="text-xs">Collectors</TabsTrigger>
            <TabsTrigger value="waste" className="text-xs">Waste</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && stats && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
              <StatCard icon={Leaf} label="Total Donors" value={stats.totalDonors} color="bg-green-500" />
              <StatCard icon={UserCheck} label="Active Collectors" value={stats.activeCollectors} color="bg-emerald-500" />
              <StatCard icon={Clock} label="Pending Approval" value={stats.pendingCollectors} color="bg-amber-500" />
              <StatCard icon={Package} label="Total Waste" value={stats.totalWaste} color="bg-purple-500" />
              <StatCard icon={CheckCircle2} label="Collected" value={stats.collectedWaste} color="bg-teal-500" />
              <StatCard icon={TrendingUp} label="In Progress" value={stats.inProgressWaste} color="bg-orange-500" />
              <StatCard icon={BarChart3} label="Total Qty (kg)" value={Math.round(stats.totalQuantityKg)} color="bg-indigo-500" />
            </div>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {stats.pendingCollectors > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 border-amber-200 text-amber-700"
                    onClick={() => setActiveTab("collectors")}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {stats.pendingCollectors} collector(s) awaiting approval
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("users")}
                >
                  <Users className="h-4 w-4" />
                  Manage {stats.totalUsers} users
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("waste")}
                >
                  <Package className="h-4 w-4" />
                  View {stats.totalWaste} waste records
                </Button>
              </div>
            </Card>

            {/* Waste Status Breakdown */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Waste Status Breakdown</h3>
              <div className="space-y-3">
                <ProgressBar label="Pending" value={stats.pendingWaste} total={stats.totalWaste} color="bg-amber-500" />
                <ProgressBar label="In Progress" value={stats.inProgressWaste} total={stats.totalWaste} color="bg-blue-500" />
                <ProgressBar label="Collected" value={stats.collectedWaste} total={stats.totalWaste} color="bg-green-500" />
              </div>
            </Card>

            {/* Communities */}
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">{stats.totalCommunities}</span>
                <span className="text-muted-foreground text-sm">communities active</span>
              </div>
            </Card>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["ALL", "DONOR", "COLLECTOR", "ADMIN"].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={userFilter === f ? "default" : "outline"}
                  onClick={() => setUserFilter(f)}
                  className="text-xs"
                >
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{filteredUsers.length} users</p>

            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{user.name}</p>
                      <RoleBadge role={user.role} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={user.accountStatus} />
                    {expandedUser === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {expandedUser === user.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Joined: {formatDate(user.createdAt)} · ID: {user.id}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {user.role === "COLLECTOR" && user.accountStatus === "PENDING_APPROVAL" && (
                        <>
                          <Button size="sm" className="gap-1" onClick={() => handleAccountStatus(user.id, "ACTIVE")}>
                            <UserCheck className="h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleAccountStatus(user.id, "REJECTED")}>
                            <UserX className="h-3 w-3" /> Reject
                          </Button>
                        </>
                      )}
                      {user.role === "COLLECTOR" && user.accountStatus === "REJECTED" && (
                        <Button size="sm" className="gap-1" onClick={() => handleAccountStatus(user.id, "ACTIVE")}>
                          <UserCheck className="h-3 w-3" /> Approve
                        </Button>
                      )}
                      {user.role === "COLLECTOR" && user.accountStatus === "ACTIVE" && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAccountStatus(user.id, "REJECTED")}>
                          <UserX className="h-3 w-3" /> Revoke
                        </Button>
                      )}
                      {user.id !== adminId && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </div>
        )}

        {/* ── COLLECTORS TAB ── */}
        {activeTab === "collectors" && (
          <div className="space-y-3">
            <h3 className="font-semibold">Pending Approval ({pendingCollectors.length})</h3>

            {pendingCollectors.length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending collector requests</p>
              </Card>
            ) : (
              pendingCollectors.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Applied: {formatDate(c.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-300 text-amber-700">Pending</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1" onClick={() => handleAccountStatus(c.id, "ACTIVE")}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => handleAccountStatus(c.id, "REJECTED")}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}

            {/* All Collectors Section */}
            <h3 className="font-semibold mt-6">
              All Collectors ({allUsers.filter((u) => u.role === "COLLECTOR").length})
            </h3>
            {allUsers
              .filter((u) => u.role === "COLLECTOR")
              .map((c) => (
                <Card key={c.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.accountStatus} />
                      {c.accountStatus === "ACTIVE" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleAccountStatus(c.id, "REJECTED")}>
                          Revoke
                        </Button>
                      )}
                      {c.accountStatus === "REJECTED" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleAccountStatus(c.id, "ACTIVE")}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* ── WASTE TAB ── */}
        {activeTab === "waste" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search waste..."
                value={wasteSearch}
                onChange={(e) => setWasteSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["ALL", "PENDING", "IN_PROGRESS", "COLLECTED"].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={wasteFilter === f ? "default" : "outline"}
                  onClick={() => setWasteFilter(f)}
                  className="text-xs"
                >
                  {f === "ALL" ? "All" : f === "IN_PROGRESS" ? "In Progress" : f.charAt(0) + f.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{filteredWaste.length} records</p>

            {filteredWaste.map((w) => (
              <Card key={w.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{w.type}</Badge>
                    <WasteStatusBadge status={w.status} />
                  </div>
                  <span className="text-sm font-medium">{w.quantity} kg</span>
                </div>
                {w.description && (
                  <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{w.description}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {w.user && <p>Donor: {w.user.name} (#{w.user.id})</p>}
                  {w.collectedBy && <p>Collector: {w.collectedBy.name} (#{w.collectedBy.id})</p>}
                  {w.locationAddress && <p>📍 {w.locationAddress}</p>}
                  <p>Created: {formatDate(w.createdAt)}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => handleDeleteWaste(w.id)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </Card>
            ))}

            {filteredWaste.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No waste records found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} text-white p-2 rounded-lg`}>
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
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    COLLECTOR: "bg-blue-100 text-blue-700 border-blue-200",
    DONOR: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${styles[role] || ""}`}>
      {role}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "bg-green-100 text-green-700 border-green-200" },
    PENDING_APPROVAL: { label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.cls}`}>{s.label}</Badge>;
}

function WasteStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    IN_PROGRESS: { label: "In Progress", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    COLLECTED: { label: "Collected", cls: "bg-green-100 text-green-700 border-green-200" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.cls}`}>{s.label}</Badge>;
}
