const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so Metro resolves symlinked packages (@openstr/shared)
config.watchFolders = [workspaceRoot];

// Resolve from mobile's node_modules first, then workspace root.
// This ensures react@18 (mobile) wins over react@19 (admin, hoisted to root).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force React and React Native to always resolve from mobile's own node_modules
// so there is never more than one copy in the bundle.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName === 'react/jsx-runtime' ||
    moduleName === 'react/jsx-dev-runtime' ||
    moduleName === 'react-native'
  ) {
    return {
      filePath: require.resolve(moduleName, {
        paths: [path.resolve(projectRoot, 'node_modules')],
      }),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
