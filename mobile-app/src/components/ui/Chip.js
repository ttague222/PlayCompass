/**
 * PlayCompass Chip Component
 *
 * Selectable chips for filters, tags, multi-select options
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Chip = ({
  children,
  selected = false,
  onPress,
  icon,
  disabled = false,
  size = 'md', // sm, md, lg
  style,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      fontSize: 12,
      iconSize: 14,
    },
    md: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
    },
    lg: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      fontSize: 16,
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  const renderContent = () => (
    <View style={styles.content}>
      {icon && (
        <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>
          {icon}
        </Text>
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
            color: selected ? '#ffffff' : colors.text.primary,
          },
        ]}
      >
        {children}
      </Text>
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );

  if (selected) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.chipWrapper,
          styles.chip,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: colors.primary.main,
            borderColor: colors.primary.main,
          },
          style,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.chipWrapper,
        styles.chip,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: colors.surface.secondary,
          borderColor: colors.border.medium,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chipWrapper: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 8,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default Chip;
