import GLib from "gi://GLib";

import {
  buildAdbArgv,
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
const COMMAND_TIMEOUT_SECONDS = 20;
const BOOT_TIMEOUT_SECONDS = 180;

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
    await runCommand(buildAdbArgv(serial, ["shell", ...args], COMMAND_TIMEOUT_SECONDS));
  }

  private connectOnce(): Promise<string> {
    this.connecting ??= this.connect().finally(() => (this.connecting = null));
    return this.connecting;
  }

  private async connect(): Promise<string> {
    const address = parseLeaseAddress(readLeases());
    if (!address) throw new Error("O container do Waydroid não tem endereço IP.");

    const serial = buildAdbSerial(address);
    await runCommand(["timeout", String(COMMAND_TIMEOUT_SECONDS), "adb", "connect", serial]);
    await runCommand(
      buildAdbArgv(
        serial,
        ["wait-for-device", "shell", WAIT_FOR_BOOT_SCRIPT],
        BOOT_TIMEOUT_SECONDS,
      ),
    );
    return serial;
  }
}
