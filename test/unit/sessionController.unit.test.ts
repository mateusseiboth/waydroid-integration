import { describe, expect, mock, test } from "bun:test";

import { SessionState } from "@domain/session/sessionState";
import { SessionController, type SessionBackend } from "@service/sessionController";

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const createBackend = (overrides: Partial<SessionBackend> = {}) => ({
  start: mock(() => Promise.resolve()),
  stop: mock(() => Promise.resolve()),
  ...overrides,
});

describe("SessionController", () => {
  test("começa parado", () => {
    expect(new SessionController(createBackend(), () => {}).state).toBe(SessionState.STOPPED);
  });

  test("toggle com a sessão parada pede para iniciar", () => {
    const backend = createBackend();
    const controller = new SessionController(backend, () => {});

    controller.toggle();

    expect(backend.start).toHaveBeenCalledTimes(1);
    expect(controller.state).toBe(SessionState.STARTING);
  });

  test("toggle com a sessão no ar pede para parar", () => {
    const backend = createBackend();
    const controller = new SessionController(backend, () => {});
    controller.onAppeared();

    controller.toggle();

    expect(backend.stop).toHaveBeenCalledTimes(1);
    expect(controller.state).toBe(SessionState.STOPPING);
  });

  test("o nome no barramento confirma e derruba o estado", () => {
    const controller = new SessionController(createBackend(), () => {});

    controller.onAppeared();
    expect(controller.state).toBe(SessionState.RUNNING);

    controller.onVanished();
    expect(controller.state).toBe(SessionState.STOPPED);
  });

  test("falha ao iniciar volta para parado e avisa", async () => {
    const failure = new Error("sem container");
    const onError = mock((_error: unknown) => {});
    const controller = new SessionController(
      createBackend({ start: () => Promise.reject(failure) }),
      onError,
    );

    controller.toggle();
    await flush();

    expect(controller.state).toBe(SessionState.STOPPED);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  test("falha ao parar volta para no ar e avisa", async () => {
    const failure = new Error("sem resposta");
    const onError = mock((_error: unknown) => {});
    const controller = new SessionController(
      createBackend({ stop: () => Promise.reject(failure) }),
      onError,
    );
    controller.onAppeared();

    controller.toggle();
    await flush();

    expect(controller.state).toBe(SessionState.RUNNING);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  test("avisa os ouvintes a cada mudança e para de avisar depois de cancelar", () => {
    const controller = new SessionController(createBackend(), () => {});
    const seen: SessionState[] = [];
    const unsubscribe = controller.subscribe((state) => seen.push(state));

    controller.onAppeared();
    unsubscribe();
    controller.onVanished();

    expect(seen).toEqual([SessionState.RUNNING]);
  });

  test("evento que não muda o estado não avisa ninguém", () => {
    const controller = new SessionController(createBackend(), () => {});
    const listener = mock((_state: SessionState) => {});
    controller.subscribe(listener);

    controller.onVanished();

    expect(listener).not.toHaveBeenCalled();
  });
});
