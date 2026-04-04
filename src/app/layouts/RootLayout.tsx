import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Home, ScanLine, Users, MapPin, User, Package, History, AlertTriangle, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { cn } from "../components/ui/utils";

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

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const status = localStorage.getItem("accountStatus");

    if (role === "COLLECTOR" && status !== "ACTIVE") {
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("token");
      localStorage.removeItem("accountStatus");

      toast.error("Access restricted. Your account is not yet active.");
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  const getDonorNavItems = () => [
    { path: "/app", icon: Home, label: "Home" },
    { path: "/app/track", icon: ScanLine, label: "Track" },
    { path: "/app/locations", icon: MapPin, label: "Spots" },
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
    <div className="min-h-dvh bg-background flex flex-col">
      {userRole === "COLLECTOR" && accountStatus === "ACTIVE" && (
        <div className="bg-primary text-primary-foreground text-center py-2.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 px-3">
          <Truck className="h-3.5 w-3.5 shrink-0 opacity-90" />
          Collector mode — manage pickups and routes
        </div>
      )}
      {userRole === "COLLECTOR" && accountStatus === "PENDING_APPROVAL" && (
        <div className="bg-amber-500 text-white text-center py-2.5 text-xs font-semibold flex items-center justify-center gap-2 px-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Account pending approval — you cannot claim pickups yet
        </div>
      )}
      {userRole === "COLLECTOR" && accountStatus === "REJECTED" && (
        <div className="bg-destructive text-destructive-foreground text-center py-2.5 text-xs font-semibold flex items-center justify-center gap-2 px-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Account rejected — contact support for help
        </div>
      )}

      <main className="flex-1 overflow-y-auto min-h-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-[1.35rem] border border-border bg-card shadow-[0_-6px_28px_rgba(15,50,30,0.08),0_10px_32px_-10px_rgba(15,50,30,0.18)] ring-1 ring-black/[0.04] px-1 py-1">
          <div className="flex justify-between items-center gap-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 px-0.5 min-w-0 min-h-[3.25rem] transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-primary/14 text-primary" : "text-current",
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight tracking-tight truncate max-w-full">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
