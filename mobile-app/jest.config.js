module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-modules-core|expo-linking|expo-constants|expo-file-system|expo-asset|@react-native-firebase|@react-native-async-storage|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-navigation|react-native-purchases)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx}',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
};
