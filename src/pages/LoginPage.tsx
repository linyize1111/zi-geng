import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { routes } from "@/routes/paths";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="font-[family-name:var(--font-sans)] text-4xl tracking-[0.2em]">字耕</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
          使用 Google 登入（Phase 2 接上 Supabase）。目前僅頁面骨架。
        </p>
      </div>
      <Button type="button" disabled>
        使用 Google 登入
      </Button>
      <Link
        to={routes.today}
        className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
      >
        先瀏覽介面殼層
      </Link>
    </div>
  );
}
