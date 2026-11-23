export const ColorScheme = {
  DEFAULT: "default",
  PREFER_DARK: "prefer-dark",
  PREFER_LIGHT: "prefer-light",
} as const;
export type ColorScheme = (typeof ColorScheme)[keyof typeof ColorScheme];

export const NightMode = {
  YES: "yes",
  NO: "no",
} as const;
export type NightMode = (typeof NightMode)[keyof typeof NightMode];

export const AccentColor = {
  BLUE: "blue",
  TEAL: "teal",
  GREEN: "green",
  YELLOW: "yellow",
  ORANGE: "orange",
  RED: "red",
  PINK: "pink",
  PURPLE: "purple",
  SLATE: "slate",
} as const;
export type AccentColor = (typeof AccentColor)[keyof typeof AccentColor];

const ACCENT_HEX: Record<AccentColor, string> = {
  [AccentColor.BLUE]: "3584E4",
  [AccentColor.TEAL]: "2190A4",
  [AccentColor.GREEN]: "3A944A",
  [AccentColor.YELLOW]: "C88800",
  [AccentColor.ORANGE]: "ED5B00",
  [AccentColor.RED]: "E62D42",
  [AccentColor.PINK]: "D56199",
  [AccentColor.PURPLE]: "9141AC",
  [AccentColor.SLATE]: "6F8396",
};

const isAccentColor = (value: string): value is AccentColor => value in ACCENT_HEX;

export const resolveNightMode = (scheme: string): NightMode =>
  scheme === ColorScheme.PREFER_DARK ? NightMode.YES : NightMode.NO;

export const resolveAccentHex = (accent: string): string =>
  isAccentColor(accent) ? ACCENT_HEX[accent] : ACCENT_HEX[AccentColor.BLUE];

export const buildThemeOverlay = (accent: string): string => {
  const hex = resolveAccentHex(accent);
  return JSON.stringify({
    "android.theme.customization.color_source": "preset",
    "android.theme.customization.system_palette": hex,
    "android.theme.customization.accent_color": hex,
    "android.theme.customization.theme_style": "TONAL_SPOT",
  });
};
