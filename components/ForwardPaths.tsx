"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Snapshot } from "@/lib/data/loadSnapshot";
import { COPY, type Lang } from "@/lib/i18n";

function toPoints(series: Array<number | null>, min: number, max: number, w: number, h: number): string {
  return series
    .map((v, i) => {
      if (v === null) return "";
      const x = 40 + (i / 90) * (w - 60);
      const y = 18 + ((max - v) / (max - min || 1)) * (h - 40);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
}

export default function ForwardPaths({
  snapshot,
  index,
  neighbours,
  lang,
}: {
  snapshot: Snapshot;
  index: number;
  neighbours: Array<{ index: number; day: string; distance: number; similarity: number }>;
  lang: Lang;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 760, h: 220 });

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

  const { min, max, current, top, median } = useMemo(() => {
    const currentPath = snapshot.paths[String(index)] ?? [];
    const neighbourPaths = neighbours.map((n) => snapshot.paths[String(n.index)] ?? []);
    const all = [currentPath, ...neighbourPaths]
      .flat()
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const lo = all.length ? Math.min(...all) : -0.1;
    const hi = all.length ? Math.max(...all) : 0.1;
    const pad = (hi - lo) * 0.1 || 0.01;
    const band: Array<number | null> = [];
    for (let k = 0; k <= 90; k += 1) {
      const values = neighbourPaths
        .map((p) => p[k])
        .filter((v): v is number => v !== null && Number.isFinite(v));
      values.sort((a, b) => a - b);
      band.push(values.length ? values[Math.floor(values.length / 2)] : null);
    }
    return {
      min: lo - pad,
      max: hi + pad,
      current: currentPath,
      top: neighbourPaths.slice(0, 3),
      median: band,
    };
  }, [snapshot.paths, index, neighbours]);

  const { w, h } = size;
  const zeroY = 18 + ((max - 0) / (max - min || 1)) * (h - 40);

  return (
    <section className="panel flex h-full min-h-0 flex-col p-3 xl:p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="eyebrow text-[9px]">{COPY.forward[lang]}</h2>
        <span className="mono whitespace-nowrap text-[9px] text-[var(--muted)]">TOTAL CAP · +90D</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-[var(--muted)]">
        <span className="flex items-center gap-1"><i className="h-[2px] w-3 bg-[var(--amber)]" />{snapshot.days[index]}</span>
        <span className="flex items-center gap-1"><i className="h-[2px] w-3 bg-[var(--cyan)]" />TOP 3 {lang === "zh" ? "近邻" : "NEIGHBOURS"}</span>
        <span className="flex items-center gap-1"><i className="h-[2px] w-3 border-t border-dashed border-[#8b93a7]" />{COPY.medianBand[lang]}</span>
      </div>
      <div ref={boxRef} className="min-h-0 flex-1">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="block h-full w-full"
          role="img"
          aria-label="Forward market cap paths"
        >
          <line x1={40} y1={zeroY} x2={w - 12} y2={zeroY} stroke="#2a3444" strokeDasharray="4 4" />
          <line x1={40} y1={12} x2={40} y2={h - 14} stroke="#2a3444" />
          <text x={w - 14} y={h - 4} textAnchor="end" fontSize="9" fill="#8b93a7">+90D</text>
          <text x={4} y={22} fontSize="9" fill="#8b93a7">{(max * 100).toFixed(0)}%</text>
          <text x={4} y={h - 16} fontSize="9" fill="#8b93a7">{(min * 100).toFixed(0)}%</text>
          {top.map((path, i) => (
            <polyline key={i} points={toPoints(path, min, max, w, h)} fill="none" stroke="#5fd0c5" strokeOpacity={0.42} strokeWidth={1.5} />
          ))}
          <polyline points={toPoints(median, min, max, w, h)} fill="none" stroke="#8b93a7" strokeDasharray="5 4" strokeWidth={1.4} />
          <polyline points={toPoints(current, min, max, w, h)} fill="none" stroke="#e0a458" strokeWidth={2.4} />
        </svg>
      </div>
    </section>
  );
}
