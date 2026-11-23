import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { WaydroidIntegrationSession } from "@app/waydroidIntegrationSession";

export default class WaydroidIntegrationExtension extends Extension {
  private session: WaydroidIntegrationSession | null = null;

  override enable(): void {
    this.session = new WaydroidIntegrationSession(this.getSettings());
    this.session.start();
  }

  override disable(): void {
    this.session?.stop();
    this.session = null;
  }
}
