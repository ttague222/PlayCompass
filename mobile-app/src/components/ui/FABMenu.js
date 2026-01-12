/**
 * PlayCompass FAB Menu Component
 *
 * Floating Action Button as primary navigation hub
 * Tap to open radial menu with all navigation options
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useKids } from '../../context/KidsContext';
import { useFavorites } from '../../context/FavoritesContext';

// Animation configuration
const FAB_SIZE = 56;
const MENU_ITEM_SIZE = 48;
const ITEM_SPACING = 60; // Vertical spacing between items

const FABMenu = ({ onFindActivity }) => {
  const { colors } = useTheme();
  const { kids } = useKids();
  const { favoritesCount } = useFavorites();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;

  // Menu items - simplified to frequent actions only
  // Bottom to top: Find Activity (primary) → Schedule → Saved → Kids → Settings
  // Using simple text icons instead of emojis for cleaner look
  const menuItems = [
    { id: 'settings', label: 'Settings', icon: '⚙', screen: 'Profile' },
    { id: 'kids', label: 'Kids', icon: '👤', screen: 'KidsList' },
    { id: 'saved', label: 'Saved', icon: '♡', screen: 'SavedActivities' },
    { id: 'schedule', label: 'Schedule', icon: '◫', screen: 'Schedule' },
    { id: 'find', label: 'Find Activity', icon: '→', action: 'find', isPrimary: true },
  ];

  // Calculate vertical position for each menu item (stacked above FAB)
  const getItemPosition = (index) => {
    return {
      x: 0,
      y: -ITEM_SPACING * (index + 1), // Stack upward
    };
  };

  // Toggle menu open/close
  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.parallel([
      Animated.spring(animatedValue, {
        toValue,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotationValue, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  // Handle menu item press
  const handleItemPress = (item) => {
    toggleMenu();
    setTimeout(() => {
      if (item.action === 'find') {
        onFindActivity?.();
      } else if (item.screen) {
        navigation.navigate(item.screen);
      }
    }, 150);
  };

  // Close menu when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isOpen) {
        animatedValue.setValue(0);
        rotationValue.setValue(0);
        setIsOpen(false);
      }
    });
    return unsubscribe;
  }, [navigation, isOpen, animatedValue, rotationValue]);

  // FAB rotation animation
  const fabRotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  // Backdrop opacity
  const backdropOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Get badge for specific items
  const getBadge = (itemId) => {
    switch (itemId) {
      case 'kids':
        return kids?.length || 0;
      case 'saved':
        return favoritesCount || 0;
      default:
        return 0;
    }
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* FAB Container */}
      <View
        style={[
          styles.container,
          {
            bottom: insets.bottom + 24,
            right: 24,
          },
        ]}
      >
        {/* Menu Items */}
        {menuItems.map((item, index) => {
          const position = getItemPosition(index);
          const badge = getBadge(item.id);

          const translateX = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, position.x],
          });
          const translateY = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, position.y],
          });
          const scale = animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
          });
          const opacity = animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
          });

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItemContainer,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  item.isPrimary
                    ? { backgroundColor: colors.primary.main }
                    : { backgroundColor: colors.surface.primary },
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.menuItemIcon,
                  { color: item.isPrimary ? '#fff' : colors.text.primary },
                ]}>
                  {item.icon}
                </Text>
                {badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error.main }]}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Label tooltip */}
              <Animated.View
                style={[
                  styles.labelContainer,
                  { backgroundColor: colors.surface.primary, opacity },
                ]}
              >
                <Text style={[styles.labelText, { color: colors.text.primary }]}>
                  {item.label}
                </Text>
              </Animated.View>
            </Animated.View>
          );
        })}

        {/* Main FAB - tap to toggle menu */}
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: colors.primary.main },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <Text style={styles.fabIcon}>{isOpen ? '✕' : '☰'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
  },
  menuItemContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItem: {
    width: MENU_ITEM_SIZE,
    height: MENU_ITEM_SIZE,
    borderRadius: MENU_ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItemIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  labelContainer: {
    position: 'absolute',
    right: MENU_ITEM_SIZE + 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default FABMenu;
