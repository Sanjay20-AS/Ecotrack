import { useState, useEffect } from "react";
import { Users, Search, ChevronDown, ChevronUp, UserCheck, UserX, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { userAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

export function AdminUsersScreen() {
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const adminId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getAllUsers();
      setAllUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatus = async (userId: number, status: string) => {
    try {
      await userAPI.updateAccountStatus(userId, status, adminId);
      toast.success(`Account ${status === "ACTIVE" ? "approved" : "rejected"}`);
      loadUsers();
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
      loadUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userFilter === "ALL" || u.role === userFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage all platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "DONOR", "COLLECTOR", "ADMIN"].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={userFilter === f ? "default" : "outline"}
              onClick={() => setUserFilter(f)}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>

      <div className="space-y-3">
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
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <StatusBadge status={user.accountStatus} />
                {expandedUser === user.id
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {expandedUser === user.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <p className="text-sm text-muted-foreground">
                  Joined: {formatDate(user.createdAt)} · ID: #{user.id}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {user.role === "COLLECTOR" && user.accountStatus === "PENDING_APPROVAL" && (
                    <>
                      <Button size="sm" className="gap-1.5" onClick={() => handleAccountStatus(user.id, "ACTIVE")}>
                        <UserCheck className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleAccountStatus(user.id, "REJECTED")}>
                        <UserX className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {user.role === "COLLECTOR" && user.accountStatus === "REJECTED" && (
                    <Button size="sm" className="gap-1.5" onClick={() => handleAccountStatus(user.id, "ACTIVE")}>
                      <UserCheck className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {user.role === "COLLECTOR" && user.accountStatus === "ACTIVE" && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAccountStatus(user.id, "REJECTED")}>
                      <UserX className="h-3.5 w-3.5" /> Revoke Access
                    </Button>
                  )}
                  {user.id !== adminId && (
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleDeleteUser(user.id, user.name)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
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
