"use client";

export default function DemoBanner({ lang }: { lang: "zh" | "en" }) {
  return (
    <div className="border-b border-[var(--down)] bg-[#241216] px-6 py-2 text-center text-xs text-[#f0b8bb]">
      {lang === "zh"
        ? "演示数据 · 由本地合成算法生成，非 CoinMarketCap 真实响应。提交前必须在可访问 CMC API 的环境运行 npm run snapshot 生成真实快照。"
        : "DEMO DATA · Locally generated synthetic series, NOT real CoinMarketCap responses. Run npm run snapshot in an environment with CMC API access before submitting."}
    </div>
  );
}
