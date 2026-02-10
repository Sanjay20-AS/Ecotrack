import { Outlet, useLocation, Link } from "react-router";
import { Home, ScanLine, Users, MapPin, User, Truck, Package } from "lucide-react";
import { useState, useEffect } from "react";

export function RootLayout() {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string>("DONOR");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "DONOR";
    setUserRole(role);
  }, []);

  // Role-based navigation items
  const getDonorNavItems = () => [
    { path: "/app", icon: Home, label: "Home" },
    { path: "/app/track", icon: ScanLine, label: "Track" },
    { path: "/app/community", icon: Users, label: "Community" },
    { path: "/app/locations", icon: MapPin, label: "Locations" },
    { path: "/app/profile", icon: User, label: "Profile" },
  ];

  const getCollectorNavItems = () => [
    { path: "/app", icon: Home, label: "Home" },
    { path: "/app/track", icon: ScanLine, label: "Manage" },
    { path: "/app/community", icon: Truck, label: "Pickups" },
    { path: "/app/locations", icon: MapPin, label: "Routes" },
    { path: "/app/profile", icon: User, label: "Profile" },
  ];

  const navItems = userRole === "COLLECTOR" ? getCollectorNavItems() : getDonorNavItems();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Role Indicator Banner for Collectors */}
      {userRole === "COLLECTOR" && (
        <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
          🚛 Collector Mode - Manage Waste Collection
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
