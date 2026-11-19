import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { CmcClient } from "../lib/cmc/client";
import { CMC_ENDPOINTS } from "../lib/cmc/endpoints";
import { AXIS_COUNT, buildFingerprint, type FingerprintInput } from "../lib/analytics/fingerprint";
import { topK } from "../lib/analytics/distance";
import { pca2d } from "../lib/analytics/pca";
import { attachForwardReturns } from "../lib/analytics/forwardReturns";
import { generateInsight } from "../lib/analytics/insight";
import { fetchAll, type RawData } from "./fetch-all";

const ROOT = resolve(process.cwd());

function buildBreadth(raw: RawData): Map<string, number> {
  const days = [...raw.global.keys()].sort();
  const breadth = new Map<string, number>();
  for (let i = 30; i < days.length; i += 1) {
    const now = raw.topPrices.get(days[i]);
    const before = raw.topPrices.get(days[i - 30]);
    if (!now || !before) continue;
    let up = 0;
    let counted = 0;
    for (const [id, price] of now) {
      const old = before.get(id);
      if (old === undefined || old <= 0) continue;
      counted += 1;
      if (price > old) up += 1;
    }
    if (counted >= 10) breadth.set(days[i], up / counted);
  }
  return breadth;
}

function matrixToArrays(matrix: Float64Array): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < matrix.length / AXIS_COUNT; i += 1) {
    rows.push(Array.from(matrix.slice(i * AXIS_COUNT, (i + 1) * AXIS_COUNT)));
  }
  return rows;
}

function pcaToArrays(pca: Float64Array): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < pca.length / 2; i += 1) rows.push([pca[i * 2], pca[i * 2 + 1]]);
  return rows;
}

async function main() {
  const client = new CmcClient();
  const keyInfo = await client.get<Record<string, unknown>>(CMC_ENDPOINTS.keyInfo);
  const raw = await fetchAll(client);

  const breadth = buildBreadth(raw);
  const capByDay = new Map([...raw.global].map(([d, v]) => [d, v.cap]));
  const forward = attachForwardReturns([...raw.global.keys()].sort(), capByDay, raw.btc);

  const input: FingerprintInput = {
    days: [...raw.global.keys()].sort(),
    fearGreed: raw.fearGreed,
    global: raw.global,
    volume: raw.btcVolume,
    breadth,
  };
  const fp = buildFingerprint(input);
  if (fp.days.length < 300) {
    throw new Error(
      `Not enough aligned days: ${fp.days.length}. counts global=${raw.global.size} fg=${raw.fearGreed.size} btc=${raw.btc.size} vol=${raw.btcVolume.size} breadth=${breadth.size} ids=${raw.topIds.length}`,
    );
  }

  const pca = pca2d(fp.matrix);
  const neighbours: Record<string, Array<{ index: number; day: string; distance: number; similarity: number }>> = {};
  for (let i = 0; i < fp.days.length; i += 1) {
    if (!fp.valid[i]) continue;
    neighbours[String(i)] = topK(fp, i, 8);
  }

  const insight = generateInsight(fp, forward, 30);
  const lastValid = fp.days.length - 1;

  const allGlobalDays = [...raw.global.keys()].sort();
  const globalPosition = new Map(allGlobalDays.map((d, i) => [d, i]));
  const paths: Record<string, Array<number | null>> = {};
  for (let i = 0; i < fp.days.length; i += 1) {
    const base = capByDay.get(fp.days[i]);
    const series: Array<number | null> = [];
    for (let k = 0; k <= 90; k += 1) {
      const futureDay = allGlobalDays[(globalPosition.get(fp.days[i]) ?? 0) + k];
      const value = futureDay ? capByDay.get(futureDay) : undefined;
      series.push(base && value ? value / base - 1 : null);
    }
    paths[String(i)] = series;
  }

  const snapshot = {
    meta: {
      generatedAt: new Date().toISOString(),
      coverageStart: fp.days[0],
      coverageEnd: fp.days[fp.days.length - 1],
      alignedDays: fp.days.length,
      warmupDays: 180,
      totalCredits: client.totalCredits,
      keyPlan:
        (keyInfo.envelope.data as { plan?: { credit_limit_monthly?: number } })?.plan
          ?.credit_limit_monthly === 450000
          ? "Startup"
          : "unknown",
      calls: client.calls,
      fearGreedCoverage: {
        start: [...raw.fearGreed.keys()].sort()[0],
        end: [...raw.fearGreed.keys()].sort().at(-1),
        count: raw.fearGreed.size,
      },
      topIds: raw.topIds,
    },
    latest: raw.latest,
    days: fp.days,
    valid: fp.valid,
    matrix: matrixToArrays(fp.matrix),
    pca: pcaToArrays(pca),
    forward,
    neighbours,
    paths,
    insight,
    currentIndex: lastValid,
  };

  mkdirSync(resolve(ROOT, "data"), { recursive: true });
  writeFileSync(resolve(ROOT, "data/snapshot.json"), JSON.stringify(snapshot));
  writeFileSync(
    resolve(ROOT, "data/manifest.json"),
    JSON.stringify(
      {
        generatedAt: snapshot.meta.generatedAt,
        coverageStart: snapshot.meta.coverageStart,
        coverageEnd: snapshot.meta.coverageEnd,
        alignedDays: snapshot.meta.alignedDays,
        totalCredits: snapshot.meta.totalCredits,
        keyPlan: snapshot.meta.keyPlan,
        endpoints: [...new Set(client.calls.map((c) => c.endpoint))],
      },
      null,
      2,
    ),
  );

  // Raw API responses with credit_count — submission evidence for the judges.
  mkdirSync(resolve(ROOT, "data/evidence"), { recursive: true });
  for (const [name, envelope] of Object.entries(raw.rawEnvelopes)) {
    if (envelope === undefined) continue;
    writeFileSync(
      resolve(ROOT, `data/evidence/${name}.sample.json`),
      JSON.stringify(envelope, null, 2),
    );
  }

  console.log(
    JSON.stringify(
      {
        alignedDays: fp.days.length,
        coverage: [snapshot.meta.coverageStart, snapshot.meta.coverageEnd],
        fearGreedDays: raw.fearGreed.size,
        credits: snapshot.meta.totalCredits,
        insight: insight?.zh ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
