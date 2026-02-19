/**
 * PlayCompass Paywall Component
 *
 * Modal for upselling activity packs or premium lifetime when user
 * tries to access a locked activity OR reaches their daily recommendation limit.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { ACTIVITY_PACKS, PREMIUM_LIFETIME, getPackForActivity } from '../data/activityPacks';
import Button from './ui/Button';
import Card from './ui/Card';

const Paywall = ({ visible, onClose, activity, requiredPackId, blockedFeature }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const {
    purchasePack,
    purchaseLifetime,
    purchaseLoading,
  } = useSubscription();
  const [selectedOption, setSelectedOption] = useState('pack'); // 'pack' or 'lifetime'

  // Check if this is a feature block (daily limit or scheduling)
  const isDailyLimitBlock = blockedFeature === 'dailyRecommendations';
  const isSchedulingBlock = blockedFeature === 'scheduling';
  const isFeatureBlock = isDailyLimitBlock || isSchedulingBlock;

  // Get the pack info (only for activity locks)
  const packId = requiredPackId || (activity ? getPackForActivity(activity) : null);
  const pack = packId ? ACTIVITY_PACKS[packId] : null;

  // Return null only if it's NOT a feature block AND no pack found
  if (!isFeatureBlock && !pack) {
    return null;
  }

  const handlePurchasePack = async () => {
    const result = await purchasePack(packId);

    if (result.success) {
      Alert.alert(
        'Pack Unlocked!',
        `You now have access to all ${pack.name} activities!`,
        [{ text: 'Great!', onPress: onClose }]
      );
    } else if (result.cancelled) {
      // User cancelled
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error, [{ text: 'OK' }]);
    }
  };

  const handlePurchaseLifetime = async () => {
    const result = await purchaseLifetime();

    if (result.success) {
      Alert.alert(
        'Premium Unlocked!',
        'You now have lifetime access to all packs and features!',
        [{ text: 'Awesome!', onPress: onClose }]
      );
    } else if (result.cancelled) {
      // User cancelled
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error, [{ text: 'OK' }]);
    }
  };

  const handleGoToStore = () => {
    onClose();
    navigation.navigate('Store');
  };

  // Render Daily Limit UI
  const renderDailyLimitContent = () => (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={[styles.closeText, { color: colors.text.secondary }]}>✕</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.lockIcon}>⏰</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Daily Limit Reached
        </Text>
        <Text style={[styles.activityName, { color: colors.text.secondary }]}>
          You've used your 3 free recommendations for today
        </Text>
      </View>

      {/* Premium Lifetime Option */}
      <View style={styles.options}>
        <View
          style={[
            styles.optionCard,
            {
              backgroundColor: colors.primary.light,
              borderColor: colors.primary.main,
            },
          ]}
        >
          {/* Best Value badge */}
          <View style={[styles.bestValueBadge, { backgroundColor: colors.secondary.main }]}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>

          <View style={styles.optionHeader}>
            <View style={[styles.optionIconContainer, { backgroundColor: colors.primary.main + '30' }]}>
              <Text style={styles.optionEmoji}>{PREMIUM_LIFETIME.emoji}</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionName, { color: colors.text.primary }]}>
                {PREMIUM_LIFETIME.name}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
                Unlimited recommendations forever
              </Text>
            </View>
          </View>

          {/* Feature list */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text.primary }]}>
                Unlimited daily recommendations
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text.primary }]}>
                All activity packs included
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text.primary }]}>
                Weather-aware & seasonal activities
              </Text>
            </View>
          </View>

          <Text style={[styles.optionPrice, { color: colors.primary.main }]}>
            {PREMIUM_LIFETIME.priceLabel}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        <Button
          onPress={handlePurchaseLifetime}
          variant="primary"
          fullWidth
          size="lg"
          loading={purchaseLoading}
          disabled={purchaseLoading}
        >
          Get Unlimited - {PREMIUM_LIFETIME.priceLabel}
        </Button>

        <TouchableOpacity onPress={onClose} style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color: colors.text.tertiary }]}>
            Come back tomorrow
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Scheduling Feature UI
  const renderSchedulingContent = () => (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={[styles.closeText, { color: colors.text.secondary }]}>✕</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.lockIcon}>📅</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Premium Feature
        </Text>
        <Text style={[styles.activityName, { color: colors.text.secondary }]}>
          Scheduling activities requires Premium
        </Text>
      </View>

      {/* Premium Lifetime Option */}
      <View style={styles.options}>
        <View
          style={[
            styles.optionCard,
            {
              backgroundColor: colors.primary.light,
              borderColor: colors.primary.main,
            },
          ]}
        >
          {/* Best Value badge */}
          <View style={[styles.bestValueBadge, { backgroundColor: colors.secondary.main }]}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>

          <View style={styles.optionHeader}>
            <View style={[styles.optionIconContainer, { backgroundColor: colors.primary.main + '30' }]}>
              <Text style={styles.optionEmoji}>{PREMIUM_LIFETIME.emoji}</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionName, { color: colors.text.primary }]}>
                {PREMIUM_LIFETIME.name}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
                Unlock all premium features
              </Text>
            </View>
          </View>

          {/* Feature list */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text.primary }]}>
                Activity scheduling & reminders
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text.primary }]}>
                Unlimited daily recommendations
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text.primary }]}>
                All activity packs included
              </Text>
            </View>
          </View>

          <Text style={[styles.optionPrice, { color: colors.primary.main }]}>
            {PREMIUM_LIFETIME.priceLabel}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        <Button
          onPress={handlePurchaseLifetime}
          variant="primary"
          fullWidth
          size="lg"
          loading={purchaseLoading}
          disabled={purchaseLoading}
        >
          Get Premium - {PREMIUM_LIFETIME.priceLabel}
        </Button>

        <TouchableOpacity onPress={onClose} style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color: colors.text.tertiary }]}>
            Maybe later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Activity Lock UI (existing behavior)
  const renderActivityLockContent = () => (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={[styles.closeText, { color: colors.text.secondary }]}>✕</Text>
      </TouchableOpacity>

      {/* Lock icon and title */}
      <View style={styles.header}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Unlock This Activity
        </Text>
        {activity && (
          <Text style={[styles.activityName, { color: colors.text.secondary }]}>
            "{activity.title}" is part of the {pack.name}
          </Text>
        )}
      </View>

      {/* Options */}
      <View style={styles.options}>
        {/* Pack option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: selectedOption === 'pack' ? pack.color + '15' : colors.surface.secondary,
              borderColor: selectedOption === 'pack' ? pack.color : colors.border.light,
            },
          ]}
          onPress={() => setSelectedOption('pack')}
          activeOpacity={0.7}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.optionIconContainer, { backgroundColor: pack.color + '30' }]}>
              <Text style={styles.optionEmoji}>{pack.emoji}</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionName, { color: colors.text.primary }]}>
                {pack.name}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
                {pack.description}
              </Text>
            </View>
          </View>
          <Text style={[styles.optionPrice, { color: pack.color }]}>
            {pack.priceLabel}
          </Text>
          {selectedOption === 'pack' && (
            <View style={[styles.selectedIndicator, { backgroundColor: pack.color }]} />
          )}
        </TouchableOpacity>

        {/* Divider with "or" */}
        <View style={styles.orDivider}>
          <View style={[styles.orLine, { backgroundColor: colors.border.light }]} />
          <Text style={[styles.orText, { color: colors.text.tertiary }]}>or</Text>
          <View style={[styles.orLine, { backgroundColor: colors.border.light }]} />
        </View>

        {/* Lifetime option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: selectedOption === 'lifetime' ? colors.primary.light : colors.surface.secondary,
              borderColor: selectedOption === 'lifetime' ? colors.primary.main : colors.border.light,
            },
          ]}
          onPress={() => setSelectedOption('lifetime')}
          activeOpacity={0.7}
        >
          {/* Best Value badge */}
          <View style={[styles.bestValueBadge, { backgroundColor: colors.secondary.main }]}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>

          <View style={styles.optionHeader}>
            <View style={[styles.optionIconContainer, { backgroundColor: colors.primary.light }]}>
              <Text style={styles.optionEmoji}>{PREMIUM_LIFETIME.emoji}</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionName, { color: colors.text.primary }]}>
                {PREMIUM_LIFETIME.name}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
                All packs + unlimited features forever
              </Text>
            </View>
          </View>
          <Text style={[styles.optionPrice, { color: colors.primary.main }]}>
            {PREMIUM_LIFETIME.priceLabel}
          </Text>
          {selectedOption === 'lifetime' && (
            <View style={[styles.selectedIndicator, { backgroundColor: colors.primary.main }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Purchase button */}
      <View style={styles.footer}>
        <Button
          onPress={selectedOption === 'pack' ? handlePurchasePack : handlePurchaseLifetime}
          variant="primary"
          fullWidth
          size="lg"
          loading={purchaseLoading}
          disabled={purchaseLoading}
          style={selectedOption === 'pack' ? { backgroundColor: pack.color } : {}}
        >
          {selectedOption === 'pack'
            ? `Get ${pack.name} - ${pack.priceLabel}`
            : `Get Premium Lifetime - ${PREMIUM_LIFETIME.priceLabel}`}
        </Button>

        <TouchableOpacity onPress={handleGoToStore} style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color: colors.text.tertiary }]}>
            View all packs in Store
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        {isDailyLimitBlock
          ? renderDailyLimitContent()
          : isSchedulingBlock
            ? renderSchedulingContent()
            : renderActivityLockContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 14,
    textAlign: 'center',
  },
  options: {
    marginBottom: 24,
  },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 12,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  featureList: {
    marginTop: 8,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#22c55e',
  },
  featureText: {
    fontSize: 13,
  },
  footer: {
    marginTop: 8,
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  viewAllText: {
    fontSize: 13,
  },
});

export default Paywall;
