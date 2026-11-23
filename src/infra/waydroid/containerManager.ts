import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { ContainerState } from "@domain/session/containerState";
import type { ContainerControl } from "@service/containerWake";

const BUS_NAME = "id.waydro.Container";
const OBJECT_PATH = "/ContainerManager";
const INTERFACE = "id.waydro.ContainerManager";
const CALL_TIMEOUT_MS = 10000;

Gio._promisify(Gio.DBusConnection.prototype, "call", "call_finish");

export class WaydroidContainerManager implements ContainerControl {
  async readState(): Promise<string> {
    const reply = await this.call("GetSession");
    const [session] = reply.deepUnpack<[Record<string, string>]>();
    return session.state ?? ContainerState.STOPPED;
  }

  async unfreeze(): Promise<void> {
    await this.call("Unfreeze");
  }

  async freeze(): Promise<void> {
    await this.call("Freeze");
  }

  private call(method: string): Promise<GLib.Variant> {
    return Gio.DBus.system.call(
      BUS_NAME,
      OBJECT_PATH,
      INTERFACE,
      method,
      null,
      null,
      Gio.DBusCallFlags.NONE,
      CALL_TIMEOUT_MS,
      null,
    );
  }
}
