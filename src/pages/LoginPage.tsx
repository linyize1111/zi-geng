import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { env } from "@/lib/env";
import { routes } from "@/routes/paths";

export default function LoginPage() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (auth.status === "authenticated") {
    return <Navigate to={routes.today} replace />;
  }
  if (auth.status === "unauthorized") {
    return <Navigate to={routes.unauthorized} replace />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="font-[family-name:var(--font-sans)] text-4xl tracking-[0.2em]">字耕</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
          受邀使用者以 Google 登入。私人內容預設不會公開。
        </p>
      </div>
      <Button
        type="button"
        disabled={pending || auth.status === "loading"}
        onClick={() => {
          setError(null);
          setPending(true);
          void auth
            .signInWithGoogle()
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "登入失敗");
            })
            .finally(() => setPending(false));
        }}
      >
        {env.useMockAdapter ? "使用示範身分進入" : "使用 Google 登入"}
      </Button>
      {error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {!env.useMockAdapter && !env.supabaseUrl ? (
        <p className="text-xs text-[var(--color-ink-muted)]">
          尚未設定 VITE_SUPABASE_URL。請先完成 USER_ACTIONS U1，或本機開啟 Mock。
        </p>
      ) : null}
      <Link
        to={routes.unauthorized}
        className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
      >
        非白名單說明頁
      </Link>
    </div>
  );
}
