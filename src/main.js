import '@logseq/libs';

const PLUGIN_ID = 'logseq-claude-code-wsl';

const settingsSchema = [
  {
    key: 'graphPath',
    title: 'Logseq graph directory',
    description:
      'Absolute path to the directory you want claude to open. Accepts Windows paths (C:\\Users\\...) or WSL paths (/home/..., /mnt/c/...). If empty, the current graph path is used.',
    type: 'string',
    default: '',
  },
  {
    key: 'claudeCommand',
    title: 'Claude command',
    description: 'Command executed inside WSL. Default: claude',
    type: 'string',
    default: 'claude',
  },
  {
    key: 'wslDistribution',
    title: 'WSL distribution (optional)',
    description:
      'Specific WSL distribution to use (passed via -d to wsl.exe). Leave empty for the default.',
    type: 'string',
    default: '',
  },
  {
    key: 'externalTerminal',
    title: 'External terminal command template',
    description:
      'Launcher used to host the wsl.exe call. Use {args} as placeholder for the wsl.exe argv. Default: "wt.exe new-tab {args}".',
    type: 'string',
    default: 'wt.exe new-tab {args}',
  },
];

function resolveSettings() {
  const s = window.logseq.settings || {};
  return {
    graphPath: (s.graphPath || '').trim(),
    claudeCommand: (s.claudeCommand || 'claude').trim(),
    wslDistribution: (s.wslDistribution || '').trim(),
    externalTerminal: (s.externalTerminal || 'wt.exe new-tab {args}').trim(),
  };
}

async function resolveGraphPath() {
  const s = resolveSettings();
  if (s.graphPath) return s.graphPath;
  try {
    const graph = await window.logseq.App.getCurrentGraph();
    if (graph && graph.path) return graph.path;
  } catch (err) {
    console.warn('[claude-code-wsl] getCurrentGraph failed', err);
  }
  return '';
}

function buildWslArgs(graphPath) {
  const s = resolveSettings();
  const args = ['wsl.exe'];
  if (s.wslDistribution) args.push('-d', s.wslDistribution);
  args.push('--cd', graphPath, '--', s.claudeCommand);
  return args;
}

function expandTemplate(template, wslArgs) {
  const tokens = template.split(/\s+/).filter(Boolean);
  const result = [];
  let used = false;
  for (const t of tokens) {
    if (t === '{args}') {
      result.push(...wslArgs);
      used = true;
    } else {
      result.push(t);
    }
  }
  if (!used) result.push(...wslArgs);
  return result;
}

async function openExternal() {
  const path = await resolveGraphPath();
  if (!path) {
    window.logseq.UI.showMsg(
      'Claude Code: no graph path configured. Set it in plugin settings.',
      'error'
    );
    return;
  }
  const s = resolveSettings();
  const wslArgs = buildWslArgs(path);
  const tokens = expandTemplate(s.externalTerminal, wslArgs);
  const [cmd, ...cmdArgs] = tokens;
  if (!cmd) {
    window.logseq.UI.showMsg('Claude Code: invalid external terminal template.', 'error');
    return;
  }

  try {
    const { spawn } = globalThis.require('child_process');
    const child = spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore' });
    child.on('error', (err) => {
      window.logseq.UI.showMsg('Claude Code: ' + err.message, 'error');
    });
    child.unref();
    window.logseq.UI.showMsg('Claude Code: launching terminal in ' + path);
  } catch (err) {
    window.logseq.UI.showMsg('Claude Code: ' + err.message, 'error');
  }
}

function main() {
  window.logseq.useSettingsSchema(settingsSchema);

  window.logseq.App.registerCommandPalette(
    {
      key: 'claude-code-open-external',
      label: 'Claude Code: open in Windows Terminal',
    },
    openExternal
  );

  if (
    window.logseq.Editor &&
    typeof window.logseq.Editor.registerSlashCommand === 'function'
  ) {
    window.logseq.Editor.registerSlashCommand('Claude Code', openExternal);
  }

  window.logseq.App.registerUIItem('toolbar', {
    key: PLUGIN_ID + '-toolbar',
    template:
      '<a data-on-click="openExternal" class="button" title="Open Claude Code in Windows Terminal" style="font-weight:600;font-size:12px">CC</a>',
  });

  window.logseq.provideModel({ openExternal });
}

window.logseq.ready(main).catch((err) => {
  console.error('[claude-code-wsl] init failed', err);
});
