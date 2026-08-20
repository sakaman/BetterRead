import type { BetterReadSettings, ThemeId } from "../core/settings.ts";

const LEGACY_APPEARANCE_PROPERTIES = [
  "--br-content-width",
  "--br-font-size",
  "--br-line-height",
  "--br-letter-spacing",
  "--br-paragraph-spacing",
  "--br-font-family",
  "--br-text-align",
];

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
    delete root.dataset.brFont;
    root.style.setProperty("--br-accent", settings.accent);
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
    for (const property of LEGACY_APPEARANCE_PROPERTIES) {
      root.style.removeProperty(property);
    }
  }

  destroy(): void {
    this.media.removeEventListener("change", this.onSchemeChange);
  }
}
