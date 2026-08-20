import type { BetterReadSettings, FontId, ThemeId } from "../core/settings.ts";

const fonts: Record<FontId, string> = {
  "system-sans": '"PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
  "system-serif": 'ui-serif, "Songti SC", "Source Han Serif SC", SimSun, serif',
  "source-serif": '"Source Han Serif CN", "Source Han Serif SC", "Noto Serif CJK SC", ui-serif, serif',
  lxgw: '"LXGW WenKai", "霞鹜文楷", "KaiTi", cursive',
};

export class AppearanceController {
  private settings: BetterReadSettings | null = null;
  private readonly media = matchMedia("(prefers-color-scheme: dark)");
  private readonly onSchemeChange = () => this.settings && this.apply(this.settings);

  constructor() {
    this.media.addEventListener("change", this.onSchemeChange);
  }

  apply(settings: BetterReadSettings): void {
    this.settings = settings;
    const root = document.documentElement;
    const enabled = settings.enabled;
    const resolvedTheme: Exclude<ThemeId, "system"> = settings.theme === "system"
      ? this.media.matches ? "dark" : "paper"
      : settings.theme;

    root.dataset.brEnabled = String(enabled);
    root.dataset.brTheme = resolvedTheme;
    root.dataset.brFocus = String(enabled && settings.focusMode);
    root.dataset.brAutohide = String(enabled && settings.autoHideControls);
    root.dataset.brLineFocus = String(enabled && settings.lineFocus);
    root.style.setProperty("--br-accent", settings.accent);
    root.style.setProperty("--br-content-width", `${settings.typography.contentWidth}px`);
    root.style.setProperty("--br-font-size", `${settings.typography.fontSize}px`);
    root.style.setProperty("--br-line-height", String(settings.typography.lineHeight));
    root.style.setProperty("--br-letter-spacing", `${settings.typography.letterSpacing}em`);
    root.style.setProperty("--br-paragraph-spacing", `${settings.typography.paragraphSpacing}em`);
    root.style.setProperty("--br-font-family", fonts[settings.typography.font]);
    root.style.setProperty("--br-text-align", settings.typography.textAlign);

    if (resolvedTheme === "custom") {
      root.style.setProperty("--br-bg", settings.customBackground);
      root.style.setProperty("--br-surface", `color-mix(in srgb, ${settings.customBackground} 88%, ${settings.customText})`);
      root.style.setProperty("--br-text", settings.customText);
      root.style.setProperty("--br-muted", `color-mix(in srgb, ${settings.customText} 66%, ${settings.customBackground})`);
      root.style.setProperty("--br-border", `color-mix(in srgb, ${settings.customText} 16%, transparent)`);
      root.style.setProperty("--br-selection", `color-mix(in srgb, ${settings.accent} 26%, transparent)`);
    } else {
      for (const property of ["--br-bg", "--br-surface", "--br-text", "--br-muted", "--br-border", "--br-selection"]) {
        root.style.removeProperty(property);
      }
    }
  }

  destroy(): void {
    this.media.removeEventListener("change", this.onSchemeChange);
  }
}
