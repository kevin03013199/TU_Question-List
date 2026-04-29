@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 問題清單平台 - 服務執行中

REM ---- 嘗試找到 Node.js ----
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

echo [錯誤] 找不到 Node.js，請先執行 setup.bat 或修改路徑
pause
exit /b 1

:node_ok
echo ===========================================
echo  問題清單平台 啟動中...
echo.
echo  啟動完成後，請在瀏覽器開啟：
echo    http://localhost:3000
echo.
echo  停止服務：在此視窗按 Ctrl+C，或直接關閉視窗
echo ===========================================
echo.

call npm run dev
