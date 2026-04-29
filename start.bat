@echo off
setlocal enabledelayedexpansion
title Issue Platform - Server Running

REM ---- Find Node.js ----
where node >nul 2>nul
if not errorlevel 1 goto node_ok

for %%P in (
  "D:\NodeJS\node-v24.14.0-win-x64"
  "C:\NodeJS\node-v24.14.0-win-x64"
  "D:\NodeJS"
  "C:\NodeJS"
  "C:\Program Files\nodejs"
  "C:\Program Files (x86)\nodejs"
) do (
  if exist "%%~P\node.exe" (
    set "PATH=%%~P;!PATH!"
    goto node_ok
  )
)

echo [ERROR] Node.js not found. Run setup.bat first or add Node to PATH.
pause
exit /b 1

:node_ok
echo ===========================================
echo   Issue Platform - Starting...
echo.
echo   Once ready, open in browser:
echo     http://localhost:3000
echo.
echo   To stop: press Ctrl+C or close this window
echo ===========================================
echo.

call npm run dev
