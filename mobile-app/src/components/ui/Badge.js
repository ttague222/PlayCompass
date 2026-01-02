/**
 * PlayCompass Badge Component
 *
 * Small status indicators and labels
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Badge = ({
  children,
  variant = 'default', // default, primary, secondary, success, warning, error
  size = 'md', // sm, md, lg
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      fontSize: 10,
      borderRadius: 6,
    },
    md: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      fontSize: 12,
      borderRadius: 8,
    },
    lg: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      fontSize: 14,
      borderRadius: 10,
    },
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.main,
          textColor: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary.main,
          textColor: '#ffffff',
        };
      case 'success':
        return {
          backgroundColor: colors.success.main,
          textColor: '#ffffff',
        };
      case 'warning':
        return {
          backgroundColor: colors.warning.main,
          textColor: '#ffffff',
        };
      case 'error':
        return {
          backgroundColor: colors.error.main,
          textColor: '#ffffff',
        };
      default:
        return {
          backgroundColor: colors.neutral[200],
          textColor: colors.text.secondary,
        };
    }
  };

  const currentSize = sizeStyles[size];
  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.backgroundColor,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: currentSize.fontSize,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
