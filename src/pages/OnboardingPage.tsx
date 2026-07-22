import { Navigate } from "react-router-dom";
import { routes } from "@/routes/paths";

/** 初次設定已併入「設定」；保留路由以免舊連結失效。 */
export default function OnboardingPage() {
  return <Navigate to={routes.settings} replace />;
}
