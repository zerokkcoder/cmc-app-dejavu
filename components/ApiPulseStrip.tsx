"use client";

import type { Snapshot } from "@/lib/data/loadSnapshot";

function extract(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "—";
  let current: unknown = value;
  for (const key of keys) {
    if (!current || typeof current !== "object") return "—";
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === "number") {
    if (current >= 1e9) return `$${(current / 1e9).toFixed(0)}B`;
    if (Number.isInteger(current)) return String(current);
    return current.toFixed(2);
  }
  return current === undefined || current === null ? "—" : String(current);
}

export default function ApiPulseStrip({ snapshot }: { snapshot: Snapshot }) {
  const asi = snapshot.latest.altSeason30d as { points?: Array<Record<string, unknown>> } | undefined;
  const asiPoints = asi?.points ?? [];
  const items = [
    { label: "F&G", value: extract(snapshot.latest.fearGreed, ["value"]) },
    { label: "BTC.D", value: extract(snapshot.latest.global, ["btc_dominance"]) + "%" },
    { label: "ASI 30d", value: extract(asiPoints[asiPoints.length - 1], ["altcoin_index"]) },
    { label: "TOTAL CAP", value: extract(snapshot.latest.global, ["quote", "USD", "total_market_cap"]) },
    { label: "CMC100", value: extract(snapshot.latest.cmc100, ["value"]) },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-[var(--border)] bg-[var(--border)] sm:grid-cols-5 xl:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`bg-[var(--panel)] px-2 py-1.5 sm:px-3 sm:py-2 ${i === items.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
        >
          <div className="eyebrow text-[9px]">{item.label}</div>
          <div className="mono mt-0.5 text-xs text-[var(--cyan)] sm:text-sm">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
