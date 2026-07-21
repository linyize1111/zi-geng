import { PageState } from "@/components/common/PageState";
import { env } from "@/lib/env";
import { getDataAdapter } from "@/lib/offline/mock-adapter";

export default function TodayPage() {
  const adapter = getDataAdapter(env.useMockAdapter);
  const user = adapter.getDemoUser();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">今日</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {user ? `你好，${user.name}` : "登入後顯示每日計畫"}
        </p>
      </header>
      <PageState
        title="每日閉環尚未接上資料"
        description="Phase 3 將提供名言、詞彙、技巧與寫作題目。目前可驗證導覽與主題。"
      />
    </div>
  );
}
