#!/bin/bash
# Setup script for AIP API Design plugin
# Downloads pre-built bundles from GitHub releases if not present

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
REPO="getlarge/claude-aip-plugins"

# Bundle paths
MCP_DIST="$PLUGIN_DIR/mcp-server/dist"
REVIEWER_DIST="$PLUGIN_DIR/openapi-reviewer/dist"

# Required bundles
MCP_BUNDLES=("server.bundle.js" "stdio.bundle.js" "worker.bundle.js")
REVIEWER_BUNDLES=("reviewer.bundle.js" "cli.bundle.js" "discover.bundle.js")

# =============================================================================
# Check Node.js version
# =============================================================================

if ! command -v node &> /dev/null; then
    echo "[aip-api-design] Node.js not found."
    echo "[aip-api-design] Install Node.js 22.5+ to use this plugin: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
NODE_MINOR=$(node -v | sed 's/v//' | cut -d'.' -f2)

if [ "$NODE_VERSION" -lt 22 ] || ([ "$NODE_VERSION" -eq 22 ] && [ "$NODE_MINOR" -lt 5 ]); then
    echo "[aip-api-design] Node.js $(node -v) detected. This plugin requires Node.js 22.5+."
    echo "[aip-api-design] Please upgrade: https://nodejs.org/"
    exit 1
fi

# =============================================================================
# Check if bundles exist
# =============================================================================

check_bundles() {
    local dist_dir="$1"
    shift
    local bundles=("$@")

    for bundle in "${bundles[@]}"; do
        if [ ! -f "$dist_dir/$bundle" ]; then
            return 1
        fi
    done
    return 0
}

# Check if all bundles exist
if check_bundles "$MCP_DIST" "${MCP_BUNDLES[@]}" && \
   check_bundles "$REVIEWER_DIST" "${REVIEWER_BUNDLES[@]}"; then
    echo "[aip-api-design] Bundles found (Node.js $(node -v))"
    exit 0
fi

# =============================================================================
# Download bundles from GitHub releases
# =============================================================================

echo "[aip-api-design] Downloading bundles from GitHub releases..."

# Get latest release tag
get_latest_release() {
    if command -v curl &> /dev/null; then
        curl -s "https://api.github.com/repos/$REPO/releases/latest" | \
            grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
    elif command -v wget &> /dev/null; then
        wget -qO- "https://api.github.com/repos/$REPO/releases/latest" | \
            grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
    else
        echo ""
    fi
}

# Download a file from GitHub release
download_bundle() {
    local tag="$1"
    local filename="$2"
    local dest="$3"
    local url="https://github.com/$REPO/releases/download/$tag/$filename"

    mkdir -p "$(dirname "$dest")"

    if command -v curl &> /dev/null; then
        curl -sL "$url" -o "$dest"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest"
    else
        echo "[aip-api-design] Error: curl or wget required to download bundles"
        return 1
    fi
}

# Get latest release
LATEST_TAG=$(get_latest_release)

if [ -z "$LATEST_TAG" ]; then
    echo "[aip-api-design] Could not determine latest release."
    echo "[aip-api-design] Falling back to building from source..."

    # Fallback: build from source
    if [ -f "$PLUGIN_DIR/mcp-server/package.json" ]; then
        cd "$PLUGIN_DIR/mcp-server"
        if command -v npm &> /dev/null; then
            echo "[aip-api-design] Building mcp-server..."
            npm install --ignore-scripts 2>/dev/null || true
            npm run build 2>/dev/null || true
        fi
    fi

    if [ -f "$PLUGIN_DIR/openapi-reviewer/package.json" ]; then
        cd "$PLUGIN_DIR/openapi-reviewer"
        if command -v npm &> /dev/null; then
            echo "[aip-api-design] Building openapi-reviewer..."
            npm install --ignore-scripts 2>/dev/null || true
            npm run build 2>/dev/null || true
        fi
    fi

    # Check if build succeeded
    if check_bundles "$MCP_DIST" "${MCP_BUNDLES[@]}" && \
       check_bundles "$REVIEWER_DIST" "${REVIEWER_BUNDLES[@]}"; then
        echo "[aip-api-design] Built from source successfully"
        exit 0
    else
        echo "[aip-api-design] Warning: Could not build bundles. Some features may not work."
        exit 0
    fi
fi

echo "[aip-api-design] Downloading release $LATEST_TAG..."

# Create dist directories
mkdir -p "$MCP_DIST" "$REVIEWER_DIST"

# Download MCP server bundles
for bundle in "${MCP_BUNDLES[@]}"; do
    if [ ! -f "$MCP_DIST/$bundle" ]; then
        echo "[aip-api-design]   Downloading $bundle..."
        if ! download_bundle "$LATEST_TAG" "$bundle" "$MCP_DIST/$bundle"; then
            echo "[aip-api-design]   Warning: Failed to download $bundle"
        fi
    fi
done

# Download openapi-reviewer bundles
for bundle in "${REVIEWER_BUNDLES[@]}"; do
    if [ ! -f "$REVIEWER_DIST/$bundle" ]; then
        echo "[aip-api-design]   Downloading $bundle..."
        if ! download_bundle "$LATEST_TAG" "$bundle" "$REVIEWER_DIST/$bundle"; then
            echo "[aip-api-design]   Warning: Failed to download $bundle"
        fi
    fi
done

# Final check
if check_bundles "$MCP_DIST" "${MCP_BUNDLES[@]}" && \
   check_bundles "$REVIEWER_DIST" "${REVIEWER_BUNDLES[@]}"; then
    echo "[aip-api-design] Ready (Node.js $(node -v), release $LATEST_TAG)"
else
    echo "[aip-api-design] Warning: Some bundles may be missing. Features may be limited."
fi
