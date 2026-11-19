"use client";

import type { Snapshot } from "@/lib/data/loadSnapshot";
import { COPY, type Lang } from "@/lib/i18n";
import { formatPct } from "@/lib/utils/date";
import { forwardAt } from "@/lib/analytics/forwardReturns";

export default function NeighborCards({
  snapshot,
  neighbours,
  lang,
  onSelect,
}: {
  snapshot: Snapshot;
  neighbours: Array<{ index: number; day: string; distance: number; similarity: number }>;
  lang: Lang;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="panel flex h-full min-h-0 flex-col p-3 xl:p-2.5">
      <h2 className="eyebrow mb-1.5 text-[9px] xl:mb-1">{COPY.neighbours[lang]}</h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5 overflow-y-auto">
        {neighbours.map((n, rank) => {
          const fwd = forwardAt(snapshot.forward, n.index, 30, "cap");
          return (
            <button
              key={n.day}
              onClick={() => onSelect(n.index)}
              className="rounded border border-[var(--border)] bg-[#0a0e16] px-2 py-1.5 text-left transition-colors hover:border-[var(--cyan)]"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="mono text-[9px] text-[var(--muted)]">#{rank + 1}</span>
                <span className="mono truncate text-[10px] text-[var(--cyan)]">
                  {(n.similarity * 100).toFixed(1)}% {COPY.similarity[lang]}
                </span>
              </div>
              <div className="mono mt-0.5 text-[11px] text-[var(--text)]">{n.day}</div>
              <div className={`mono text-xs ${fwd !== null && fwd >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                +30d {fwd === null ? COPY.pending[lang] : formatPct(fwd)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
