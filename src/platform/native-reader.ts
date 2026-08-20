import type { BetterReadSettings } from "../core/settings.ts";

function isDarkColor(color: string): boolean {
  const value = color.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128;
}

export function shouldUseNativeDark(settings: BetterReadSettings, prefersDark: boolean): boolean {
  if (settings.theme === "system") return prefersDark;
  if (settings.theme === "custom") return isDarkColor(settings.customBackground);
  return settings.theme === "midnight" || settings.theme === "dark" || settings.theme === "oled";
}

export class NativeReaderThemeController {
  private settings: BetterReadSettings | null = null;
  private attempts = 0;
  private retryTimer = 0;
  private originalNativeDark: boolean | null = null;
  private readonly media = matchMedia("(prefers-color-scheme: dark)");
  private readonly onSchemeChange = () => this.settings && this.apply(this.settings);

  constructor() {
    this.media.addEventListener("change", this.onSchemeChange);
  }

  apply(settings: BetterReadSettings): void {
    this.settings = settings;
    this.attempts = 0;
    window.clearTimeout(this.retryTimer);
    this.syncOrRetry();
  }

  private syncOrRetry(): void {
    if (!this.settings || this.sync()) return;
    if (this.attempts++ >= 12) return;
    this.retryTimer = window.setTimeout(() => this.syncOrRetry(), 250);
  }

  private sync(): boolean {
    if (!this.settings || !document.body) return false;
    const nativeDark = !document.body.classList.contains("wr_whiteTheme");
    this.originalNativeDark ??= nativeDark;
    const desiredDark = this.settings.enabled
      ? shouldUseNativeDark(this.settings, this.media.matches)
      : this.originalNativeDark;
    if (desiredDark === nativeDark) return true;

    const themeButton = document.querySelector<HTMLButtonElement>(
      "button.readerControls_item.dark, button.readerControls_item.white",
    );
    if (!themeButton) return false;
    themeButton.click();
    return true;
  }

  destroy(): void {
    window.clearTimeout(this.retryTimer);
    this.media.removeEventListener("change", this.onSchemeChange);
  }
}
