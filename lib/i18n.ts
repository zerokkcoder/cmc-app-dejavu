export type Lang = "zh" | "en";

export const COPY = {
  tagline: { zh: "市场既视感 · 历史近邻搜索引擎", en: "Market déjà vu · a historical nearest-neighbour engine" },
  heroLabel: { zh: "本周市场状态", en: "MARKET STATE RIGHT NOW" },
  constellation: { zh: "历史市场状态星图", en: "HISTORICAL STATE CONSTELLATION" },
  constellationHint: {
    zh: "每个点是一天。拖动时间轴，寻找与当下最相似的时刻。",
    en: "Each point is a UTC day. Drag the timeline to find moments that resemble today.",
  },
  fingerprint: { zh: "状态指纹对比", en: "FINGERPRINT COMPARISON" },
  neighbours: { zh: "最相似的 8 天", en: "8 MOST SIMILAR DAYS" },
  forward: { zh: "随后 90 天的真实路径", en: "WHAT HAPPENED OVER THE NEXT 90 DAYS" },
  slider: { zh: "时间轴", en: "TIMELINE" },
  similarity: { zh: "相似度", en: "similarity" },
  pending: { zh: "待揭晓", en: "pending" },
  medianBand: { zh: "近邻中位数", en: "neighbour median" },
  disclaimer: {
    zh: "历史相似不等于未来重复 · 仅供数据研究，不构成投资建议",
    en: "Similarity ≠ prediction. For data research only. Not investment advice.",
  },
  proxyNote: {
    zh: "山寨轮动为代理指标（官方山寨季指数仅提供 7/30/90 天历史）",
    en: "Alt rotation is a proxy (official Altcoin Season Index history covers only 7/30/90d)",
  },
  dataThrough: { zh: "数据截至", en: "DATA THROUGH" },
  credits: { zh: "本次构建消耗积分", en: "BUILD CREDITS" },
} as const;

export type CopyKey = keyof typeof COPY;
