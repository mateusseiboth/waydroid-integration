export const SessionState = {
  STOPPED: "stopped",
  STARTING: "starting",
  RUNNING: "running",
  STOPPING: "stopping",
} as const;
export type SessionState = (typeof SessionState)[keyof typeof SessionState];

export const SessionEvent = {
  START_REQUESTED: "start-requested",
  START_FAILED: "start-failed",
  STOP_REQUESTED: "stop-requested",
  APPEARED: "appeared",
  VANISHED: "vanished",
} as const;
export type SessionEvent = (typeof SessionEvent)[keyof typeof SessionEvent];

const TRANSITIONS: Record<SessionState, Partial<Record<SessionEvent, SessionState>>> = {
  [SessionState.STOPPED]: {
    [SessionEvent.START_REQUESTED]: SessionState.STARTING,
    [SessionEvent.APPEARED]: SessionState.RUNNING,
  },
  [SessionState.STARTING]: {
    [SessionEvent.APPEARED]: SessionState.RUNNING,
    [SessionEvent.START_FAILED]: SessionState.STOPPED,
    [SessionEvent.VANISHED]: SessionState.STOPPED,
  },
  [SessionState.RUNNING]: {
    [SessionEvent.STOP_REQUESTED]: SessionState.STOPPING,
    [SessionEvent.VANISHED]: SessionState.STOPPED,
  },
  [SessionState.STOPPING]: {
    [SessionEvent.VANISHED]: SessionState.STOPPED,
    [SessionEvent.APPEARED]: SessionState.RUNNING,
  },
};

export const nextSessionState = (state: SessionState, event: SessionEvent): SessionState =>
  TRANSITIONS[state][event] ?? state;

const ACTIVE_STATES: ReadonlySet<SessionState> = new Set([
  SessionState.STARTING,
  SessionState.RUNNING,
]);

export const isSessionActive = (state: SessionState): boolean => ACTIVE_STATES.has(state);
