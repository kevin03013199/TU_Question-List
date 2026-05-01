@echo off
setlocal enabledelayedexpansion
title Issue Platform - First Time Setup

echo ===========================================
echo   Issue Platform - First Time Setup
echo ===========================================
echo.

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

echo [ERROR] Node.js not found.
echo.
echo Please add your Node folder to system PATH,
echo or edit this file to include the Node path.
echo.
pause
exit /b 1

:node_ok
echo [OK] Using Node:
node --version
echo.

REM ---- Create .env if missing ----
if not exist .env (
  copy /Y .env.example .env >nul
  echo [OK] Created .env from .env.example
)

REM ---- Install packages ----
echo.
echo === Step 1/3: Installing dependencies ^(first run: 1-3 min^) ===
call npm install
if errorlevel 1 goto fail

REM ---- Apply database migrations ----
echo.
echo === Step 2/3: Setting up database ===
REM If the existing DB was created against an older schema, this will detect
REM the drift and start clean. Comment this out if you want to keep data.
if exist "prisma\dev.db" (
  echo [info] Existing dev.db detected. Resetting for new schema...
  del /Q "prisma\dev.db"
  if exist "prisma\dev.db-journal" del /Q "prisma\dev.db-journal"
)
call npx prisma migrate deploy
if errorlevel 1 goto fail
call npx prisma generate
if errorlevel 1 goto fail

REM ---- Seed default data ----
echo.
echo === Step 3/3: Seeding default admin and departments ===
call npm run prisma:seed
if errorlevel 1 goto fail

echo.
echo ===========================================
echo   Setup completed successfully!
echo.
echo   Next: double-click start.bat
echo   Default username: admin
echo   Default password: admin123
echo ===========================================
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed. See messages above.
echo.
pause
exit /b 1
