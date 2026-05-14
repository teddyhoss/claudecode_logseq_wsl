import '@logseq/libs';

const PLUGIN_ID = 'logseq-claude-code-wsl';

const CLAUDE_ICON_SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="cc-icon"><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"></path></svg>';

const TOOLBAR_CSS = `
  .cc-toolbar-btn .cc-icon { width: 18px; height: 18px; display: block; flex: none; }
  .cc-toolbar-btn { display: inline-flex; align-items: center; justify-content: center; }
  [data-injected-ui*="logseq-claude-code-wsl"],
  .cc-toolbar-host { order: -1000 !important; }
`;

const settingsSchema = [
  {
    key: 'graphPath',
    title: 'Graph directory (Windows path)',
    description:
      'Windows path to the directory claude should open in. Example: `C:\\Users\\you\\Logseq` or the local Drive mirror `C:\\Users\\you\\My Drive\\my-graph`. Avoid pure virtual drive letters like `G:\\` -- WSL cannot translate them.',
    type: 'string',
    default: '',
  },
  {
    key: 'claudeCommand',
    title: 'Claude command',
    description:
      'Command executed inside WSL via `bash -lic`. Default: `claude`.',
    type: 'string',
    default: 'claude',
  },
  {
    key: 'wslDistribution',
    title: 'WSL distribution (optional)',
    description:
      'Specific WSL distribution name (passed as `-d`). Leave empty for the default. Run `wsl -l -v` to list available distros.',
    type: 'string',
    default: '',
  },
  {
    key: 'protocol',
    title: 'URL protocol name',
    description:
      'Custom URL scheme that invokes the launcher. Must match the one in setup.reg. Change only if you have a conflict.',
    type: 'string',
    default: 'claudewsl',
  },
  {
    key: 'firstTimeSetup',
    title: 'First-time setup',
    description:
      'Before the toolbar button works, register the Windows URL protocol once. Open the command palette (`Ctrl+Shift+P`) and run **Claude Code: install Windows protocol handler**. To remove the registration use **Claude Code: uninstall Windows protocol handler**. **Claude Code: open plugin folder** shows the .reg files in Explorer if Logseq cannot launch them directly.',
    type: 'string',
    default: '',
    inputAs: 'textarea',
  },
];

function getProtocol() {
  const p = (window.logseq.settings && window.logseq.settings.protocol) || 'claudewsl';
  return p.replace(/[^a-zA-Z0-9]/g, '') || 'claudewsl';
}

function triggerProtocolViaAnchor(url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { try { a.remove(); } catch (_) {} }, 0);
}

async function tryOpenUrl(url) {
  let lastErr = null;
  try { triggerProtocolViaAnchor(url); return true; } catch (e) { lastErr = e; }
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) setTimeout(() => { try { w.close(); } catch (_) {} }, 200);
    return true;
  } catch (e) { lastErr = e; }
  try { await window.logseq.App.openExternalLink(url); return true; } catch (e) { lastErr = e; }
  console.error('[claude-code-wsl] tryOpenUrl failed for ' + url, lastErr);
  return false;
}

async function launchClaude() {
  const url = getProtocol() + '://';
  const ok = await tryOpenUrl(url);
  if (!ok) {
    await window.logseq.UI.showMsg(
      'Claude Code: launch failed. Run "Claude Code: install Windows protocol handler" from the command palette first.',
      'error'
    );
  }
}

function pluginFileUrl(filename) {
  const userHome = (window.logseq.settings && window.logseq.settings._userHomeOverride) || '';
  if (userHome) {
    const cleaned = userHome.replace(/\\/g, '/').replace(/\/+$/, '');
    return 'file:///' + cleaned + '/.logseq/plugins/' + PLUGIN_ID + '/' + filename;
  }
  // No override available: fall back to lsp:// (Logseq plugin resource URL) which may work
  // for opening in Explorer, but the .reg execution needs a real file:// path. We rely on
  // the user manually navigating via "open plugin folder" if openExternalLink rejects it.
  return null;
}

async function installHandler() {
  const url = pluginFileUrl('setup.reg');
  if (url) {
    const ok = await tryOpenUrl(url);
    if (ok) {
      await window.logseq.UI.showMsg(
        'Opening setup.reg. Confirm the Windows prompt to register the protocol.',
        'success'
      );
      return;
    }
  }
  await window.logseq.UI.showMsg(
    'Logseq cannot launch the .reg directly. Run "Claude Code: open plugin folder" and double-click setup.reg in Explorer.',
    'warning'
  );
}

async function uninstallHandler() {
  const url = pluginFileUrl('uninstall.reg');
  if (url) {
    const ok = await tryOpenUrl(url);
    if (ok) {
      await window.logseq.UI.showMsg(
        'Opening uninstall.reg. Confirm the Windows prompt to remove the protocol.',
        'success'
      );
      return;
    }
  }
  await window.logseq.UI.showMsg(
    'Logseq cannot launch the .reg directly. Run "Claude Code: open plugin folder" and double-click uninstall.reg in Explorer.',
    'warning'
  );
}

async function openPluginFolder() {
  const url = pluginFileUrl('');
  if (url) {
    const ok = await tryOpenUrl(url.replace(/\/$/, ''));
    if (ok) return;
  }
  await window.logseq.UI.showMsg(
    'Open Explorer manually and navigate to %USERPROFILE%\\.logseq\\plugins\\' + PLUGIN_ID,
    'warning'
  );
}

function main() {
  window.logseq.useSettingsSchema(settingsSchema);

  if (typeof window.logseq.provideStyle === 'function') {
    window.logseq.provideStyle(TOOLBAR_CSS);
  }

  window.logseq.App.registerCommandPalette(
    { key: 'claude-code-launch', label: 'Claude Code: open in Windows Terminal' },
    launchClaude
  );

  window.logseq.App.registerCommandPalette(
    { key: 'claude-code-install', label: 'Claude Code: install Windows protocol handler' },
    installHandler
  );

  window.logseq.App.registerCommandPalette(
    { key: 'claude-code-uninstall', label: 'Claude Code: uninstall Windows protocol handler' },
    uninstallHandler
  );

  window.logseq.App.registerCommandPalette(
    { key: 'claude-code-open-folder', label: 'Claude Code: open plugin folder' },
    openPluginFolder
  );

  if (
    window.logseq.Editor &&
    typeof window.logseq.Editor.registerSlashCommand === 'function'
  ) {
    window.logseq.Editor.registerSlashCommand('Claude Code', launchClaude);
  }

  window.logseq.App.registerUIItem('toolbar', {
    key: PLUGIN_ID + '-toolbar',
    template:
      '<a data-on-click="launchClaude" class="button cc-toolbar-btn cc-toolbar-host" title="Open Claude Code in Windows Terminal">' +
      CLAUDE_ICON_SVG +
      '</a>',
  });

  window.logseq.provideModel({
    launchClaude,
    installHandler,
    uninstallHandler,
    openPluginFolder,
  });
}

window.logseq.ready(main).catch((err) => {
  console.error('[claude-code-wsl] init failed', err);
});
