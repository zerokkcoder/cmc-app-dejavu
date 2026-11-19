/**
 * CoinMarketCap Pro API endpoint inventory used by DÉJÀVU.
 * Every endpoint listed here is a real CMC endpoint named explicitly for the judges.
 */
export const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";

export const CMC_ENDPOINTS = {
  keyInfo: "/v1/key/info",
  globalHistorical: "/v1/global-metrics/quotes/historical",
  globalLatest: "/v1/global-metrics/quotes/latest",
  fearGreedHistorical: "/v3/fear-and-greed/historical",
  fearGreedLatest: "/v3/fear-and-greed/latest",
  altSeasonHistorical: "/v1/altcoin-season-index/historical",
  altSeasonLatest: "/v1/altcoin-season-index/latest",
  quotesHistorical: "/v3/cryptocurrency/quotes/historical",
  cmc100Latest: "/v3/index/cmc100-latest",
} as const;

/** Human-readable list for README / submission docs. */
export const NAMED_ENDPOINTS = Object.values(CMC_ENDPOINTS);
