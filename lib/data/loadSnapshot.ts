import snapshotJson from "@/data/snapshot.json";
import type { ForwardResult } from "@/lib/analytics/forwardReturns";
import type { GeneratedInsight } from "@/lib/analytics/insight";
import type { Lang } from "@/lib/i18n";

export type Snapshot = {
  meta: {
    generatedAt: string;
    coverageStart: string;
    coverageEnd: string;
    alignedDays: number;
    warmupDays: number;
    totalCredits: number;
    keyPlan: string;
    calls: Array<{ endpoint: string; creditCount: number; rowCount: number; fetchedAt: string }>;
    fearGreedCoverage: { start: string; end: string; count: number };
    topIds: number[];
  };
  latest: Record<string, unknown>;
  days: string[];
  valid: boolean[];
  matrix: number[][];
  pca: number[][];
  forward: ForwardResult;
  paths: Record<string, Array<number | null>>;
  neighbours: Record<string, Array<{ index: number; day: string; distance: number; similarity: number }>>;
  insight: GeneratedInsight | null;
  currentIndex: number;
};

export const snapshot = snapshotJson as Snapshot;

export function isPlaceholder(): boolean {
  return snapshot.meta.generatedAt === "placeholder";
}

export function insightText(lang: Lang): string {
  if (!snapshot.insight) return lang === "zh" ? "暂无可用的历史规律。" : "No historical pattern available.";
  return lang === "zh" ? snapshot.insight.zh : snapshot.insight.en;
}

export function axisLabel(axis: number, lang: Lang): string {
  const zh = ["恐慌贪婪", "BTC 主导率", "山寨轮动代理", "市值动能 30d", "成交量动能 30d", "市场广度 30d"];
  const en = ["Fear & Greed", "BTC Dominance", "Alt Rotation", "Cap Momentum 30d", "Volume Momentum 30d", "Breadth 30d"];
  return lang === "zh" ? zh[axis] : en[axis];
}
