# Claude Code launcher for logseq-claude-code-wsl plugin.
# Reads settings from the plugin's settings JSON and spawns wt.exe -> wsl.exe -> claude.

$ErrorActionPreference = 'Stop'

$pluginId = 'logseq-claude-code-wsl'
$settingsPath = Join-Path $env:USERPROFILE ".logseq\settings\$pluginId.json"

function Show-Msg($text) {
    Add-Type -AssemblyName System.Windows.Forms | Out-Null
    [System.Windows.Forms.MessageBox]::Show($text, 'Claude Code (WSL)') | Out-Null
}

if (-not (Test-Path -LiteralPath $settingsPath)) {
    Show-Msg "Settings file not found:`n$settingsPath`n`nOpen Logseq, configure the Claude Code (WSL) plugin first."
    exit 1
}

try {
    $raw = Get-Content -Raw -LiteralPath $settingsPath
    $settings = ConvertFrom-Json $raw
} catch {
    Show-Msg "Failed to parse settings JSON ($settingsPath):`n$_"
    exit 1
}

$graphPath = [string]$settings.graphPath
if (-not $graphPath) {
    Show-Msg "graphPath is empty in plugin settings. Set it in Logseq -> Plugins -> Claude Code (WSL) -> Settings."
    exit 1
}

$claudeCmd = if ($settings.claudeCommand) { [string]$settings.claudeCommand } else { 'claude' }
$wslDistro = [string]$settings.wslDistribution

# Build command line manually so paths with spaces are quoted correctly.
# Start-Process -ArgumentList @(...) in PowerShell 5.1 does NOT quote args with spaces.
$argLine = 'new-tab wsl.exe'
if ($wslDistro) {
    $argLine += ' -d "' + $wslDistro + '"'
}
$argLine += ' --cd "' + $graphPath + '" -- bash -lic "' + $claudeCmd + '"'

Start-Process -FilePath 'wt.exe' -ArgumentList $argLine
