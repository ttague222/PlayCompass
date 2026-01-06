/**
 * PlayCompass Achievement Modal
 *
 * Celebration modal shown when user unlocks a new achievement
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

const { width } = Dimensions.get('window');

const AchievementModal = ({ achievement, visible, onDismiss }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);

      // Play celebration animation
      Animated.sequence([
        // Pop in with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Slight wiggle
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Pulsing glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, scaleAnim, rotateAnim, glowAnim]);

  if (!achievement) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9333EA';
      case 'rare':
        return '#3B82F6';
      default:
        return colors.primary.main;
    }
  };

  const getRarityLabel = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return 'LEGENDARY';
      case 'epic':
        return 'EPIC';
      case 'rare':
        return 'RARE';
      default:
        return 'ACHIEVEMENT';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background.primary,
              transform: [{ scale: scaleAnim }, { rotate }],
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: getRarityColor(),
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <Text style={[styles.header, { color: getRarityColor() }]}>
              {getRarityLabel()} UNLOCKED!
            </Text>

            {/* Badge */}
            <View
              style={[
                styles.badgeContainer,
                { borderColor: getRarityColor() },
              ]}
            >
              <Text style={styles.badgeEmoji}>{achievement.icon}</Text>
            </View>

            {/* Achievement Info */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {achievement.name}
            </Text>
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              {achievement.description}
            </Text>

            {/* Points */}
            {achievement.points && (
              <View style={[styles.pointsBadge, { backgroundColor: getRarityColor() + '20' }]}>
                <Text style={[styles.pointsText, { color: getRarityColor() }]}>
                  +{achievement.points} points
                </Text>
              </View>
            )}

            {/* Dismiss Button */}
            <Button
              variant="primary"
              onPress={onDismiss}
              style={styles.button}
            >
              Awesome!
            </Button>
          </View>

          {/* Confetti decoration */}
          <View style={styles.confettiContainer}>
            {['🎉', '⭐', '✨', '🌟', '🎊'].map((emoji, index) => (
              <Text
                key={index}
                style={[
                  styles.confetti,
                  {
                    left: `${15 + index * 17}%`,
                    top: index % 2 === 0 ? -10 : -20,
                    transform: [{ rotate: `${index * 30}deg` }],
                  },
                ]}
              >
                {emoji}
              </Text>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: width - 48,
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 200,
  },
  content: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  header: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  pointsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    minWidth: 150,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'visible',
  },
  confetti: {
    position: 'absolute',
    fontSize: 24,
  },
});

export default AchievementModal;
