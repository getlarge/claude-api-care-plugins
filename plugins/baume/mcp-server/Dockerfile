# Baume MCP Server
# Uses pre-bundled ESBuild output - no node_modules needed at runtime

FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace root files for npm workspace resolution
COPY package.json package-lock.json .npmrc ./

# Copy patches for patch-package
COPY patches ./patches

# Copy the openapi-reviewer (peer dependency bundled into output)
COPY plugins/baume/openapi-reviewer ./plugins/baume/openapi-reviewer

# Copy mcp-server source
COPY plugins/baume/mcp-server ./plugins/baume/mcp-server

# Install all dependencies (needed for build)
# Use npm install instead of npm ci to handle optional deps resolution differences
RUN npm install

# Build openapi-reviewer first (mcp-server depends on its types)
WORKDIR /app/plugins/baume/openapi-reviewer
RUN npm run build

# Build mcp-server
WORKDIR /app/plugins/baume/mcp-server
RUN npm run build

# Production stage - minimal image with just the bundles
FROM node:22-slim AS production

# OCI labels for GitHub Container Registry
LABEL org.opencontainers.image.source="https://github.com/getlarge/claude-api-care-plugins"
LABEL org.opencontainers.image.description="Baume MCP Server - Review and improve REST APIs against Google API Improvement Proposals"
LABEL org.opencontainers.image.licenses="Apache-2.0"

WORKDIR /app

# Copy workspace files for npm workspace resolution of local deps
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/plugins/baume/openapi-reviewer ./plugins/baume/openapi-reviewer
COPY --from=builder /app/plugins/baume/mcp-server/package.json ./plugins/baume/mcp-server/

# Install optional runtime dependencies (marked external in esbuild)
# Skip postinstall scripts since patch-package is a devDep and patches are already applied in builder
WORKDIR /app/plugins/baume/mcp-server
RUN HUSKY=0 npm install --omit=dev --include=optional --ignore-scripts
WORKDIR /app

# Copy only the self-contained bundles
# Worker must be named worker.js as that's what worker-pool.ts expects via __dirname resolution
COPY --from=builder /app/plugins/baume/mcp-server/dist/server.bundle.js ./server.bundle.js
COPY --from=builder /app/plugins/baume/mcp-server/dist/server.bundle.js.map ./server.bundle.js.map
COPY --from=builder /app/plugins/baume/mcp-server/dist/worker.bundle.js ./worker.js
COPY --from=builder /app/plugins/baume/mcp-server/dist/worker.bundle.js.map ./worker.js.map

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.bundle.js"]
