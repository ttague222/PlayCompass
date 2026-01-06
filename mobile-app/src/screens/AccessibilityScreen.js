/**
 * PlayCompass Accessibility Screen
 *
 * Settings for accessibility options
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { ScreenWrapper, TopBar, Card } from '../components/ui';

const AccessibilityScreen = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const {
    settings,
    updateSetting,
    loading,
  } = useAccessibility();

  const fontSizeOptions = [
    { id: 'small', label: 'Small', size: 14 },
    { id: 'normal', label: 'Normal', size: 16 },
    { id: 'large', label: 'Large', size: 18 },
    { id: 'xlarge', label: 'Extra Large', size: 21 },
  ];

  const colorBlindOptions = [
    { id: 'none', label: 'None', description: 'Standard colors' },
    { id: 'protanopia', label: 'Protanopia', description: 'Red-blind' },
    { id: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind' },
    { id: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind' },
  ];

  const renderToggle = (label, description, settingKey, icon) => (
    <View
      style={[styles.settingRow, { borderBottomColor: colors.border.light }]}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityState={{ checked: settings[settingKey] }}
    >
      <View style={styles.settingInfo}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            {label}
          </Text>
          <Text style={[styles.settingDesc, { color: colors.text.secondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{
          false: colors.neutral[300],
          true: colors.primary.main + '60',
        }}
        thumbColor={settings[settingKey] ? colors.primary.main : colors.neutral[100]}
      />
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <TopBar title="Accessibility" showBack onBack={() => navigation.goBack()} />
        <View style={styles.loading}>
          <Text style={{ color: colors.text.secondary }}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <TopBar title="Accessibility" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Visual Settings */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Visual
          </Text>

          {renderToggle(
            'High Contrast',
            'Increase contrast for better visibility',
            'highContrast',
            '🔲'
          )}

          {renderToggle(
            'Large Text',
            'Increase text size throughout the app',
            'largeText',
            '🔤'
          )}

          {/* Font Size Selector */}
          <View style={styles.fontSizeSection}>
            <Text style={[styles.subSectionTitle, { color: colors.text.primary }]}>
              Text Size
            </Text>
            <View style={styles.fontSizeOptions}>
              {fontSizeOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.fontSizeOption,
                    {
                      backgroundColor:
                        settings.fontSize === option.id
                          ? colors.primary.main
                          : colors.background.secondary,
                      borderColor:
                        settings.fontSize === option.id
                          ? colors.primary.main
                          : colors.border.light,
                    },
                  ]}
                  onPress={() => updateSetting('fontSize', option.id)}
                  accessible
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} text size`}
                  accessibilityState={{ selected: settings.fontSize === option.id }}
                >
                  <Text
                    style={[
                      styles.fontSizeLabel,
                      {
                        fontSize: option.size,
                        color:
                          settings.fontSize === option.id
                            ? '#ffffff'
                            : colors.text.primary,
                      },
                    ]}
                  >
                    Aa
                  </Text>
                  <Text
                    style={[
                      styles.fontSizeName,
                      {
                        color:
                          settings.fontSize === option.id
                            ? '#ffffff'
                            : colors.text.secondary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* Color Blind Mode */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Color Vision
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            Adjust colors for different types of color vision deficiency
          </Text>

          <View style={styles.colorBlindOptions}>
            {colorBlindOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.colorBlindOption,
                  {
                    backgroundColor:
                      settings.colorBlindMode === option.id
                        ? colors.primary.main + '15'
                        : colors.background.secondary,
                    borderColor:
                      settings.colorBlindMode === option.id
                        ? colors.primary.main
                        : colors.border.light,
                  },
                ]}
                onPress={() => updateSetting('colorBlindMode', option.id)}
                accessible
                accessibilityRole="radio"
                accessibilityLabel={`${option.label}: ${option.description}`}
                accessibilityState={{ selected: settings.colorBlindMode === option.id }}
              >
                <View style={styles.radioCircle}>
                  {settings.colorBlindMode === option.id && (
                    <View
                      style={[
                        styles.radioSelected,
                        { backgroundColor: colors.primary.main },
                      ]}
                    />
                  )}
                </View>
                <View>
                  <Text
                    style={[styles.colorBlindLabel, { color: colors.text.primary }]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[styles.colorBlindDesc, { color: colors.text.secondary }]}
                  >
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Motion Settings */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Motion & Feedback
          </Text>

          {renderToggle(
            'Reduce Motion',
            'Minimize animations and transitions',
            'reduceMotion',
            '🎬'
          )}

          {renderToggle(
            'Haptic Feedback',
            'Vibration feedback for actions',
            'hapticFeedback',
            '📳'
          )}
        </Card>

        {/* Screen Reader Info */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Screen Reader
          </Text>
          <View style={styles.screenReaderInfo}>
            <Text style={styles.screenReaderIcon}>
              {settings.screenReaderEnabled ? '✅' : '⭕'}
            </Text>
            <View>
              <Text style={[styles.screenReaderStatus, { color: colors.text.primary }]}>
                {settings.screenReaderEnabled ? 'Active' : 'Not Active'}
              </Text>
              <Text style={[styles.screenReaderDesc, { color: colors.text.secondary }]}>
                {settings.screenReaderEnabled
                  ? 'VoiceOver/TalkBack is enabled on your device'
                  : 'Enable VoiceOver (iOS) or TalkBack (Android) in your device settings'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={[styles.tipsTitle, { color: colors.text.secondary }]}>
            Accessibility Tips
          </Text>
          <Text style={[styles.tipText, { color: colors.text.tertiary }]}>
            • All interactive elements have minimum touch targets of 44x44 points
          </Text>
          <Text style={[styles.tipText, { color: colors.text.tertiary }]}>
            • Activity cards include full descriptions for screen readers
          </Text>
          <Text style={[styles.tipText, { color: colors.text.tertiary }]}>
            • Use the Preferences screen to customize your experience
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  fontSizeSection: {
    marginTop: 8,
  },
  fontSizeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  fontSizeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fontSizeLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  fontSizeName: {
    fontSize: 11,
  },
  colorBlindOptions: {
    gap: 10,
    marginTop: 12,
  },
  colorBlindOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorBlindLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  colorBlindDesc: {
    fontSize: 13,
  },
  screenReaderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  screenReaderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  screenReaderStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  screenReaderDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  tipsSection: {
    marginTop: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default AccessibilityScreen;
