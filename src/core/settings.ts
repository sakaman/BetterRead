export const SETTINGS_VERSION = 1 as const;

export type ThemeId = "paper" | "sepia" | "forest" | "dark" | "oled" | "system" | "custom";
export type FontId = "system-sans" | "system-serif" | "source-serif" | "lxgw";
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
  theme: "paper",
  customBackground: "#f5f1e8",
  customText: "#2f2a24",
  accent: "#2f7d68",
  typography: {
    font: "system-serif",
    fontSize: 19,
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

const themes = new Set<ThemeId>(["paper", "sepia", "forest", "dark", "oled", "system", "custom"]);
const fonts = new Set<FontId>(["system-sans", "system-serif", "source-serif", "lxgw"]);
const alignments = new Set<TextAlign>(["left", "justify"]);

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
    theme: themes.has(input.theme as ThemeId) ? input.theme as ThemeId : DEFAULT_SETTINGS.theme,
    customBackground: validColor(input.customBackground, DEFAULT_SETTINGS.customBackground),
    customText: validColor(input.customText, DEFAULT_SETTINGS.customText),
    accent: validColor(input.accent, DEFAULT_SETTINGS.accent),
    typography: {
      font: fonts.has(typography.font as FontId) ? typography.font as FontId : DEFAULT_SETTINGS.typography.font,
      fontSize: clampNumber(typography.fontSize, DEFAULT_SETTINGS.typography.fontSize, 14, 30),
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
