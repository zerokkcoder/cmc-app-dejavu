"use client";

import type { Snapshot } from "@/lib/data/loadSnapshot";
import { axisLabel } from "@/lib/data/loadSnapshot";
import { COPY, type Lang } from "@/lib/i18n";
import { clamp } from "@/lib/analytics/normalize";

const R = 112;
const CX = 150;
const CY = 195;

function polygon(values: number[], scale = 1): string {
  return values
    .map((v, i) => {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const r = R * clamp(v, -1, 1) * scale;
      return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`;
    })
    .join(" ");
}

export default function FingerprintRadar({
  snapshot,
  index,
  neighbourIndex,
  lang,
}: {
  snapshot: Snapshot;
  index: number;
  neighbourIndex?: number;
  lang: Lang;
}) {
  const current = snapshot.matrix[index] ?? [];
  const neighbour = neighbourIndex === undefined ? null : snapshot.matrix[neighbourIndex] ?? null;

  return (
    <section className="panel flex h-full min-h-0 flex-col p-3 xl:p-2.5">
      <h2 className="eyebrow mb-1 text-[9px] xl:mb-0">{COPY.fingerprint[lang]}</h2>
      <svg
        viewBox="0 0 300 390"
        preserveAspectRatio="xMidYMid meet"
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Fingerprint radar"
      >
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={polygon([1, 1, 1, 1, 1, 1], scale)}
            fill="none"
            stroke="#1d2532"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={CX + R * Math.cos(angle)}
              y2={CY + R * Math.sin(angle)}
              stroke="#1d2532"
            />
          );
        })}
        {neighbour && (
          <polygon points={polygon(neighbour)} fill="#5fd0c5" fillOpacity={0.12} stroke="#5fd0c5" strokeWidth={1.5} />
        )}
        <polygon points={polygon(current)} fill="#e0a458" fillOpacity={0.18} stroke="#e0a458" strokeWidth={1.8} />
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          return (
            <text
              key={i}
              x={CX + (R + 24) * Math.cos(angle)}
              y={CY + (R + 24) * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#8b93a7"
            >
              {axisLabel(i, lang)}
            </text>
          );
        })}
      </svg>
      <div className="flex justify-center gap-3 text-[10px]">
        <span className="flex items-center gap-1"><i className="h-2 w-2 bg-[var(--amber)]" />{snapshot.days[index]}</span>
        {neighbourIndex !== undefined && (
          <span className="flex items-center gap-1"><i className="h-2 w-2 bg-[var(--cyan)]" />{snapshot.days[neighbourIndex]}</span>
        )}
      </div>
    </section>
  );
}
