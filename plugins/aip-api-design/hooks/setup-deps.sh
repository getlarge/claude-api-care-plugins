#!/bin/bash
# Minimal setup for AIP API Design plugin
# Pre-built bundles are shipped with the plugin - just validate Node.js version

set -e

# Check Node.js is available
if ! command -v node &> /dev/null; then
    echo "[aip-api-design] ⚠️  Node.js not found."
    echo "[aip-api-design] Install Node.js 22.5+ to use this plugin: https://nodejs.org/"
    exit 1
fi

# Check version (require Node.js 22.5+)
NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
NODE_MINOR=$(node -v | sed 's/v//' | cut -d'.' -f2)

if [ "$NODE_VERSION" -lt 22 ] || ([ "$NODE_VERSION" -eq 22 ] && [ "$NODE_MINOR" -lt 5 ]); then
    echo "[aip-api-design] ⚠️  Node.js $(node -v) detected. This plugin requires Node.js 22.5+."
    echo "[aip-api-design] Please upgrade: https://nodejs.org/"
    exit 1
fi

echo "[aip-api-design] ✅ Ready (Node.js $(node -v))"
