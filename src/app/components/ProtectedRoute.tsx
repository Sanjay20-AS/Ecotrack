import { Navigate } from "react-router";

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: Props) {
  const role = localStorage.getItem("userRole") || "DONOR";
  if (!allowedRoles.includes(role)) {
    const fallback = role === "COLLECTOR" ? "/app/collector-dashboard" : "/app";
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
