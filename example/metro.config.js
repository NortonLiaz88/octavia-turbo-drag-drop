const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const root = path.resolve(__dirname, '..');

const baseConfig = getDefaultConfig(__dirname);

// Primeiro aplica o monorepo config
const monorepoConfig = withMetroConfig(baseConfig, {
  root,
  dirname: __dirname,
});

// Depois aplica o wrap da Reanimated
module.exports = wrapWithReanimatedMetroConfig(monorepoConfig);
