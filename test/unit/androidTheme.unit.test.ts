/**
 * Tradução do tema do GNOME (`org.gnome.desktop.interface`) para o Android: modo noturno
 * pelo `color-scheme` e paleta do Material You pela `accent-color`.
 */
import { describe, expect, test } from "bun:test";

import {
  AccentColor,
  buildThemeOverlay,
  ColorScheme,
  NightMode,
  resolveAccentHex,
  resolveNightMode,
} from "@domain/theme/androidTheme";

describe("resolveNightMode", () => {
  test.each([
    [ColorScheme.PREFER_DARK, NightMode.YES],
    [ColorScheme.PREFER_LIGHT, NightMode.NO],
    [ColorScheme.DEFAULT, NightMode.NO],
  ])("%p vira night %p", (scheme, expected) => {
    expect(resolveNightMode(scheme)).toBe(expected);
  });

  test("valor desconhecido fica no claro", () => {
    expect(resolveNightMode("qualquer")).toBe(NightMode.NO);
  });
});

describe("resolveAccentHex", () => {
  test("usa as cores de destaque do libadwaita", () => {
    expect(resolveAccentHex(AccentColor.BLUE)).toBe("3584E4");
    expect(resolveAccentHex(AccentColor.TEAL)).toBe("2190A4");
    expect(resolveAccentHex(AccentColor.GREEN)).toBe("3A944A");
    expect(resolveAccentHex(AccentColor.YELLOW)).toBe("C88800");
    expect(resolveAccentHex(AccentColor.ORANGE)).toBe("ED5B00");
    expect(resolveAccentHex(AccentColor.RED)).toBe("E62D42");
    expect(resolveAccentHex(AccentColor.PINK)).toBe("D56199");
    expect(resolveAccentHex(AccentColor.PURPLE)).toBe("9141AC");
    expect(resolveAccentHex(AccentColor.SLATE)).toBe("6F8396");
  });

  test("cobre toda cor do enum do GNOME", () => {
    for (const accent of Object.values(AccentColor)) {
      expect(resolveAccentHex(accent)).toMatch(/^[0-9A-F]{6}$/);
    }
  });

  test("cor desconhecida cai no azul padrão", () => {
    expect(resolveAccentHex("magenta")).toBe("3584E4");
  });
});

describe("buildThemeOverlay", () => {
  test("monta o JSON de theme_customization_overlay_packages com a paleta fixa", () => {
    expect(JSON.parse(buildThemeOverlay(AccentColor.RED))).toEqual({
      "android.theme.customization.color_source": "preset",
      "android.theme.customization.system_palette": "E62D42",
      "android.theme.customization.accent_color": "E62D42",
    });
  });
});
