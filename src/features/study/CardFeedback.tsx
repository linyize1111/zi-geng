import { useState } from "react";
import {
  recordStudyEvent,
  type StudyContentType,
  type StudyEventType,
} from "@/features/study/events-api";

const ACTIONS: { type: StudyEventType; label: string }[] = [
  { type: "too_easy", label: "太簡單" },
  { type: "not_useful", label: "不實用" },
  { type: "want_more", label: "想多看這類" },
  { type: "good", label: "很好" },
];

export function CardFeedback({
  contentType,
  contentId,
  normalizedKey,
  localDate,
}: {
  contentType: StudyContentType;
  contentId: string;
  normalizedKey?: string;
  localDate?: string;
}) {
  const [sent, setSent] = useState<StudyEventType | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(eventType: StudyEventType) {
    if (busy || sent) return;
    setBusy(true);
    try {
      await recordStudyEvent({
        contentType,
        contentId,
        normalizedKey,
        eventType,
        localDate,
      });
      setSent(eventType);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {ACTIONS.map((a) => (
        <button
          key={a.type}
          type="button"
          disabled={busy || Boolean(sent)}
          onClick={() => void onPick(a.type)}
          className={`rounded border px-2 py-0.5 text-[11px] ${
            sent === a.type
              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
              : "border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink)]"
          }`}
        >
          {a.label}
        </button>
      ))}
      {sent ? (
        <span className="text-[11px] text-[var(--color-ink-muted)]">已記錄，會影響之後抽卡</span>
      ) : null}
    </div>
  );
}
