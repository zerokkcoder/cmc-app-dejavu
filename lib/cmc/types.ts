export type CmcStatus = {
  timestamp?: string;
  error_code: number | string;
  error_message?: string;
  elapsed?: number;
  credit_count?: number;
};

export type CmcEnvelope<T> = {
  data: T;
  status: CmcStatus;
};

/** /v1/global-metrics/quotes/historical -> data.quotes[] */
export type GlobalQuotePoint = {
  timestamp: string | number;
  btc_dominance?: number | null;
  eth_dominance?: number | null;
  active_cryptocurrencies?: number;
  quote?: {
    USD?: {
      total_market_cap?: number;
      total_volume_24h?: number;
      altcoin_market_cap?: number;
      altcoin_volume_24h?: number;
    };
  };
  // Some docs show a flattened shape; normalizer supports both.
  total_market_cap?: number;
  total_volume_24h?: number;
  altcoin_market_cap?: number;
};

/** /v3/fear-and-greed/historical -> data[] */
export type FearGreedPoint = {
  timestamp: string | number;
  value: number;
  value_classification?: string;
};

/** /v3/cryptocurrency/quotes/historical -> data[id].quotes[] */
export type CryptoQuotePoint = {
  timestamp: string | number;
  quote?: {
    USD?: { price?: number; market_cap?: number; volume_24h?: number };
  };
  price?: number;
  volume_24h?: number;
};

export type ApiCallRecord = {
  endpoint: string;
  params: Record<string, string | number | undefined>;
  creditCount: number;
  fetchedAt: string;
  rowCount: number;
};
