import { buildThemeOverlay, resolveNightMode, type NightMode } from "@domain/theme/androidTheme";

export interface DesktopTheme {
  colorScheme(): string;
  accentColor(): string;
  onChanged(listener: () => void): () => void;
}

export interface AndroidTheme {
  setNightMode(mode: NightMode): Promise<void>;
  setThemeOverlay(overlay: string): Promise<void>;
}

export interface ThemeSyncOptions {
  syncDarkMode(): boolean;
  syncAccentColor(): boolean;
}

export type ThemeSyncErrorListener = (error: unknown) => void;

interface ThemeStep {
  readonly isEnabled: (options: ThemeSyncOptions) => boolean;
  readonly run: (desktop: DesktopTheme, android: AndroidTheme) => Promise<void>;
}

const THEME_STEPS: readonly ThemeStep[] = [
  {
    isEnabled: (options) => options.syncDarkMode(),
    run: (desktop, android) => android.setNightMode(resolveNightMode(desktop.colorScheme())),
  },
  {
    isEnabled: (options) => options.syncAccentColor(),
    run: (desktop, android) => android.setThemeOverlay(buildThemeOverlay(desktop.accentColor())),
  },
];

export class ThemeSync {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly desktop: DesktopTheme,
    private readonly android: AndroidTheme,
    private readonly options: ThemeSyncOptions,
    private readonly isAndroidReady: () => boolean,
    private readonly onError: ThemeSyncErrorListener,
  ) {}

  start(): void {
    this.unsubscribe = this.desktop.onChanged(() => void this.pushWhenReady());
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async push(): Promise<void> {
    const steps = THEME_STEPS.filter((step) => step.isEnabled(this.options));
    const results = await Promise.allSettled(
      steps.map((step) => step.run(this.desktop, this.android)),
    );
    results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .forEach((result) => this.onError(result.reason));
  }

  private pushWhenReady(): Promise<void> {
    if (!this.isAndroidReady()) return Promise.resolve();
    return this.push();
  }
}
