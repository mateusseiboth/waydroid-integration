import { runCommand, spawnCommand } from "@infra/gnome/subprocess";
import type { SessionBackend } from "@service/sessionController";

const WAYDROID = "waydroid";
const SETTINGS_PACKAGE = "com.android.settings";

export const WaydroidLaunch = {
  FULL_UI: "full-ui",
  SETTINGS: "settings",
} as const;
export type WaydroidLaunch = (typeof WaydroidLaunch)[keyof typeof WaydroidLaunch];

const LAUNCH_ARGV: Record<WaydroidLaunch, readonly string[]> = {
  [WaydroidLaunch.FULL_UI]: [WAYDROID, "show-full-ui"],
  [WaydroidLaunch.SETTINGS]: [WAYDROID, "app", "launch", SETTINGS_PACKAGE],
};

export class WaydroidCli implements SessionBackend {
  async start(): Promise<void> {
    await spawnCommand([WAYDROID, "session", "start"]);
  }

  async stop(): Promise<void> {
    await runCommand([WAYDROID, "session", "stop"]);
  }

  launch(target: WaydroidLaunch): Promise<boolean> {
    return spawnCommand(LAUNCH_ARGV[target]);
  }
}
