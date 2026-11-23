/**
 * O Waydroid congela o container quando o Android suspende (`suspend_action = freeze`).
 * Congelado, qualquer `adb shell` fica parado. Quem precisa falar com o Android descongela,
 * faz o que tem de fazer e devolve o container como estava.
 */
import { describe, expect, mock, test } from "bun:test";

import { ContainerState } from "@domain/session/containerState";
import { runAwake, type ContainerControl, type WakeTiming } from "@service/containerWake";

const instant: WakeTiming = { attempts: 3, intervalMs: 0, sleep: () => Promise.resolve() };

const createControl = (...states: string[]) => {
  const calls: string[] = [];
  const pending = [...states];
  const control = {
    calls,
    readState: mock(() =>
      Promise.resolve((pending.length > 1 ? pending.shift() : pending[0]) ?? ""),
    ),
    unfreeze: mock(() => {
      calls.push("unfreeze");
      return Promise.resolve();
    }),
    freeze: mock(() => {
      calls.push("freeze");
      return Promise.resolve();
    }),
  } satisfies ContainerControl & { calls: string[] };
  return control;
};

describe("runAwake", () => {
  test("container acordado: só executa", async () => {
    const control = createControl(ContainerState.RUNNING);

    const result = await runAwake(control, () => Promise.resolve(42), instant);

    expect(result).toBe(42);
    expect(control.calls).toEqual([]);
  });

  test("container congelado: descongela, executa e congela de novo", async () => {
    const control = createControl(ContainerState.FROZEN);

    await runAwake(
      control,
      () => {
        control.calls.push("action");
        return Promise.resolve();
      },
      instant,
    );

    expect(control.calls).toEqual(["unfreeze", "action", "freeze"]);
  });

  test("falha no meio ainda devolve o container congelado", async () => {
    const control = createControl(ContainerState.FROZEN);
    const failure = new Error("adb caiu");

    const run = runAwake(control, () => Promise.reject(failure), instant);

    expect(await run.catch((error: unknown) => error)).toBe(failure);
    expect(control.calls).toEqual(["unfreeze", "freeze"]);
  });

  /**
   * O `vold` do Android roda fstrim no /data, que é bind mount do btrfs do host. Enquanto o
   * TRIM não termina, o container fica em FREEZING e o Unfreeze do Waydroid não age.
   */
  test("container congelando: espera virar FROZEN antes de descongelar", async () => {
    const control = createControl(ContainerState.FREEZING, ContainerState.FROZEN);

    await runAwake(
      control,
      () => {
        control.calls.push("action");
        return Promise.resolve();
      },
      instant,
    );

    expect(control.calls).toEqual(["unfreeze", "action", "freeze"]);
  });

  test("container que não termina de congelar: desiste sem executar", async () => {
    const control = createControl(ContainerState.FREEZING);
    const action = mock(() => Promise.resolve());

    const error = await runAwake(control, action, instant).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Error);
    expect(action).not.toHaveBeenCalled();
    expect(control.readState).toHaveBeenCalledTimes(instant.attempts);
  });
});
