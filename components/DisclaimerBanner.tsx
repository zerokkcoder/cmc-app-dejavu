"use client";

import { COPY, type Lang } from "@/lib/i18n";

export default function DisclaimerBanner({ lang }: { lang: Lang }) {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-3 border-t border-[var(--border)] px-2 py-1.5 text-center text-[10px] text-[var(--muted)] xl:py-1">
      <span className="text-[var(--amber)]">{COPY.disclaimer[lang]}</span>
      <span className="hidden text-[var(--border)] xl:inline">|</span>
      <span className="text-[9px]">{COPY.proxyNote[lang]}</span>
    </footer>
  );
}
