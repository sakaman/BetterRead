import { installRouteObserver } from "./core/lifecycle.ts";
import { copySettings, DEFAULT_SETTINGS, type BetterReadSettings, type ThemeId } from "./core/settings.ts";
import {
  deleteBookProfile,
  hasBookProfile,
  loadGlobalSettings,
  loadResolvedSettings,
  saveBookProfile,
  saveScopedSettings,
} from "./core/storage.ts";
import { AppearanceController } from "./features/appearance.ts";
import { ReadingAidsController } from "./features/reading-aids.ts";
import { getBookId, isReaderPage } from "./platform/weread.ts";
import { NativeReaderThemeController } from "./platform/native-reader.ts";
import { READER_CSS } from "./styles/reader-css.ts";
import { SettingsPanel } from "./ui/settings-panel.ts";

function addStyle(css: string): void {
  if (typeof GM_addStyle === "function") {
    GM_addStyle(css);
    return;
  }
  const style = document.createElement("style");
  style.dataset.betterread = "reader";
  style.textContent = css;
  (document.head || document.documentElement).append(style);
}

function ready(): Promise<void> {
  if (document.body) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener("DOMContentLoaded", () => resolve(), { once: true }));
}

function previewBookId(): string | null {
  return document.body?.dataset.betterreadBook || null;
}

addStyle(READER_CSS);

let currentBookId = getBookId();
let bookScoped = hasBookProfile(currentBookId);
let settings = loadResolvedSettings(currentBookId);
const appearance = new AppearanceController();
const readingAids = new ReadingAidsController();
const nativeTheme = new NativeReaderThemeController();
let panel: SettingsPanel | null = null;

appearance.apply(settings);

function apply(next: BetterReadSettings, persist = true): void {
  settings = copySettings(next);
  appearance.apply(settings);
  nativeTheme.apply(settings);
  readingAids.apply(settings);
  panel?.setState(settings, bookScoped, currentBookId);
  if (persist) saveScopedSettings(currentBookId, bookScoped, settings);
}

function resetCurrentScope(): void {
  apply(copySettings(DEFAULT_SETTINGS));
}

function setBookScope(enabled: boolean): void {
  if (!currentBookId) return;
  if (enabled) {
    bookScoped = true;
    saveBookProfile(currentBookId, settings);
  } else {
    deleteBookProfile(currentBookId);
    bookScoped = false;
    settings = loadGlobalSettings();
  }
  apply(settings, false);
}

function refreshRoute(): void {
  const nextBookId = getBookId() || previewBookId();
  if (nextBookId === currentBookId) return;
  currentBookId = nextBookId;
  bookScoped = hasBookProfile(currentBookId);
  apply(loadResolvedSettings(currentBookId), false);
}

function cycleTheme(): void {
  const order: ThemeId[] = ["paper", "sepia", "parchment", "bean", "forest", "midnight", "dark", "oled", "system"];
  const index = order.indexOf(settings.theme);
  apply({ ...settings, theme: order[(index + 1) % order.length] ?? "paper" });
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.isContentEditable || target.matches("input, textarea, select, [role='textbox']")
  );
}

function onShortcut(event: KeyboardEvent): void {
  if (!event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
  if (event.key.toLowerCase() === "b") {
    event.preventDefault();
    panel?.toggle();
    return;
  }
  if (!settings.shortcuts) return;
  if (event.key.toLowerCase() === "t") {
    event.preventDefault();
    cycleTheme();
  } else if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    apply({ ...settings, focusMode: !settings.focusMode });
  } else if (event.key === "0") {
    event.preventDefault();
    resetCurrentScope();
  }
}

function registerMenu(): void {
  if (typeof GM_registerMenuCommand !== "function") return;
  GM_registerMenuCommand("打开 BetterRead 设置", () => panel?.open());
  GM_registerMenuCommand("启用 / 停用 BetterRead", () => apply({ ...settings, enabled: !settings.enabled }));
  GM_registerMenuCommand("切换阅读主题", cycleTheme);
  GM_registerMenuCommand("恢复当前范围默认设置", resetCurrentScope);
}

void ready().then(() => {
  const isPreview = document.body.dataset.betterreadPreview !== undefined;
  if (!isReaderPage() && !isPreview) return;
  if (!currentBookId) currentBookId = previewBookId();
  bookScoped = hasBookProfile(currentBookId);
  settings = loadResolvedSettings(currentBookId);

  panel = new SettingsPanel(settings, {
    onChange: (next) => apply(next),
    onBookScopeChange: setBookScope,
    onReset: resetCurrentScope,
  });
  panel.mount();
  readingAids.mount();
  apply(settings, false);
  installRouteObserver(refreshRoute);
  document.addEventListener("keydown", onShortcut);
  registerMenu();
});
