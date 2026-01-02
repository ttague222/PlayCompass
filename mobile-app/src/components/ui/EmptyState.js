/**
 * PlayCompass EmptyState Component
 *
 * Placeholder for empty lists/screens with optional action
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

const EmptyState = ({
  emoji = '📭',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {title && (
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {title}
        </Text>
      )}
      {description && (
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button onPress={onAction} size="md">
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  action: {
    marginTop: 8,
  },
});

export default EmptyState;
