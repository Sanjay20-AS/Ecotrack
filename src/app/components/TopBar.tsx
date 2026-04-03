import { useEffect, useState } from "react";
import { Bell, User, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../services/apiService";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  variant?: "banner" | "compact";
}

export default function TopBar({ title, subtitle, showBack, onBack, variant = "compact" }: TopBarProps) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState<number>(0);
  const [initials, setInitials] = useState<string>("U");

  useEffect(() => {
    const name = (() => {
      const n = localStorage.getItem("userName") || localStorage.getItem("name");
      if (n) return n;
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        return u?.name;
      } catch { return null; }
    })();
    if (name) {
      const parts = name.split(" ").filter(Boolean);
      setInitials(parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0]?.substring(0,2).toUpperCase() || "U");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const userId = parseInt(localStorage.getItem("userId") || "0");
    if (!userId) return;
    const load = async () => {
      try {
        const res: any = await notificationAPI.getUnreadCount(userId);
        if (!mounted) return;
        // support API returning object { unread: n } or a raw number
        const value = typeof res === "number" ? res : (res?.unread ?? res?.count ?? 0);
        setUnread(Number(value) || 0);
      } catch (e) {
        // ignore
      }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const onBell = () => navigate("/app/profile/notifications");
  const onAvatar = () => navigate("/app/profile");

  const baseClasses = "w-full";
  const bannerClasses = "bg-[#228B22] px-6 h-[80px] rounded-none";
  const compactClasses = "px-4 py-2";
  const titleClass = variant === 'banner' ? 'text-lg font-bold text-white leading-tight' : 'text-lg font-bold text-gray-900 leading-tight';
  const subtitleClass = variant === 'banner' ? 'text-sm text-white/90' : 'text-sm text-gray-500';
  const iconColorClass = variant === 'banner' ? 'text-white' : 'text-gray-700';
  const bellButtonClasses = variant === 'banner'
    ? 'relative flex items-center justify-center w-10 h-10 bg-transparent rounded-full border border-white/20 hover:bg-white/10'
    : 'relative flex items-center justify-center w-10 h-10 bg-transparent rounded-full border border-gray-200 hover:bg-gray-100';

  return (
    <>
      <div
        className={`${baseClasses} ${variant === "banner" ? bannerClasses : compactClasses}`}
        style={variant === "banner" ? { boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } : undefined}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4 h-full">
            {showBack && (
              <button onClick={onBack ?? (() => window.history.back())} aria-label="Back" className="p-2 mr-1">
                <ChevronLeft className={`h-6 w-6 ${iconColorClass}`} />
              </button>
            )}
            <div>
              <div className={titleClass}>{title}</div>
              {subtitle && <div className={subtitleClass}>{subtitle}</div>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onBell} aria-label="Notifications" className={bellButtonClasses}>
              <Bell className={`h-5 w-5 ${iconColorClass}`} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            <button onClick={onAvatar} aria-label="Profile" className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-[#2E8B57] text-sm font-semibold border border-white/10">
              {initials}
            </button>
          </div>
        </div>
      </div>
      {variant === "banner" && <div className="h-3 bg-white rounded-t-md" />}
    </>
  );
}
