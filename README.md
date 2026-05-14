# Logseq Claude Code (WSL)

Open [Claude Code](https://claude.com/claude-code) on your Logseq graph directory in a new Windows Terminal session, via WSL.

The plugin adds:

- a **toolbar button** (`CC`),
- a **command-palette** entry `Claude Code: open in Windows Terminal`,
- a **slash command** `/Claude Code`.

Each of them spawns:

```
wt.exe new-tab wsl.exe [-d <distro>] --cd <graph-path> -- claude
```

## Requirements

- Windows 10/11 with [Windows Terminal](https://aka.ms/terminal) installed (`wt.exe` on PATH)
- WSL with a working `claude` command on PATH inside the chosen distribution
- Logseq Desktop for Windows

> The plugin only launches an external terminal. It does not embed a terminal inside Logseq, so no native modules are needed and the plugin works out of the box once installed.

## Install (from source)

```
git clone https://github.com/teddy/logseq-claude-code-wsl
cd logseq-claude-code-wsl
npm install
npm run build
```

Then in Logseq: `... > Plugins > Load unpacked plugin` and select the cloned folder.

## Install (from marketplace)

Once published, look up `Claude Code (WSL)` in the Logseq plugin marketplace and click *Install*.

## Settings

| Key | Default | Description |
| --- | --- | --- |
| `graphPath` | *(empty -> current graph)* | Absolute path to the directory you want claude to open. Accepts both Windows (`C:\Users\me\Logseq`) and WSL (`/mnt/c/Users/me/Logseq`) paths -- `wsl --cd` handles both. |
| `claudeCommand` | `claude` | Command executed inside WSL. |
| `wslDistribution` | *(empty -> default)* | Specific WSL distribution to use (passed as `-d`). |
| `externalTerminal` | `wt.exe new-tab {args}` | Launcher template. `{args}` is replaced by the `wsl.exe ...` argv. Use a custom value, e.g. `alacritty.exe -e {args}`, to use a different terminal. |

## Screenshots

<!-- TODO: replace with real screenshot / GIF before marketplace submission -->
*Screenshot coming soon.*

## Development

```
npm run dev     # esbuild in watch mode -> dist/
npm run build   # production build       -> dist/
```

A `git tag vX.Y.Z && git push --tags` triggers `.github/workflows/publish.yml`, which builds and attaches `logseq-claude-code-wsl.zip` + `package.json` to the GitHub release.

## License

MIT
