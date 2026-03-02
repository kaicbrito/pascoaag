@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════╗
echo ║   🐰  CaçaPáscoa — Iniciando...  🐰     ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0backend"

echo 📦 Instalando dependências (primeira vez pode demorar)...
call npm install

echo.
echo 🚀 Iniciando servidor...
echo.
node server.js

pause
