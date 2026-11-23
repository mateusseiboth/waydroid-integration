import { describe, expect, mock, test } from "bun:test";

import { AccentColor, ColorScheme, NightMode, buildThemeOverlay } from "@domain/theme/androidTheme";
import { ThemeSync, type DesktopTheme, type ThemeSyncDependencies } from "@service/themeSync";

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

const createSync = (overrides: Partial<ThemeSyncDependencies> = {}) => {
  const android = createAndroid();
  const onError = mock((_error: unknown) => {});
  const desktop = createDesktop(ColorScheme.PREFER_DARK, AccentColor.GREEN);
  const sync = new ThemeSync({
    desktop,
    android,
    options: { syncDarkMode: () => true, syncAccentColor: () => true },
    isAndroidReady: () => true,
    awake: (action) => action(),
    onError,
    ...overrides,
  });
  return { sync, android, desktop, onError };
};

describe("ThemeSync", () => {
  test("push leva modo noturno e paleta para o Android", async () => {
    const { sync, android } = createSync();

    await sync.push();

    expect(android.setNightMode).toHaveBeenCalledWith(NightMode.YES);
    expect(android.setThemeOverlay).toHaveBeenCalledWith(buildThemeOverlay(AccentColor.GREEN));
  });

  test("respeita o que está desligado nas preferências", async () => {
    const { sync, android } = createSync({
      options: { syncDarkMode: () => false, syncAccentColor: () => true },
    });

    await sync.push();

    expect(android.setNightMode).not.toHaveBeenCalled();
    expect(android.setThemeOverlay).toHaveBeenCalledTimes(1);
  });

  test("os comandos rodam com o container acordado, numa vez só", async () => {
    const order: string[] = [];
    const android = {
      setNightMode: () => {
        order.push("night");
        return Promise.resolve();
      },
      setThemeOverlay: () => {
        order.push("overlay");
        return Promise.resolve();
      },
    };
    const awake = async (action: () => Promise<void>): Promise<void> => {
      order.push("wake");
      await action();
      order.push("sleep");
    };
    const { sync } = createSync({ android, awake });

    await sync.push();

    expect(order).toEqual(["wake", "night", "overlay", "sleep"]);
  });

  test("falha ao acordar o container é relatada", async () => {
    const failure = new Error("D-Bus fora");
    const { sync, onError } = createSync({ awake: () => Promise.reject(failure) });

    await sync.push();

    expect(onError).toHaveBeenCalledWith(failure);
  });

  test("mudança no GNOME com o Android no ar é repassada", async () => {
    const { sync, android, desktop } = createSync({
      options: { syncDarkMode: () => true, syncAccentColor: () => false },
    });
    desktop.scheme = ColorScheme.DEFAULT;
    sync.start();

    desktop.scheme = ColorScheme.PREFER_DARK;
    desktop.emit();
    await flush();

    expect(android.setNightMode).toHaveBeenCalledWith(NightMode.YES);
    sync.stop();
  });

  test("mudança no GNOME com o Android parado é ignorada", async () => {
    const { sync, android, desktop } = createSync({ isAndroidReady: () => false });
    sync.start();

    desktop.emit();
    await flush();

    expect(android.setNightMode).not.toHaveBeenCalled();
    sync.stop();
  });

  test("depois do stop não escuta mais o GNOME", async () => {
    const { sync, android, desktop } = createSync();
    sync.start();
    sync.stop();

    desktop.emit();
    await flush();

    expect(android.setNightMode).not.toHaveBeenCalled();
  });

  test("falha de um passo não impede o outro e é relatada", async () => {
    const failure = new Error("adb fora");
    const android = {
      setNightMode: () => Promise.reject(failure),
      setThemeOverlay: mock((_overlay: string) => Promise.resolve()),
    };
    const { sync, onError } = createSync({ android });

    await sync.push();

    expect(android.setThemeOverlay).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
  });
});
