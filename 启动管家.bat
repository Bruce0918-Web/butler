@echo off
rem Double-click to start the site. Close this window to stop it.
chcp 65001 >nul
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run dev -- --open
pause
