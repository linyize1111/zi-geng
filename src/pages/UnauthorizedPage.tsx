import { PageState } from "@/components/common/PageState";
import { Link } from "react-router-dom";
import { routes } from "@/routes/paths";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <PageState
        tone="error"
        title="此工具目前僅限受邀使用"
        description="你的帳號不在字耕白名單中。若你是受邀朋友，請聯繫站長加入。"
      />
      <Link to={routes.login} className="text-center text-sm underline-offset-4 hover:underline">
        返回登入
      </Link>
    </div>
  );
}
