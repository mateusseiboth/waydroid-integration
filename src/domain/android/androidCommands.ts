import type { NightMode } from "@domain/theme/androidTheme";

export const ADB_PORT = 5555;

const THEME_OVERLAY_SETTING = "theme_customization_overlay_packages";
const LEASE_ADDRESS = /\s((?:\d{1,3}\.){3}\d{1,3})\s/;

export const WAIT_FOR_BOOT_SCRIPT =
  'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done';

export const quoteForShell = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

export const buildNightModeArgs = (mode: NightMode): readonly string[] => [
  "cmd",
  "uimode",
  "night",
  mode,
];

export const buildThemeOverlayArgs = (overlay: string): readonly string[] => [
  "settings",
  "put",
  "secure",
  THEME_OVERLAY_SETTING,
  quoteForShell(overlay),
];

export const parseLeaseAddress = (leases: string): string | null =>
  LEASE_ADDRESS.exec(leases)?.[1] ?? null;

export const buildAdbSerial = (address: string): string => `${address}:${ADB_PORT}`;

export const buildAdbArgv = (
  serial: string,
  args: readonly string[],
  timeoutSeconds: number,
): readonly string[] => ["timeout", String(timeoutSeconds), "adb", "-s", serial, ...args];
