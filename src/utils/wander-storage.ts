export type WanderRecent = {
  key: string;
  visitedAt: number;
};

export type WanderDetailState = {
  footprint: string;
  storageHint: string;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type WanderScene = "night" | "day";

export type WanderRoomState = {
  scene: WanderScene;
  resumeKey: string;
};

export const shouldInitializeWander = (ready: string | undefined): boolean => ready !== "true";

export const getWanderResumeKey = (storedKey: string | null, availableKeys: readonly string[]): string =>
  storedKey && availableKeys.includes(storedKey) ? storedKey : "center";

export const getWanderRoomState = (
  storedScene: string | null,
  storedKey: string | null,
  availableKeys: readonly string[],
): WanderRoomState => ({
  scene: storedScene === "day" ? "day" : "night",
  resumeKey: getWanderResumeKey(storedKey, availableKeys),
});

const MAX_STORAGE_VALUE_LENGTH = 100_000;
const MAX_KEY_LENGTH = 128;
const MAX_VISITED_KEYS = 32;
const MAX_RECENT_ENTRIES = 3;

const isValidKey = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_KEY_LENGTH;

export const getWanderStorage = (): StorageLike | null => {
  try { return globalThis.localStorage; } catch { return null; }
};

export const readStorageValue = (storage: StorageLike | null, key: string): string | null => {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
};

export const writeStorageValue = (storage: StorageLike | null, key: string, value: string): boolean => {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch { return false; }
};

const isValidTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && new Date(value).getTime() === value;

export const formatWanderFootprintTime = (visitedAt: number, now = Date.now()): string => {
  const elapsed = now - visitedAt;
  if (elapsed >= 0 && elapsed < 60 * 60 * 1000) return "刚刚";
  const visitedDate = new Date(visitedAt);
  const nowDate = new Date(now);
  if (visitedDate.toDateString() === nowDate.toDateString()) return "今天";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(visitedDate).replace("/", "月") + "日";
};

export const getWanderDetailState = (
  label: string,
  recent: WanderRecent[],
  storageAvailable: boolean,
  now = Date.now(),
): WanderDetailState => ({
  footprint: recent[0] ? `当前足迹 · ${label} · ${formatWanderFootprintTime(recent[0].visitedAt, now)}` : "继续探索",
  storageHint: storageAvailable ? "" : "进度仅保存在当前浏览器",
});

const parseJson = (raw: string | null): unknown => {
  if (!raw || raw.length > MAX_STORAGE_VALUE_LENGTH) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const parseVisitedProgress = (raw: string | null): string[] => {
  const stored = parseJson(raw);
  const object = stored && typeof stored === "object" && !Array.isArray(stored) ? stored as Record<string, unknown> : undefined;
  const values: unknown[] = Array.isArray(stored) ? stored : Array.isArray(object?.visited) ? object.visited : [];
  return [...new Set(values.filter(isValidKey))].slice(0, MAX_VISITED_KEYS);
};

export const parseRecentProgress = (raw: string | null, now = Date.now()): WanderRecent[] => {
  const stored = parseJson(raw);
  const object = stored && typeof stored === "object" && !Array.isArray(stored) ? stored as Record<string, unknown> : undefined;
  const values: unknown[] = Array.isArray(stored) ? stored : Array.isArray(object?.recent) ? object.recent : [];
  const seen = new Set<string>();
  return values.flatMap((item: unknown, index: number): WanderRecent[] => {
    if (typeof item === "string") {
      if (!isValidKey(item) || seen.has(item)) return [];
      seen.add(item);
      return [{ key: item, visitedAt: now - index }];
    }
    if (!item || typeof item !== "object") return [];
    const entry = item as { key?: unknown; visitedAt?: unknown };
    if (!isValidKey(entry.key) || seen.has(entry.key) || !isValidTimestamp(entry.visitedAt)) return [];
    seen.add(entry.key);
    return [{ key: entry.key, visitedAt: entry.visitedAt }];
  }).slice(0, MAX_RECENT_ENTRIES);
};

export const readVisitedProgress = (storage: StorageLike | null, key: string): Set<string> => {
  return new Set(parseVisitedProgress(readStorageValue(storage, key)));
};

export const readRecentProgress = (storage: StorageLike | null, key: string, now = Date.now()): WanderRecent[] => {
  return parseRecentProgress(readStorageValue(storage, key), now);
};

export const writeVisitedProgress = (storage: StorageLike | null, key: string, visited: Iterable<string>): boolean => {
  const values = [...new Set(visited)].filter(isValidKey).slice(0, MAX_VISITED_KEYS);
  return writeStorageValue(storage, key, JSON.stringify(values));
};

export const writeRecentProgress = (storage: StorageLike | null, key: string, recent: WanderRecent[]): boolean => {
  return writeStorageValue(storage, key, JSON.stringify(parseRecentProgress(JSON.stringify(recent))));
};

export type WanderDirectoryState = {
  explored: number;
  total: number;
  isComplete: boolean;
  visitedKeys: Set<string>;
  recent: WanderRecent[];
};

export const getWanderDirectoryState = (
  visited: Iterable<string>,
  recent: WanderRecent[],
  keys: readonly string[],
): WanderDirectoryState => {
  const knownKeys = new Set(keys.filter(isValidKey));
  const visitedKeys = new Set([...visited].filter((key) => knownKeys.has(key)));
  const visibleRecent = recent.filter((item) => knownKeys.has(item.key)).slice(0, MAX_RECENT_ENTRIES);
  return {
    explored: visitedKeys.size,
    total: knownKeys.size,
    isComplete: visitedKeys.size === knownKeys.size,
    visitedKeys,
    recent: visibleRecent,
  };
};

export const recordRecentProgress = (storage: StorageLike | null, storageKey: string, key: string, now = Date.now()): WanderRecent[] => {
  if (!isValidKey(key) || !isValidTimestamp(now)) return readRecentProgress(storage, storageKey, now);
  const recent = readRecentProgress(storage, storageKey, now).filter((item) => item.key !== key).slice(0, 2);
  recent.unshift({ key, visitedAt: now });
  writeRecentProgress(storage, storageKey, recent);
  return recent;
};
