import type Gio from "gi://Gio";

import { FeatureId } from "@domain/feature/featureId";
import { UndoableFeature } from "@domain/feature/undoableFeature";
import { SessionState } from "@domain/session/sessionState";
import { SettingsKey } from "@infra/gnome/settingsKeys";
import type { SessionController } from "@service/sessionController";
import type { ThemeSync } from "@service/themeSync";

const SYNC_KEYS = [SettingsKey.SYNC_DARK_MODE, SettingsKey.SYNC_ACCENT_COLOR] as const;

export class ThemeSyncFeature extends UndoableFeature {
  readonly id = FeatureId.THEME_SYNC;

  constructor(
    private readonly themeSync: ThemeSync,
    private readonly controller: SessionController,
    private readonly settings: Gio.Settings,
  ) {
    super();
  }

  protected apply(): void {
    this.themeSync.start();
    this.undo.push(() => this.themeSync.stop());

    this.undo.push(this.controller.subscribe(() => this.pushWhenRunning()));

    const ids = SYNC_KEYS.map((key) =>
      this.settings.connect(`changed::${key}`, () => this.pushWhenRunning()),
    );
    this.undo.push(() => ids.forEach((id) => this.settings.disconnect(id)));

    this.pushWhenRunning();
  }

  private pushWhenRunning(): void {
    if (this.controller.state !== SessionState.RUNNING) return;
    void this.themeSync.push();
  }
}
