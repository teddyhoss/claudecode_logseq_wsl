# Logseq Claude Code (WSL)

Open [Claude Code](https://claude.com/claude-code) on your Logseq graph directory directly from Logseq — one click in the toolbar launches Claude inside a new Windows Terminal session running WSL.

For Logseq Desktop on Windows with WSL.

## Features

- Toolbar icon (Claude logo) that launches Claude on the current graph
- `Ctrl+Shift+P` palette commands for launch / install / uninstall / open plugin folder
- `/Claude Code` slash command in any block
- Settings panel to configure graph path, claude command, WSL distribution
- One-time, reversible Windows URL-protocol registration (HKCU only, no admin)
- No native modules: pure HTML/JS plugin, distributable as a sandboxed marketplace zip

## Requirements

- Logseq Desktop for Windows
- [Windows Terminal](https://aka.ms/terminal) (`wt.exe` on PATH)
- WSL with a working `claude` command available inside an interactive login shell

## Installation

### From the Logseq marketplace

1. In Logseq: `...` → **Plugins** → **Marketplace** → search **Claude Code (WSL)** → **Install**.
2. Open the plugin **Settings** and set **Graph directory (Windows path)**.
3. From the command palette (`Ctrl+Shift+P`), run **Claude Code: install Windows protocol handler**. Confirm the Windows registry import prompt (no admin needed, HKCU only).
4. Click the Claude icon in the toolbar.

### From source (development)

```
git clone https://github.com/teddyhoss/logseq-claude-code-wsl
cd logseq-claude-code-wsl
npm install
npm run build
```

In Logseq: `...` → **Plugins** → **Load unpacked plugin** → select the cloned folder.

## First-time setup

The plugin needs a tiny Windows URL-protocol registration so it can ask the OS shell to launch a terminal — Logseq plugins cannot spawn processes directly. This is the same mechanism Zoom, Slack and VS Code use for their `zoommtg://`, `slack://` and `vscode://` URLs.

Run from the command palette: **Claude Code: install Windows protocol handler** → confirm the prompt.

Alternatively, double-click `setup.reg` inside the plugin folder (use the **Claude Code: open plugin folder** palette command to find it).

To undo: **Claude Code: uninstall Windows protocol handler** (or double-click `uninstall.reg`).

## Configuration

All settings live under `Plugins → Claude Code (WSL) → Settings`:

| Setting | Default | Description |
| --- | --- | --- |
| Graph directory (Windows path) | *empty* | Absolute Windows path. Example: `C:\Users\you\Logseq`. Avoid pure virtual drive letters (Google Drive `G:\` in streaming mode); use the Drive mirror under `C:\Users\you\...` instead so WSL can translate it. |
| Claude command | `claude` | Command executed inside WSL. |
| WSL distribution | *empty* | Specific distro name (passed as `-d`). |
| URL protocol name | `claudewsl` | Custom URL scheme registered in the Windows registry. |

## How it works

```
toolbar click
  -> claudewsl:// URL navigation
  -> HKCU URL handler -> cmd.exe -> launcher.cmd
  -> launcher.cmd reads settings JSON, spawns:
     wt.exe new-tab wsl.exe --cd "<graphPath>" -- bash -lic "<claudeCommand>"
  -> bash sources .profile + .bashrc, claude takes over the Windows Terminal TTY
```

The plugin itself is fully sandboxed (no `child_process`, no `node-pty`, no `effect: true`). Process spawning is delegated to the OS via a registered URL protocol, exactly as web apps launch Zoom and VS Code.

## Troubleshooting

- **`claude: command not found`** — `claude` is not in the PATH of `bash -lic`. Verify with `which claude` inside an interactive WSL session; if it shows a path, ensure your `.bashrc`/`.profile` exports it (most installers do).
- **`Wsl/ERROR_PATH_NOT_FOUND`** — the configured `graphPath` cannot be translated to a WSL path. Most often caused by Google Drive `G:\` streaming mode. Switch to the local Drive mirror path under `C:\Users\you\...` or move the graph out of a virtualized filesystem.
- **Toolbar button does nothing** — the URL protocol is not registered yet. Run **Claude Code: install Windows protocol handler**.
- **Custom WSL distro** — set **WSL distribution** in plugin settings. List your distros with `wsl -l -v`.

## Uninstallation

1. Run **Claude Code: uninstall Windows protocol handler** from the palette (removes the HKCU registry entry).
2. In Logseq: `...` → **Plugins** → uninstall **Claude Code (WSL)**.

## License

MIT
