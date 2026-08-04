import assert from "node:assert/strict";
import test from "node:test";
import { getWanderDirectoryState, parseRecentProgress, parseVisitedProgress, readRecentProgress, readStorageValue, readVisitedProgress, recordRecentProgress, writeRecentProgress, writeStorageValue, writeVisitedProgress } from "../src/utils/wander-storage.ts";

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

test("deduplicates repeated footprints and rejects empty or oversized keys", () => {
  assert.deepEqual(parseVisitedProgress(JSON.stringify(["anime", "anime", "", "x".repeat(129), "photo"])), ["anime", "photo"]);
  assert.deepEqual(parseRecentProgress(JSON.stringify([
    { key: "anime", visitedAt: 1780000000000 },
    { key: "anime", visitedAt: 1780000000001 },
    { key: "photo", visitedAt: 1780000000002 },
  ])), [
    { key: "anime", visitedAt: 1780000000000 },
    { key: "photo", visitedAt: 1780000000002 },
  ]);
});

test("ignores oversized storage payloads", () => {
  assert.deepEqual(parseVisitedProgress(`[${JSON.stringify("anime")},${"0,".repeat(50_001)}"photo"]`), []);
  assert.deepEqual(parseRecentProgress("x".repeat(100_001)), []);
});

test("falls back when storage is unavailable or throws", () => {
  const unavailable = null;
  const throwing = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.deepEqual(readVisitedProgress(unavailable, "muxin-wander-visited"), new Set());
  assert.deepEqual(readRecentProgress(unavailable, "muxin-wander-recent"), []);
  assert.equal(readStorageValue(throwing, "muxin-wander-scene"), null);
  assert.equal(writeStorageValue(throwing, "muxin-wander-scene", "day"), false);
  assert.equal(writeVisitedProgress(unavailable, "muxin-wander-visited", ["anime"]), false);
  assert.equal(writeRecentProgress(unavailable, "muxin-wander-recent", []), false);
  assert.deepEqual(readVisitedProgress(throwing, "muxin-wander-visited"), new Set());
  assert.deepEqual(readRecentProgress(throwing, "muxin-wander-recent"), []);
  assert.equal(writeVisitedProgress(throwing, "muxin-wander-visited", ["anime"]), false);
  assert.equal(writeRecentProgress(throwing, "muxin-wander-recent", []), false);
});

test("derives safe directory progress, explored labels, and recent footprints", () => {
  const recent = [
    { key: "memo", visitedAt: 1780000000003 },
    { key: "unknown", visitedAt: 1780000000002 },
    { key: "anime", visitedAt: 1780000000001 },
  ];
  const state = getWanderDirectoryState(["anime", "photo", "outside"], recent, ["anime", "photo", "notes", "memo"]);
  assert.equal(state.explored, 2);
  assert.equal(state.total, 4);
  assert.equal(state.isComplete, false);
  assert.deepEqual([...state.visitedKeys], ["anime", "photo"]);
  assert.deepEqual(state.recent, [recent[0], recent[2]]);
  assert.equal(getWanderDirectoryState(["anime", "photo", "notes", "memo"], [], ["anime", "photo", "notes", "memo"]).isComplete, true);
});

test("records one recent footprint per key and caps the timeline", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  assert.deepEqual(recordRecentProgress(storage, "muxin-wander-recent", "anime", 1780000000000), [{ key: "anime", visitedAt: 1780000000000 }]);
  assert.deepEqual(recordRecentProgress(storage, "muxin-wander-recent", "photo", 1780000000001), [
    { key: "photo", visitedAt: 1780000000001 },
    { key: "anime", visitedAt: 1780000000000 },
  ]);
  assert.deepEqual(recordRecentProgress(storage, "muxin-wander-recent", "anime", 1780000000002), [
    { key: "anime", visitedAt: 1780000000002 },
    { key: "photo", visitedAt: 1780000000001 },
  ]);
});
