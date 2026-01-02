/**
 * PlayCompass TopBar Component
 *
 * Minimalist top bar with logo and overflow menu
 * Follows Home Hub UX approach - keeps secondary items tucked away
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useKids } from '../../context/KidsContext';

const TopBar = () => {
  const { colors } = useTheme();
  const { kids } = useKids();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    { id: 'kids', label: 'Manage Kids', emoji: '👶', screen: 'KidsList', badge: kids?.length || 0 },
    { id: 'history', label: 'Activity History', emoji: '📋', screen: 'History' },
    { id: 'profile', label: 'Profile & Settings', emoji: '⚙️', screen: 'Profile' },
  ];

  const handleMenuPress = (screen) => {
    setMenuVisible(false);
    navigation.navigate(screen);
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
        <View style={styles.content}>
          {/* Logo / Brand */}
          <View style={styles.logoSection}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary.main }]}>
              <Text style={styles.logoEmoji}>🧭</Text>
            </View>
            <Text style={[styles.appName, { color: colors.text.primary }]}>PlayCompass</Text>
          </View>

          {/* Menu Button */}
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.surface.secondary }]}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overflow Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={[styles.menuContainer, { backgroundColor: colors.surface.primary, top: insets.top + 60 }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border.light },
                ]}
                onPress={() => handleMenuPress(item.screen)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                <Text style={[styles.menuItemLabel, { color: colors.text.primary }]}>{item.label}</Text>
                {item.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary.main }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Text style={[styles.menuItemArrow, { color: colors.text.tertiary }]}>›</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoEmoji: {
    fontSize: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    width: 240,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  menuItemArrow: {
    fontSize: 20,
    fontWeight: '300',
  },
});

export default TopBar;
