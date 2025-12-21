import { Outlet, useLocation, Link } from "react-router";
import { Home, ScanLine, Users, MapPin, User } from "lucide-react";

const navItems = [
  { path: "/app", icon: Home, label: "Home" },
  { path: "/app/track", icon: ScanLine, label: "Track" },
  { path: "/app/community", icon: Users, label: "Community" },
  { path: "/app/locations", icon: MapPin, label: "Locations" },
  { path: "/app/profile", icon: User, label: "Profile" },
];

export function RootLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
