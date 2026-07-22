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
      <PageState title="即將推出" description="這一區還在打磨，先用今日、詞彙與寫作就好。" />
    </div>
  );
}
