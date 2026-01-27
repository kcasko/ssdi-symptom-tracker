module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/testHelpers.ts'],
  cacheDirectory: '<rootDir>/.jest-cache',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-native|@expo|expo(nent)?|expo(-.*)?|@expo(-.*)?|expo-modules-core|@unimodules|unimodules|sentry-expo|native-base|uuid)/)'
  ],
};
