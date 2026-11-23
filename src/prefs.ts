import Adw from "gi://Adw";
import Gio from "gi://Gio";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { SettingsKey } from "@infra/gnome/settingsKeys";

interface SwitchRow {
  readonly key: SettingsKey;
  readonly title: () => string;
  readonly subtitle: () => string;
}

const THEME_ROWS: readonly SwitchRow[] = [
  {
    key: SettingsKey.SYNC_DARK_MODE,
    title: () => _("Follow dark style"),
    subtitle: () => _("Android switches to dark theme together with GNOME."),
  },
  {
    key: SettingsKey.SYNC_ACCENT_COLOR,
    title: () => _("Follow accent color"),
    subtitle: () => _("Android uses the GNOME accent color in its palette."),
  },
];

export default class WaydroidIntegrationPreferences extends ExtensionPreferences {
  override async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({ title: _("Appearance") });

    THEME_ROWS.forEach((row) => group.add(this.buildSwitchRow(settings, row)));
    page.add(group);
    window.add(page);
  }

  private buildSwitchRow(
    settings: Gio.Settings,
    { key, title, subtitle }: SwitchRow,
  ): Adw.SwitchRow {
    const row = new Adw.SwitchRow({ title: title(), subtitle: subtitle() });
    settings.bind(key, row, "active", Gio.SettingsBindFlags.DEFAULT);
    return row;
  }
}
