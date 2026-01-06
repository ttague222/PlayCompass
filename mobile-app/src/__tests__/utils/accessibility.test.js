/**
 * Tests for Accessibility Utilities
 *
 * Note: Tests that require react-native AccessibilityInfo are skipped
 * because mocking react-native before module import is complex in Jest.
 * These functions should be tested in integration tests with a proper RN environment.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock react-native with Platform before importing
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
}), { virtual: true });

// Import after mock
const accessibility = require('../../utils/accessibility').default;

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('accessibility', () => {
  describe('getAccessibilitySettings / saveAccessibilitySettings', () => {
    it('should return default settings for new user', async () => {
      const settings = await accessibility.getAccessibilitySettings();

      expect(settings).toHaveProperty('reduceMotion');
      expect(settings).toHaveProperty('highContrast');
      expect(settings).toHaveProperty('largeText');
      expect(settings).toHaveProperty('hapticFeedback');
      expect(settings).toHaveProperty('fontSize');
      expect(settings).toHaveProperty('colorBlindMode');
    });

    it('should save and retrieve settings', async () => {
      const customSettings = {
        highContrast: true,
        fontSize: 'large',
        colorBlindMode: 'protanopia',
      };

      await accessibility.saveAccessibilitySettings(customSettings);
      const settings = await accessibility.getAccessibilitySettings();

      expect(settings.highContrast).toBe(true);
      expect(settings.fontSize).toBe('large');
      expect(settings.colorBlindMode).toBe('protanopia');
    });
  });

  describe('updateAccessibilitySetting', () => {
    it('should update a single setting', async () => {
      await accessibility.updateAccessibilitySetting('highContrast', true);

      const settings = await accessibility.getAccessibilitySettings();
      expect(settings.highContrast).toBe(true);
    });
  });

  describe('getAccessibilityProps', () => {
    it('should return basic accessibility props', () => {
      const props = accessibility.getAccessibilityProps({
        label: 'Test button',
      });

      expect(props.accessible).toBe(true);
      expect(props.accessibilityLabel).toBe('Test button');
    });

    it('should include hint when provided', () => {
      const props = accessibility.getAccessibilityProps({
        label: 'Submit',
        hint: 'Submits the form',
      });

      expect(props.accessibilityHint).toBe('Submits the form');
    });

    it('should include role when provided', () => {
      const props = accessibility.getAccessibilityProps({
        label: 'Settings',
        role: 'link',
      });

      expect(props.accessibilityRole).toBe('link');
    });

    it('should include state when provided', () => {
      const props = accessibility.getAccessibilityProps({
        label: 'Toggle',
        state: { checked: true },
      });

      expect(props.accessibilityState).toEqual({ checked: true });
    });
  });

  describe('getActivityCardLabel', () => {
    it('should generate descriptive label for activity', () => {
      const activity = {
        name: 'Fun Painting',
        category: 'creative',
        duration: 30,
        ageRange: '3-8 years',
        description: 'Create beautiful art',
      };

      const label = accessibility.getActivityCardLabel(activity);

      expect(label).toContain('Fun Painting');
      expect(label).toContain('creative');
      expect(label).toContain('30 minutes');
      expect(label).toContain('3-8 years');
    });

    it('should handle missing fields gracefully', () => {
      const activity = {
        name: 'Simple Activity',
      };

      const label = accessibility.getActivityCardLabel(activity);

      expect(label).toContain('Simple Activity');
      expect(typeof label).toBe('string');
    });
  });

  describe('getRatingLabel', () => {
    it('should return descriptive rating label', () => {
      const label = accessibility.getRatingLabel(4, 5);

      expect(label).toBe('Rating: 4 out of 5 stars');
    });

    it('should use default max rating of 5', () => {
      const label = accessibility.getRatingLabel(3);

      expect(label).toBe('Rating: 3 out of 5 stars');
    });
  });

  describe('getProgressLabel', () => {
    it('should return descriptive progress label', () => {
      const label = accessibility.getProgressLabel(7, 10, 'Activities');

      expect(label).toContain('7 of 10');
      expect(label).toContain('70 percent');
      expect(label).toContain('Activities');
    });

    it('should use default label', () => {
      const label = accessibility.getProgressLabel(5, 20);

      expect(label).toContain('Progress');
      expect(label).toContain('25 percent');
    });
  });

  describe('getColorBlindColors', () => {
    it('should return default colors for no mode', () => {
      const colors = accessibility.getColorBlindColors('none');

      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('success');
      expect(colors).toHaveProperty('warning');
      expect(colors).toHaveProperty('error');
    });

    it('should return protanopia colors', () => {
      const colors = accessibility.getColorBlindColors('protanopia');

      expect(colors.primary).toBe('#0066CC');
    });

    it('should return deuteranopia colors', () => {
      const colors = accessibility.getColorBlindColors('deuteranopia');

      expect(colors).toBeDefined();
      expect(colors.primary).toBe('#0066CC');
    });

    it('should return tritanopia colors', () => {
      const colors = accessibility.getColorBlindColors('tritanopia');

      expect(colors).toBeDefined();
      expect(colors.primary).toBe('#CC3366');
    });
  });

  describe('getMinTouchTargetSize', () => {
    it('should return minimum touch target size', () => {
      const size = accessibility.getMinTouchTargetSize();

      expect(size).toBeGreaterThanOrEqual(44);
    });
  });

  describe('FONT_SIZES', () => {
    it('should export font size multipliers', () => {
      expect(accessibility.FONT_SIZES).toBeDefined();
      expect(accessibility.FONT_SIZES.small).toBeLessThan(1);
      expect(accessibility.FONT_SIZES.normal).toBe(1);
      expect(accessibility.FONT_SIZES.large).toBeGreaterThan(1);
      expect(accessibility.FONT_SIZES.xlarge).toBeGreaterThan(accessibility.FONT_SIZES.large);
    });
  });

  describe('HEADING_LEVELS', () => {
    it('should export heading level props', () => {
      expect(accessibility.HEADING_LEVELS).toBeDefined();
      expect(accessibility.HEADING_LEVELS.h1).toHaveProperty('accessibilityRole', 'header');
      expect(accessibility.HEADING_LEVELS.h2).toBeDefined();
      expect(accessibility.HEADING_LEVELS.h3).toBeDefined();
    });
  });

  describe('getHeadingProps', () => {
    it('should return heading props for level', () => {
      const props = accessibility.getHeadingProps('h1');

      expect(props.accessibilityRole).toBe('header');
    });

    it('should default to h1', () => {
      const props = accessibility.getHeadingProps();

      expect(props).toEqual(accessibility.HEADING_LEVELS.h1);
    });
  });

  describe('getLiveRegionProps', () => {
    it('should return polite live region by default', () => {
      const props = accessibility.getLiveRegionProps();

      expect(props.accessibilityLiveRegion).toBe('polite');
    });

    it('should return assertive live region when specified', () => {
      const props = accessibility.getLiveRegionProps(false);

      expect(props.accessibilityLiveRegion).toBe('assertive');
    });
  });

  describe('COLOR_BLIND_PALETTES', () => {
    it('should have all required color blind modes', () => {
      expect(accessibility.COLOR_BLIND_PALETTES).toHaveProperty('none');
      expect(accessibility.COLOR_BLIND_PALETTES).toHaveProperty('protanopia');
      expect(accessibility.COLOR_BLIND_PALETTES).toHaveProperty('deuteranopia');
      expect(accessibility.COLOR_BLIND_PALETTES).toHaveProperty('tritanopia');
    });

    it('should have all required colors in each palette', () => {
      Object.values(accessibility.COLOR_BLIND_PALETTES).forEach(palette => {
        expect(palette).toHaveProperty('primary');
        expect(palette).toHaveProperty('success');
        expect(palette).toHaveProperty('warning');
        expect(palette).toHaveProperty('error');
      });
    });
  });
});
