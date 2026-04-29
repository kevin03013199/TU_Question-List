@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 問題清單平台 - 首次安裝

echo ===========================================
echo  問題清單平台 - 首次安裝
echo ===========================================
echo.

REM ---- 嘗試找到 Node.js ----
where node >nul 2>nul
if not errorlevel 1 goto node_ok

set "FOUND="
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
    set "FOUND=1"
    goto node_ok
  )
)

echo [錯誤] 找不到 Node.js
echo.
echo 請開啟 setup.bat 手動修改最上方的 Node 路徑，
echo 或把 Node 資料夾加入系統環境變數 PATH。
echo.
pause
exit /b 1

:node_ok
echo [OK] 使用 Node:
node --version
echo.

REM ---- 建立 .env ----
if not exist .env (
  copy /Y .env.example .env >nul
  echo [OK] 已建立 .env 設定檔（使用預設值）
)

REM ---- 安裝套件 ----
echo.
echo === 步驟 1/3：安裝相依套件（首次約 1-3 分鐘）===
call npm install
if errorlevel 1 goto fail

REM ---- 建立資料庫 ----
echo.
echo === 步驟 2/3：建立資料庫 ===
call npx prisma migrate deploy
if errorlevel 1 goto fail
call npx prisma generate
if errorlevel 1 goto fail

REM ---- 塞入預設資料 ----
echo.
echo === 步驟 3/3：建立預設管理員與部門 ===
call npm run prisma:seed
if errorlevel 1 goto fail

echo.
echo ===========================================
echo  安裝完成！
echo.
echo  下一步：雙擊 start.bat 啟動服務
echo  預設帳號：admin
echo  預設密碼：admin123
echo ===========================================
echo.
pause
exit /b 0

:fail
echo.
echo [錯誤] 安裝過程中發生錯誤，請查看上方訊息
echo.
pause
exit /b 1
