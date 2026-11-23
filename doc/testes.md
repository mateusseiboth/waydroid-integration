# Testes

## Unitários

`bun test` cobre a máquina de estados da sessão, o controlador, a sincronização do tema, a
tradução de cores, os comandos do `adb`, o catálogo de tradução, a paridade entre o schema
GSettings e as chaves do código, a pilha de desfazer e o ciclo das features. Tudo sem GNOME.
Arquivo novo segue `<assunto>.unit.test.ts`.

## Shell real, sem mexer na sessão

O mesmo roteiro do quick-settings-notifications (`doc/testes.md` de lá), trocando o uuid por
`waydroid-integration@mateusseiboth.github.io`. Use `GSETTINGS_BACKEND=memory` e um
`XDG_RUNTIME_DIR` curto.

Resultado em 23/11/2026: estado `ACTIVE`, ciclo de desativar e reativar sem erro no log.

## Contra o Waydroid de verdade

Os adaptadores compilados (`dist/infra`, `dist/service`) só importam `gi://`, então rodam
num `gjs -m` comum contra o Waydroid real, sem o Shell. Em 23/11/2026, com o Android 17
(LineageOS 24.0, WayDroid-ATV):

- Tema: Android deixado em verde e claro, container congelado; o `ThemeSync` descongelou,
  aplicou o azul e o escuro do GNOME (`system_palette` 3584E4, `Night mode: yes`) e congelou
  de novo.
- Sessão: `SessionController` + `WaydroidCli` + vigia do `id.waydro.Session`: parado,
  iniciando (clique repetido ignorado), no ar, parando, parado.
