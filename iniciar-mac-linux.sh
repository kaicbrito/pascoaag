#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🐰  CaçaPáscoa — Iniciando...  🐰     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/backend"

echo "📦 Instalando dependências..."
npm install

echo ""
echo "🚀 Iniciando servidor..."
echo ""
node server.js
