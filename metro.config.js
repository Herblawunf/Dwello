// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Add support for path aliases
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

module.exports = config;