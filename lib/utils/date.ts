/** All DÉJÀVU dates are UTC calendar days. No local-time conversion anywhere. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftDay(day: string, deltaDays: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function prettyDay(day: string, lang: "zh" | "en"): string {
  if (lang === "zh") return day.replace("-", " 年 ").replace("-", " 月 ") + " 日";
  return new Date(`${day}T00:00:00.000Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}
