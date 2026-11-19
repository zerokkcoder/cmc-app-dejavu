import type { CmcClient } from "../lib/cmc/client";
import { CMC_ENDPOINTS } from "../lib/cmc/endpoints";
import {
  normalizeCryptoPoint,
  normalizeFearGreedPoint,
  normalizeGlobalPoint,
  toUtcDay,
} from "../lib/cmc/normalize";
import { shiftDay, utcDay } from "../lib/utils/date";

export const WINDOW_DAYS = 1120;

export type RawData = {
  global: Map<string, { cap: number; volume?: number; altcap?: number; btcDominance?: number }>;
  fearGreed: Map<string, number>;
  btc: Map<string, number>;
  btcVolume: Map<string, number>;
  topIds: number[];
  topPrices: Map<string, Map<number, number>>;
  latest: {
    global?: unknown;
    fearGreed?: unknown;
    altSeason7d?: unknown;
    altSeason30d?: unknown;
    altSeason90d?: unknown;
    cmc100?: unknown;
  };
  rawEnvelopes: Record<string, unknown>;
};

type GlobalPoint = Parameters<typeof normalizeGlobalPoint>[0];
type FearGreedPoint = Parameters<typeof normalizeFearGreedPoint>[0];
type CryptoPoint = Parameters<typeof normalizeCryptoPoint>[0];

/** Fetch every CMC series needed to build the DÉJÀVU snapshot. */
export async function fetchAll(client: CmcClient): Promise<RawData> {
  const firstProbe = await client.get<{ quotes: GlobalPoint[] }>(
    CMC_ENDPOINTS.globalHistorical,
    { count: 2, interval: "daily", convert: "USD" },
  );
  const firstPoints = firstProbe.envelope.data.quotes ?? [];
  const endDate = firstPoints.length
    ? toUtcDay(firstPoints[firstPoints.length - 1].timestamp)
    : utcDay(new Date());
  const startDate = shiftDay(endDate, -(WINDOW_DAYS - 1));

  const globalResp = await client.get<{ quotes: GlobalPoint[] }>(
    CMC_ENDPOINTS.globalHistorical,
    {
      time_start: `${startDate}T00:00:00.000Z`,
      time_end: `${endDate}T23:59:59.999Z`,
      interval: "daily",
      count: WINDOW_DAYS,
      convert: "USD",
      aux: "altcoin_market_cap",
    },
  );
  const global = new Map<string, { cap: number; volume?: number; altcap?: number; btcDominance?: number }>();
  for (const p of globalResp.envelope.data.quotes ?? []) {
    const n = normalizeGlobalPoint(p);
    global.set(n.day, { cap: n.cap, volume: n.volume, altcap: n.altcap, btcDominance: n.btcDominance });
  }

  const fearGreed = new Map<string, number>();
  for (let start = 1; start <= 1500; start += 500) {
    const page = await client.get<FearGreedPoint[]>(CMC_ENDPOINTS.fearGreedHistorical, {
      start,
      limit: 500,
    });
    const items = page.envelope.data ?? [];
    for (const p of items) {
      const n = normalizeFearGreedPoint(p);
      fearGreed.set(n.day, n.value);
    }
    if (items.length < 500) break;
  }

  const btcResp = await client.get<Record<string, { quotes: CryptoPoint[] }>>(
    CMC_ENDPOINTS.quotesHistorical,
    {
      id: 1,
      time_start: `${startDate}T00:00:00.000Z`,
      time_end: `${endDate}T23:59:59.999Z`,
      interval: "daily",
      count: WINDOW_DAYS,
      convert: "USD",
    },
  );
  const btc = new Map<string, number>();
  const btcVolume = new Map<string, number>();
  const btcItem = btcResp.envelope.data["1"];
  for (const p of btcItem?.quotes ?? []) {
    const n = normalizeCryptoPoint(p);
    btc.set(n.day, n.price);
    if (n.volume) btcVolume.set(n.day, n.volume);
  }

  const listings = await client.get<Array<{ id: number }>>(
    "/v3/cryptocurrency/listings/latest",
    { limit: 30, convert: "USD" },
  );
  const topIds = (listings.envelope.data ?? []).map((c) => c.id);

  const topPrices = new Map<string, Map<number, number>>();
  // CMC caps a request at 10,000 datapoints; 8 ids x 1120 days stays under it.
  for (let i = 0; i < topIds.length; i += 8) {
    const batch = topIds.slice(i, i + 8);
    const resp = await client.get<Record<string, { quotes: CryptoPoint[] }>>(
      CMC_ENDPOINTS.quotesHistorical,
      {
        id: batch.join(","),
        time_start: `${startDate}T00:00:00.000Z`,
        time_end: `${endDate}T23:59:59.999Z`,
        interval: "daily",
        count: WINDOW_DAYS,
        convert: "USD",
      },
    );
    for (const [id, item] of Object.entries(resp.envelope.data)) {
      for (const p of (item as { quotes?: CryptoPoint[] }).quotes ?? []) {
        const n = normalizeCryptoPoint(p);
        if (!topPrices.has(n.day)) topPrices.set(n.day, new Map());
        topPrices.get(n.day)!.set(Number(id), n.price);
      }
    }
  }

  const [globalLatest, fgLatest, as7d, as30d, as90d, cmc100] = await Promise.all([
    client.get(CMC_ENDPOINTS.globalLatest, { convert: "USD" }),
    client.get(CMC_ENDPOINTS.fearGreedLatest),
    client.get(CMC_ENDPOINTS.altSeasonHistorical, { timeframe: "7d" }),
    client.get(CMC_ENDPOINTS.altSeasonHistorical, { timeframe: "30d" }),
    client.get(CMC_ENDPOINTS.altSeasonHistorical, { timeframe: "90d" }),
    client.get(CMC_ENDPOINTS.cmc100Latest),
  ]);

  return {
    global,
    fearGreed,
    btc,
    btcVolume,
    topIds,
    topPrices,
    latest: {
      global: globalLatest.envelope.data,
      fearGreed: fgLatest.envelope.data,
      altSeason7d: as7d.envelope.data,
      altSeason30d: as30d.envelope.data,
      altSeason90d: as90d.envelope.data,
      cmc100: cmc100.envelope.data,
    },
    rawEnvelopes: {
      globalHistorical: globalResp.envelope,
      btcQuotesHistorical: btcResp.envelope,
      listingsLatest: listings.envelope,
      globalLatest: globalLatest.envelope,
      fearGreedLatest: fgLatest.envelope,
      altSeason7d: as7d.envelope,
      altSeason30d: as30d.envelope,
      altSeason90d: as90d.envelope,
      cmc100Latest: cmc100.envelope,
    },
  };
}
