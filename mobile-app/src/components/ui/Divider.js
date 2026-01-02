/**
 * PlayCompass Divider Component
 *
 * Horizontal or vertical divider with optional label
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Divider = ({
  label,
  orientation = 'horizontal', // horizontal, vertical
  spacing = 'md', // sm, md, lg
  style,
}) => {
  const { colors } = useTheme();

  const spacingStyles = {
    sm: 8,
    md: 16,
    lg: 24,
  };

  const currentSpacing = spacingStyles[spacing];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: colors.border.light,
            marginHorizontal: currentSpacing,
          },
          style,
        ]}
      />
    );
  }

  if (label) {
    return (
      <View
        style={[
          styles.labelContainer,
          { marginVertical: currentSpacing },
          style,
        ]}
      >
        <View style={[styles.line, { backgroundColor: colors.border.light }]} />
        <Text style={[styles.label, { color: colors.text.tertiary }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border.light }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: colors.border.light,
          marginVertical: currentSpacing,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Divider;
