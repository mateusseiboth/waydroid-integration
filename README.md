# Waydroid Integration

Extensão do GNOME Shell 50 e 51 que aproxima o Waydroid do resto do GNOME:

- Toggle **Android** no Quick Settings: liga e desliga a sessão do Waydroid. O estado vem do
  nome `id.waydro.Session` no barramento da sessão, então sessão iniciada pelo terminal
  também acende o toggle.
- Menu do toggle: **Mostrar o Android** (`waydroid show-full-ui`) e **Configurações do
  Android**.
- O Android segue o **estilo escuro** do GNOME (`cmd uimode night`) e a **cor de destaque**
  (paleta do Material You por `theme_customization_overlay_packages`). Cada um pode ser
  desligado nas preferências. Muda junto quando você troca no GNOME e é reaplicado toda vez
  que a sessão sobe.

O que o Waydroid já faz sozinho e a extensão não repete: notificações do Android no GNOME
(Waydroid 1.6), área de transferência compartilhada, atalhos `.desktop` por app e
congelar o container quando o Android suspende (`suspend_action = freeze`).

## Requisitos

- Waydroid instalado e inicializado (`waydroid init`).
- `adb` (pacote `android-tools`) para seguir o tema. Na primeira vez o Android pede para
  autorizar a depuração do computador: marque "Sempre permitir".

## Desenvolvimento

```bash
bun install
bun run build          # dist/
bun run install:local  # copia para ~/.local/share/gnome-shell/extensions (logout/login no Wayland)
bun run pack           # zip para o extensions.gnome.org
```

Portão: `bun run format:check && bun run lint && bun run typecheck && bun test`.

Arquitetura em [doc/arquitetura.md](doc/arquitetura.md) e testes em
[doc/testes.md](doc/testes.md).

## Licença

GPL-2.0-or-later.
