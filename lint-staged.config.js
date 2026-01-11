export default {
  '*.{js,ts,json,md,yaml,yml}': 'prettier --write',
  'plugins/aip-api-design/openapi-reviewer/src/**/*.js': [
    'eslint --fix --config plugins/aip-api-design/openapi-reviewer/eslint.config.js',
    'prettier --write',
    () => 'npm run typecheck -w @getlarge/aip-openapi-reviewer',
    () =>
      'npm run build -w @getlarge/aip-openapi-reviewer && git add plugins/aip-api-design/openapi-reviewer/dist/*.bundle.js',
  ],
  'plugins/aip-api-design/mcp-server/src/**/*.ts': [
    'eslint --fix --config plugins/aip-api-design/mcp-server/eslint.config.js',
    'prettier --write',
    () => 'npm run typecheck -w @getlarge/aip-openapi-reviewer-mcp',
    () =>
      'npm run build -w @getlarge/aip-openapi-reviewer-mcp && git add plugins/aip-api-design/mcp-server/dist/*.bundle.js',
  ],
};
