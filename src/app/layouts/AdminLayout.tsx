import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import {
  BarChart3, Users, Truck, Package, LogOut, Leaf, Shield, Menu, X,
  TrendingUp, Building2, Globe
} from "lucide-react";
import { Button } from "../components/ui/button";

const navItems = [
  { path: "/admin", icon: BarChart3, label: "Overview" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/collectors", icon: Truck, label: "Collectors" },
  { path: "/admin/waste", icon: Package, label: "Waste Records" },
  { path: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
  { path: "/admin/facilities", icon: Building2, label: "Facilities" },
  { path: "/admin/communities", icon: Globe, label: "Communities" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const parsedId = parseInt(userId || "0");
    if (!userId || parsedId === 0 || role !== "ADMIN") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card/95 backdrop-blur-md border-r border-border/60 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/60">
          <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/20">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">EcoTrack</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" /> Admin Panel
            </p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 pt-[max(0.25rem,env(safe-area-inset-top))]">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground tracking-tight">Admin</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-6xl mx-auto w-full pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
