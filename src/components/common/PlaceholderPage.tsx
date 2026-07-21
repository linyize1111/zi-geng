import { PageState } from "@/components/common/PageState";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{description}</p>
        ) : null}
      </header>
      <PageState
        title="此頁骨架已就緒"
        description="功能將於後續 Phase 實作。目前可驗證導覽、主題與 PWA 殼層。"
      />
    </div>
  );
}
