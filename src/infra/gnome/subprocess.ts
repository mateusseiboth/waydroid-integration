import Gio from "gi://Gio";

Gio._promisify(Gio.Subprocess.prototype, "communicate_utf8_async", "communicate_utf8_finish");
Gio._promisify(Gio.Subprocess.prototype, "wait_check_async", "wait_check_finish");

const CAPTURE = Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_MERGE;

export const runCommand = async (argv: readonly string[]): Promise<string> => {
  const process = Gio.Subprocess.new([...argv], CAPTURE);
  const [output] = await process.communicate_utf8_async(null, null);
  if (!process.get_successful()) throw new Error(`${argv.join(" ")}: ${output ?? ""}`.trim());
  return output ?? "";
};

export const spawnCommand = (argv: readonly string[]): Promise<boolean> =>
  Gio.Subprocess.new([...argv], Gio.SubprocessFlags.NONE).wait_check_async(null);
