@echo off
cd /d "%~dp0"
echo Starting Chemia Atelier v1.0 (NCTB SSC ^& HSC 3D Chemistry Studio)...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js was not found in PATH. Install Node.js v22 LTS from https://nodejs.org/
  pause
  exit /b 1
)
node serve-local.mjs
pause
