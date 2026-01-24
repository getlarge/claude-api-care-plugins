# AIP OpenAPI Reviewer MCP Server
# Uses pre-bundled ESBuild output - no node_modules needed at runtime

FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace root files for npm workspace resolution
COPY package.json package-lock.json ./

# Copy the openapi-reviewer (peer dependency bundled into output)
COPY plugins/aip-api-design/openapi-reviewer ./plugins/aip-api-design/openapi-reviewer

# Copy mcp-server source
COPY plugins/aip-api-design/mcp-server ./plugins/aip-api-design/mcp-server

# Install all dependencies (needed for build)
RUN npm ci

# Build the bundles
WORKDIR /app/plugins/aip-api-design/mcp-server
RUN npm run build

# Production stage - minimal image with just the bundles
FROM node:22-slim AS production

# OCI labels for GitHub Container Registry
LABEL org.opencontainers.image.source="https://github.com/getlarge/claude-aip-plugins"
LABEL org.opencontainers.image.description="AIP OpenAPI Reviewer MCP Server - Analyze OpenAPI specs against Google API Improvement Proposals"
LABEL org.opencontainers.image.licenses="Apache-2.0"

WORKDIR /app

# Copy only the self-contained bundles (no node_modules needed)
# Worker must be named worker.js as that's what worker-pool.ts expects via __dirname resolution
COPY --from=builder /app/plugins/aip-api-design/mcp-server/dist/server.bundle.js ./server.bundle.js
COPY --from=builder /app/plugins/aip-api-design/mcp-server/dist/server.bundle.js.map ./server.bundle.js.map
COPY --from=builder /app/plugins/aip-api-design/mcp-server/dist/worker.bundle.js ./worker.js
COPY --from=builder /app/plugins/aip-api-design/mcp-server/dist/worker.bundle.js.map ./worker.js.map

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.bundle.js"]
