/**
 * PlayCompass Star Rating Component
 *
 * Interactive star rating input
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const StarRating = ({
  rating = 0,
  maxStars = 5,
  size = 'md',
  readonly = false,
  onRatingChange,
  showLabel = false,
  style,
}) => {
  const { colors } = useTheme();

  const sizeConfig = {
    sm: { starSize: 20, gap: 4 },
    md: { starSize: 32, gap: 6 },
    lg: { starSize: 44, gap: 8 },
  };

  const { starSize, gap } = sizeConfig[size] || sizeConfig.md;

  const ratingLabels = {
    1: 'Not great',
    2: 'It was okay',
    3: 'Pretty good',
    4: 'Really fun!',
    5: 'Amazing!',
  };

  const handleStarPress = (starIndex) => {
    if (readonly) return;
    // If tapping the same star, toggle it off (set to 0) or set the rating
    const newRating = starIndex === rating ? 0 : starIndex;
    onRatingChange?.(newRating);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.starsRow, { gap }]}>
        {Array.from({ length: maxStars }, (_, index) => {
          const starIndex = index + 1;
          const isFilled = starIndex <= rating;

          return (
            <TouchableOpacity
              key={starIndex}
              onPress={() => handleStarPress(starIndex)}
              disabled={readonly}
              activeOpacity={readonly ? 1 : 0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.star,
                  {
                    fontSize: starSize,
                    color: isFilled ? '#f59e0b' : colors.border.light,
                  },
                ]}
              >
                {isFilled ? '\u2605' : '\u2606'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {showLabel && rating > 0 && (
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          {ratingLabels[rating]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    textAlign: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default StarRating;
