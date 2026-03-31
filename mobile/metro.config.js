const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Monorepo setup: watch the whole workspace so Metro sees symlinked packages
// (e.g. @openstr/shared) and resolves them correctly.
config.watchFolders = [workspaceRoot];

// Look in mobile's own node_modules first so react@18 wins over root react@19.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
