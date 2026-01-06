/**
 * Jest setup file
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ docs: [] })),
          })),
        })),
      })),
    })),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    arrayUnion: jest.fn((val) => val),
    arrayRemove: jest.fn((val) => val),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: { uid: 'test-user-id', email: 'test@example.com', displayName: 'Test User' },
  })),
}));

// Mock expo-notifications (virtual mock since module may not be installed)
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
}), { virtual: true });

// Mock expo-print (virtual mock)
jest.mock('expo-print', () => ({
  printAsync: jest.fn(() => Promise.resolve()),
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file://test.pdf' })),
}), { virtual: true });

// Mock expo-sharing (virtual mock)
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock expo-file-system (virtual mock)
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://documents/',
  moveAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock @react-native-community/netinfo (virtual mock)
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}), { virtual: true });

// Mock expo-linking (virtual mock)
jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock expo-location (virtual mock)
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 40.7128, longitude: -74.0060 },
  })),
  Accuracy: {
    Balanced: 3,
    High: 4,
    Highest: 5,
    Low: 1,
    Lowest: 0,
  },
}), { virtual: true });

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
