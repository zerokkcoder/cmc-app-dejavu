# DoraHacks 提交清单（中文）

[English](SUBMISSION.md)

赛事：Build with CMC: API Hackathon Round 2 (Plushie)
赛道：**Data and Visualisation**
截止：**2026-12-09 23:59 UTC**（建议 12/07 前提交，留 buffer）

## 必交项

- [ ] 公开 GitHub 仓库（不能 private）
- [ ] 可运行部署 demo 或录屏
- [ ] X/Twitter 帖：含 DoraHacks 提交链接 + demo 视频 + `#BuildwithCMC`，帖子 URL 回填表单
- [ ] 显式列出所用 CMC 端点（见根 README 表格与 `API_NOTES.md`）
- [ ] 真实 API 调用的可见证据：代码 + 响应（`data/evidence/*.sample.json` + `scripts/fetch-all.ts`）
- [ ] 简短说明「API 让什么成为可能 / 在哪里阻碍」（README + `API_NOTES.md`）
- [ ] 只选一个赛道

## 提交前的数据闸门

提交的快照必须是**真实数据**，不能是合成数据：

```bash
npm run probe        # 写 data/probe-report.json，核对套餐、字段路径、历史深度
npm run snapshot     # 覆盖 data/snapshot.json，写 data/evidence/*.sample.json
npm run test && npm run build
```

当前状态（2026-11-19 实测）：`meta.generatedAt` 为真实 ISO 时间、`keyPlan = Startup`、1089 天对齐数据、347 credits、9 份证据文件。若 `meta.generatedAt === "synthetic-demo"` 或 `meta.keyPlan === "SYNTHETIC-DEMO"`，**不要提交**。该状态下界面会显示红色演示数据横幅。

## 部署

```bash
npm run build
# 将项目根部署到 Vercel，运行时无需任何环境变量
```

运行时不调用 CMC，Vercel 上不需要 `CMC_API_KEY`。key 只留在本地或 CI secret。

**线上 demo（已部署）：** https://cmc-app-dejavu.vercel.app/

## 录屏脚本（3–5 分钟）

1. 展示星图，说明每个点是一天。
2. 拖动时间轴到某个历史日，展示雷达与近邻联动更新。
3. 解释扩展窗口 z-score 与 ±5 天排除（无前视偏差）。
4. 展示前向路径与近邻中位数带。
5. 展示 `data/evidence/*.sample.json` 中的 `status.credit_count`，逐字念出端点名。
6. 以免责声明收尾：历史相似不等于未来重复。

## X 帖模板

> Built **DÉJÀVU** for #BuildwithCMC — a market déjà-vu engine: 6-dim fingerprint from CMC first-party indices, find the most similar day in 1000 days, see what happened next. Live: https://cmc-app-dejavu.vercel.app/ · Demo: <视频> · Submission: <DoraHacks 链接> #BuildwithCMC

## 合规

- 不做投资建议，不出现 buy/sell/target 等词。
- 绝不提交 `CMC_API_KEY`；一旦泄露立即轮换。
- 获奖者须通过制裁名单筛查；奖品不可折现。
