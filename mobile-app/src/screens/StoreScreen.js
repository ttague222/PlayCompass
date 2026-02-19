/**
 * PlayCompass Store Screen
 *
 * Displays activity packs and premium lifetime for purchase.
 * Replaces the old SubscriptionScreen.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Button, IconButton, ScreenWrapper } from '../components';

const StoreScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    ownedPacks,
    hasPremiumLifetime,
    allPacks,
    premiumLifetime,
    purchasePack,
    purchaseLifetime,
    restorePurchases,
    purchaseLoading,
  } = useSubscription();
  const insets = useSafeAreaInsets();
  const [restoring, setRestoring] = useState(false);

  const handlePurchasePack = async (packId) => {
    const result = await purchasePack(packId);

    if (result.success) {
      Alert.alert(
        'Purchase Successful!',
        'Your pack has been unlocked. Enjoy the new activities!',
        [{ text: 'Great!' }]
      );
    } else if (result.cancelled) {
      // User cancelled, do nothing
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error, [{ text: 'OK' }]);
    }
  };

  const handlePurchaseLifetime = async () => {
    const result = await purchaseLifetime();

    if (result.success) {
      Alert.alert(
        'Welcome to Premium!',
        'You now have lifetime access to all packs and features!',
        [{ text: 'Awesome!' }]
      );
    } else if (result.cancelled) {
      // User cancelled, do nothing
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error, [{ text: 'OK' }]);
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);

    if (result.success && (result.hasPremiumLifetime || result.ownedPacks.length > 0)) {
      Alert.alert(
        'Purchases Restored',
        result.hasPremiumLifetime
          ? 'Your Premium Lifetime has been restored!'
          : `${result.ownedPacks.length} pack(s) have been restored.`,
        [{ text: 'Great!' }]
      );
    } else if (result.success) {
      Alert.alert(
        'No Purchases Found',
        'We couldn\'t find any previous purchases to restore.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Restore Failed', result.error || 'Please try again.', [{ text: 'OK' }]);
    }
  };

  const isPackOwned = (packId) => {
    return hasPremiumLifetime || ownedPacks.includes(packId);
  };

  const renderLifetimeCard = () => (
    <Card
      variant="elevated"
      style={[
        styles.lifetimeCard,
        {
          backgroundColor: hasPremiumLifetime ? colors.success.light : colors.primary.light,
          borderColor: hasPremiumLifetime ? colors.success.main : colors.primary.main,
          borderWidth: 2,
        },
      ]}
    >
      {/* Crown icon */}
      <View style={styles.lifetimeHeader}>
        <Text style={styles.lifetimeEmoji}>{premiumLifetime.emoji}</Text>
        <View style={styles.lifetimeTextContainer}>
          <Text style={[styles.lifetimeName, { color: colors.text.primary }]}>
            {premiumLifetime.name}
          </Text>
          {hasPremiumLifetime ? (
            <View style={[styles.ownedBadge, { backgroundColor: colors.success.main }]}>
              <Text style={styles.ownedBadgeText}>OWNED</Text>
            </View>
          ) : (
            <Text style={[styles.lifetimePrice, { color: colors.primary.main }]}>
              {premiumLifetime.priceLabel}
            </Text>
          )}
        </View>
      </View>

      <Text style={[styles.lifetimeDescription, { color: colors.text.secondary }]}>
        {premiumLifetime.description}
      </Text>

      {/* Features list */}
      <View style={styles.lifetimeFeatures}>
        {premiumLifetime.featureDescriptions.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={[styles.featureLabel, { color: colors.text.primary }]}>
              {feature.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Best Value badge */}
      {!hasPremiumLifetime && (
        <View style={[styles.bestValueBadge, { backgroundColor: colors.secondary.main }]}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}

      {/* Purchase button */}
      {!hasPremiumLifetime && (
        <Button
          onPress={handlePurchaseLifetime}
          variant="primary"
          fullWidth
          style={styles.lifetimeButton}
          loading={purchaseLoading}
          disabled={purchaseLoading || restoring}
        >
          Get Premium Lifetime - {premiumLifetime.priceLabel}
        </Button>
      )}
    </Card>
  );

  const renderPackCard = (pack) => {
    const owned = isPackOwned(pack.id);

    return (
      <Card
        key={pack.id}
        variant="outlined"
        style={[
          styles.packCard,
          owned && { borderColor: colors.success.main, borderWidth: 2 },
        ]}
      >
        {/* Owned badge */}
        {owned && (
          <View style={[styles.packOwnedBadge, { backgroundColor: colors.success.main }]}>
            <Text style={styles.packOwnedText}>OWNED</Text>
          </View>
        )}

        {/* Pack header */}
        <View style={[styles.packIconContainer, { backgroundColor: pack.color + '20' }]}>
          <Text style={styles.packEmoji}>{pack.emoji}</Text>
        </View>

        <Text style={[styles.packName, { color: colors.text.primary }]}>
          {pack.name}
        </Text>

        <Text
          style={[styles.packDescription, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {pack.description}
        </Text>

        {/* Price or owned status */}
        {!owned ? (
          <>
            <Text style={[styles.packPrice, { color: pack.color }]}>
              {pack.priceLabel}
            </Text>
            <TouchableOpacity
              style={[styles.packButton, { backgroundColor: pack.color }]}
              onPress={() => handlePurchasePack(pack.id)}
              disabled={purchaseLoading || restoring}
            >
              {purchaseLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.packButtonText}>Get Pack</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.ownedContainer}>
            <Text style={[styles.ownedText, { color: colors.success.main }]}>
              Unlocked
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="←"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="md"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Store
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Lifetime Section */}
        {renderLifetimeCard()}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border.light }]} />
          <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>
            or buy individual packs
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border.light }]} />
        </View>

        {/* Activity Packs Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Activity Packs
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
          Unlock themed activities for your family
        </Text>

        <View style={styles.packsGrid}>
          {allPacks.map(renderPackCard)}
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={restoring || purchaseLoading}
        >
          {restoring ? (
            <ActivityIndicator color={colors.primary.main} size="small" />
          ) : (
            <Text style={[styles.restoreText, { color: colors.primary.main }]}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        {/* Info text */}
        <Text style={[styles.infoText, { color: colors.text.tertiary }]}>
          All purchases are one-time payments. No subscriptions or recurring charges.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  // Lifetime card styles
  lifetimeCard: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  lifetimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lifetimeEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  lifetimeTextContainer: {
    flex: 1,
  },
  lifetimeName: {
    fontSize: 22,
    fontWeight: '700',
  },
  lifetimePrice: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  lifetimeDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  lifetimeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 12,
    right: -30,
    paddingVertical: 4,
    paddingHorizontal: 40,
    transform: [{ rotate: '45deg' }],
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  lifetimeButton: {
    marginTop: 8,
  },
  ownedBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  ownedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
  },
  // Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  // Pack cards grid
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  packCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 200,
  },
  packOwnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  packOwnedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  packIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  packEmoji: {
    fontSize: 28,
  },
  packName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  packDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
    flex: 1,
  },
  packPrice: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  packButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  packButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  ownedContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Info
  infoText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default StoreScreen;
