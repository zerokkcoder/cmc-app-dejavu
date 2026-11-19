import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { CmcClient } from "../lib/cmc/client";
import { CMC_ENDPOINTS } from "../lib/cmc/endpoints";
import { toUtcDay } from "../lib/cmc/normalize";

/** Day-1 verification: record real field paths, history start, paging semantics. */
async function main() {
  const client = new CmcClient();
  const keyInfo = await client.get<Record<string, unknown>>(CMC_ENDPOINTS.keyInfo);
  const result: Record<string, unknown> = {
    probedAt: new Date().toISOString(),
    keyPlan: keyInfo.envelope.data,
    creditsUsed: client.totalCredits,
  };

  const global = await client.get<{ quotes: Array<{ timestamp: string | number; quote?: { USD?: Record<string, unknown> } }> }>(
    CMC_ENDPOINTS.globalHistorical,
    { time_start: "2010-01-01T00:00:00.000Z", count: 10000, interval: "daily", convert: "USD", aux: "altcoin_market_cap" },
  );
  const quotes = global.envelope.data.quotes ?? [];
  result.globalHistorical = {
    rows: quotes.length,
    firstDay: quotes.length ? toUtcDay(quotes[0].timestamp) : null,
    lastDay: quotes.length ? toUtcDay(quotes[quotes.length - 1].timestamp) : null,
    firstRowFields: quotes.length ? Object.keys(quotes[0]) : [],
    usdFields: quotes.length ? Object.keys(quotes[0].quote?.USD ?? {}) : [],
    credits: global.record.creditCount,
  };

  const fgPages: Array<{ first: string | null; last: string | null; rows: number }> = [];
  for (let start = 1; start <= 2500; start += 500) {
    const page = await client.get<Array<{ timestamp: string | number; value: number }>>(
      CMC_ENDPOINTS.fearGreedHistorical,
      { start, limit: 500 },
    );
    const items = page.envelope.data ?? [];
    fgPages.push({
      first: items.length ? toUtcDay(items[0].timestamp) : null,
      last: items.length ? toUtcDay(items[items.length - 1].timestamp) : null,
      rows: items.length,
    });
    if (items.length < 500) break;
  }
  result.fearGreedHistorical = {
    pages: fgPages,
    totalRows: fgPages.reduce((s, p) => s + p.rows, 0),
    firstDay: fgPages.flatMap((p) => (p.first ? [p.first] : [])).sort()[0] ?? null,
    lastDay: fgPages.flatMap((p) => (p.last ? [p.last] : [])).sort().at(-1) ?? null,
  };

  const asn = await client.get(CMC_ENDPOINTS.altSeasonHistorical, { timeframe: "30d" });
  result.altSeasonHistorical = { shape: Object.keys(asn.envelope.data as object), credits: asn.record.creditCount };

  const btc = await client.get<Record<string, { quotes: Array<{ timestamp: string | number }> }>>(
    CMC_ENDPOINTS.quotesHistorical,
    { id: 1, time_start: "2010-01-01T00:00:00.000Z", count: 10000, interval: "daily", convert: "USD" },
  );
  const btcQuotes = btc.envelope.data["1"]?.quotes ?? [];
  result.btcQuotesHistorical = {
    rows: btcQuotes.length,
    firstDay: btcQuotes.length ? toUtcDay(btcQuotes[0].timestamp) : null,
    lastDay: btcQuotes.length ? toUtcDay(btcQuotes[btcQuotes.length - 1].timestamp) : null,
    credits: btc.record.creditCount,
  };

  result.creditsUsed = client.totalCredits;
  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(resolve(process.cwd(), "data/probe-report.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
