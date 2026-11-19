# DÉJÀVU · 市场既视感

**EN** | [中文](docs/README.zh-CN.md)

A one-screen market déjà-vu engine built entirely on CoinMarketCap Pro API data. It turns six CMC-native market indicators into a daily "state fingerprint", finds the most similar UTC days in history, and shows what actually happened over the following 7 / 30 / 90 days.

Built for **Build with CMC: API Hackathon Round 2 (Plushie)** — **Data and Visualisation** track. `#BuildwithCMC`

**Live demo:** https://cmc-app-dejavu.vercel.app/ · **Repository:** https://github.com/zerokkcoder/cmc-app-dejavu · **X post:** https://x.com/huanggz0315/status/2123317982155964574 · **Demo video:** https://www.youtube.com/watch?v=SYunm4i5CIw

> ✅ **DATA STATUS:** `data/snapshot.json` contains **real CMC API data** fetched with a Startup-tier key: 1,089 aligned UTC days (2023-11-26 → 2026-11-18), 347 credits consumed. Real raw responses with `status.credit_count` are in `data/evidence/*.sample.json`. `data/probe-report.json` records the verified field/plan probe. Refresh with `npm run probe && npm run snapshot`.

## Why it is different

- Most market tools show one indicator. DÉJÀVU compares a **six-dimensional state vector**.
- Similarity uses an **expanding-window z-score** (mean/std up to day *t* only), so historical points never see the future.
- Neighbours exclude the query day and a ±5-day window — otherwise "the most similar day" is trivially yesterday.
- Output is a 2D PCA constellation, a fingerprint radar, and real forward paths — not another price chart.

## Quick start

```bash
npm install
cp .env.example .env
# put your CMC key in .env as CMC_API_KEY=...
npm run probe          # verify field paths, history depth, plan (writes data/probe-report.json)
npm run snapshot       # fetch real CMC data -> data/snapshot.json + data/evidence/*.sample.json
npm test               # 8 unit tests including no-look-ahead and PCA checks
npm run dev            # http://localhost:3000
```

`CMC_API_KEY` is read **only server-side** in `lib/cmc/client.ts` and `scripts/*`. Never use a `NEXT_PUBLIC_` prefix. `.env*` is gitignored with `!.env.example`. The runtime app never calls CMC (no CORS support) — it imports the committed snapshot.

## CMC API endpoints used (named explicitly for the judges)

| Endpoint | Purpose |
|---|---|
| `/v1/key/info` | plan and credit self-check |
| `/v1/global-metrics/quotes/historical` | BTC dominance, total market cap, volume, `aux=altcoin_market_cap` |
| `/v1/global-metrics/quotes/latest` | current-state pulse strip |
| `/v3/fear-and-greed/historical` | Fear & Greed axis (paged with `start`/`limit`) |
| `/v3/fear-and-greed/latest` | current Fear & Greed |
| `/v1/altcoin-season-index/historical` | 7d / 30d / 90d current read only |
| `/v3/cryptocurrency/quotes/historical` | BTC forward returns + top-30 market breadth |
| `/v3/index/cmc100-latest` | supplementary current index read |
| `/v3/cryptocurrency/listings/latest` | resolve current top-30 coin IDs |

Credit cost of one full snapshot build: **347 credits (measured)**, vs. the event's 450,000/month Startup allowance (~0.08% per build). `status.credit_count` is recorded in `data/manifest.json`.

## What the API made possible / where it got in the way

**Made possible:** CMC's first-party Fear & Greed, BTC dominance and global cap/volume series can be pulled through one credit system and one JSON envelope, which makes a six-dimensional fingerprint feasible. `aux=altcoin_market_cap` unlocks an alt-rotation proxy. `status.credit_count` makes the cost auditable.

**Got in the way:** the official Altcoin Season Index exposes only 7/30/90-day history, so a long-run "alt season" axis had to be reconstructed from `altcap/totalcap`. Fear & Greed `start` semantics and timestamp formats are inconsistently documented. Historical endpoints return three different shapes (array, keyed dict, id map). There is no sandbox. See [API_NOTES](docs/API_NOTES.md).

## Docs

- [Product & users (中文)](docs/README.zh-CN.md) · [Methodology](docs/METHODOLOGY.md) · [API notes](docs/API_NOTES.md) · [Submission checklist](docs/SUBMISSION.md)
- All docs exist in English and Chinese pairs.

## Disclaimer

Similarity ≠ prediction. For data research only. Not investment advice.
