# CMC API 说明 · 端点、陷阱、积分

[English](API_NOTES.md)

## 认证与配置

- 请求头：`X-CMC_PRO_API_KEY`。Base：`https://pro-api.coinmarketcap.com`。
- `.env.example` 定义 `CMC_API_KEY`，只在 `lib/cmc/client.ts` 与 `scripts/*`（服务端）读取。绝不加 `NEXT_PUBLIC_` 前缀。
- `.gitignore` 含 `.env*` 并保留 `!.env.example`。若 key 曾被提交，立即在 CMC 开发者后台轮换。
- CMC **不支持 CORS**。浏览器绝不直连；应用读取随仓库提交的快照，可选通过 `/api/state` 提供。

## 端点清单

| 端点 | 使用参数 | 计费 |
|---|---|---|
| `/v1/key/info` | — | 0 |
| `/v1/global-metrics/quotes/historical` | `time_start`、`time_end`、`interval=daily`、`count`、`convert=USD`、`aux=altcoin_market_cap` | 1 / 100 点 |
| `/v1/global-metrics/quotes/latest` | `convert=USD` | 按次 |
| `/v3/fear-and-greed/historical` | `start`（1-based 分页偏移）、`limit<=500` | 1 / 请求 |
| `/v3/fear-and-greed/latest` | — | 按次 |
| `/v1/altcoin-season-index/historical` | `timeframe=7d\|30d\|90d` | 1 / 请求 |
| `/v3/cryptocurrency/quotes/historical` | `id`、`time_start`、`time_end`、`interval=daily`、`count`、`convert=USD` | 1 / 100 点 |
| `/v3/cryptocurrency/listings/latest` | `limit=30`、`convert=USD` | 1 / 请求 |
| `/v3/index/cmc100-latest` | — | 按次 |

## 单次完整构建的积分预算

| 调用 | 积分 |
|---|---:|
| 全球历史（1120 点） | 12 |
| BTC 历史（1120 点） | 12 |
| top-30 历史（33,600 点，每批 8 个 ID，共 4 批） | 336 |
| 恐慌贪婪（3 页） | 3 |
| 山寨季 7/30/90 + latest | 4 |
| 全球最新 / CMC100 / key info / listings | ~3 |
| **合计** | **347（实测）** |

活动 Startup 额度 450,000/月，每周刷新加本地重建约占 1%。每次调用的 `status.credit_count` 记入 `data/manifest.json`。

## `npm run probe` 实测结果（2026-11-19）

- key 套餐：Startup，450,000 credits/月，600 次/分。
- 全球历史起点：**2013-04-29**（不是 2010），可用 4,951 行。
- BTC 历史起点：2010-07-14。
- 恐慌贪婪：1,239 行，2023-06-29 → 2026-11-18，`start` 为分页偏移，最新在前。
- 全球历史 `quote.USD` 只有 `timestamp`、`total_market_cap`、`altcoin_market_cap`，**没有 `total_volume_24h`**；A5 因此改用 BTC 成交量。
- `/v3/cryptocurrency/quotes/historical` 单次上限 **10,000 数据点**；8 个 ID × 1120 天是可行的批大小。

## 文档里的坑

1. `error_code` 在 v1/v2 是数字，v3+ 是字符串。`lib/cmc/normalize.ts` 统一转字符串。
2. 时间戳有 ISO 字符串、整数秒、纯数字字符串三种形态，`toUtcMs` 全部兼容。
3. 未知标识符可能返回 HTTP 200 + `error_code:"0"` 但 `data` 为空，必须校验负载。
4. 历史端点返回三种结构：全球 `data.quotes[]`、恐慌贪婪 `data[]`、币种 `data[id].quotes[]`。
5. `altcoin_market_cap` 等细粒度字段必须在全球历史端点显式传 `aux`。
6. 官方山寨季指数历史只覆盖 7/30/90 天，没有长区间。
7. CMC100 历史在给时间范围时 `count` 上限为 10，因此不用于指纹。
8. 429 有分钟/日/月/IP 四种错误码，`CmcClient` 做指数退避重试。
9. 没有 sandbox；keyless public API 是零摩擦测试路径。

## API 让什么成为可能 / 在哪里阻碍

**可能**：CMC 第一方恐慌贪婪、BTC 主导率、全球市值/成交量序列共用一套积分与 JSON 信封，六维指纹才可行；`aux=altcoin_market_cap` 让山寨轮动代理可算；`status.credit_count` 让成本可审计。

**阻碍**：没有长期官方山寨季历史（只能代理）；分页语义与时间戳格式不一致；三种互不兼容的历史响应结构；无 sandbox；无 RWA 历史端点。这些约束在 UI 方法说明和文档中公开，而不是掩盖。
