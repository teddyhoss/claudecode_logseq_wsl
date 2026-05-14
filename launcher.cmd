@echo off
REM Claude Code launcher for logseq-claude-code-wsl plugin.
REM Reads graphPath / claudeCommand / wslDistribution from the plugin's settings JSON.
REM Delegates to launcher.ps1 (PowerShell handles JSON natively, no escaping mess).

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher.ps1"
