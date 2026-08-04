import assert from "node:assert/strict";
import test from "node:test";
import { parseRecentProgress, parseVisitedProgress } from "../src/utils/wander-storage.ts";

test("ignores corrupted JSON instead of throwing", () => {
  assert.deepEqual(parseVisitedProgress("{not-json"), []);
  assert.deepEqual(parseRecentProgress("["), []);
});

test("rejects non-array progress and keeps only valid visited keys", () => {
  assert.deepEqual(parseVisitedProgress(JSON.stringify({ visited: "anime" })), []);
  assert.deepEqual(parseVisitedProgress(JSON.stringify(["anime", 42, null, "photo"])), ["anime", "photo"]);
  assert.deepEqual(parseRecentProgress(JSON.stringify({ recent: "anime" })), []);
});

test("rejects invalid timestamps, including non-finite and out-of-range values", () => {
  const raw = JSON.stringify([
    { key: "anime", visitedAt: Number.NaN },
    { key: "photo", visitedAt: Number.POSITIVE_INFINITY },
    { key: "notes", visitedAt: "2026-08-05" },
    { key: "memo", visitedAt: 8640000000000001 },
    { key: "valid", visitedAt: 1780000000000 },
  ]);
  assert.deepEqual(parseRecentProgress(raw), [{ key: "valid", visitedAt: 1780000000000 }]);
});

test("migrates legacy arrays of visited keys into timestamped recent entries", () => {
  assert.deepEqual(parseRecentProgress(JSON.stringify(["anime", "photo"]), 1700000000000), [
    { key: "anime", visitedAt: 1700000000000 },
    { key: "photo", visitedAt: 1699999999999 },
  ]);
  assert.deepEqual(parseVisitedProgress(JSON.stringify({ visited: ["anime", "photo"] })), ["anime", "photo"]);
});
