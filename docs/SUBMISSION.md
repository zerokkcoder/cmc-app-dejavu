# DoraHacks submission checklist

[中文版](SUBMISSION.zh-CN.md)

Event: Build with CMC: API Hackathon Round 2 (Plushie)
Track: **Data and Visualisation**
Deadline: **2026-12-09 23:59 UTC** (submit by 12/07 to leave buffer)

## Required items

- [ ] Public GitHub repository (not private)
- [ ] Working deployed demo or screen recording
- [x] X/Twitter post containing the DoraHacks link + demo video + `#BuildwithCMC`; paste post URL into the form
  - **Published 2026-11-19:** https://x.com/huanggz0315/status/2123317982155964574 (author @huanggz0315)
  - Verified live content: `#BuildwithCMC`, live demo, demo video, DoraHacks link.
  - ⚠️ The link labelled "BUIDL" currently points to the **event detail page** (`https://dorahacks.io/hackathon/coinmarketcap-api-202611/detail`), not a BUIDL submission page. After the BUIDL is created, edit/repost with the real BUIDL URL if the judges require it.
- [ ] Explicitly named CMC API endpoints (see table in root README and `API_NOTES.md`)
- [ ] Visible evidence of real API calls: code AND response (`data/evidence/*.sample.json` + `scripts/fetch-all.ts`)
- [ ] Short note on "what the API made possible / where it got in the way" (README + `API_NOTES.md`)
- [ ] One track selected only

## Before submission — data gate

The committed snapshot must be **real**, not synthetic:

```bash
npm run probe        # writes data/probe-report.json — verify plan, field paths, history depth
npm run snapshot     # overwrites data/snapshot.json, writes data/evidence/*.sample.json
npm run test && npm run build
```

Current status (verified 2026-11-19): `meta.generatedAt` is a real ISO timestamp, `keyPlan = Startup`, 1,089 aligned days, 347 credits, 9 evidence files. If `meta.generatedAt === "synthetic-demo"` or `meta.keyPlan === "SYNTHETIC-DEMO"`, **do not submit** — a red banner appears in the UI in that state.

## Deployment

```bash
npm run build
# deploy the project root to Vercel; no environment variable is needed at runtime
```

The runtime never calls CMC, so no `CMC_API_KEY` is required on Vercel. Keep the key local/CI-only.

**Live demo (already deployed):** https://cmc-app-dejavu.vercel.app/

## Recording script (3–5 minutes)

1. Show the constellation and say what each point means.
2. Drag the timeline to a historical day; show radar + neighbours update.
3. Explain the expanding z-score and the ±5-day exclusion (no look-ahead).
4. Show the forward paths and the median band.
5. Show `data/evidence/*.sample.json` with `status.credit_count` and name the endpoints.
6. End on the disclaimer: similarity ≠ prediction.

## X post

Published: https://x.com/huanggz0315/status/2123317982155964574

> Built DÉJÀVU for #BuildwithCMC — a market déjà-vu engine from @CoinMarketCap data. 6-dim fingerprint → most similar day in 1,089 → what happened next. Live: https://cmc-app-dejavu.vercel.app/ · BUIDL: https://dorahacks.io/hackathon/coinmarketcap-api-202611/detail · Demo: https://www.youtube.com/watch?v=SYunm4i5CIw

Demo video: https://www.youtube.com/watch?v=SYunm4i5CIw

## Compliance

- No investment advice, no buy/sell/target language.
- Never commit `CMC_API_KEY`; rotate immediately if leaked.
- Winners must pass sanctions screening; prizes are not cash-convertible.
