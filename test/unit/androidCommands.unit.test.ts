/**
 * Comandos que vão pelo `adb shell` para o Android. O `adb shell` junta os argumentos numa
 * linha e entrega ao `sh` do Android, então valor com aspas ou espaço precisa ir citado.
 */
import { describe, expect, test } from "bun:test";

import {
  ADB_PORT,
  buildAdbArgv,
  buildAdbSerial,
  buildNightModeArgs,
  buildThemeOverlayArgs,
  parseLeaseAddress,
  quoteForShell,
  WAIT_FOR_BOOT_SCRIPT,
} from "@domain/android/androidCommands";
import { NightMode } from "@domain/theme/androidTheme";

describe("quoteForShell", () => {
  test("envolve em aspas simples", () => {
    expect(quoteForShell('{"a":"b c"}')).toBe(`'{"a":"b c"}'`);
  });

  test("escapa aspas simples do próprio valor", () => {
    expect(quoteForShell("it's")).toBe(`'it'\\''s'`);
  });
});

describe("comandos de tema", () => {
  test("modo noturno pelo uimode", () => {
    expect(buildNightModeArgs(NightMode.YES)).toEqual(["cmd", "uimode", "night", "yes"]);
  });

  test("paleta pelo theme_customization_overlay_packages, com o JSON citado", () => {
    expect(buildThemeOverlayArgs('{"k":"v"}')).toEqual([
      "settings",
      "put",
      "secure",
      "theme_customization_overlay_packages",
      `'{"k":"v"}'`,
    ]);
  });
});

describe("conexão", () => {
  test("lê o IP do container no arquivo de concessões do dnsmasq", () => {
    const leases = "1795442999 00:16:3e:f9:d3:03 192.168.240.112 waydroid 01:00:16:3e:f9:d3:03\n";

    expect(parseLeaseAddress(leases)).toBe("192.168.240.112");
  });

  test("sem concessão não há endereço", () => {
    expect(parseLeaseAddress("")).toBeNull();
  });

  test("o serial do adb é IP e porta", () => {
    expect(buildAdbSerial("192.168.240.112")).toBe(`192.168.240.112:${ADB_PORT}`);
  });

  test("espera o boot pelo sys.boot_completed", () => {
    expect(WAIT_FOR_BOOT_SCRIPT).toContain("getprop sys.boot_completed");
  });

  test("todo adb roda com tempo limite e no aparelho certo", () => {
    expect(buildAdbArgv("10.0.0.2:5555", ["shell", "cmd", "uimode", "night", "yes"], 20)).toEqual([
      "timeout",
      "20",
      "adb",
      "-s",
      "10.0.0.2:5555",
      "shell",
      "cmd",
      "uimode",
      "night",
      "yes",
    ]);
  });
});
