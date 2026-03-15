import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Home, ScanLine, Users, MapPin, User, Truck, Package, History, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("DONOR");
  const [accountStatus, setAccountStatus] = useState<string>("ACTIVE");
  const [authenticated, setAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setAuthenticated(false);
      navigate("/", { replace: true });
      return;
    }
    const role = localStorage.getItem("userRole") || "DONOR";
    const status = localStorage.getItem("accountStatus") || "ACTIVE";
    setUserRole(role);
    setAccountStatus(status);
  }, [navigate]);

  // ── Collector protection: Check on every route change ──
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const status = localStorage.getItem("accountStatus");

    // If collector and NOT active, block access immediately
    if (role === "COLLECTOR" && status !== "ACTIVE") {
      // Clear auth state
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("token");
      localStorage.removeItem("accountStatus");

      // Redirect and show message
      toast.error("Access restricted. Your account is not yet active.");
      navigate("/", { replace: true });
    }
  }, [location, navigate]); // Runs on every route change

  // Role-based navigation items
  const getDonorNavItems = () => [
    { path: "/app", icon: Home, label: "Home" },
    { path: "/app/track", icon: ScanLine, label: "Track" },
    { path: "/app/locations", icon: MapPin, label: "Locations" },
    { path: "/app/community", icon: Users, label: "Community" },
    { path: "/app/profile", icon: User, label: "Profile" },
  ];

  const getCollectorNavItems = () => [
    { path: "/app/collector-dashboard", icon: Home, label: "Home" },
    { path: "/app/pickups", icon: Package, label: "Pickups" },
    { path: "/app/collector-history", icon: History, label: "History" },
    { path: "/app/routes", icon: MapPin, label: "Routes" },
    { path: "/app/profile", icon: User, label: "Profile" },
  ];

  const navItems = userRole === "COLLECTOR" ? getCollectorNavItems() : getDonorNavItems();

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Role Indicator Banner for Collectors */}
      {userRole === "COLLECTOR" && accountStatus === "ACTIVE" && (
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          🚛 Collector Mode - Manage Waste Collection
        </div>
      )}
      {userRole === "COLLECTOR" && accountStatus === "PENDING_APPROVAL" && (
        <div className="bg-amber-500 text-white text-center py-2.5 text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Account Pending Approval — You cannot claim pickups yet
        </div>
      )}
      {userRole === "COLLECTOR" && accountStatus === "REJECTED" && (
        <div className="bg-destructive text-destructive-foreground text-center py-2.5 text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Account Rejected — Contact support for assistance
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
