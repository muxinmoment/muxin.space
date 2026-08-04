export type WanderRecent = {
  key: string;
  visitedAt: number;
};

const isValidTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && new Date(value).getTime() === value;

const parseJson = (raw: string | null): unknown => {
  if (!raw) return [];
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
  return values.filter((item: unknown): item is string => typeof item === "string");
};

export const parseRecentProgress = (raw: string | null, now = Date.now()): WanderRecent[] => {
  const stored = parseJson(raw);
  const object = stored && typeof stored === "object" && !Array.isArray(stored) ? stored as Record<string, unknown> : undefined;
  const values: unknown[] = Array.isArray(stored) ? stored : Array.isArray(object?.recent) ? object.recent : [];
  return values.flatMap((item: unknown, index: number): WanderRecent[] => {
    if (typeof item === "string") return [{ key: item, visitedAt: now - index }];
    if (!item || typeof item !== "object") return [];
    const entry = item as { key?: unknown; visitedAt?: unknown };
    return typeof entry.key === "string" && isValidTimestamp(entry.visitedAt) ? [{ key: entry.key, visitedAt: entry.visitedAt }] : [];
  });
};
