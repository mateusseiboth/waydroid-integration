import {
  isSessionActive,
  nextSessionState,
  SessionEvent,
  SessionState,
} from "@domain/session/sessionState";

export interface SessionBackend {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type SessionListener = (state: SessionState) => void;
export type SessionErrorListener = (error: unknown) => void;

interface SessionRequest {
  readonly requested: SessionEvent;
  readonly failed: SessionEvent;
  readonly run: (backend: SessionBackend) => Promise<void>;
}

const START: SessionRequest = {
  requested: SessionEvent.START_REQUESTED,
  failed: SessionEvent.START_FAILED,
  run: (backend) => backend.start(),
};

const STOP: SessionRequest = {
  requested: SessionEvent.STOP_REQUESTED,
  failed: SessionEvent.APPEARED,
  run: (backend) => backend.stop(),
};

export class SessionController {
  private current: SessionState = SessionState.STOPPED;
  private readonly listeners = new Set<SessionListener>();

  constructor(
    private readonly backend: SessionBackend,
    private readonly onError: SessionErrorListener,
  ) {}

  get state(): SessionState {
    return this.current;
  }

  toggle(): void {
    this.request(isSessionActive(this.current) ? STOP : START);
  }

  onAppeared(): void {
    this.dispatch(SessionEvent.APPEARED);
  }

  onVanished(): void {
    this.dispatch(SessionEvent.VANISHED);
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private request({ requested, failed, run }: SessionRequest): void {
    if (!this.dispatch(requested)) return;

    run(this.backend).catch((error: unknown) => {
      this.dispatch(failed);
      this.onError(error);
    });
  }

  private dispatch(event: SessionEvent): boolean {
    const next = nextSessionState(this.current, event);
    if (next === this.current) return false;

    this.current = next;
    this.listeners.forEach((listener) => listener(next));
    return true;
  }
}
