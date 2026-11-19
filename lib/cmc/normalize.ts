import type { CryptoQuotePoint, FearGreedPoint, GlobalQuotePoint } from "./types";

/** CMC returns numeric error codes on v1/v2 and string codes on v3+. */
export function errorCode(value: number | string | undefined): string {
  return value === undefined ? "unknown" : String(value);
}

export function isSuccess(errorCodeValue: number | string | undefined): boolean {
  return errorCode(errorCodeValue) === "0";
}

/**
 * CMC timestamps appear as ISO strings, integer unix seconds, or numeric strings.
 * Always convert to UTC milliseconds.
 */
export function toUtcMs(value: string | number): number {
  if (typeof value === "number") {
    return value < 1e12 ? value * 1000 : value;
  }
  if (/^\d+$/.test(value.trim())) {
    const n = Number(value);
    return n < 1e12 ? n * 1000 : n;
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new Error(`Unparseable CMC timestamp: ${value}`);
  return ms;
}

/** UTC calendar day key. Never use toLocaleDateString (local timezone contamination). */
export function toUtcDay(value: string | number): string {
  return new Date(toUtcMs(value)).toISOString().slice(0, 10);
}

function pickNumber(...candidates: unknown[]): number | undefined {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
    if (typeof c === "string" && c.trim() !== "" && Number.isFinite(Number(c))) return Number(c);
  }
  return undefined;
}

/** Normalize a global-metrics history point; supports nested and flattened shapes. */
export function normalizeGlobalPoint(p: GlobalQuotePoint): {
  day: string;
  cap: number;
  volume?: number;
  altcap?: number;
  btcDominance?: number;
} {
  const cap = pickNumber(p.quote?.USD?.total_market_cap, p.total_market_cap);
  if (cap === undefined) {
    throw new Error("global-metrics point missing total_market_cap");
  }
  return {
    day: toUtcDay(p.timestamp),
    cap,
    // Historical global-metrics does not expose total_volume_24h on Startup.
    volume: pickNumber(p.quote?.USD?.total_volume_24h, p.total_volume_24h),
    altcap: pickNumber(p.quote?.USD?.altcoin_market_cap, p.altcoin_market_cap),
    btcDominance: pickNumber(p.btc_dominance),
  };
}

export function normalizeFearGreedPoint(p: FearGreedPoint): { day: string; value: number } {
  return { day: toUtcDay(p.timestamp), value: p.value };
}

export function normalizeCryptoPoint(p: CryptoQuotePoint): { day: string; price: number; volume?: number } {
  const price = pickNumber(p.quote?.USD?.price, p.price);
  if (price === undefined) throw new Error("crypto quote point missing price");
  return {
    day: toUtcDay(p.timestamp),
    price,
    volume: pickNumber(p.quote?.USD?.volume_24h, p.volume_24h),
  };
}
