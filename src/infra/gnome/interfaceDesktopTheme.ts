import Gio from "gi://Gio";

import type { DesktopTheme } from "@service/themeSync";

const INTERFACE_SCHEMA = "org.gnome.desktop.interface";
const COLOR_SCHEME = "color-scheme";
const ACCENT_COLOR = "accent-color";
const WATCHED_KEYS = [COLOR_SCHEME, ACCENT_COLOR] as const;

export class InterfaceDesktopTheme implements DesktopTheme {
  private readonly settings = new Gio.Settings({ schema_id: INTERFACE_SCHEMA });

  colorScheme(): string {
    return this.settings.get_string(COLOR_SCHEME);
  }

  accentColor(): string {
    return this.settings.get_string(ACCENT_COLOR);
  }

  onChanged(listener: () => void): () => void {
    const ids = WATCHED_KEYS.map((key) => this.settings.connect(`changed::${key}`, listener));
    return () => ids.forEach((id) => this.settings.disconnect(id));
  }
}
