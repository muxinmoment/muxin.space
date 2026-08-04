import type { SiteMode } from "./wander-storage.ts";
import { normalizeSiteMode } from "./wander-storage.ts";

export const SITE_MODE_STORAGE_KEYS = ["muxin-site-mode", "muxin-home-mode"] as const;

export const resolveSiteMode = (siteMode: string | null, homeMode: string | null): SiteMode =>
  normalizeSiteMode(siteMode ?? homeMode);

export const isSiteModeStorageKey = (key: string | null): boolean =>
  key !== null && SITE_MODE_STORAGE_KEYS.includes(key as typeof SITE_MODE_STORAGE_KEYS[number]);

export const getSiteModeSyncState = (value: unknown) => {
  const mode = normalizeSiteMode(value);
  return {
    mode,
    homeMode: mode,
    navigationMode: mode,
  } as const;
};
