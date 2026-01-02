/**
 * PlayCompass Card Component
 *
 * Reusable card container with elevation and variants
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Card = ({
  children,
  variant = 'elevated', // elevated, outlined, filled
  onPress,
  padding = 'md', // none, sm, md, lg
  style,
  ...props
}) => {
  const { colors, shadows } = useTheme();

  const paddingStyles = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 24,
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface.elevated,
          borderWidth: 0,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border.light,
        };
      case 'filled':
        return {
          backgroundColor: colors.surface.secondary,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.surface.elevated,
          borderWidth: 0,
          ...shadows.md,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const cardStyle = [
    styles.card,
    {
      padding: paddingStyles[padding],
      ...variantStyles,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyle}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
  },
});

export default Card;
