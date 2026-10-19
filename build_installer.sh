#!/bin/bash
set -e

echo "=== Compilando NEXA Church v2.1.2 para Linux ==="
npm run build
npx tauri build --ignore-version-mismatches

echo ""
echo "=== Compilación completada con éxito ==="
echo "Paquete Debian (.deb): src-tauri/target/release/bundle/deb/"
echo "Paquete Universal (.AppImage): src-tauri/target/release/bundle/appimage/"
