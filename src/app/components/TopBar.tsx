import { useEffect, useState, type ReactNode } from "react";
import { Bell, ChevronLeft, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../services/apiService";
import { cn } from "./ui/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  variant?: "banner" | "compact";
  /** Shown below title row on banner variant (e.g. primary actions) */
  bannerAccessory?: ReactNode;
}

export default function TopBar({
  title,
  subtitle,
  showBack,
  onBack,
  variant = "compact",
  bannerAccessory,
}: TopBarProps) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState<number>(0);
  const [initials, setInitials] = useState<string>("U");

  const isBanner = variant === "banner";

  useEffect(() => {
    const name = (() => {
      const n = localStorage.getItem("userName") || localStorage.getItem("name");
      if (n) return n;
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        return u?.name;
      } catch {
        return null;
      }
    })();
    if (name) {
      const parts = name.split(" ").filter(Boolean);
      setInitials(
        parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0]?.substring(0, 2).toUpperCase() || "U",
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const userId = parseInt(localStorage.getItem("userId") || "0");
    if (!userId) return;
    const load = async () => {
      try {
        const res: unknown = await notificationAPI.getUnreadCount(userId);
        if (!mounted) return;
        const value =
          typeof res === "number"
            ? res
            : (res as { unread?: number; count?: number })?.unread ??
              (res as { count?: number })?.count ??
              0;
        setUnread(Number(value) || 0);
      } catch {
        // ignore
      }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const onBell = () => navigate("/app/profile/notifications");
  const onAvatar = () => navigate("/app/profile");

  const titleBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 min-w-0">
        {isBanner && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"
            aria-hidden
          >
            <Leaf className="h-4 w-4" strokeWidth={2.5} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-bold tracking-tight text-foreground truncate text-[1.05rem] leading-tight sm:text-lg">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onBell}
        aria-label="Notifications"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          "bg-muted/55 text-foreground hover:bg-muted/90",
          "ring-1 ring-black/[0.05] dark:ring-white/10",
        )}
      >
        <Bell className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-card">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onAvatar}
        aria-label="Profile"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-opacity hover:opacity-95",
          "bg-gradient-to-br from-primary to-emerald-800 text-primary-foreground shadow-sm shadow-primary/25",
          "ring-1 ring-primary/20",
        )}
      >
        {initials}
      </button>
    </div>
  );

  if (!isBanner) {
    return (
      <header
        className={cn(
          "sticky top-0 z-30 w-full shrink-0",
          "border-b border-border/70 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65",
          "pt-[max(0.35rem,env(safe-area-inset-top))]",
          "shadow-sm shadow-black/[0.05]",
        )}
      >
        <div className="relative mx-auto max-w-lg px-4 pb-3 pt-1">
          <div
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
            aria-hidden
          />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              {showBack && (
                <button
                  type="button"
                  onClick={onBack ?? (() => window.history.back())}
                  aria-label="Back"
                  className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-foreground hover:bg-muted ring-1 ring-black/[0.05] transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0 pt-0.5 flex-1">
                <h1 className="font-bold tracking-tight text-foreground truncate text-lg">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>
                )}
              </div>
            </div>
            {actions}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full z-30 shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))] px-3 pb-2">
      <div className="mx-auto max-w-lg">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border/80",
            "bg-card/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/70",
            "shadow-[0_12px_40px_-12px_rgba(15,35,22,0.14),inset_0_1px_0_0_rgba(255,255,255,0.65)]",
          )}
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-emerald-600 to-teal-600 opacity-90"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3 px-3.5 pt-4 pb-3">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              {showBack && (
                <button
                  type="button"
                  onClick={onBack ?? (() => window.history.back())}
                  aria-label="Back"
                  className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/55 text-foreground hover:bg-muted/90 ring-1 ring-black/[0.05] transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {titleBlock}
            </div>
            {actions}
          </div>
          {bannerAccessory ? (
            <div className="px-3.5 pb-3.5 pt-0 border-t border-border/50">{bannerAccessory}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
