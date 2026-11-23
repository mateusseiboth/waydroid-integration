# waydroid-integration

Extensão do GNOME Shell 50 e 51 em TypeScript 7 que integra o Waydroid ao GNOME (toggle no
Quick Settings e tema do Android seguindo o do GNOME). Leia `doc/` antes de mexer.

## Regras deste repositório

- Mesma estrutura do quick-settings-notifications: cada alteração no Shell é uma `Feature`
  (`src/feature/`) que herda de `UndoableFeature`; o `disable()` deixa o Shell como estava.
- `domain/` e `service/` não importam valor de `gi://`. É o que deixa o `bun test` rodar.
- Tudo que fala com o Waydroid ou com o Android fica em `src/infra/waydroid/`. Comando novo
  para o Android: função pura em `src/domain/android/androidCommands.ts` com teste, e o
  adaptador só executa.
- Não repetir o que o Waydroid já faz (notificações, área de transferência, `.desktop`,
  congelar ao suspender). Conferir em `/usr/lib/waydroid/tools/services/` antes de criar
  feature nova.
- Imports por alias (`tsconfig.base.json` e `bunfig.toml`).
- Texto de tela em inglês no código com `_("...")`, traduzido em `po/pt_BR.po`.
- `src/` não tem comentário (o teste `sourceComments` reprova). O porquê mora em `doc/`.
- Portão de saída: `bun run format:check && bun run lint && bun run typecheck && bun test`.

## Duplicado de propósito

`scripts/i18n/messageCatalog.ts`, `scripts/install.ts`, `scripts/pack.ts`,
`scripts/build/moduleTranspiler.ts` (e o teste dele), os testes `sourceComments`,
`messageCatalog`, `undoStack`, `undoableFeature`, `runAll` e `featureSet`, as configs de
oxlint/oxfmt, `src/types/*.d.ts`, `src/domain/undo/`, `src/domain/feature/feature.ts`,
`undoableFeature.ts` e `src/service/featureSet.ts` vieram do quick-settings-notifications.
`scripts/build.ts` diverge só por não gerar folha de estilo (a extensão não tem CSS).

## Armadilhas

- `id.waydro.Session` aparece no barramento assim que o `waydroid session start` começa, bem
  antes do Android terminar o boot. Por isso o `AdbAndroidTheme` espera o
  `sys.boot_completed` antes de mandar comando.
- O Waydroid 1.6 deixou o adb seguro: na primeira conexão o Android pede autorização. Sem
  "Sempre permitir", o `wait-for-device` fica parado até o tempo limite.
- `waydroid shell` exige root; não use na extensão.
