/**
 * O schema GSettings e o código falam das mesmas chaves. Chave que só existe num lado quebra
 * a extensão ao ler a preferência.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SettingsKey } from "@infra/gnome/settingsKeys";

const SCHEMA = readFileSync(
  join(
    import.meta.dir,
    "..",
    "..",
    "schemas",
    "org.gnome.shell.extensions.waydroid-integration.gschema.xml",
  ),
  "utf8",
);

const keyBlockOf = (key: string): string =>
  SCHEMA.match(new RegExp(`<key name="${key}"[\\s\\S]*?</key>`))?.[0] ?? "";

const schemaKeys = (): string[] =>
  [...SCHEMA.matchAll(/<key name="([^"]+)"/g)].map((match) => match[1] ?? "");

describe("schema GSettings", () => {
  test("tem exatamente as chaves do código", () => {
    expect(schemaKeys().sort()).toEqual([...Object.values(SettingsKey)].sort());
  });

  test.each([SettingsKey.SYNC_DARK_MODE, SettingsKey.SYNC_ACCENT_COLOR])(
    "%p começa ligada",
    (key) => {
      expect(keyBlockOf(key)).toContain("<default>true");
    },
  );
});
