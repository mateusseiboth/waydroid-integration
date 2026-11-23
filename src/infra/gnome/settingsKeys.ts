export const SettingsKey = {
  SYNC_DARK_MODE: "sync-dark-mode",
  SYNC_ACCENT_COLOR: "sync-accent-color",
} as const;
export type SettingsKey = (typeof SettingsKey)[keyof typeof SettingsKey];
