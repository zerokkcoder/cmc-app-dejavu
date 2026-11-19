# CMC API notes — endpoints, traps, credits

[中文版](API_NOTES.zh-CN.md)

## Authentication and configuration

- Header: `X-CMC_PRO_API_KEY`. Base: `https://pro-api.coinmarketcap.com`.
- `.env.example` defines `CMC_API_KEY`. It is read only in `lib/cmc/client.ts` and `scripts/*` (server-side). Never prefix with `NEXT_PUBLIC_`.
- `.gitignore` includes `.env*` with `!.env.example`. If a key is ever committed, rotate it in the CMC developer portal immediately.
- CMC does **not** support CORS. The browser never calls CMC; the app imports a committed snapshot and optionally serves it via `/api/state`.

## Endpoint inventory

| Endpoint | Params used | Credit rule |
|---|---|---|
| `/v1/key/info` | — | 0 |
| `/v1/global-metrics/quotes/historical` | `time_start`, `time_end`, `interval=daily`, `count`, `convert=USD`, `aux=altcoin_market_cap` | 1 / 100 points |
| `/v1/global-metrics/quotes/latest` | `convert=USD` | flat |
| `/v3/fear-and-greed/historical` | `start` (1-based page offset), `limit<=500` | 1 / request |
| `/v3/fear-and-greed/latest` | — | flat |
| `/v1/altcoin-season-index/historical` | `timeframe=7d\|30d\|90d` | 1 / request |
| `/v3/cryptocurrency/quotes/historical` | `id`, `time_start`, `time_end`, `interval=daily`, `count`, `convert=USD` | 1 / 100 points |
| `/v3/cryptocurrency/listings/latest` | `limit=30`, `convert=USD` | 1 / request |
| `/v3/index/cmc100-latest` | — | flat |

## Credit budget for one full build

| Call | Credits |
|---|---:|
| global historical (1120 points) | 12 |
| BTC historical (1120 points) | 12 |
| top-30 historical (33,600 points, 4 batches of 8 IDs) | 336 |
| Fear & Greed (3 pages) | 3 |
| Altcoin Season 7/30/90 + latest | 4 |
| global latest / CMC100 / key info / listings | ~3 |
| **Total** | **347 (measured)** |

With the event's Startup tier at 450,000 credits/month, weekly refresh plus local rebuilds stay near ~1% of the allowance. `status.credit_count` is recorded per call in `data/manifest.json`.

## Verified by `npm run probe` (2026-11-19)

- Key plan: Startup, 450,000 credits/month, 600 requests/minute.
- Global historical first day: **2013-04-29** (not 2010); 4,951 rows available.
- BTC historical first day: 2010-07-14.
- Fear & Greed: 1,239 rows, 2023-06-29 → 2026-11-18, paged newest-first with `start` = page offset.
- Global historical `quote.USD` contains only `timestamp`, `total_market_cap`, `altcoin_market_cap` — **no `total_volume_24h`**, so A5 uses BTC volume instead.
- `/v3/cryptocurrency/quotes/historical` rejects more than **10,000 datapoints per request**; 8 IDs × 1120 days is the working batch size.

## Traps found in documentation

1. `error_code` is numeric on v1/v2 and a string on v3+. `lib/cmc/normalize.ts` coerces to string.
2. Timestamps appear as ISO strings, integer unix seconds and numeric strings. `toUtcMs` handles all three.
3. HTTP 200 with `error_code: "0"` can still carry an empty `data` for unknown identifiers. Validate payloads.
4. Historical endpoints return three shapes: `data.quotes[]` (global), `data[]` (Fear & Greed), `data[id].quotes[]` (crypto quotes).
5. `altcoin_market_cap` and other granular fields require explicit `aux` on global historical.
6. Official Altcoin Season Index history is limited to 7/30/90 days — no long-range series.
7. CMC100 historical caps `count` at 10 when a date range is supplied, so it is not used for the fingerprint.
8. 429 has four distinct error codes (minute/day/month/IP). `CmcClient` retries with exponential backoff.
9. No sandbox endpoint exists; the keyless public API is the zero-friction test path.

## What the API made possible / where it got in the way

**Possible:** first-party Fear & Greed, BTC dominance and global market-cap/volume series share one credit system and JSON envelope, making a six-dimensional fingerprint practical. `aux=altcoin_market_cap` enables an alt-rotation proxy. `status.credit_count` makes cost auditable.

**In the way:** no long-run official Altcoin Season Index history (proxy required); inconsistent paging semantics and timestamp formats; three incompatible historical response shapes; no sandbox; no RWA historical endpoint. These constraints are surfaced in the UI methodology note and in the docs rather than papered over.
