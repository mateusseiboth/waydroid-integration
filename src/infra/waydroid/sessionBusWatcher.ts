import Gio from "gi://Gio";

const SESSION_BUS_NAME = "id.waydro.Session";

export interface SessionPresence {
  onAppeared(): void;
  onVanished(): void;
}

export const watchWaydroidSession = (presence: SessionPresence): (() => void) => {
  const id = Gio.bus_watch_name(
    Gio.BusType.SESSION,
    SESSION_BUS_NAME,
    Gio.BusNameWatcherFlags.NONE,
    () => presence.onAppeared(),
    () => presence.onVanished(),
  );
  return () => Gio.bus_unwatch_name(id);
};
