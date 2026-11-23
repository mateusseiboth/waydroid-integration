export const FeatureId = {
  ANDROID_TOGGLE: "android-toggle",
  THEME_SYNC: "theme-sync",
} as const;
export type FeatureId = (typeof FeatureId)[keyof typeof FeatureId];
