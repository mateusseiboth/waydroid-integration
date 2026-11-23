import { ContainerState } from "@domain/session/containerState";

export interface ContainerControl {
  readState(): Promise<string>;
  unfreeze(): Promise<void>;
  freeze(): Promise<void>;
}

export interface WakeTiming {
  readonly attempts: number;
  readonly intervalMs: number;
  readonly sleep: (ms: number) => Promise<void>;
}

export const DEFAULT_WAKE_TIMING: WakeTiming = {
  attempts: 30,
  intervalMs: 2000,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const readSettledState = async (control: ContainerControl, timing: WakeTiming): Promise<string> => {
  for (let attempt = 1; attempt <= timing.attempts; attempt++) {
    const state = await control.readState();
    if (state !== ContainerState.FREEZING) return state;
    if (attempt < timing.attempts) await timing.sleep(timing.intervalMs);
  }
  throw new Error("O container do Waydroid não terminou de congelar.");
};

export const runAwake = async <T>(
  control: ContainerControl,
  action: () => Promise<T>,
  timing: WakeTiming = DEFAULT_WAKE_TIMING,
): Promise<T> => {
  const state = await readSettledState(control, timing);
  if (state !== ContainerState.FROZEN) return action();

  await control.unfreeze();
  try {
    return await action();
  } finally {
    await control.freeze();
  }
};
