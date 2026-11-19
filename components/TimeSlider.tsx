"use client";

import { COPY, type Lang } from "@/lib/i18n";
import { prettyDay } from "@/lib/utils/date";

export default function TimeSlider({
  min,
  max,
  value,
  onChange,
  lang,
  day,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (index: number) => void;
  lang: Lang;
  day: string;
}) {
  return (
    <section className="panel px-3 py-2 xl:px-3 xl:py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow text-[9px]">{COPY.slider[lang]}</span>
        <span className="mono whitespace-nowrap text-xs text-[var(--amber)]">{prettyDay(day, lang)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Timeline"
        className="!my-1"
      />
    </section>
  );
}
