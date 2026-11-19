import test from "node:test";
import assert from "node:assert/strict";
import { errorCode, isSuccess, normalizeGlobalPoint, toUtcDay, toUtcMs } from "../lib/cmc/normalize";
import { expandingZScore } from "../lib/analytics/normalize";
import { buildFingerprint } from "../lib/analytics/fingerprint";
import { topK } from "../lib/analytics/distance";
import { pca2d } from "../lib/analytics/pca";
import { attachForwardReturns, forwardAt } from "../lib/analytics/forwardReturns";

test("error codes normalize across v1/v2 numeric and v3 string", () => {
  assert.equal(errorCode(0), "0");
  assert.equal(errorCode("0"), "0");
  assert.equal(isSuccess(0), true);
  assert.equal(isSuccess("0"), true);
  assert.equal(isSuccess("1008"), false);
});

test("timestamps accept ISO strings, unix seconds and numeric strings", () => {
  const expected = Date.parse("2024-01-02T00:00:00.000Z");
  assert.equal(toUtcMs("2024-01-02T00:00:00.000Z"), expected);
  assert.equal(toUtcMs(1704153600), expected);
  assert.equal(toUtcMs("1704153600"), expected);
  assert.equal(toUtcDay(1704153600), "2024-01-02");
});

test("global point supports nested and flattened shapes", () => {
  const nested = normalizeGlobalPoint({
    timestamp: "2024-01-02T00:00:00.000Z",
    btc_dominance: 50,
    quote: { USD: { total_market_cap: 100, total_volume_24h: 10, altcoin_market_cap: 40 } },
  });
  const flat = normalizeGlobalPoint({
    timestamp: 1704153600,
    total_market_cap: 100,
    total_volume_24h: 10,
    altcoin_market_cap: 40,
    btc_dominance: 50,
  });
  assert.deepEqual(nested, flat);
});

test("expanding z-score never uses future values", () => {
  const a = expandingZScore([1, 2, 3, 4, 5, 6, 7, 8], 0);
  const b = expandingZScore([1, 2, 3, 4, 500, 6, 7, 8], 0);
  assert.deepEqual(a.slice(0, 4), b.slice(0, 4));
  assert.notEqual(a[4], b[4]);
});

test("topK excludes the query and its +/-5 day window", () => {
  const days = Array.from({ length: 60 }, (_, i) => `2024-01-${String(i + 1).padStart(2, "0")}`);
  const matrix = new Float64Array(days.length * 6);
  for (let i = 0; i < days.length; i += 1) matrix[i * 6] = i === 40 ? 0.5 : i % 7;
  const fp = {
    days,
    matrix,
    rawAxes: Array.from({ length: 6 }, () => days.map(() => 0)),
    valid: days.map((_, i) => i >= 10),
  };
  const result = topK(fp, 40, 8, 5);
  assert.equal(result.length, 8);
  assert.ok(result.every((n) => Math.abs(n.index - 40) > 5));
});

test("forward returns use data strictly after the reference day", () => {
  const days = Array.from({ length: 8 }, (_, i) => `2024-01-${String(i + 1).padStart(2, "0")}`);
  const cap = new Map(days.map((d, i) => [d, 100 * (1 + i)]));
  const btc = new Map(days.map((d, i) => [d, 10 * (1 + i)]));
  const result = attachForwardReturns(days, cap, btc);
  assert.ok(Math.abs(forwardAt(result, 0, 7, "cap")! - 7) < 1e-9);
  assert.equal(forwardAt(result, 2, 7, "cap"), null);
});

test("PCA separates two synthetic clusters", () => {
  const points: number[] = [];
  for (let i = 0; i < 40; i += 1) points.push(-3 + i * 0.01, -2 + i * 0.01, 0, 0, 0, 0);
  for (let i = 0; i < 40; i += 1) points.push(3 + i * 0.01, 2 + i * 0.01, 0, 0, 0, 0);
  const projected = pca2d(new Float64Array(points));
  const left = projected[0];
  const right = projected[80];
  assert.ok(Math.abs(left - right) > 1, `expected separation, got ${left} vs ${right}`);
});

test("fingerprint builds aligned days with no look-ahead in axis computation", () => {
  const days = Array.from({ length: 220 }, (_, i) => {
    const d = new Date(Date.UTC(2023, 0, 1 + i)).toISOString().slice(0, 10);
    return d;
  });
  const global = new Map(days.map((d, i) => [d, { cap: 100 + i, volume: 10 + i * 0.1, altcap: 40 + i * 0.4, btcDominance: 50 - i * 0.01 }]));
  const fearGreed = new Map(days.map((d, i) => [d, 40 + (i % 20)]));
  const breadth = new Map(days.map((d, i) => [d, 0.3 + (i % 10) * 0.05]));
  const volume = new Map(days.map((d, i) => [d, 1000 + i * 3]));
  const fp = buildFingerprint({ days, fearGreed, global, volume, breadth });
  assert.equal(fp.matrix.length, fp.days.length * 6);
  assert.equal(fp.valid[0], false);
  assert.equal(fp.valid[220 - 1], true);
});
