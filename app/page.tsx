"use client";

import { useMemo, useState } from "react";
import ObservatoryHeader from "@/components/ObservatoryHeader";
import HeroInsight from "@/components/HeroInsight";
import ApiPulseStrip from "@/components/ApiPulseStrip";
import ConstellationMap from "@/components/ConstellationMap";
import FingerprintRadar from "@/components/FingerprintRadar";
import TimeSlider from "@/components/TimeSlider";
import NeighborCards from "@/components/NeighborCards";
import ForwardPaths from "@/components/ForwardPaths";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import DemoBanner from "@/components/DemoBanner";
import { insightText, isPlaceholder, snapshot } from "@/lib/data/loadSnapshot";
import type { Lang } from "@/lib/i18n";

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [index, setIndex] = useState(snapshot.currentIndex);

  const minIndex = useMemo(() => snapshot.valid.findIndex(Boolean), []);
  const maxIndex = useMemo(() => {
    for (let i = snapshot.valid.length - 1; i >= 0; i -= 1) if (snapshot.valid[i]) return i;
    return 0;
  }, []);
  const safeIndex = Math.min(Math.max(index, minIndex < 0 ? 0 : minIndex), maxIndex);
  const neighbours = snapshot.neighbours[String(safeIndex)] ?? [];

  if (isPlaceholder() || snapshot.days.length === 0) {
    return (
      <main className="min-h-screen px-4">
        <ObservatoryHeader lang={lang} onLang={setLang} coverageEnd="—" credits={0} />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-2xl tracking-[0.2em] text-[var(--amber)] mono">DÉJÀVU</h1>
          <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
            {lang === "zh"
              ? "尚未生成数据快照。请先配置 CMC_API_KEY，然后运行 npm run snapshot。"
              : "No data snapshot yet. Configure CMC_API_KEY, then run npm run snapshot."}
          </p>
        </div>
        <DisclaimerBanner lang={lang} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1920px] flex-col px-3 pb-2 lg:px-5 xl:h-screen xl:overflow-hidden xl:py-2 2xl:py-3">
      {snapshot.meta.generatedAt === "synthetic-demo" && <DemoBanner lang={lang} />}
      <ObservatoryHeader
        lang={lang}
        onLang={setLang}
        coverageEnd={snapshot.meta.coverageEnd}
        credits={snapshot.meta.totalCredits}
      />
      <HeroInsight lang={lang} day={snapshot.days[safeIndex]} insight={insightText(lang)} />

      <section className="grid min-h-0 flex-1 gap-3 py-3 xl:grid-cols-12">
        <div className="flex min-h-0 flex-col gap-3 xl:col-span-5">
          <div className="min-h-[380px] flex-1 xl:min-h-0">
            <ConstellationMap
              snapshot={snapshot}
              index={safeIndex}
              neighbours={neighbours}
              onSelect={setIndex}
              lang={lang}
            />
          </div>
          <TimeSlider
            min={minIndex}
            max={maxIndex}
            value={safeIndex}
            onChange={setIndex}
            lang={lang}
            day={snapshot.days[safeIndex]}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-3 xl:col-span-3">
          <div className="min-h-[300px] flex-1 xl:min-h-0">
            <FingerprintRadar
              snapshot={snapshot}
              index={safeIndex}
              neighbourIndex={neighbours[0]?.index}
              lang={lang}
            />
          </div>
          <ApiPulseStrip snapshot={snapshot} />
        </div>

        <div className="flex min-h-0 flex-col gap-3 xl:col-span-4">
          <div className="min-h-[320px] flex-[1.15] xl:min-h-0">
            <NeighborCards snapshot={snapshot} neighbours={neighbours} lang={lang} onSelect={setIndex} />
          </div>
          <div className="min-h-[220px] flex-1 xl:min-h-0">
            <ForwardPaths snapshot={snapshot} index={safeIndex} neighbours={neighbours} lang={lang} />
          </div>
        </div>
      </section>

      <DisclaimerBanner lang={lang} />
    </main>
  );
}
