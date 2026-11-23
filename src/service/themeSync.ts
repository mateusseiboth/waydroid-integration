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
export type Awake = (action: () => Promise<void>) => Promise<void>;

export interface ThemeSyncDependencies {
  readonly desktop: DesktopTheme;
  readonly android: AndroidTheme;
  readonly options: ThemeSyncOptions;
  readonly isAndroidReady: () => boolean;
  readonly awake: Awake;
  readonly onError: ThemeSyncErrorListener;
}

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

  constructor(private readonly deps: ThemeSyncDependencies) {}

  start(): void {
    this.unsubscribe = this.deps.desktop.onChanged(() => void this.pushWhenReady());
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async push(): Promise<void> {
    try {
      await this.deps.awake(() => this.runSteps());
    } catch (error) {
      this.deps.onError(error);
    }
  }

  private async runSteps(): Promise<void> {
    const { desktop, android, options, onError } = this.deps;
    const steps = THEME_STEPS.filter((step) => step.isEnabled(options));
    const results = await Promise.allSettled(steps.map((step) => step.run(desktop, android)));
    results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .forEach((result) => onError(result.reason));
  }

  private pushWhenReady(): Promise<void> {
    if (!this.deps.isAndroidReady()) return Promise.resolve();
    return this.push();
  }
}
