/**
 * PlayCompass IconButton Component
 *
 * Circular button for icons/emoji actions
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const IconButton = ({
  icon,
  onPress,
  variant = 'default', // default, primary, secondary, ghost
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  style,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { size: 32, iconSize: 16 },
    md: { size: 44, iconSize: 22 },
    lg: { size: 56, iconSize: 28 },
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.main,
          iconColor: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary.main,
          iconColor: '#ffffff',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          iconColor: colors.text.primary,
        };
      default:
        return {
          backgroundColor: colors.surface.secondary,
          iconColor: colors.text.primary,
        };
    }
  };

  const currentSize = sizeStyles[size];
  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          width: currentSize.size,
          height: currentSize.size,
          borderRadius: currentSize.size / 2,
          backgroundColor: variantStyles.backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.iconColor} size="small" />
      ) : (
        <Text
          style={{
            fontSize: currentSize.iconSize,
            color: variantStyles.iconColor,
          }}
        >
          {icon}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IconButton;
