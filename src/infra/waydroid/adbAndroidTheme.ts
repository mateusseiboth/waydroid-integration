import GLib from "gi://GLib";

import {
  buildAdbSerial,
  buildNightModeArgs,
  buildThemeOverlayArgs,
  parseLeaseAddress,
  WAIT_FOR_BOOT_SCRIPT,
} from "@domain/android/androidCommands";
import type { NightMode } from "@domain/theme/androidTheme";
import { runCommand } from "@infra/gnome/subprocess";
import type { AndroidTheme } from "@service/themeSync";

const LEASES_FILE = "/var/lib/misc/dnsmasq.waydroid0.leases";
const BOOT_TIMEOUT_SECONDS = "180";

const readLeases = (): string => {
  const [, contents] = GLib.file_get_contents(LEASES_FILE);
  return new TextDecoder().decode(contents);
};

export class AdbAndroidTheme implements AndroidTheme {
  private connecting: Promise<string> | null = null;

  setNightMode(mode: NightMode): Promise<void> {
    return this.shell(buildNightModeArgs(mode));
  }

  setThemeOverlay(overlay: string): Promise<void> {
    return this.shell(buildThemeOverlayArgs(overlay));
  }

  private async shell(args: readonly string[]): Promise<void> {
    const serial = await this.connectOnce();
    await runCommand(["adb", "-s", serial, "shell", ...args]);
  }

  private connectOnce(): Promise<string> {
    this.connecting ??= this.connect().finally(() => (this.connecting = null));
    return this.connecting;
  }

  private async connect(): Promise<string> {
    const address = parseLeaseAddress(readLeases());
    if (!address) throw new Error("O container do Waydroid não tem endereço IP.");

    const serial = buildAdbSerial(address);
    await runCommand(["adb", "connect", serial]);
    await runCommand([
      "timeout",
      BOOT_TIMEOUT_SECONDS,
      "adb",
      "-s",
      serial,
      "wait-for-device",
      "shell",
      WAIT_FOR_BOOT_SCRIPT,
    ]);
    return serial;
  }
}
