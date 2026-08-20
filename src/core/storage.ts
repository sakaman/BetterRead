import { DEFAULT_SETTINGS, type BetterReadSettings, normalizeSettings } from "./settings.ts";

const GLOBAL_KEY = "betterread.settings.v1";
const BOOK_KEY_PREFIX = "betterread.book.v1.";

function getValue<T>(key: string, fallback: T): T {
  if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setValue<T>(key: string, value: T): void {
  if (typeof GM_setValue === "function") {
    GM_setValue(key, value);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

function deleteValue(key: string): void {
  if (typeof GM_deleteValue === "function") {
    GM_deleteValue(key);
    return;
  }
  localStorage.removeItem(key);
}

function bookKey(bookId: string): string {
  return `${BOOK_KEY_PREFIX}${bookId}`;
}

export function loadGlobalSettings(): BetterReadSettings {
  return normalizeSettings(getValue(GLOBAL_KEY, DEFAULT_SETTINGS));
}

export function saveGlobalSettings(settings: BetterReadSettings): void {
  setValue(GLOBAL_KEY, normalizeSettings(settings));
}

export function hasBookProfile(bookId: string | null): boolean {
  return Boolean(bookId && getValue<unknown>(bookKey(bookId), null) !== null);
}

export function loadResolvedSettings(bookId: string | null): BetterReadSettings {
  const globalSettings = loadGlobalSettings();
  if (!bookId) return globalSettings;
  const profile = getValue<unknown>(bookKey(bookId), null);
  return profile === null ? globalSettings : normalizeSettings(profile);
}

export function saveBookProfile(bookId: string, settings: BetterReadSettings): void {
  setValue(bookKey(bookId), normalizeSettings(settings));
}

export function deleteBookProfile(bookId: string): void {
  deleteValue(bookKey(bookId));
}

export function saveScopedSettings(bookId: string | null, bookScoped: boolean, settings: BetterReadSettings): void {
  if (bookScoped && bookId) saveBookProfile(bookId, settings);
  else saveGlobalSettings(settings);
}
