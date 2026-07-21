import { PageState } from "@/components/common/PageState";
import { useNavigate } from "react-router-dom";
import { routes } from "@/routes/paths";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <PageState
      title="找不到頁面"
      description="請從導覽返回今日或其他區段。"
      actionLabel="回到今日"
      onAction={() => navigate(routes.today)}
    />
  );
}
