/** Build a daily VEVENT ICS for calendar apps (Apple / Google / Outlook). */
export function buildDailyReminderIcs(opts: {
  timeHHMM: string;
  title?: string;
  description?: string;
  timezone?: string;
}): string {
  const [hhRaw, mmRaw] = opts.timeHHMM.split(":");
  const hh = String(Math.min(23, Math.max(0, Number(hhRaw) || 9))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(mmRaw) || 0))).padStart(2, "0");
  const title = opts.title ?? "字耕・今日提醒";
  const description =
    opts.description ??
    "打開字耕，做今日詞彙／寫作／小說任務。https://linyize1111.github.io/zi-geng/";
  const tz = opts.timezone ?? "Asia/Taipei";

  const now = new Date();
  const stamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";

  // Local calendar date in the reminder timezone (Taipei = UTC+8, no DST).
  const localParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = localParts.find((p) => p.type === "year")?.value ?? String(now.getFullYear());
  const mo = localParts.find((p) => p.type === "month")?.value ?? "01";
  const da = localParts.find((p) => p.type === "day")?.value ?? "01";
  const dtStart = `${y}${mo}${da}T${hh}${mm}00`;
  const uid = `zi-geng-daily-${hh}${mm}@zi-geng`;

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  // Asia/Taipei has observed UTC+8 year-round since 1979 (no DST).
  const vtimezone =
    tz === "Asia/Taipei"
      ? [
          "BEGIN:VTIMEZONE",
          "TZID:Asia/Taipei",
          "X-LIC-LOCATION:Asia/Taipei",
          "BEGIN:STANDARD",
          "TZOFFSETFROM:+0800",
          "TZOFFSETTO:+0800",
          "TZNAME:CST",
          "DTSTART:19700101T000000",
          "END:STANDARD",
          "END:VTIMEZONE",
        ]
      : [];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//字耕//Daily Reminder//ZH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vtimezone,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${tz}:${dtStart}`,
    `RRULE:FREQ=DAILY`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
