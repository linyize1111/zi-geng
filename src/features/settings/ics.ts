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
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const da = String(now.getDate()).padStart(2, "0");
  const stamp = `${y}${mo}${da}T${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}00`;
  const dtStart = `${y}${mo}${da}T${hh}${mm}00`;
  const uid = `zi-geng-daily-${hh}${mm}@zi-geng`;

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//字耕//Daily Reminder//ZH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
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
