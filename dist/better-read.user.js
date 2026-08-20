// ==UserScript==
// @name         BetterRead - 微信读书体验增强
// @namespace    https://betterread.local/
// @version      0.1.4
// @description  提供正文主题、沉浸阅读和进度增强，并保留微信读书原生排版。
// @author       BetterRead
// @homepageURL  https://github.com/sakaman/BetterRead
// @supportURL   https://github.com/sakaman/BetterRead/issues
// @downloadURL  https://raw.githubusercontent.com/sakaman/BetterRead/main/dist/better-read.user.js
// @updateURL    https://raw.githubusercontent.com/sakaman/BetterRead/main/dist/better-read.user.js
// @match        https://weread.qq.com/web/reader/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
"use strict";
(() => {
  // src/core/lifecycle.ts
  var ROUTE_EVENT = "betterread:routechange";
  function installRouteObserver(handler) {
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    let scheduled = false;
    const notify = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        handler();
      });
    };
    history.pushState = (...args) => {
      originalPush(...args);
      window.dispatchEvent(new Event(ROUTE_EVENT));
    };
    history.replaceState = (...args) => {
      originalReplace(...args);
      window.dispatchEvent(new Event(ROUTE_EVENT));
    };
    window.addEventListener("popstate", notify);
    window.addEventListener("hashchange", notify);
    window.addEventListener(ROUTE_EVENT, notify);
    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", notify);
      window.removeEventListener("hashchange", notify);
      window.removeEventListener(ROUTE_EVENT, notify);
    };
  }

  // src/core/settings.ts
  var SETTINGS_VERSION = 2;
  var DEFAULT_SETTINGS = {
    version: SETTINGS_VERSION,
    enabled: true,
    uiTheme: "system",
    theme: "paper",
    customBackground: "#f5f1e8",
    customText: "#2f2a24",
    accent: "#2f7d68",
    typography: {
      font: "wechat-default",
      fontSize: 18,
      lineHeight: 1.9,
      letterSpacing: 0.02,
      paragraphSpacing: 1.1,
      contentWidth: 760,
      textAlign: "justify"
    },
    focusMode: false,
    autoHideControls: false,
    showProgress: true,
    lineFocus: false,
    shortcuts: true
  };
  var themes = /* @__PURE__ */ new Set(["paper", "sepia", "parchment", "bean", "forest", "midnight", "dark", "oled", "system", "custom"]);
  var uiThemes = /* @__PURE__ */ new Set(["light", "dark", "system"]);
  var fonts = /* @__PURE__ */ new Set(["wechat-default", "source-serif", "source-sans", "lxgw"]);
  var alignments = /* @__PURE__ */ new Set(["left", "justify"]);
  function normalizeFont(value) {
    if (value === "system-serif" || value === "system-sans") return "wechat-default";
    return fonts.has(value) ? value : DEFAULT_SETTINGS.typography.font;
  }
  function clampNumber(value, fallback, min, max) {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }
  function validColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }
  function normalizeSettings(value) {
    const input = value && typeof value === "object" ? value : {};
    const typography = input.typography && typeof input.typography === "object" ? input.typography : {};
    return {
      version: SETTINGS_VERSION,
      enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_SETTINGS.enabled,
      uiTheme: uiThemes.has(input.uiTheme) ? input.uiTheme : DEFAULT_SETTINGS.uiTheme,
      theme: themes.has(input.theme) ? input.theme : DEFAULT_SETTINGS.theme,
      customBackground: validColor(input.customBackground, DEFAULT_SETTINGS.customBackground),
      customText: validColor(input.customText, DEFAULT_SETTINGS.customText),
      accent: validColor(input.accent, DEFAULT_SETTINGS.accent),
      typography: {
        font: normalizeFont(typography.font),
        fontSize: Math.round(clampNumber(typography.fontSize, DEFAULT_SETTINGS.typography.fontSize, 16, 28) / 2) * 2,
        lineHeight: clampNumber(typography.lineHeight, DEFAULT_SETTINGS.typography.lineHeight, 1.4, 2.5),
        letterSpacing: clampNumber(typography.letterSpacing, DEFAULT_SETTINGS.typography.letterSpacing, 0, 0.12),
        paragraphSpacing: clampNumber(typography.paragraphSpacing, DEFAULT_SETTINGS.typography.paragraphSpacing, 0.4, 2.4),
        contentWidth: clampNumber(typography.contentWidth, DEFAULT_SETTINGS.typography.contentWidth, 560, 1080),
        textAlign: alignments.has(typography.textAlign) ? typography.textAlign : DEFAULT_SETTINGS.typography.textAlign
      },
      focusMode: typeof input.focusMode === "boolean" ? input.focusMode : DEFAULT_SETTINGS.focusMode,
      autoHideControls: typeof input.autoHideControls === "boolean" ? input.autoHideControls : DEFAULT_SETTINGS.autoHideControls,
      showProgress: typeof input.showProgress === "boolean" ? input.showProgress : DEFAULT_SETTINGS.showProgress,
      lineFocus: typeof input.lineFocus === "boolean" ? input.lineFocus : DEFAULT_SETTINGS.lineFocus,
      shortcuts: typeof input.shortcuts === "boolean" ? input.shortcuts : DEFAULT_SETTINGS.shortcuts
    };
  }
  function copySettings(settings2) {
    return normalizeSettings(structuredClone(settings2));
  }

  // src/core/storage.ts
  var GLOBAL_KEY = "betterread.settings.v1";
  var BOOK_KEY_PREFIX = "betterread.book.v1.";
  function getValue(key, fallback) {
    if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function setValue(key, value) {
    if (typeof GM_setValue === "function") {
      GM_setValue(key, value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }
  function deleteValue(key) {
    if (typeof GM_deleteValue === "function") {
      GM_deleteValue(key);
      return;
    }
    localStorage.removeItem(key);
  }
  function bookKey(bookId) {
    return `${BOOK_KEY_PREFIX}${bookId}`;
  }
  function loadGlobalSettings() {
    return normalizeSettings(getValue(GLOBAL_KEY, DEFAULT_SETTINGS));
  }
  function saveGlobalSettings(settings2) {
    setValue(GLOBAL_KEY, normalizeSettings(settings2));
  }
  function hasBookProfile(bookId) {
    return Boolean(bookId && getValue(bookKey(bookId), null) !== null);
  }
  function loadResolvedSettings(bookId) {
    const globalSettings = loadGlobalSettings();
    if (!bookId) return globalSettings;
    const profile = getValue(bookKey(bookId), null);
    return profile === null ? globalSettings : normalizeSettings(profile);
  }
  function saveBookProfile(bookId, settings2) {
    setValue(bookKey(bookId), normalizeSettings(settings2));
  }
  function deleteBookProfile(bookId) {
    deleteValue(bookKey(bookId));
  }
  function saveScopedSettings(bookId, bookScoped2, settings2) {
    if (bookScoped2 && bookId) saveBookProfile(bookId, settings2);
    else saveGlobalSettings(settings2);
  }

  // src/features/appearance.ts
  var LEGACY_APPEARANCE_PROPERTIES = [
    "--br-content-width",
    "--br-font-size",
    "--br-line-height",
    "--br-letter-spacing",
    "--br-paragraph-spacing",
    "--br-font-family",
    "--br-text-align"
  ];
  var AppearanceController = class {
    settings = null;
    media = matchMedia("(prefers-color-scheme: dark)");
    onSchemeChange = () => this.settings && this.apply(this.settings);
    constructor() {
      this.media.addEventListener("change", this.onSchemeChange);
    }
    apply(settings2) {
      this.settings = settings2;
      const root = document.documentElement;
      const enabled = settings2.enabled;
      const resolvedTheme = settings2.theme === "system" ? this.media.matches ? "dark" : "paper" : settings2.theme;
      root.dataset.brEnabled = String(enabled);
      root.dataset.brTheme = resolvedTheme;
      root.dataset.brFocus = String(enabled && settings2.focusMode);
      root.dataset.brAutohide = String(enabled && settings2.autoHideControls);
      root.dataset.brLineFocus = String(enabled && settings2.lineFocus);
      delete root.dataset.brFont;
      root.style.setProperty("--br-accent", settings2.accent);
      if (resolvedTheme === "custom") {
        root.style.setProperty("--br-bg", settings2.customBackground);
        root.style.setProperty("--br-surface", `color-mix(in srgb, ${settings2.customBackground} 88%, ${settings2.customText})`);
        root.style.setProperty("--br-text", settings2.customText);
        root.style.setProperty("--br-muted", `color-mix(in srgb, ${settings2.customText} 66%, ${settings2.customBackground})`);
        root.style.setProperty("--br-border", `color-mix(in srgb, ${settings2.customText} 16%, transparent)`);
        root.style.setProperty("--br-selection", `color-mix(in srgb, ${settings2.accent} 26%, transparent)`);
      } else {
        for (const property of ["--br-bg", "--br-surface", "--br-text", "--br-muted", "--br-border", "--br-selection"]) {
          root.style.removeProperty(property);
        }
      }
      for (const property of LEGACY_APPEARANCE_PROPERTIES) {
        root.style.removeProperty(property);
      }
    }
    destroy() {
      this.media.removeEventListener("change", this.onSchemeChange);
    }
  };

  // src/platform/weread.ts
  var READER_PATH = /^\/web\/reader\/([^/?#]+)/;
  function getBookId(pathname = location.pathname) {
    return READER_PATH.exec(pathname)?.[1] ?? null;
  }
  function isReaderPage(pathname = location.pathname) {
    return READER_PATH.test(pathname);
  }
  var selectors = {
    readerBody: "body.wr_page_reader",
    chapter: [
      ".readerChapterContent",
      "[class*='readerChapterContent']",
      "[class*='chapterContent']"
    ].join(","),
    readingBlocks: "p,h1,h2,h3,h4,li,blockquote",
    chrome: [
      ".readerTopBar",
      ".readerControls",
      ".readerHeaderButton",
      ".readerFooter",
      "[class*='readerControls']",
      "[class*='readerTopBar']"
    ].join(",")
  };
  function findReadingScroller() {
    const scrolling = document.scrollingElement;
    return scrolling instanceof HTMLElement ? scrolling : document.documentElement;
  }

  // src/features/reading-aids.ts
  var ReadingAidsController = class {
    settings = null;
    progress = null;
    chapterChip = null;
    activeLine = null;
    frame = 0;
    hideControlsTimer = 0;
    lastScrollTop = 0;
    scrollDirection = 0;
    scrollDistance = 0;
    onActivity = () => {
      if (!this.settings?.enabled || !this.settings.autoHideControls) return;
      document.documentElement.dataset.brControlsHidden = "false";
      window.clearTimeout(this.hideControlsTimer);
      this.hideControlsTimer = window.setTimeout(() => {
        if (this.settings?.enabled && this.settings.autoHideControls) {
          document.documentElement.dataset.brControlsHidden = "true";
        }
      }, 1500);
    };
    scheduleUpdate = () => {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.updateProgress();
        this.updateChapter();
      });
    };
    onScroll = () => {
      this.scheduleUpdate();
      const current = findReadingScroller().scrollTop;
      const delta = current - this.lastScrollTop;
      this.lastScrollTop = current;
      if (!this.settings?.enabled || !this.settings.focusMode || Math.abs(delta) < 2) return;
      const direction = delta > 0 ? 1 : -1;
      if (direction !== this.scrollDirection) {
        this.scrollDirection = direction;
        this.scrollDistance = 0;
      }
      this.scrollDistance += Math.abs(delta);
      if (direction < 0) {
        document.documentElement.dataset.brFocusHidden = "false";
        return;
      }
      if (this.scrollDistance < 18) return;
      document.documentElement.dataset.brFocusHidden = String(current > 24);
    };
    onWheel = (event) => {
      if (!this.settings?.enabled || !this.settings.focusMode || event.deltaY >= -2) return;
      this.scrollDirection = -1;
      this.scrollDistance = 0;
      document.documentElement.dataset.brFocusHidden = "false";
    };
    onPointerOver = (event) => {
      if (!this.settings?.enabled || !this.settings.lineFocus) return;
      const target = event.target instanceof Element ? event.target.closest(selectors.readingBlocks) : null;
      if (!target || !target.closest(selectors.chapter) || target === this.activeLine) return;
      this.activeLine?.classList.remove("betterread-active-line");
      target.classList.add("betterread-active-line");
      this.activeLine = target;
    };
    mount() {
      if (!this.progress) {
        this.progress = document.createElement("div");
        this.progress.id = "betterread-progress";
        this.progress.setAttribute("aria-hidden", "true");
        this.progress.innerHTML = "<span></span>";
        document.body.append(this.progress);
      }
      if (!this.chapterChip) {
        this.chapterChip = document.createElement("div");
        this.chapterChip.id = "betterread-chapter-chip";
        this.chapterChip.setAttribute("aria-hidden", "true");
        document.body.append(this.chapterChip);
      }
      this.lastScrollTop = findReadingScroller().scrollTop;
      window.addEventListener("scroll", this.onScroll, { passive: true });
      document.addEventListener("scroll", this.onScroll, { capture: true, passive: true });
      document.addEventListener("wheel", this.onWheel, { passive: true });
      window.addEventListener("resize", this.scheduleUpdate, { passive: true });
      document.addEventListener("pointermove", this.onActivity, { passive: true });
      document.addEventListener("pointerdown", this.onActivity, { passive: true });
      document.addEventListener("keydown", this.onActivity);
      document.addEventListener("focusin", this.onActivity);
      document.addEventListener("pointerover", this.onPointerOver, { passive: true });
      this.scheduleUpdate();
    }
    apply(settings2) {
      const focusWasActive = Boolean(this.settings?.enabled && this.settings.focusMode);
      const focusIsActive = settings2.enabled && settings2.focusMode;
      this.settings = settings2;
      if (focusWasActive !== focusIsActive) {
        this.lastScrollTop = findReadingScroller().scrollTop;
        this.scrollDirection = 0;
        this.scrollDistance = 0;
        document.documentElement.dataset.brFocusHidden = "false";
      }
      if (this.progress) this.progress.hidden = !settings2.enabled || !settings2.showProgress;
      if (!settings2.enabled || !settings2.lineFocus) {
        this.activeLine?.classList.remove("betterread-active-line");
        this.activeLine = null;
      }
      if (settings2.enabled && settings2.autoHideControls) this.onActivity();
      else {
        window.clearTimeout(this.hideControlsTimer);
        document.documentElement.dataset.brControlsHidden = "false";
      }
      this.scheduleUpdate();
    }
    updateProgress() {
      if (!this.progress || !this.settings?.enabled || !this.settings.showProgress) return;
      const scroller = findReadingScroller();
      const available = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      const value = Math.min(1, Math.max(0, scroller.scrollTop / available));
      this.progress.style.setProperty("--br-progress", value.toFixed(4));
    }
    updateChapter() {
      if (!this.chapterChip || !this.settings?.enabled) return;
      const headings = [...new Set(
        [...document.querySelectorAll(selectors.chapter)].flatMap((container) => [...container.querySelectorAll("h1,h2,h3")])
      )].filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
      let current = headings[0] ?? null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 140) current = heading;
        else break;
      }
      this.chapterChip.textContent = current?.textContent?.trim() || "";
    }
    destroy() {
      window.removeEventListener("scroll", this.onScroll);
      document.removeEventListener("scroll", this.onScroll, { capture: true });
      document.removeEventListener("wheel", this.onWheel);
      window.removeEventListener("resize", this.scheduleUpdate);
      document.removeEventListener("pointermove", this.onActivity);
      document.removeEventListener("pointerdown", this.onActivity);
      document.removeEventListener("keydown", this.onActivity);
      document.removeEventListener("focusin", this.onActivity);
      document.removeEventListener("pointerover", this.onPointerOver);
      window.clearTimeout(this.hideControlsTimer);
      if (this.frame) cancelAnimationFrame(this.frame);
      this.activeLine?.classList.remove("betterread-active-line");
      this.progress?.remove();
      this.chapterChip?.remove();
    }
  };

  // src/platform/native-reader.ts
  function isDarkColor(color) {
    const value = color.replace("#", "");
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1e3 < 128;
  }
  function shouldUseNativeDark(settings2, prefersDark) {
    if (settings2.theme === "system") return prefersDark;
    if (settings2.theme === "custom") return isDarkColor(settings2.customBackground);
    return settings2.theme === "midnight" || settings2.theme === "dark" || settings2.theme === "oled";
  }
  var NativeReaderThemeController = class {
    settings = null;
    attempts = 0;
    retryTimer = 0;
    originalNativeDark = null;
    media = matchMedia("(prefers-color-scheme: dark)");
    onSchemeChange = () => this.settings && this.apply(this.settings);
    constructor() {
      this.media.addEventListener("change", this.onSchemeChange);
    }
    apply(settings2) {
      this.settings = settings2;
      this.attempts = 0;
      window.clearTimeout(this.retryTimer);
      this.syncOrRetry();
    }
    syncOrRetry() {
      if (!this.settings || this.sync()) return;
      if (this.attempts++ >= 12) return;
      this.retryTimer = window.setTimeout(() => this.syncOrRetry(), 250);
    }
    sync() {
      if (!this.settings || !document.body) return false;
      const nativeDark = !document.body.classList.contains("wr_whiteTheme");
      this.originalNativeDark ??= nativeDark;
      const desiredDark = this.settings.enabled ? shouldUseNativeDark(this.settings, this.media.matches) : this.originalNativeDark;
      if (desiredDark === nativeDark) return true;
      const themeButton = document.querySelector(
        "button.readerControls_item.dark, button.readerControls_item.white"
      );
      if (!themeButton) return false;
      themeButton.click();
      return true;
    }
    destroy() {
      window.clearTimeout(this.retryTimer);
      this.media.removeEventListener("change", this.onSchemeChange);
    }
  };

  // src/styles/reader-css.ts
  var READER_CSS = String.raw`
html[data-br-enabled="true"] {
  --br-bg: #f4f2ed;
  --br-surface: #fbfaf7;
  --br-text: #262b31;
  --br-muted: #727981;
  --br-border: rgba(38, 43, 49, 0.12);
  --br-accent: #2f7d68;
  --br-selection: rgba(47, 125, 104, 0.22);
}

html[data-br-theme="sepia"] {
  --br-bg: #eee5d3;
  --br-surface: #f8f0df;
  --br-text: #3a3026;
  --br-muted: #756859;
  --br-border: rgba(72, 56, 38, 0.14);
  --br-selection: rgba(161, 105, 52, 0.24);
}

html[data-br-theme="parchment"] {
  --br-bg: #d8c49f;
  --br-surface: #e7d5b1;
  --br-text: #4a3826;
  --br-muted: #806b50;
  --br-border: rgba(74, 56, 38, 0.18);
  --br-selection: rgba(139, 91, 48, 0.28);
}

html[data-br-theme="bean"] {
  --br-bg: #e7d8d4;
  --br-surface: #f0e4e0;
  --br-text: #493839;
  --br-muted: #796668;
  --br-border: rgba(73, 56, 57, 0.15);
  --br-selection: rgba(143, 90, 94, 0.24);
}

html[data-br-theme="forest"] {
  --br-bg: #e4eadf;
  --br-surface: #eef2ea;
  --br-text: #25322c;
  --br-muted: #607068;
  --br-border: rgba(37, 61, 49, 0.14);
  --br-selection: rgba(64, 119, 88, 0.23);
}

html[data-br-theme="midnight"] {
  --br-bg: #182431;
  --br-surface: #223140;
  --br-text: #d6e1ea;
  --br-muted: #94a8b8;
  --br-border: rgba(214, 225, 234, 0.13);
  --br-selection: rgba(94, 159, 196, 0.32);
}

html[data-br-theme="dark"] {
  --br-bg: #171a1f;
  --br-surface: #20242b;
  --br-text: #d9dde3;
  --br-muted: #929aa5;
  --br-border: rgba(232, 236, 241, 0.12);
  --br-selection: rgba(78, 184, 151, 0.3);
}

html[data-br-theme="oled"] {
  --br-bg: #000;
  --br-surface: #0a0b0d;
  --br-text: #d6d8dc;
  --br-muted: #878c94;
  --br-border: rgba(255, 255, 255, 0.14);
  --br-selection: rgba(77, 196, 159, 0.32);
}

html[data-br-enabled="true"] body.wr_page_reader,
html[data-br-enabled="true"] body[data-betterread-preview] {
  color: var(--br-text) !important;
  background-color: var(--br-bg) !important;
  transition: background-color 180ms ease, color 180ms ease;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.app, .routerView, .readerContent, .app_content),
html[data-br-enabled="true"] body[data-betterread-preview] :where(.app, .routerView, .readerContent, .app_content) {
  background-color: var(--br-bg) !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]),
html[data-br-enabled="true"] body[data-betterread-preview] .readerChapterContent {
  color: var(--br-text) !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) :where(p, li, h1, h2, h3, h4, blockquote),
html[data-br-enabled="true"] body[data-betterread-preview] .readerChapterContent :where(p, li, h1, h2, h3, h4, blockquote) {
  color: inherit !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerTopBar, .readerFooter, [class*="readerTopBar"], [class*="readerFooter"]),
html[data-br-enabled="true"] body[data-betterread-preview] :where(.readerTopBar, .readerFooter) {
  color: var(--br-muted) !important;
  background-color: color-mix(in srgb, var(--br-surface) 94%, transparent) !important;
  border-color: var(--br-border) !important;
}

html[data-br-enabled="true"] body.wr_page_reader .readerControls button,
html[data-br-enabled="true"] body[data-betterread-preview] .readerControls button {
  color: var(--br-muted) !important;
  background-color: var(--br-surface) !important;
  border-color: var(--br-border) !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) blockquote,
html[data-br-enabled="true"] body[data-betterread-preview] .readerChapterContent blockquote {
  border-inline-start-color: var(--br-accent) !important;
  background-color: color-mix(in srgb, var(--br-surface) 82%, transparent) !important;
  color: var(--br-muted) !important;
}

html[data-br-enabled="true"] body.wr_page_reader ::selection,
html[data-br-enabled="true"] body[data-betterread-preview] ::selection {
  background: var(--br-selection) !important;
}

html[data-br-enabled="true"][data-br-theme="midnight"] body.wr_page_reader img,
html[data-br-enabled="true"][data-br-theme="dark"] body.wr_page_reader img,
html[data-br-enabled="true"][data-br-theme="oled"] body.wr_page_reader img,
html[data-br-enabled="true"][data-br-theme="midnight"] body[data-betterread-preview] img,
html[data-br-enabled="true"][data-br-theme="dark"] body[data-betterread-preview] img,
html[data-br-enabled="true"][data-br-theme="oled"] body[data-betterread-preview] img {
  filter: brightness(0.9) contrast(0.96);
}

html[data-br-enabled="true"][data-br-focus="true"][data-br-focus-hidden="true"] body.wr_page_reader :where(.readerTopBar, .readerHeaderButton, .readerFooter, [class*="readerTopBar"], [class*="readerFooter"]),
html[data-br-enabled="true"][data-br-focus="true"][data-br-focus-hidden="true"] body[data-betterread-preview] :where(.readerTopBar, .readerFooter) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 180ms ease !important;
}

html[data-br-enabled="true"][data-br-autohide="true"][data-br-controls-hidden="true"] body.wr_page_reader .readerControls,
html[data-br-enabled="true"][data-br-autohide="true"][data-br-controls-hidden="true"] body[data-betterread-preview] .readerControls {
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translate(18px, -50%) !important;
  transition: opacity 180ms ease, transform 180ms ease !important;
}

html[data-br-enabled="true"][data-br-line-focus="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) :where(p, h1, h2, h3, h4, li, blockquote),
html[data-br-enabled="true"][data-br-line-focus="true"] body[data-betterread-preview] .readerChapterContent :where(p, h1, h2, h3, h4, li, blockquote) {
  opacity: 0.38;
  transition: opacity 120ms ease;
}

html[data-br-enabled="true"][data-br-line-focus="true"] body :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) .betterread-active-line {
  opacity: 1 !important;
}

#betterread-progress {
  position: fixed;
  inset: 0 0 auto;
  z-index: 2147483645;
  height: 3px;
  pointer-events: none;
  background: transparent;
}

#betterread-progress > span {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--br-accent, #2f7d68);
  box-shadow: 0 0 10px color-mix(in srgb, var(--br-accent, #2f7d68) 55%, transparent);
  transform: scaleX(var(--br-progress, 0));
  transform-origin: left center;
  transition: transform 80ms linear;
}

#betterread-progress[hidden] { display: none !important; }

#betterread-chapter-chip {
  position: fixed;
  z-index: 2147483644;
  top: 14px;
  left: 50%;
  max-width: min(540px, calc(100vw - 160px));
  padding: 6px 12px;
  overflow: hidden;
  color: var(--br-muted, #727981);
  background: color-mix(in srgb, var(--br-surface, #fff) 88%, transparent);
  border: 1px solid var(--br-border, rgba(0,0,0,.12));
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,.08);
  font: 500 12px/1.35 ui-sans-serif, system-ui, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -6px);
  transition: opacity 160ms ease, transform 160ms ease;
}

html[data-br-enabled="true"][data-br-focus="true"] #betterread-chapter-chip {
  opacity: 0.9;
  transform: translate(-50%, 0);
}

@media (max-width: 720px) {
  #betterread-chapter-chip { max-width: calc(100vw - 104px); }
}

@media (prefers-reduced-motion: reduce) {
  html[data-br-enabled="true"] *, #betterread-progress > span, #betterread-chapter-chip {
    transition-duration: 0.01ms !important;
  }
}
`;

  // src/ui/settings-panel.ts
  var PANEL_CSS = String.raw`
:host {
  all: initial;
  --panel-bg: #f8faf9;
  --panel-surface: #ffffff;
  --panel-surface-2: #eef3f1;
  --panel-text: #18211e;
  --panel-muted: #68736e;
  --panel-border: rgba(24, 45, 37, 0.13);
  --panel-accent: #2f8b6d;
  --panel-launcher: #17241f;
  --panel-shadow: rgba(22, 37, 31, .2);
  color: var(--panel-text);
  color-scheme: light;
  font: 14px/1.45 "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
}
:host([data-ui-theme="dark"]) {
  --panel-bg: #111715;
  --panel-surface: #19211e;
  --panel-surface-2: #202a26;
  --panel-text: #edf4f0;
  --panel-muted: #a1afa9;
  --panel-border: rgba(229, 244, 237, 0.12);
  --panel-accent: #65c6a5;
  --panel-launcher: #16211d;
  --panel-shadow: rgba(0, 0, 0, .42);
  color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
button, input, select { font: inherit; }
button { color: inherit; }
.launcher {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2147483647;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 14px;
  color: #edf4f0;
  background: var(--panel-launcher);
  box-shadow: 0 12px 36px rgba(0, 0, 0, .24);
  cursor: pointer;
  transition: transform 150ms ease, background 150ms ease;
}
.launcher:hover { transform: translateY(-2px); filter: brightness(1.12); }
.launcher:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
  outline: 2px solid var(--panel-accent);
  outline-offset: 2px;
}
.launcher svg { width: 22px; height: 22px; }
.panel {
  position: fixed;
  z-index: 2147483647;
  right: 24px;
  bottom: 80px;
  width: min(390px, calc(100vw - 32px));
  max-height: min(760px, calc(100vh - 112px));
  overflow: auto;
  overscroll-behavior: contain;
  color: var(--panel-text);
  background: color-mix(in srgb, var(--panel-bg) 96%, transparent);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  box-shadow: 0 24px 80px var(--panel-shadow);
  backdrop-filter: blur(22px) saturate(1.2);
}
.panel[hidden] { display: none; }
.header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 18px 14px;
  background: color-mix(in srgb, var(--panel-bg) 94%, transparent);
  border-bottom: 1px solid var(--panel-border);
  backdrop-filter: blur(18px);
}
.mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #0d1a15;
  background: var(--panel-accent);
  font: 800 17px/1 ui-serif, serif;
}
.heading { min-width: 0; flex: 1; }
.title { margin: 0; font-size: 16px; font-weight: 720; letter-spacing: .01em; }
.subtitle { margin: 2px 0 0; color: var(--panel-muted); font-size: 11px; }
.icon-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
.icon-button:hover { background: var(--panel-surface-2); }
.content { display: grid; gap: 12px; padding: 14px; }
.section {
  padding: 14px;
  background: var(--panel-surface);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
}
.section[hidden] { display: none; }
.section-title {
  margin: 0 0 12px;
  color: var(--panel-muted);
  font-size: 11px;
  font-weight: 720;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.field { display: grid; gap: 7px; margin-top: 12px; }
.field[hidden] { display: none; }
.field:first-of-type { margin-top: 0; }
.field-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.field-label { color: var(--panel-text); font-size: 13px; }
.field-value { color: var(--panel-accent); font-variant-numeric: tabular-nums; font-size: 12px; }
select, input[type="color"] {
  width: 100%;
  min-height: 36px;
  color: var(--panel-text);
  background: var(--panel-surface-2);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
}
select { padding: 0 34px 0 10px; }
input[type="color"] { padding: 4px; cursor: pointer; }
input[type="range"] {
  width: 100%;
  height: 18px;
  margin: 0;
  accent-color: var(--panel-accent);
  cursor: pointer;
}
.color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.color-grid label { display: grid; gap: 6px; color: var(--panel-muted); font-size: 11px; }
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 42px;
  border-top: 1px solid var(--panel-border);
}
.switch-row:first-of-type { border-top: 0; }
.switch-copy { min-width: 0; }
.switch-title { display: block; color: var(--panel-text); font-size: 13px; }
.switch-note { display: block; margin-top: 2px; color: var(--panel-muted); font-size: 11px; }
.switch {
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 22px;
}
.switch input { position: absolute; opacity: 0; }
.switch span {
  position: absolute;
  inset: 0;
  border-radius: 11px;
  background: #38423e;
  cursor: pointer;
  transition: background 140ms ease;
}
.switch span::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f2f5f3;
  transition: transform 140ms ease;
}
.switch input:checked + span { background: #3e9f7e; }
.switch input:checked + span::after { transform: translateX(16px); }
.switch input:focus-visible + span { outline: 2px solid var(--panel-accent); outline-offset: 2px; }
.switch input:disabled + span { opacity: .4; cursor: not-allowed; }
.footer {
  position: sticky;
  bottom: -14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 -14px -14px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--panel-bg) 96%, transparent);
  border-top: 1px solid var(--panel-border);
  backdrop-filter: blur(18px);
}
.scope { color: var(--panel-muted); font-size: 11px; }
.reset {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  color: var(--panel-accent);
  background: var(--panel-surface);
  font-weight: 650;
  cursor: pointer;
}
.reset:hover { background: var(--panel-surface-2); }
@media (max-width: 560px) {
  .launcher { right: 16px; bottom: 16px; }
  .panel { right: 16px; left: 16px; bottom: 70px; width: auto; max-height: calc(100vh - 94px); }
}
@media (prefers-reduced-motion: reduce) { * { transition-duration: .01ms !important; } }
`;
  var PANEL_HTML = `
  <button class="launcher" type="button" aria-label="打开 BetterRead 设置" title="BetterRead 设置 (Alt+B)">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Zm0 0v11.2M8.5 16H19"/></svg>
  </button>
  <section class="panel" role="dialog" aria-label="BetterRead 阅读设置" hidden>
    <header class="header">
      <div class="mark">B</div>
      <div class="heading"><h2 class="title">BetterRead</h2><p class="subtitle">微信读书体验增强 · v${"0.1.4"}</p></div>
      <button class="icon-button" type="button" data-action="close" aria-label="关闭设置">✕</button>
    </header>
    <div class="content">
      <section class="section">
        <h3 class="section-title">状态</h3>
        <div class="switch-row">
          <div class="switch-copy"><span class="switch-title">启用 BetterRead</span><span class="switch-note">关闭后立即恢复原网页样式</span></div>
          <label class="switch"><input type="checkbox" name="enabled"><span></span></label>
        </div>
        <div class="switch-row">
          <div class="switch-copy"><span class="switch-title">仅应用于本书</span><span class="switch-note">为当前书籍保存独立设置</span></div>
          <label class="switch"><input type="checkbox" name="bookScoped"><span></span></label>
        </div>
        <label class="field"><span class="field-label">面板外观</span>
          <select name="uiTheme"><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select>
        </label>
      </section>

      <section class="section">
        <h3 class="section-title">正文主题</h3>
        <label class="field"><span class="field-label">配色</span>
          <select name="theme">
            <option value="paper">纸张白</option><option value="sepia">暖黄</option><option value="parchment">羊皮纸</option>
            <option value="bean">豆沙</option><option value="forest">护眼绿</option><option value="midnight">月夜蓝</option>
            <option value="dark">深色</option><option value="oled">OLED 黑</option><option value="system">跟随系统</option><option value="custom">自定义</option>
          </select>
        </label>
        <div class="field color-grid" data-custom-colors>
          <label>背景<input type="color" name="customBackground"></label>
          <label>正文<input type="color" name="customText"></label>
          <label>强调<input type="color" name="accent"></label>
        </div>
        <p class="switch-note">仅调整配色；字体、字号、行距和版心继续使用微信读书设置。</p>
      </section>

      <section class="section">
        <h3 class="section-title">阅读辅助</h3>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">沉浸模式</span><span class="switch-note">下滑隐藏顶部与页脚，上滑立即显示</span></div><label class="switch"><input type="checkbox" name="focusMode"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">自动隐藏工具栏</span><span class="switch-note">闲置 1.5 秒后隐藏，移动鼠标即恢复</span></div><label class="switch"><input type="checkbox" name="autoHideControls"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">顶部阅读进度</span></div><label class="switch"><input type="checkbox" name="showProgress"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">段落聚焦</span><span class="switch-note">移动鼠标突出当前段落</span></div><label class="switch"><input type="checkbox" name="lineFocus"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">启用快捷键</span><span class="switch-note">Alt+B / Alt+T / Alt+F / Alt+0</span></div><label class="switch"><input type="checkbox" name="shortcuts"><span></span></label></div>
      </section>

      <footer class="footer"><span class="scope" data-scope-label>当前：全局设置</span><button class="reset" type="button" data-action="reset">恢复当前默认</button></footer>
    </div>
  </section>
`;
  var SettingsPanel = class {
    constructor(initial, options) {
      this.options = options;
      this.settings = copySettings(initial);
      this.host.id = "betterread-ui-host";
      this.root = this.host.attachShadow({ mode: "open" });
      this.root.innerHTML = `<style>${PANEL_CSS}</style>${PANEL_HTML}`;
      this.panel = this.root.querySelector(".panel");
      this.root.querySelector(".launcher")?.addEventListener("click", () => this.toggle());
      this.root.addEventListener("click", (event) => this.onClick(event));
      this.root.addEventListener("input", (event) => this.onInput(event));
      this.root.addEventListener("change", (event) => this.onInput(event));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.isOpen()) this.close();
      });
      this.media.addEventListener("change", this.onSchemeChange);
      this.syncFields();
    }
    host = document.createElement("div");
    root;
    panel;
    settings;
    bookId = null;
    bookScoped = false;
    media = matchMedia("(prefers-color-scheme: dark)");
    onSchemeChange = () => this.updatePanelTheme();
    mount() {
      document.body.append(this.host);
    }
    setState(settings2, bookScoped2, bookId) {
      this.settings = copySettings(settings2);
      this.bookScoped = bookScoped2;
      this.bookId = bookId;
      this.syncFields();
    }
    open() {
      this.panel.hidden = false;
      this.root.querySelector("[data-action='close']")?.focus();
    }
    close() {
      this.panel.hidden = true;
      this.root.querySelector(".launcher")?.focus();
    }
    toggle() {
      this.isOpen() ? this.close() : this.open();
    }
    isOpen() {
      return !this.panel.hidden;
    }
    onClick(event) {
      const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
      if (!target) return;
      if (target.dataset.action === "close") this.close();
      if (target.dataset.action === "reset") this.options.onReset();
    }
    onInput(event) {
      const input = event.target;
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
      if (input.name === "bookScoped") {
        const checked2 = input instanceof HTMLInputElement && input.checked;
        this.bookScoped = checked2;
        this.options.onBookScopeChange(checked2);
        return;
      }
      const next = copySettings(this.settings);
      const checked = input instanceof HTMLInputElement && input.checked;
      switch (input.name) {
        case "enabled":
          next.enabled = checked;
          break;
        case "uiTheme":
          next.uiTheme = input.value;
          break;
        case "theme":
          next.theme = input.value;
          break;
        case "customBackground":
          next.customBackground = input.value;
          break;
        case "customText":
          next.customText = input.value;
          break;
        case "accent":
          next.accent = input.value;
          break;
        case "focusMode":
          next.focusMode = checked;
          break;
        case "autoHideControls":
          next.autoHideControls = checked;
          break;
        case "showProgress":
          next.showProgress = checked;
          break;
        case "lineFocus":
          next.lineFocus = checked;
          break;
        case "shortcuts":
          next.shortcuts = checked;
          break;
        default:
          return;
      }
      this.settings = next;
      this.updatePanelTheme();
      this.syncDynamicFields();
      this.options.onChange(copySettings(next));
    }
    syncFields() {
      const setValue2 = (name, value) => {
        const input = this.root.querySelector(`[name="${name}"]`);
        if (!input) return;
        if (input instanceof HTMLInputElement && input.type === "checkbox") input.checked = Boolean(value);
        else input.value = String(value);
      };
      setValue2("enabled", this.settings.enabled);
      setValue2("uiTheme", this.settings.uiTheme);
      setValue2("bookScoped", this.bookScoped);
      setValue2("theme", this.settings.theme);
      setValue2("customBackground", this.settings.customBackground);
      setValue2("customText", this.settings.customText);
      setValue2("accent", this.settings.accent);
      setValue2("focusMode", this.settings.focusMode);
      setValue2("autoHideControls", this.settings.autoHideControls);
      setValue2("showProgress", this.settings.showProgress);
      setValue2("lineFocus", this.settings.lineFocus);
      setValue2("shortcuts", this.settings.shortcuts);
      const scope = this.root.querySelector("[name='bookScoped']");
      if (scope) scope.disabled = !this.bookId;
      this.updatePanelTheme();
      this.syncDynamicFields();
    }
    updatePanelTheme() {
      this.host.dataset.uiTheme = this.settings.uiTheme === "system" ? this.media.matches ? "dark" : "light" : this.settings.uiTheme;
    }
    syncDynamicFields() {
      const customColors = this.root.querySelector("[data-custom-colors]");
      if (customColors) customColors.hidden = this.settings.theme !== "custom";
      const label = this.root.querySelector("[data-scope-label]");
      if (label) label.textContent = this.bookScoped ? "当前：本书独立设置" : "当前：全局设置";
    }
  };

  // src/main.ts
  function addStyle(css) {
    if (typeof GM_addStyle === "function") {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement("style");
    style.dataset.betterread = "reader";
    style.textContent = css;
    (document.head || document.documentElement).append(style);
  }
  function ready() {
    if (document.body) return Promise.resolve();
    return new Promise((resolve) => document.addEventListener("DOMContentLoaded", () => resolve(), { once: true }));
  }
  function previewBookId() {
    return document.body?.dataset.betterreadBook || null;
  }
  addStyle(READER_CSS);
  var currentBookId = getBookId();
  var bookScoped = hasBookProfile(currentBookId);
  var settings = loadResolvedSettings(currentBookId);
  var appearance = new AppearanceController();
  var readingAids = new ReadingAidsController();
  var nativeTheme = new NativeReaderThemeController();
  var panel = null;
  appearance.apply(settings);
  function apply(next, persist = true) {
    settings = copySettings(next);
    appearance.apply(settings);
    nativeTheme.apply(settings);
    readingAids.apply(settings);
    panel?.setState(settings, bookScoped, currentBookId);
    if (persist) saveScopedSettings(currentBookId, bookScoped, settings);
  }
  function resetCurrentScope() {
    apply(copySettings(DEFAULT_SETTINGS));
  }
  function setBookScope(enabled) {
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
  function refreshRoute() {
    const nextBookId = getBookId() || previewBookId();
    if (nextBookId === currentBookId) return;
    currentBookId = nextBookId;
    bookScoped = hasBookProfile(currentBookId);
    apply(loadResolvedSettings(currentBookId), false);
  }
  function cycleTheme() {
    const order = ["paper", "sepia", "parchment", "bean", "forest", "midnight", "dark", "oled", "system"];
    const index = order.indexOf(settings.theme);
    apply({ ...settings, theme: order[(index + 1) % order.length] ?? "paper" });
  }
  function isEditableTarget(target) {
    return target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"));
  }
  function onShortcut(event) {
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
  function registerMenu() {
    if (typeof GM_registerMenuCommand !== "function") return;
    GM_registerMenuCommand("打开 BetterRead 设置", () => panel?.open());
    GM_registerMenuCommand("启用 / 停用 BetterRead", () => apply({ ...settings, enabled: !settings.enabled }));
    GM_registerMenuCommand("切换阅读主题", cycleTheme);
    GM_registerMenuCommand("恢复当前范围默认设置", resetCurrentScope);
  }
  void ready().then(() => {
    const isPreview = document.body.dataset.betterreadPreview !== void 0;
    if (!isReaderPage() && !isPreview) return;
    if (!currentBookId) currentBookId = previewBookId();
    bookScoped = hasBookProfile(currentBookId);
    settings = loadResolvedSettings(currentBookId);
    panel = new SettingsPanel(settings, {
      onChange: (next) => apply(next),
      onBookScopeChange: setBookScope,
      onReset: resetCurrentScope
    });
    panel.mount();
    readingAids.mount();
    apply(settings, false);
    installRouteObserver(refreshRoute);
    document.addEventListener("keydown", onShortcut);
    registerMenu();
  });
})();
