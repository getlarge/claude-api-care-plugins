#!/bin/bash
# Setup script for AIP API Design plugin dependencies
# Runs on SessionStart - only installs if node_modules missing

set -e

SCRIPTS_DIR="${CLAUDE_PLUGIN_ROOT}/scripts"

# Check if scripts directory exists
if [ ! -d "$SCRIPTS_DIR" ]; then
    exit 0
fi

# Check if node_modules already exists
if [ -d "$SCRIPTS_DIR/node_modules" ]; then
    exit 0
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "[aip-api-design] npm not found. Install Node.js 18+ to use the standalone reviewer."
    echo "[aip-api-design] Commands will use Claude's analysis instead (still works)."
    exit 0
fi

# Install dependencies
echo "[aip-api-design] Installing reviewer dependencies..."
cd "$SCRIPTS_DIR"
npm install --silent --no-progress --no-audit --no-fund 2>/dev/null

if [ $? -eq 0 ]; then
    echo "[aip-api-design] Dependencies installed successfully."
else
    echo "[aip-api-design] Failed to install dependencies. Commands will use Claude's analysis."
fi
