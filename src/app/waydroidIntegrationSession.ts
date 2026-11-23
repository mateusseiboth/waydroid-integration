import type Gio from "gi://Gio";

import type { Feature } from "@domain/feature/feature";
import { SessionState } from "@domain/session/sessionState";
import { AndroidToggleFeature } from "@feature/androidToggleFeature";
import { ThemeSyncFeature } from "@feature/themeSyncFeature";
import { InterfaceDesktopTheme } from "@infra/gnome/interfaceDesktopTheme";
import { SettingsKey } from "@infra/gnome/settingsKeys";
import { AdbAndroidTheme } from "@infra/waydroid/adbAndroidTheme";
import { watchWaydroidSession } from "@infra/waydroid/sessionBusWatcher";
import { WaydroidCli } from "@infra/waydroid/waydroidCli";
import { FeatureSet, type FeaturePhase } from "@service/featureSet";
import { SessionController } from "@service/sessionController";
import { ThemeSync, type ThemeSyncOptions } from "@service/themeSync";

const LOG_PREFIX = "[waydroid-integration]";

const logError =
  (context: string) =>
  (error: unknown): void =>
    console.error(`${LOG_PREFIX} ${context}:`, error);

const logFeatureError = (id: string, phase: FeaturePhase, error: unknown): void =>
  console.error(`${LOG_PREFIX} ${id} (${phase}):`, error);

const readSyncOptions = (settings: Gio.Settings): ThemeSyncOptions => ({
  syncDarkMode: () => settings.get_boolean(SettingsKey.SYNC_DARK_MODE),
  syncAccentColor: () => settings.get_boolean(SettingsKey.SYNC_ACCENT_COLOR),
});

export class WaydroidIntegrationSession {
  private readonly controller: SessionController;
  private readonly features: FeatureSet;
  private unwatch: (() => void) | null = null;

  constructor(settings: Gio.Settings) {
    const cli = new WaydroidCli();
    this.controller = new SessionController(cli, logError("session"));
    const themeSync = new ThemeSync(
      new InterfaceDesktopTheme(),
      new AdbAndroidTheme(),
      readSyncOptions(settings),
      () => this.controller.state === SessionState.RUNNING,
      logError("theme"),
    );
    const features: Feature[] = [
      new AndroidToggleFeature(this.controller, cli, logError("launch")),
      new ThemeSyncFeature(themeSync, this.controller, settings),
    ];
    this.features = new FeatureSet(features, logFeatureError);
  }

  start(): void {
    this.features.enableAll();
    this.unwatch = watchWaydroidSession(this.controller);
  }

  stop(): void {
    this.unwatch?.();
    this.unwatch = null;
    this.features.disableAll();
  }
}
