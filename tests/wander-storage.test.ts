import assert from "node:assert/strict";
import test from "node:test";
import { formatWanderFootprintTime, getWanderDetailState, getWanderDirectoryState, getWanderResumeKey, getWanderRoomState, parseRecentProgress, parseVisitedProgress, readRecentProgress, readStorageValue, readVisitedProgress, recordRecentProgress, shouldInitializeWander, writeRecentProgress, writeStorageValue, writeVisitedProgress } from "../src/utils/wander-storage.ts";

test("initializes each Astro page once while allowing a fresh page", () => {
  assert.equal(shouldInitializeWander(undefined), true);
  assert.equal(shouldInitializeWander("false"), true);
  assert.equal(shouldInitializeWander("true"), false);
  assert.equal(shouldInitializeWander("true"), false);
});

test("resumes the remembered room camera without accepting stale keys", () => {
  const availableKeys = ["center", "anime", "photo", "notes", "memo"] as const;
  assert.equal(getWanderResumeKey("photo", availableKeys), "photo");
  assert.equal(getWanderResumeKey("photo", availableKeys), "photo");
  assert.equal(getWanderResumeKey("missing", availableKeys), "center");
  assert.equal(getWanderResumeKey(null, availableKeys), "center");
});

test("combines scene switching and safe room restoration without browser storage", () => {
  const availableKeys = ["center", "anime", "photo", "notes", "memo"] as const;
  assert.deepEqual(getWanderRoomState("day", "photo", availableKeys), { scene: "day", resumeKey: "photo" });
  assert.deepEqual(getWanderRoomState("night", "missing", availableKeys), { scene: "night", resumeKey: "center" });
  assert.deepEqual(getWanderRoomState("storm", null, availableKeys), { scene: "night", resumeKey: "center" });
  assert.deepEqual(getWanderRoomState(null, null, availableKeys), { scene: "night", resumeKey: "center" });
});

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

test("formats recent footprints consistently and derives detail fallback state", () => {
  const now = new Date("2026-08-05T12:00:00+08:00").getTime();
  assert.equal(formatWanderFootprintTime(now - 30 * 60 * 1000, now), "刚刚");
  assert.equal(formatWanderFootprintTime(new Date("2026-08-05T08:00:00+08:00").getTime(), now), "今天");
  assert.equal(formatWanderFootprintTime(new Date("2026-07-30T08:00:00+08:00").getTime(), now), "7月30日");
  assert.deepEqual(getWanderDetailState("番剧书架", [{ key: "anime", visitedAt: now }], true, now), {
    footprint: "当前足迹 · 番剧书架 · 刚刚",
    storageHint: "",
  });
  assert.deepEqual(getWanderDetailState("番剧书架", [], false, now), {
    footprint: "继续探索",
    storageHint: "进度仅保存在当前浏览器",
  });
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
