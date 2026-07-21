import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageLoading } from "@/components/common/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { routes } from "@/routes/paths";
import type { ReactNode } from "react";

export function RequireMember({ children }: { children?: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "loading") return <PageLoading label="確認登入狀態…" />;
  if (auth.status === "anonymous") {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />;
  }
  if (auth.status === "unauthorized") {
    return <Navigate to={routes.unauthorized} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

export function RequireOwner({ children }: { children?: ReactNode }) {
  const auth = useAuth();
  if (auth.status === "loading") return <PageLoading />;
  if (!auth.membership?.isOwner) {
    return <Navigate to={routes.today} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
