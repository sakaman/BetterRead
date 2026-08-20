import { copySettings, type BetterReadSettings, type FontId, type TextAlign, type ThemeId } from "../core/settings.ts";

export interface SettingsPanelOptions {
  onChange: (settings: BetterReadSettings) => void;
  onBookScopeChange: (enabled: boolean) => void;
  onReset: () => void;
}

const PANEL_CSS = String.raw`
:host {
  all: initial;
  --panel-bg: #111715;
  --panel-surface: #19211e;
  --panel-surface-2: #202a26;
  --panel-text: #edf4f0;
  --panel-muted: #a1afa9;
  --panel-border: rgba(229, 244, 237, 0.12);
  --panel-accent: #65c6a5;
  color: var(--panel-text);
  font: 14px/1.45 "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
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
  background: #16211d;
  box-shadow: 0 12px 36px rgba(0, 0, 0, .24);
  cursor: pointer;
  transition: transform 150ms ease, background 150ms ease;
}
.launcher:hover { transform: translateY(-2px); background: #1c2c26; }
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
  box-shadow: 0 24px 80px rgba(0,0,0,.42);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px 2px;
}
.scope { color: var(--panel-muted); font-size: 11px; }
.reset {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
.reset:hover { background: var(--panel-surface-2); }
@media (max-width: 560px) {
  .launcher { right: 16px; bottom: 16px; }
  .panel { right: 16px; bottom: 70px; max-height: calc(100vh - 94px); }
}
@media (prefers-reduced-motion: reduce) { * { transition-duration: .01ms !important; } }
`;

const PANEL_HTML = `
  <button class="launcher" type="button" aria-label="打开 BetterRead 设置" title="BetterRead 设置 (Alt+B)">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Zm0 0v11.2M8.5 16H19"/></svg>
  </button>
  <section class="panel" role="dialog" aria-label="BetterRead 阅读设置" hidden>
    <header class="header">
      <div class="mark">B</div>
      <div class="heading"><h2 class="title">BetterRead</h2><p class="subtitle">微信读书体验增强 · v0.1.0</p></div>
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
      </section>

      <section class="section">
        <h3 class="section-title">主题</h3>
        <label class="field"><span class="field-label">配色</span>
          <select name="theme">
            <option value="paper">纸张白</option><option value="sepia">暖黄</option><option value="forest">护眼绿</option>
            <option value="dark">深色</option><option value="oled">OLED 黑</option><option value="system">跟随系统</option><option value="custom">自定义</option>
          </select>
        </label>
        <div class="field color-grid" data-custom-colors>
          <label>背景<input type="color" name="customBackground"></label>
          <label>正文<input type="color" name="customText"></label>
          <label>强调<input type="color" name="accent"></label>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">排版</h3>
        <label class="field"><span class="field-label">字体</span>
          <select name="font"><option value="system-serif">系统宋体</option><option value="system-sans">系统黑体</option><option value="source-serif">思源宋体</option><option value="lxgw">霞鹜文楷</option></select>
        </label>
        <label class="field"><span class="field-head"><span class="field-label">字号</span><output class="field-value" data-output="fontSize"></output></span><input type="range" name="fontSize" min="14" max="30" step="1"></label>
        <label class="field"><span class="field-head"><span class="field-label">行高</span><output class="field-value" data-output="lineHeight"></output></span><input type="range" name="lineHeight" min="1.4" max="2.5" step="0.05"></label>
        <label class="field"><span class="field-head"><span class="field-label">字间距</span><output class="field-value" data-output="letterSpacing"></output></span><input type="range" name="letterSpacing" min="0" max="0.12" step="0.01"></label>
        <label class="field"><span class="field-head"><span class="field-label">段落间距</span><output class="field-value" data-output="paragraphSpacing"></output></span><input type="range" name="paragraphSpacing" min="0.4" max="2.4" step="0.1"></label>
        <label class="field"><span class="field-head"><span class="field-label">阅读栏宽度</span><output class="field-value" data-output="contentWidth"></output></span><input type="range" name="contentWidth" min="560" max="1080" step="20"></label>
        <label class="field"><span class="field-label">对齐方式</span><select name="textAlign"><option value="justify">两端对齐</option><option value="left">左对齐</option></select></label>
      </section>

      <section class="section">
        <h3 class="section-title">阅读辅助</h3>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">沉浸模式</span><span class="switch-note">弱化界面并显示章节提示</span></div><label class="switch"><input type="checkbox" name="focusMode"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">自动隐藏控件</span><span class="switch-note">悬停时恢复显示</span></div><label class="switch"><input type="checkbox" name="autoHideControls"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">顶部阅读进度</span></div><label class="switch"><input type="checkbox" name="showProgress"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">段落聚焦</span><span class="switch-note">移动鼠标突出当前段落</span></div><label class="switch"><input type="checkbox" name="lineFocus"><span></span></label></div>
        <div class="switch-row"><div class="switch-copy"><span class="switch-title">启用快捷键</span><span class="switch-note">Alt+B / Alt+T / Alt+F / Alt+0</span></div><label class="switch"><input type="checkbox" name="shortcuts"><span></span></label></div>
      </section>

      <footer class="footer"><span class="scope" data-scope-label>当前：全局设置</span><button class="reset" type="button" data-action="reset">恢复默认</button></footer>
    </div>
  </section>
`;

export class SettingsPanel {
  readonly host = document.createElement("div");
  private readonly root: ShadowRoot;
  private readonly panel: HTMLElement;
  private settings: BetterReadSettings;
  private bookId: string | null = null;
  private bookScoped = false;

