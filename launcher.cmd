@echo off
REM Claude Code launcher for logseq-claude-code-wsl plugin.
REM Reads graphPath / claudeCommand / wslDistribution from the plugin's settings JSON
REM so users don't have to edit this file -- they configure everything from Logseq UI.

setlocal EnableDelayedExpansion

set "PLUGIN_ID=logseq-claude-code-wsl"
set "SETTINGS_FILE=%USERPROFILE%\.logseq\settings\%PLUGIN_ID%.json"

if not exist "%SETTINGS_FILE%" (
    msg * "Claude Code plugin: settings file not found at %SETTINGS_FILE%. Open Logseq, configure the plugin first."
    exit /b 1
)

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$j = Get-Content -Raw -LiteralPath '%SETTINGS_FILE%' ^| ConvertFrom-Json; $j.graphPath"`) do set "GRAPH_PATH=%%i"

if "%GRAPH_PATH%"=="" (
    msg * "Claude Code plugin: graphPath is empty. Set it in plugin settings in Logseq."
    exit /b 1
)

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$j = Get-Content -Raw -LiteralPath '%SETTINGS_FILE%' ^| ConvertFrom-Json; if ($j.claudeCommand) { $j.claudeCommand } else { 'claude' }"`) do set "CLAUDE_CMD=%%i"

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$j = Get-Content -Raw -LiteralPath '%SETTINGS_FILE%' ^| ConvertFrom-Json; $j.wslDistribution"`) do set "WSL_DISTRO=%%i"

if "%WSL_DISTRO%"=="" (
    start "" wt.exe new-tab wsl.exe --cd "%GRAPH_PATH%" -- bash -lic "%CLAUDE_CMD%"
) else (
    start "" wt.exe new-tab wsl.exe -d "%WSL_DISTRO%" --cd "%GRAPH_PATH%" -- bash -lic "%CLAUDE_CMD%"
)

endlocal
