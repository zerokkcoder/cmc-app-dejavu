"use client";

import Image from "next/image";
import { COPY, type Lang } from "@/lib/i18n";

export default function ObservatoryHeader({
  lang,
  onLang,
  coverageEnd,
  credits,
}: {
  lang: Lang;
  onLang: (lang: Lang) => void;
  coverageEnd: string;
  credits: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] px-1 py-2 xl:py-1.5">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt=""
          width={30}
          height={30}
          priority
          unoptimized
          className="shrink-0"
        />
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-semibold tracking-[0.2em] text-[var(--amber)] mono xl:text-lg">DÉJÀVU</span>
          <span className="text-xs text-[var(--muted)] xl:hidden sm:text-sm">{COPY.tagline[lang]}</span>
          <span className="hidden text-xs text-[var(--muted)] 2xl:inline">{COPY.tagline[lang]}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs xl:gap-4">
        <div className="hidden sm:block text-right">
          <div className="eyebrow">{COPY.dataThrough[lang]} UTC</div>
          <div className="mono text-[var(--text)]">{coverageEnd}</div>
        </div>
        <div className="hidden md:block text-right">
          <div className="eyebrow">{COPY.credits[lang]}</div>
          <div className="mono text-[var(--cyan)]">{credits.toLocaleString()}</div>
        </div>
        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 mono text-[10px] text-[var(--muted)]">
          STARTUP
        </span>
        <button
          onClick={() => onLang(lang === "zh" ? "en" : "zh")}
          className="rounded border border-[var(--border)] px-2 py-0.5 text-[var(--text)] transition-colors hover:border-[var(--cyan)]"
          aria-label="Switch language"
        >
          {lang === "zh" ? "EN" : "中文"}
        </button>
        <a
          href="https://github.com/zerokkcoder/cmc-app-dejavu"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--muted)] hover:text-[var(--text)]"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
