import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildFingerprint } from "../lib/analytics/fingerprint";
import { topK } from "../lib/analytics/distance";
import { pca2d } from "../lib/analytics/pca";
import { attachForwardReturns } from "../lib/analytics/forwardReturns";
import { generateInsight } from "../lib/analytics/insight";
import { AXIS_COUNT } from "../lib/analytics/fingerprint";

/**
 * SYNTHETIC DEMO DATA ONLY.
 * Generated when the CMC API domain is unreachable from the build environment.
 * Never present this as real API evidence. Run `npm run snapshot` with a working
 * CMC_API_KEY/network to overwrite data/snapshot.json with real data.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 1120;
const rand = mulberry32(20261119);
const days: string[] = [];
for (let i = 0; i < N; i += 1) {
  days.push(new Date(Date.UTC(2022, 10, 20 + i)).toISOString().slice(0, 10));
}

let cap = 900e9;
let btcPrice = 17000;
let btcDominance = 42;
let fearGreed = 45;
const global = new Map<string, { cap: number; volume: number; altcap?: number; btcDominance?: number }>();
const fg = new Map<string, number>();
const btc = new Map<string, number>();
const btcVolume = new Map<string, number>();
const breadth = new Map<string, number>();
const topPrices = new Map<string, Map<number, number>>();

for (let i = 0; i < N; i += 1) {
  const shock = (rand() - 0.5) * 0.07 + Math.sin(i / 90) * 0.006;
  const regime = i > 250 && i < 420 ? -0.002 : i > 700 && i < 820 ? 0.004 : 0.0005;
  cap *= 1 + shock + regime;
  btcPrice *= 1 + shock * 1.25 + regime * 0.6;
  btcDominance = Math.max(30, Math.min(60, btcDominance + (rand() - 0.5) * 0.35));
  fearGreed = Math.max(5, Math.min(95, fearGreed + (rand() - 0.5) * 7));
  global.set(days[i], {
    cap,
    volume: cap * (0.025 + rand() * 0.03),
    altcap: cap * (1 - btcDominance / 100) * (0.9 + rand() * 0.2),
    btcDominance,
  });
  fg.set(days[i], Math.round(fearGreed));
  btc.set(days[i], btcPrice);
  btcVolume.set(days[i], cap * (0.01 + rand() * 0.02));
  breadth.set(days[i], Math.max(0.05, Math.min(0.95, breadth.get(days[i - 30]) ?? 0.5)));
  const prices = new Map<number, number>();
  for (let id = 1; id <= 30; id += 1) prices.set(id, btcPrice * (0.02 + rand() * 0.2));
  topPrices.set(days[i], prices);
  if (i >= 30) {
    const now = topPrices.get(days[i])!;
    const before = topPrices.get(days[i - 30])!;
    let up = 0;
    for (const [id, p] of now) if (p > (before.get(id) ?? p)) up += 1;
    breadth.set(days[i], up / 30);
  }
}

const fp = buildFingerprint({
  days,
  fearGreed: fg,
  global,
  volume: btcVolume,
  breadth,
});
const pca = pca2d(fp.matrix);
const forward = attachForwardReturns(days, new Map([...global].map(([d, v]) => [d, v.cap])), btc);
const neighbours: Record<string, ReturnType<typeof topK>> = {};
for (let i = 0; i < fp.days.length; i += 1) if (fp.valid[i]) neighbours[String(i)] = topK(fp, i, 8);
const insight = generateInsight(fp, forward, 30);

const allDays = [...global.keys()].sort();
const position = new Map(allDays.map((d, i) => [d, i]));
const paths: Record<string, Array<number | null>> = {};
for (let i = 0; i < fp.days.length; i += 1) {
  const base = global.get(fp.days[i])!.cap;
  paths[String(i)] = Array.from({ length: 91 }, (_, k) => {
    const future = allDays[(position.get(fp.days[i]) ?? 0) + k];
    const value = future ? global.get(future)!.cap : undefined;
    return value ? value / base - 1 : null;
  });
}

const matrix: number[][] = [];
for (let i = 0; i < fp.matrix.length / AXIS_COUNT; i += 1) {
  matrix.push(Array.from(fp.matrix.slice(i * AXIS_COUNT, (i + 1) * AXIS_COUNT)));
}
const pcaRows: number[][] = [];
for (let i = 0; i < pca.length / 2; i += 1) pcaRows.push([pca[i * 2], pca[i * 2 + 1]]);

const snapshot = {
  meta: {
    generatedAt: "synthetic-demo",
    coverageStart: fp.days[0],
    coverageEnd: fp.days.at(-1),
    alignedDays: fp.days.length,
    warmupDays: 180,
    totalCredits: 0,
    keyPlan: "SYNTHETIC-DEMO",
    calls: [],
    fearGreedCoverage: { start: fp.days[0], end: fp.days.at(-1), count: fg.size },
    topIds: Array.from({ length: 30 }, (_, i) => i + 1),
  },
  latest: {
    global: { data: { btc_dominance: btcDominance, quote: { USD: { total_market_cap: cap } } } },
    fearGreed: { data: { value: Math.round(fearGreed) } },
    altSeason30d: { data: { points: [{ value: 58 }] } },
    cmc100: { data: [{ value: 1000 }] },
  },
  days: fp.days,
  valid: fp.valid,
  matrix,
  pca: pcaRows,
  forward,
  paths,
  neighbours,
  insight,
  currentIndex: fp.days.length - 1,
};

writeFileSync(resolve(process.cwd(), "data/snapshot.json"), JSON.stringify(snapshot));
console.log(`Synthetic demo snapshot written: ${fp.days.length} days.`);
