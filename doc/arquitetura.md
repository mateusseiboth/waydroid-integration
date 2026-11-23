# Arquitetura

Camadas iguais às do quick-settings-notifications e do gnome-spotlight:

| Pasta | Papel | Pode importar `gi://`? |
| --- | --- | --- |
| `src/domain` | Regras puras: máquina de estados da sessão, tradução do tema, comandos do Android | Não |
| `src/service` | Orquestração com portas (`SessionBackend`, `DesktopTheme`, `AndroidTheme`) | Não |
| `src/infra` | Adaptadores: `Gio.Settings`, `Gio.Subprocess`, barramento D-Bus, `adb` | Sim |
| `src/feature` | Mudanças no Shell com desfazer (`UndoableFeature`) | Sim |
| `src/app` | Raiz de composição (`WaydroidIntegrationSession`) | Sim |

## Sessão

`SessionController` guarda o estado (`STOPPED`, `STARTING`, `RUNNING`, `STOPPING`) e só muda
por `nextSessionState`, uma tabela de transições. Quem confirma que a sessão subiu ou caiu é
o vigia do nome `id.waydro.Session` (`watchWaydroidSession`). Pedir para ligar ou desligar
apenas marca a transição; se o comando falha, o estado volta.

`waydroid session start` fica rodando enquanto a sessão existe, por isso o `start()` do
`WaydroidCli` só termina quando a sessão termina. Saída com erro vira `START_FAILED`, que não
derruba uma sessão já no ar.

## Tema

`ThemeSync` aplica uma lista de passos (`THEME_STEPS`), cada um ligado por uma preferência.
Roda quando a sessão chega em `RUNNING`, quando o GNOME muda `color-scheme` ou `accent-color`
e quando a preferência é ligada. Falha de um passo não impede o outro.

O canal é o `adb` (`AdbAndroidTheme`): IP do container lido do
`/var/lib/misc/dnsmasq.waydroid0.leases` (mesma fonte do `waydroid adb connect`), `adb
connect`, espera o `sys.boot_completed` com tempo limite e então `adb shell`. O `adb shell`
junta os argumentos numa linha para o `sh` do Android, por isso o JSON da paleta vai citado
(`quoteForShell`).

Alternativas descartadas:

- `waydroid shell`: exige root.
- `IPlatform.settingsPutString` do Waydroid: só pelo Python interno do Waydroid, e o modo
  noturno não é uma chave de settings que o Android observe.
