import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import { FeatureId } from "@domain/feature/featureId";
import { UndoableFeature } from "@domain/feature/undoableFeature";
import { isSessionActive, SessionState } from "@domain/session/sessionState";
import { WaydroidLaunch, type WaydroidCli } from "@infra/waydroid/waydroidCli";
import type { SessionController } from "@service/sessionController";

const ICON = "phone-symbolic";

interface MenuAction {
  readonly label: () => string;
  readonly target: WaydroidLaunch;
}

const MENU_ACTIONS: readonly MenuAction[] = [
  { label: () => _("Show Android"), target: WaydroidLaunch.FULL_UI },
  { label: () => _("Android Settings"), target: WaydroidLaunch.SETTINGS },
];

const SUBTITLES: Record<SessionState, () => string | null> = {
  [SessionState.STOPPED]: () => null,
  [SessionState.STARTING]: () => _("Starting"),
  [SessionState.RUNNING]: () => null,
  [SessionState.STOPPING]: () => _("Stopping"),
};

export type LaunchErrorListener = (error: unknown) => void;

export class AndroidToggleFeature extends UndoableFeature {
  readonly id = FeatureId.ANDROID_TOGGLE;

  constructor(
    private readonly controller: SessionController,
    private readonly cli: WaydroidCli,
    private readonly onError: LaunchErrorListener,
  ) {
    super();
  }

  protected apply(): void {
    const { quickSettings } = Main.panel.statusArea;
    if (!quickSettings) throw new Error("O Quick Settings ainda não está no painel.");

    const indicator = new QuickSettings.SystemIndicator();
    const toggle = new QuickSettings.QuickMenuToggle({ title: _("Android"), iconName: ICON });
    this.undo.push(() => indicator.destroy());
    this.undo.push(() => toggle.destroy());

    this.fillMenu(toggle);
    indicator.quickSettingsItems.push(toggle);
    quickSettings.addExternalIndicator(indicator);

    const clickId = toggle.connect("clicked", () => this.controller.toggle());
    this.undo.push(() => toggle.disconnect(clickId));

    const render = (state: SessionState): void => {
      toggle.checked = isSessionActive(state);
      toggle.subtitle = SUBTITLES[state]();
    };
    render(this.controller.state);
    this.undo.push(this.controller.subscribe(render));
  }

  private fillMenu(toggle: QuickSettings.QuickMenuToggle): void {
    toggle.menu.setHeader(ICON, _("Android"));
    MENU_ACTIONS.forEach(({ label, target }) =>
      toggle.menu.addAction(label(), () => this.cli.launch(target).catch(this.onError)),
    );
  }
}
