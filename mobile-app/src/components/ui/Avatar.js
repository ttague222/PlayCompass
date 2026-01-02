/**
 * PlayCompass Avatar Component
 *
 * User/profile avatars with image, initials, or emoji fallback
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Avatar = ({
  source, // { uri: string } for images
  name,
  emoji,
  size = 'md', // xs, sm, md, lg, xl
  color, // override background color
  style,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    xs: { size: 28, fontSize: 12, emojiSize: 14 },
    sm: { size: 36, fontSize: 14, emojiSize: 18 },
    md: { size: 48, fontSize: 18, emojiSize: 24 },
    lg: { size: 64, fontSize: 24, emojiSize: 32 },
    xl: { size: 96, fontSize: 36, emojiSize: 48 },
  };

  const currentSize = sizeStyles[size];

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const backgroundColor = color || colors.primary.main;

  const containerStyle = [
    styles.container,
    {
      width: currentSize.size,
      height: currentSize.size,
      borderRadius: currentSize.size / 2,
      backgroundColor,
    },
    style,
  ];

  // Image avatar
  if (source?.uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: currentSize.size,
              height: currentSize.size,
              borderRadius: currentSize.size / 2,
            },
          ]}
        />
      </View>
    );
  }

  // Emoji avatar
  if (emoji) {
    return (
      <View style={containerStyle}>
        <Text style={{ fontSize: currentSize.emojiSize }}>{emoji}</Text>
      </View>
    );
  }

  // Initials avatar
  return (
    <View style={containerStyle}>
      <Text style={[styles.initials, { fontSize: currentSize.fontSize }]}>
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default Avatar;
