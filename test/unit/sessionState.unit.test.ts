/**
 * Estado da sessão do Waydroid visto pelo toggle. O nome `id.waydro.Session` no barramento
 * da sessão é a fonte da verdade: pedir para ligar ou desligar só marca a transição.
 */
import { describe, expect, test } from "bun:test";

import {
  isSessionActive,
  nextSessionState,
  SessionEvent,
  SessionState,
} from "@domain/session/sessionState";

describe("nextSessionState", () => {
  test.each([
    [SessionState.STOPPED, SessionEvent.START_REQUESTED, SessionState.STARTING],
    [SessionState.STARTING, SessionEvent.APPEARED, SessionState.RUNNING],
    [SessionState.STARTING, SessionEvent.START_FAILED, SessionState.STOPPED],
    [SessionState.RUNNING, SessionEvent.STOP_REQUESTED, SessionState.STOPPING],
    [SessionState.STOPPING, SessionEvent.VANISHED, SessionState.STOPPED],
    [SessionState.RUNNING, SessionEvent.VANISHED, SessionState.STOPPED],
    [SessionState.STOPPED, SessionEvent.APPEARED, SessionState.RUNNING],
  ])("%p + %p = %p", (state, event, expected) => {
    expect(nextSessionState(state, event)).toBe(expected);
  });

  test("a sessão iniciada fora da extensão também é reconhecida", () => {
    expect(nextSessionState(SessionState.STOPPED, SessionEvent.APPEARED)).toBe(
      SessionState.RUNNING,
    );
  });

  test("pedido repetido não muda o estado", () => {
    expect(nextSessionState(SessionState.RUNNING, SessionEvent.START_REQUESTED)).toBe(
      SessionState.RUNNING,
    );
    expect(nextSessionState(SessionState.STOPPED, SessionEvent.STOP_REQUESTED)).toBe(
      SessionState.STOPPED,
    );
  });

  test("falha ao iniciar não derruba uma sessão que já está no ar", () => {
    expect(nextSessionState(SessionState.RUNNING, SessionEvent.START_FAILED)).toBe(
      SessionState.RUNNING,
    );
  });
});

describe("isSessionActive", () => {
  test.each([
    [SessionState.STOPPED, false],
    [SessionState.STARTING, true],
    [SessionState.RUNNING, true],
    [SessionState.STOPPING, false],
  ])("%p liga o toggle? %p", (state, expected) => {
    expect(isSessionActive(state)).toBe(expected);
  });
});
