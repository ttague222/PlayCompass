/**
 * PlayCompass Onboarding Screen
 *
 * First-time user experience to introduce app features
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = '@playcompass_onboarding_complete';

const ONBOARDING_SLIDES = [
  {
    id: '1',
    emoji: '🧭',
    title: 'Welcome to PlayCompass',
    description:
      'Your personal guide to quality family activities. Discover fun, age-appropriate activities tailored just for your kids.',
    color: '#4F46E5',
  },
  {
    id: '2',
    emoji: '👶',
    title: 'Add Your Kids',
    description:
      'Tell us about your children - their ages, interests, and preferences. We\'ll personalize every recommendation just for them.',
    color: '#10B981',
  },
  {
    id: '3',
    emoji: '🎯',
    title: 'Smart AI Recommendations',
    description:
      'Swipe through personalized activity ideas. Our AI learns what your family loves and gets smarter with every choice.',
    color: '#F59E0B',
  },
  {
    id: '4',
    emoji: '📅',
    title: 'Plan Your Week',
    description:
      'Schedule activities on your calendar, set reminder notifications, and never miss quality time with your kids.',
    color: '#8B5CF6',
  },
  {
    id: '5',
    emoji: '❤️',
    title: 'Save Your Favorites',
    description:
      'Heart activities you love, build your personal library, and print activity kits to take on the go.',
    color: '#EF4444',
  },
  {
    id: '6',
    emoji: '📄',
    title: 'Take Activities To-Go',
    description:
      'Download activity kits as PDFs to print or share with caregivers. Perfect for playdates, babysitters, or family outings.',
    color: '#EC4899',
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete?.();
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      onComplete?.();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View
          style={[
            styles.slideContent,
            { transform: [{ scale }], opacity },
          ]}
        >
          <View
            style={[
              styles.emojiContainer,
              { backgroundColor: item.color + '20' },
            ]}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {ONBOARDING_SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: ONBOARDING_SLIDES[currentIndex].color,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Skip button */}
      {!isLastSlide && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.text.tertiary }]}>
            Skip
          </Text>
        </Pressable>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false } // false because we animate width on pagination dots
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {renderDots()}

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={[
              styles.button,
              { backgroundColor: ONBOARDING_SLIDES[currentIndex].color },
            ]}
          >
            {isLastSlide ? "Let's Get Started!" : 'Next'}
          </Button>
        </View>
      </View>
    </View>
  );
};

/**
 * Check if onboarding is complete
 */
export const isOnboardingComplete = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding state:', error);
    return false;
  }
};

/**
 * Reset onboarding (for testing)
 */
export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return { success: false, error: error.message };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});

export default OnboardingScreen;
