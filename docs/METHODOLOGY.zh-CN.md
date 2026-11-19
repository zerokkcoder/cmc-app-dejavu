# 方法学 · DÉJÀVU 指纹如何计算

[English](METHODOLOGY.md)

## 1. 数据窗口

所有时间对齐到 **UTC 日历日键**（`YYYY-MM-DD`）。快照请求约 1120 个日度点，让约 1000 天的指纹仍有 90 天前向数据可用。前 180 天作为 warm-up，不参与近邻选择。

## 2. 六个轴

| # | 轴 | CMC 来源 | 计算 | 归一化 |
|---|---|---|---|---|
| A1 | 恐慌贪婪 | `/v3/fear-and-greed/historical` `data[].value` | 原始 0–100 | 固定 `(v-50)/50` |
| A2 | BTC 主导率 | 全球历史 `btc_dominance` | 原始值 | 扩展窗口 z-score |
| A3 | 山寨轮动（代理） | `aux=altcoin_market_cap` / `total_market_cap` | `r_t / r_{t-30} - 1` | 扩展窗口 z-score |
| A4 | 市值动能 30d | `quote.USD.total_market_cap` | `cap_t / cap_{t-30} - 1` | 扩展窗口 z-score |
| A5 | BTC 成交量动能 30d | `/v3/cryptocurrency/quotes/historical` `quote.USD.volume_24h`（BTC id=1） | `log(v_t) - log(v_{t-30})` | 扩展窗口 z-score |
| A6 | 市场广度 30d | 当前 top-30 的 `/v3/cryptocurrency/quotes/historical` | 30 日上涨资产占比 | 固定 `2b - 1` |

**A3 是代理指标，不是官方山寨季指数。** 官方 `/v1/altcoin-season-index/historical` 只接受 `timeframe=7d|30d|90d`，没有长区间参数，无法提供 1000 天序列；它只作为当日读数出现在脉搏条。

A5 使用 BTC 成交量而非全市场成交量：Startup 套件的全球历史端点实测不返回 `total_volume_24h`（`npm run probe` 已验证），`aux` 也补不回来。BTC 成交量同为 CMC 原生数据，日度可回溯至 2010。

A6 使用固定的当前 top-30 宇宙，存在幸存者偏差。我们公开披露，而不是藏起来。

## 3. 无前视偏差

趋势类字段使用**扩展窗口 z-score**：

```
z_t = (x_t - mean(x_0..x_t)) / std(x_0..x_t)
```

全窗口统计会把 t 之后的数据泄漏进历史指纹。有天然边界的字段（恐慌贪婪 0–100、广度 0–1）改用固定缩放。

单测断言：改变索引 i 之后的数值不会改变 `z_i`；前向收益只引用严格大于当天的索引。

## 4. 距离与近邻

距离是 6 维**标准化欧氏距离**。没用余弦距离，因为极端状态的幅度本身就是信号。近邻排除查询日及前后 ±5 天，否则任意一天的最近邻必然是相邻日。

UI 显示的相似度是 `1 / (1 + distance)`，仅为展示便利，不是概率。

## 5. 投影

2D PCA：协方差矩阵 + 幂迭代，实现在 `lib/analytics/pca.ts`，固定随机种子、无外部依赖。投影只是描述性的，不参与近邻选择。

## 6. 之后发生了什么

前向收益取自同一套 CMC 序列：总市值与 BTC 价格在 +7 / +30 / +90 天的值。不足完整区间的日期返回 `null`，UI 标注「待揭晓」。

## 7. 自动洞察

对每个轴取上下五分位分组，计算各组中位前向 30 天总市值变化，取绝对值最大者生成中英双语句子并附样本量。这是描述统计，不是交易信号。

## 8. 诚实边界

- 历史相似不等于未来重复。
- 不构成投资建议；界面不出现 buy/sell/target 等词。
- top-30 宇宙固定，存在幸存者偏差。
- 恐慌贪婪深度、时间戳格式、`start` 语义由 `npm run probe` 实测并记入 `data/probe-report.json`。
