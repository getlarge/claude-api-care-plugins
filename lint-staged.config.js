export default {
  '*.{js,ts,json,md,yaml,yml}': 'prettier --write',
  'plugins/baume/openapi-reviewer/src/**/*.js': [
    'eslint --fix --config plugins/baume/openapi-reviewer/eslint.config.js',
    'prettier --write',
    () => 'npm run typecheck -w @getlarge/baume-reviewer',
    () =>
      'npm run build -w @getlarge/baume-reviewer && git add plugins/baume/openapi-reviewer/dist/*.bundle.js',
  ],
  'plugins/baume/mcp-server/src/**/*.ts': [
    'eslint --fix --config plugins/baume/mcp-server/eslint.config.js',
    'prettier --write',
    () => 'npm run typecheck -w @getlarge/baume-mcp',
    () =>
      'npm run build -w @getlarge/baume-mcp && git add plugins/baume/mcp-server/dist/*.bundle.js',
  ],
};