  constructor(initial: BetterReadSettings, private readonly options: SettingsPanelOptions) {
    this.settings = copySettings(initial);
    this.host.id = "betterread-ui-host";
    this.root = this.host.attachShadow({ mode: "open" });
    this.root.innerHTML = `<style>${PANEL_CSS}</style>${PANEL_HTML}`;
    this.panel = this.root.querySelector<HTMLElement>(".panel")!;

    this.root.querySelector(".launcher")?.addEventListener("click", () => this.toggle());
    this.root.addEventListener("click", (event) => this.onClick(event));
    this.root.addEventListener("input", (event) => this.onInput(event));
    this.root.addEventListener("change", (event) => this.onInput(event));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen()) this.close();
    });
    this.syncFields();
  }

  mount(): void {
    document.body.append(this.host);
  }

  setState(settings: BetterReadSettings, bookScoped: boolean, bookId: string | null): void {
    this.settings = copySettings(settings);
    this.bookScoped = bookScoped;
    this.bookId = bookId;
    this.syncFields();
  }

  open(): void {
    this.panel.hidden = false;
    this.root.querySelector<HTMLElement>("[data-action='close']")?.focus();
  }

  close(): void {
    this.panel.hidden = true;
    this.root.querySelector<HTMLElement>(".launcher")?.focus();
  }

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  isOpen(): boolean {
    return !this.panel.hidden;
  }

  private onClick(event: Event): void {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;
    if (!target) return;
    if (target.dataset.action === "close") this.close();
    if (target.dataset.action === "reset") this.options.onReset();
  }

  private onInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
    if (input.name === "bookScoped") {
      const checked = input instanceof HTMLInputElement && input.checked;
      this.bookScoped = checked;
      this.options.onBookScopeChange(checked);
      return;
    }

    const next = copySettings(this.settings);
    const checked = input instanceof HTMLInputElement && input.checked;
    switch (input.name) {
      case "enabled": next.enabled = checked; break;
      case "theme": next.theme = input.value as ThemeId; break;
      case "customBackground": next.customBackground = input.value; break;
      case "customText": next.customText = input.value; break;
      case "accent": next.accent = input.value; break;
      case "font": next.typography.font = input.value as FontId; break;
      case "fontSize": next.typography.fontSize = Number(input.value); break;
      case "lineHeight": next.typography.lineHeight = Number(input.value); break;
      case "letterSpacing": next.typography.letterSpacing = Number(input.value); break;
      case "paragraphSpacing": next.typography.paragraphSpacing = Number(input.value); break;
      case "contentWidth": next.typography.contentWidth = Number(input.value); break;
      case "textAlign": next.typography.textAlign = input.value as TextAlign; break;
      case "focusMode": next.focusMode = checked; break;
      case "autoHideControls": next.autoHideControls = checked; break;
      case "showProgress": next.showProgress = checked; break;
      case "lineFocus": next.lineFocus = checked; break;
      case "shortcuts": next.shortcuts = checked; break;
      default: return;
    }
    this.settings = next;
    this.syncDynamicFields();
    this.options.onChange(copySettings(next));
  }

  private syncFields(): void {
    const setValue = (name: string, value: string | number | boolean) => {
      const input = this.root.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
      if (!input) return;
      if (input instanceof HTMLInputElement && input.type === "checkbox") input.checked = Boolean(value);
      else input.value = String(value);
    };

    setValue("enabled", this.settings.enabled);
    setValue("bookScoped", this.bookScoped);
    setValue("theme", this.settings.theme);
    setValue("customBackground", this.settings.customBackground);
    setValue("customText", this.settings.customText);
    setValue("accent", this.settings.accent);
    setValue("font", this.settings.typography.font);
    setValue("fontSize", this.settings.typography.fontSize);
    setValue("lineHeight", this.settings.typography.lineHeight);
    setValue("letterSpacing", this.settings.typography.letterSpacing);
    setValue("paragraphSpacing", this.settings.typography.paragraphSpacing);
    setValue("contentWidth", this.settings.typography.contentWidth);
    setValue("textAlign", this.settings.typography.textAlign);
    setValue("focusMode", this.settings.focusMode);
    setValue("autoHideControls", this.settings.autoHideControls);
    setValue("showProgress", this.settings.showProgress);
    setValue("lineFocus", this.settings.lineFocus);
    setValue("shortcuts", this.settings.shortcuts);

    const scope = this.root.querySelector<HTMLInputElement>("[name='bookScoped']");
    if (scope) scope.disabled = !this.bookId;
    this.syncDynamicFields();
  }

  private syncDynamicFields(): void {
    const customColors = this.root.querySelector<HTMLElement>("[data-custom-colors]");
    if (customColors) customColors.hidden = this.settings.theme !== "custom";
    const values: Record<string, string> = {
      fontSize: `${this.settings.typography.fontSize}px`,
      lineHeight: this.settings.typography.lineHeight.toFixed(2),
      letterSpacing: `${this.settings.typography.letterSpacing.toFixed(2)}em`,
      paragraphSpacing: `${this.settings.typography.paragraphSpacing.toFixed(1)}em`,
      contentWidth: `${this.settings.typography.contentWidth}px`,
    };
    for (const [name, value] of Object.entries(values)) {
      const output = this.root.querySelector<HTMLOutputElement>(`[data-output="${name}"]`);
      if (output) output.value = value;
    }
    const label = this.root.querySelector<HTMLElement>("[data-scope-label]");
    if (label) label.textContent = this.bookScoped ? "当前：本书独立设置" : "当前：全局设置";
  }
}
