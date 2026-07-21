import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/features/auth/AuthProvider";
import { AUTH_STORAGE_KEY } from "@/lib/auth-keys";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

export default function SettingsPage() {
  const auth = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">更多／設定</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">主題、帳號與相關連結</p>
      </header>

      <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">帳號</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {auth.user ? `${auth.user.name} 〈${auth.user.email}〉` : "未登入"}
          {auth.membership?.isOwner ? " · Owner" : auth.membership?.isMember ? " · Member" : ""}
        </p>
        <Button type="button" variant="outline" onClick={() => void auth.signOut()}>
          登出（只清除字耕 session）
        </Button>
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--color-line)] p-4">
        <h2 className="text-sm font-medium">外觀</h2>
        <ThemeToggle />
      </section>

      <section className="space-y-2 rounded-lg border border-[var(--color-line)] p-4 text-sm text-[var(--color-ink-muted)]">
        <p>Auth storage key：{AUTH_STORAGE_KEY}</p>
        <p>Base path：{env.appBasePath}</p>
        <p>Mock adapter：{auth.usingMock ? "開啟（僅開發）" : "關閉"}</p>
      </section>

      <ul className="space-y-2 text-sm">
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.japanese}>
            日文
          </Link>
        </li>
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.review}>
            回顧
          </Link>
        </li>
        <li>
          <Link className="underline-offset-4 hover:underline" to={routes.favorites}>
            收藏
          </Link>
        </li>
        {auth.membership?.isOwner ? (
          <li>
            <Link className="underline-offset-4 hover:underline" to={routes.ownerContent}>
              內容管理（Owner）
            </Link>
          </li>
        ) : null}
        <li>
          <a className="underline-offset-4 hover:underline" href={env.mainSiteUrl}>
            回到公開網站
          </a>
        </li>
      </ul>
    </div>
  );
}
