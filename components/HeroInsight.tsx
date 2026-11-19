"use client";

import { COPY, type Lang } from "@/lib/i18n";
import { prettyDay } from "@/lib/utils/date";

export default function HeroInsight({ lang, day, insight }: { lang: Lang; day: string; insight: string }) {
  const note =
    lang === "zh"
      ? "该句由六维指纹与前向收益自动计算，非预先写好的文案。"
      : "Generated from the fingerprint matrix and forward returns, not hand-written copy.";

  return (
    <section className="grid gap-1 border-b border-[var(--border)] px-1 py-2 xl:grid-cols-[1fr_auto] xl:items-center xl:gap-6 xl:py-1.5">
      <div className="min-w-0">
        <div className="eyebrow mb-0.5 text-[9px]">
          {COPY.heroLabel[lang]} · {prettyDay(day, lang)}
        </div>
        <p
          title={note}
          className="text-sm leading-snug text-[var(--text)] sm:text-base xl:line-clamp-2 xl:text-[13px]"
        >
          {insight}
        </p>
      </div>
      <div className="mono text-[10px] leading-relaxed text-[var(--muted)] xl:text-right">
        <div className="eyebrow mb-0.5 text-[9px]">DATA SOURCE</div>
        <div>CoinMarketCap Pro API · #BuildwithCMC</div>
        <div className="hidden xl:block">Fear &amp; Greed / Global Metrics / Crypto Quotes</div>
      </div>
    </section>
  );
}
