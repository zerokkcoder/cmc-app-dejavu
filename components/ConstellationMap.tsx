"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Snapshot } from "@/lib/data/loadSnapshot";
import { COPY, type Lang } from "@/lib/i18n";

export default function ConstellationMap({
  snapshot,
  index,
  neighbours,
  onSelect,
  lang,
}: {
  snapshot: Snapshot;
  index: number;
  neighbours: Array<{ index: number; day: string; distance: number; similarity: number }>;
  onSelect: (index: number) => void;
  lang: Lang;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 760, h: 420 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const points = snapshot.pca;
    if (!points.length) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    // Isotropic scaling keeps PCA distances honest while filling the panel.
    const pad = 28;
    const scale = Math.min(
      (size.w - pad * 2) / (maxX - minX || 1),
      (size.h - pad * 2) / (maxY - minY || 1),
    );
    const offX = (size.w - scale * (maxX - minX)) / 2;
    const offY = (size.h - scale * (maxY - minY)) / 2;
    return {
      points,
      sx: (x: number) => offX + (x - minX) * scale,
      sy: (y: number) => offY + (y - minY) * scale,
    };
  }, [snapshot.pca, size]);

  if (!geometry) return null;
  const { points, sx, sy } = geometry;
  const current = points[index];
  const neighbourSet = new Set(neighbours.map((n) => n.index));

  return (
    <section className="panel flex h-full min-h-0 flex-col p-3 xl:p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="eyebrow text-[9px]">{COPY.constellation[lang]}</h2>
        <span className="mono whitespace-nowrap text-[9px] text-[var(--muted)]">
          PCA · {snapshot.meta.alignedDays} DAYS
        </span>
      </div>
      <p className="mt-0.5 text-[10px] text-[var(--muted)] xl:hidden">{COPY.constellationHint[lang]}</p>
      <div ref={boxRef} className="min-h-0 flex-1" >
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="block h-full w-full"
          role="img"
          aria-label="Market state constellation"
        >
          <defs>
            <radialGradient id="glow">
              <stop offset="0%" stopColor="#e0a458" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e0a458" stopOpacity="0" />
            </radialGradient>
          </defs>
          {points.map((p, i) =>
            snapshot.valid[i] ? (
              <circle
                key={i}
                cx={sx(p[0])}
                cy={sy(p[1])}
                r={i === index ? 4 : neighbourSet.has(i) ? 2.2 : 1.5}
                fill={i === index ? "#e0a458" : neighbourSet.has(i) ? "#5fd0c5" : "#3d4a60"}
                opacity={i === index ? 1 : neighbourSet.has(i) ? 0.95 : 0.5}
                className="cursor-pointer"
                onClick={() => snapshot.valid[i] && onSelect(i)}
              >
                <title>{`${snapshot.days[i]} · ${neighbourSet.has(i) ? "neighbour" : "day"}`}</title>
              </circle>
            ) : null,
          )}
          {current && (
            <>
              <circle cx={sx(current[0])} cy={sy(current[1])} r={28} fill="url(#glow)" />
              {neighbours.map((n) => {
                const p = points[n.index];
                if (!p) return null;
                return (
                  <line
                    key={n.index}
                    x1={sx(current[0])}
                    y1={sy(current[1])}
                    x2={sx(p[0])}
                    y2={sy(p[1])}
                    stroke="#5fd0c5"
                    strokeOpacity={0.28}
                    strokeWidth={1}
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>
    </section>
  );
}
