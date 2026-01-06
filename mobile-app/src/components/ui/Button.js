/**
 * PlayCompass Button Component
 *
 * Reusable button with variants: primary, secondary, outline, ghost
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Dynamically import LinearGradient to handle cases where native module isn't available
let LinearGradient = null;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  console.warn('[Button] expo-linear-gradient not available, using fallback');
}

const Button = ({
  children,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const { colors, gradients } = useTheme();

  const sizeStyles = {
    sm: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
    },
    md: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      fontSize: 16,
      iconSize: 20,
    },
    lg: {
      paddingVertical: 18,
      paddingHorizontal: 32,
      fontSize: 18,
      iconSize: 24,
    },
  };

  const currentSize = sizeStyles[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          useGradient: true,
          gradientColors: gradients.primary,
          textColor: '#ffffff',
          borderWidth: 0,
        };
      case 'secondary':
        return {
          useGradient: true,
          gradientColors: gradients.secondary,
          textColor: '#ffffff',
          borderWidth: 0,
        };
      case 'outline':
        return {
          useGradient: false,
          backgroundColor: 'transparent',
          textColor: colors.primary.main,
          borderWidth: 2,
          borderColor: colors.primary.main,
        };
      case 'ghost':
        return {
          useGradient: false,
          backgroundColor: 'transparent',
          textColor: colors.text.primary,
          borderWidth: 0,
        };
      default:
        return {
          useGradient: true,
          gradientColors: gradients.primary,
          textColor: '#ffffff',
          borderWidth: 0,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Text style={[styles.icon, { fontSize: currentSize.iconSize, color: variantStyles.textColor }]}>
              {icon}
            </Text>
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize: currentSize.fontSize,
                color: variantStyles.textColor,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <Text style={[styles.icon, styles.iconRight, { fontSize: currentSize.iconSize, color: variantStyles.textColor }]}>
              {icon}
            </Text>
          )}
        </>
      )}
    </View>
  );

  const buttonStyle = [
    styles.button,
    {
      paddingVertical: currentSize.paddingVertical,
      paddingHorizontal: currentSize.paddingHorizontal,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
      backgroundColor: variantStyles.backgroundColor,
      opacity: disabled ? 0.5 : 1,
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  if (variantStyles.useGradient) {
    // Fallback to solid color if LinearGradient is not available
    if (!LinearGradient) {
      return (
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={[
            styles.gradient,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
              backgroundColor: disabled ? '#9ca3af' : (variantStyles.gradientColors?.[0] || '#7c3aed'),
            },
            fullWidth && styles.fullWidth,
            style,
          ]}
          {...props}
        >
          {renderContent()}
        </TouchableOpacity>
      );
    }

    // Extract flex from style if present to apply to outer container
    const styleArray = Array.isArray(style) ? style : [style];
    const hasFlex = styleArray.some(s => s && (s.flex !== undefined));

    return (
      <View style={[hasFlex && { flex: 1, justifyContent: 'center' }]}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={[
            fullWidth && styles.fullWidth,
            { borderRadius: 14, overflow: 'hidden' },
          ]}
          {...props}
        >
          <LinearGradient
            colors={disabled ? ['#9ca3af', '#9ca3af'] : variantStyles.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradient,
              {
                paddingVertical: currentSize.paddingVertical,
                paddingHorizontal: currentSize.paddingHorizontal,
              },
            ]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract flex from style if present to apply to outer container
  const styleArray = Array.isArray(style) ? style : [style];
  const hasFlex = styleArray.some(s => s && (s.flex !== undefined));

  if (hasFlex) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.7}
          style={[
            styles.button,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
              borderWidth: variantStyles.borderWidth,
              borderColor: variantStyles.borderColor,
              backgroundColor: variantStyles.backgroundColor,
              opacity: disabled ? 0.5 : 1,
            },
            fullWidth && styles.fullWidth,
          ]}
          {...props}
        >
          {renderContent()}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={buttonStyle}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: 8,
  },
});

export default Button;
