# Methodology — how the DÉJÀVU fingerprint works

[中文版](METHODOLOGY.zh-CN.md)

## 1. Data window

All timestamps are aligned to **UTC calendar day keys** (`YYYY-MM-DD`). The snapshot requests ~1120 daily points so that a ~1000-day fingerprint has 90 days of forward data available. A 180-day warm-up is discarded from neighbour selection.

## 2. The six axes

| # | Axis | CMC source | Computation | Normalization |
|---|---|---|---|---|
| A1 | Fear & Greed | `/v3/fear-and-greed/historical` `data[].value` | raw 0–100 | fixed `(v-50)/50` |
| A2 | BTC Dominance | global historical `btc_dominance` | raw | expanding z-score |
| A3 | Alt rotation (proxy) | `aux=altcoin_market_cap` / `total_market_cap` | `r_t / r_{t-30} - 1` | expanding z-score |
| A4 | Cap momentum 30d | `quote.USD.total_market_cap` | `cap_t / cap_{t-30} - 1` | expanding z-score |
| A5 | BTC volume momentum 30d | `/v3/cryptocurrency/quotes/historical` `quote.USD.volume_24h` (BTC id=1) | `log(v_t) - log(v_{t-30})` | expanding z-score |
| A6 | Breadth 30d | `/v3/cryptocurrency/quotes/historical` for current top-30 IDs | share of assets up over 30d | fixed `2b - 1` |

**A3 is a proxy, not the official Altcoin Season Index.** The official `/v1/altcoin-season-index/historical` accepts only `timeframe=7d|30d|90d` and has no long-range date parameter, so it cannot supply a 1000-day series. It is displayed only as a current reading in the pulse strip.

A5 uses BTC volume rather than total market volume because the Startup-tier global-metrics historical response does not include `total_volume_24h` (verified by `npm run probe`); `aux` cannot restore it. BTC volume is CMC-native and available daily since 2010.

A6 uses a fixed current top-30 universe. This introduces survivorship bias; the limitation is disclosed rather than hidden.

## 3. No look-ahead

For trending axes the z-score is **expanding**:

```
z_t = (x_t - mean(x_0..x_t)) / std(x_0..x_t)
```

Full-window statistics would leak post-*t* data into a historical fingerprint. Axes with natural bounds (Fear & Greed 0–100, breadth 0–1) use fixed scaling instead.

Unit tests assert that changing a value after index *i* leaves `z_i` unchanged, and that forward returns only reference indices strictly greater than the day.

## 4. Distance and neighbours

Distance is **standardized Euclidean** in 6 dimensions. Cosine distance was rejected because the magnitude of an extreme state is itself signal. Neighbours exclude the query day and a ±5-day window; otherwise the nearest neighbour of a day is trivially its adjacent day.

Similarity displayed in the UI is `1 / (1 + distance)` — a display convenience, not a probability.

## 5. Projection

2D PCA via covariance matrix and power iteration, implemented in `lib/analytics/pca.ts` with a fixed seed and no external dependency. The projection is descriptive; it does not affect neighbour selection.

## 6. What happened next

Forward returns are computed from the same CMC series: total market cap and BTC price at +7 / +30 / +90 days. Days without a full horizon return `null` and are labelled "pending" in the UI.

## 7. Automatic insight

For each axis, days in the bottom and top quintile are grouped and the median forward 30-day total-market-cap return is computed. The strongest absolute median becomes the bilingual hero sentence, along with its sample size. This is descriptive statistics, not a trading signal.

## 8. Honest limits

- Similarity ≠ prediction.
- No investment advice; no buy/sell/target language anywhere in the UI.
- The top-30 universe is fixed (survivorship bias).
- Fear & Greed depth, timestamp formats and `start` semantics are verified by `npm run probe` and recorded in `data/probe-report.json`.
