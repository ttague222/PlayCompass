/**
 * PlayCompass Slider Component
 *
 * Age range and value selection slider
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const THUMB_SIZE = 28;

const Slider = ({
  min = 0,
  max = 100,
  value,
  onChange,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => v.toString(),
  style,
}) => {
  const { colors, gradients } = useTheme();
  const sliderRef = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);

  const getPositionFromValue = (val) => {
    const percentage = (val - min) / (max - min);
    return percentage * (sliderWidth - THUMB_SIZE);
  };

  const getValueFromPosition = (position) => {
    const percentage = position / (sliderWidth - THUMB_SIZE);
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newValue = getValueFromPosition(touchX - THUMB_SIZE / 2);
        onChange(newValue);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newValue = getValueFromPosition(touchX - THUMB_SIZE / 2);
        onChange(newValue);
      },
    })
  ).current;

  const thumbPosition = getPositionFromValue(value);
  const fillWidth = thumbPosition + THUMB_SIZE / 2;

  return (
    <View style={[styles.container, style]}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && (
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text style={[styles.value, { color: colors.primary.main }]}>
              {formatValue(value)}
            </Text>
          )}
        </View>
      )}

      <View
        ref={sliderRef}
        style={styles.sliderContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Track */}
        <View style={[styles.track, { backgroundColor: colors.border.light }]} />

        {/* Fill */}
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: fillWidth }]}
        />

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: thumbPosition,
              backgroundColor: '#ffffff',
              borderColor: colors.primary.main,
            },
          ]}
        />
      </View>

      {/* Min/Max labels */}
      <View style={styles.minMax}>
        <Text style={[styles.minMaxText, { color: colors.text.tertiary }]}>
          {formatValue(min)}
        </Text>
        <Text style={[styles.minMaxText, { color: colors.text.tertiary }]}>
          {formatValue(max)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  minMax: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  minMaxText: {
    fontSize: 12,
  },
});

export default Slider;
