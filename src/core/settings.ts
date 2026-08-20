export const SETTINGS_VERSION = 2 as const;

export type ThemeId = "paper" | "sepia" | "parchment" | "bean" | "forest" | "midnight" | "dark" | "oled" | "system" | "custom";
export type UiThemeId = "light" | "dark" | "system";
export type FontId = "wechat-default" | "source-serif" | "source-sans" | "lxgw";
export type TextAlign = "left" | "justify";

export interface TypographySettings {
  font: FontId;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  contentWidth: number;
  textAlign: TextAlign;
}

export interface BetterReadSettings {
  version: typeof SETTINGS_VERSION;
  enabled: boolean;
  uiTheme: UiThemeId;
  theme: ThemeId;
  customBackground: string;
  customText: string;
  accent: string;
  typography: TypographySettings;
  focusMode: boolean;
  autoHideControls: boolean;
  showProgress: boolean;
  lineFocus: boolean;
  shortcuts: boolean;
}

export const DEFAULT_SETTINGS: BetterReadSettings = {
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
    textAlign: "justify",
  },
  focusMode: false,
  autoHideControls: false,
  showProgress: true,
  lineFocus: false,
  shortcuts: true,
};

const themes = new Set<ThemeId>(["paper", "sepia", "parchment", "bean", "forest", "midnight", "dark", "oled", "system", "custom"]);
const uiThemes = new Set<UiThemeId>(["light", "dark", "system"]);
const fonts = new Set<FontId>(["wechat-default", "source-serif", "source-sans", "lxgw"]);
const alignments = new Set<TextAlign>(["left", "justify"]);

function normalizeFont(value: unknown): FontId {
  if (value === "system-serif" || value === "system-sans") return "wechat-default";
  return fonts.has(value as FontId) ? value as FontId : DEFAULT_SETTINGS.typography.font;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function validColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function normalizeSettings(value: unknown): BetterReadSettings {
  const input = value && typeof value === "object" ? value as Partial<BetterReadSettings> : {};
  const typography: Partial<TypographySettings> = input.typography && typeof input.typography === "object"
    ? input.typography
    : {};

  return {
    version: SETTINGS_VERSION,
    enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_SETTINGS.enabled,
    uiTheme: uiThemes.has(input.uiTheme as UiThemeId) ? input.uiTheme as UiThemeId : DEFAULT_SETTINGS.uiTheme,
    theme: themes.has(input.theme as ThemeId) ? input.theme as ThemeId : DEFAULT_SETTINGS.theme,
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
      textAlign: alignments.has(typography.textAlign as TextAlign) ? typography.textAlign as TextAlign : DEFAULT_SETTINGS.typography.textAlign,
    },
    focusMode: typeof input.focusMode === "boolean" ? input.focusMode : DEFAULT_SETTINGS.focusMode,
    autoHideControls: typeof input.autoHideControls === "boolean" ? input.autoHideControls : DEFAULT_SETTINGS.autoHideControls,
    showProgress: typeof input.showProgress === "boolean" ? input.showProgress : DEFAULT_SETTINGS.showProgress,
    lineFocus: typeof input.lineFocus === "boolean" ? input.lineFocus : DEFAULT_SETTINGS.lineFocus,
    shortcuts: typeof input.shortcuts === "boolean" ? input.shortcuts : DEFAULT_SETTINGS.shortcuts,
  };
}

export function copySettings(settings: BetterReadSettings): BetterReadSettings {
  return normalizeSettings(structuredClone(settings));
}
