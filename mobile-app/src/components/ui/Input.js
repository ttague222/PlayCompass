/**
 * PlayCompass Input Component
 *
 * Reusable text input with label, error state, and variants
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  size = 'md', // sm, md, lg
  style,
  inputStyle,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const sizeStyles = {
    sm: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 14,
      iconSize: 16,
    },
    md: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      iconSize: 20,
    },
    lg: {
      paddingVertical: 18,
      paddingHorizontal: 20,
      fontSize: 18,
      iconSize: 24,
    },
  };

  const currentSize = sizeStyles[size];

  const getBorderColor = () => {
    if (error) return colors.error.main;
    if (isFocused) return colors.primary.main;
    return colors.border.medium;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: editable ? colors.surface.primary : colors.surface.secondary,
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
        ]}
      >
        {leftIcon && (
          <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>
            {leftIcon}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: colors.text.primary,
              fontSize: currentSize.fontSize,
            },
            multiline && { minHeight: numberOfLines * 24 },
            inputStyle,
          ]}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Text style={[styles.icon, styles.rightIcon, { fontSize: currentSize.iconSize }]}>
              {rightIcon}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.error.main : colors.text.tertiary },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  icon: {
    marginRight: 12,
  },
  rightIcon: {
    marginRight: 0,
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default Input;
