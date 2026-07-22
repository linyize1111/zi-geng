import { Link } from "react-router-dom";
import { routes } from "@/routes/paths";

const sections = [
  { to: routes.learnVocabulary, label: "詞彙", desc: "主題對照・隨機刷卡・情緒／織品／面貌" },
  { to: routes.learnQuotes, label: "名言", desc: "經典與查證解析" },
  { to: routes.learnCraft, label: "寫作技巧", desc: "強弱例與練習" },
] as const;

export default function LearnPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-sans)] text-3xl tracking-wide">學習</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">選擇要深入的內容類型</p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-3">
        {sections.map((section) => (
          <li key={section.to}>
            <Link
              to={section.to}
              className="block rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4 hover:border-[var(--color-accent)]"
            >
              <span className="text-lg">{section.label}</span>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{section.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
