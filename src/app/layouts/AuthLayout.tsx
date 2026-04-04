import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-background relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-accent/12 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />
      </div>
      <div className="relative flex-1 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <Outlet />
      </div>
    </div>
  );
}
