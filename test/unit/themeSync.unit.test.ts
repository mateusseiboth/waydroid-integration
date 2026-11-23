import { describe, expect, mock, test } from "bun:test";

import { AccentColor, ColorScheme, NightMode, buildThemeOverlay } from "@domain/theme/androidTheme";
import { ThemeSync, type DesktopTheme, type ThemeSyncOptions } from "@service/themeSync";

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const createDesktop = (scheme: string, accent: string) => {
  const listeners = new Set<() => void>();
  const desktop: DesktopTheme & { scheme: string; accent: string; emit(): void } = {
    scheme,
    accent,
    colorScheme: () => desktop.scheme,
    accentColor: () => desktop.accent,
    onChanged: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: () => listeners.forEach((listener) => listener()),
  };
  return desktop;
};

const createAndroid = () => ({
  setNightMode: mock((_mode: NightMode) => Promise.resolve()),
  setThemeOverlay: mock((_overlay: string) => Promise.resolve()),
});

const options = (darkMode: boolean, accentColor: boolean): ThemeSyncOptions => ({
  syncDarkMode: () => darkMode,
  syncAccentColor: () => accentColor,
});

describe("ThemeSync", () => {
  test("push leva modo noturno e paleta para o Android", async () => {
    const android = createAndroid();
    const sync = new ThemeSync(
      createDesktop(ColorScheme.PREFER_DARK, AccentColor.GREEN),
      android,
      options(true, true),
      () => true,
      () => {},
    );

    await sync.push();

    expect(android.setNightMode).toHaveBeenCalledWith(NightMode.YES);
    expect(android.setThemeOverlay).toHaveBeenCalledWith(buildThemeOverlay(AccentColor.GREEN));
  });

  test("respeita o que está desligado nas preferências", async () => {
    const android = createAndroid();
    const sync = new ThemeSync(
      createDesktop(ColorScheme.PREFER_DARK, AccentColor.GREEN),
      android,
      options(false, true),
      () => true,
      () => {},
    );

    await sync.push();

    expect(android.setNightMode).not.toHaveBeenCalled();
    expect(android.setThemeOverlay).toHaveBeenCalledTimes(1);
  });

  test("mudança no GNOME com o Android no ar é repassada", async () => {
    const desktop = createDesktop(ColorScheme.DEFAULT, AccentColor.BLUE);
    const android = createAndroid();
    const sync = new ThemeSync(
      desktop,
      android,
      options(true, false),
      () => true,
      () => {},
    );
    sync.start();

    desktop.scheme = ColorScheme.PREFER_DARK;
    desktop.emit();
    await flush();

    expect(android.setNightMode).toHaveBeenCalledWith(NightMode.YES);
    sync.stop();
  });

  test("mudança no GNOME com o Android parado é ignorada", async () => {
    const desktop = createDesktop(ColorScheme.DEFAULT, AccentColor.BLUE);
    const android = createAndroid();
    const sync = new ThemeSync(
      desktop,
      android,
      options(true, true),
      () => false,
      () => {},
    );
    sync.start();

    desktop.emit();
    await flush();

    expect(android.setNightMode).not.toHaveBeenCalled();
    sync.stop();
  });

  test("depois do stop não escuta mais o GNOME", async () => {
    const desktop = createDesktop(ColorScheme.DEFAULT, AccentColor.BLUE);
    const android = createAndroid();
    const sync = new ThemeSync(
      desktop,
      android,
      options(true, true),
      () => true,
      () => {},
    );
    sync.start();
    sync.stop();

    desktop.emit();
    await flush();

    expect(android.setNightMode).not.toHaveBeenCalled();
  });

  test("falha de um passo não impede o outro e é relatada", async () => {
    const failure = new Error("adb fora");
    const onError = mock((_error: unknown) => {});
    const android = {
      setNightMode: () => Promise.reject(failure),
      setThemeOverlay: mock((_overlay: string) => Promise.resolve()),
    };
    const sync = new ThemeSync(
      createDesktop(ColorScheme.PREFER_DARK, AccentColor.RED),
      android,
      options(true, true),
      () => true,
      onError,
    );

    await sync.push();

    expect(android.setThemeOverlay).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
  });
});
