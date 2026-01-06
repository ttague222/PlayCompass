/**
 * PlayCompass Subscription Screen
 *
 * Displays subscription tiers and allows users to manage their subscription
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
import { Card, Button, IconButton, Badge, ScreenWrapper } from '../components';

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    tier,
    tierConfig,
    allTiers,
    isPremium,
    isTrialPeriod,
    trialEndsAt,
    usage,
    offerings,
    purchase,
    restorePurchases,
    purchaseLoading,
  } = useSubscription();
  const insets = useSafeAreaInsets();
  const [restoring, setRestoring] = useState(false);

  // Calculate days remaining in trial
  const getTrialDaysRemaining = () => {
    if (!isTrialPeriod || !trialEndsAt) return 0;
    const now = new Date();
    const end = new Date(trialEndsAt);
    const diffMs = end - now;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Find the RevenueCat package for a given tier
  const getPackageForTier = (tierId) => {
    if (!offerings || offerings.length === 0) return null;

    // Map tier IDs to RevenueCat product identifiers
    const productMap = {
      plus: 'playcompass_plus_monthly',
      family: 'playcompass_family_monthly',
    };

    const productId = productMap[tierId];
    if (!productId) return null;

    return offerings.find((pkg) =>
      pkg.product.identifier === productId ||
      pkg.identifier?.toLowerCase().includes(tierId)
    );
  };

  // Check if a package has a free trial
  const getTrialInfo = (pkg) => {
    if (!pkg?.product?.introPrice) return null;

    const intro = pkg.product.introPrice;
    // Free trial: price is 0 or paymentMode indicates trial
    if (intro.price === 0 || intro.paymentMode === 0) {
      // paymentMode 0 = free trial in RevenueCat
      const periodUnit = intro.periodUnit;
      const periodNumber = intro.periodNumberOfUnits || intro.cycles || 1;

      // Map period unit to readable string
      const unitMap = { 0: 'day', 1: 'week', 2: 'month', 3: 'year' };
      const unit = unitMap[periodUnit] || 'day';

      return {
        hasTrial: true,
        duration: `${periodNumber} ${unit}${periodNumber > 1 ? 's' : ''}`,
        periodUnit: unit,
        periodNumber,
      };
    }
    return null;
  };

  const handleSubscribe = async (tierId) => {
    const pkg = getPackageForTier(tierId);

    if (!pkg) {
      // Fallback for when offerings aren't loaded yet
      Alert.alert(
        'Subscription',
        'Unable to load subscription options. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await purchase(pkg);

    if (result.success) {
      Alert.alert(
        'Welcome to ' + allTiers[result.tier]?.name + '!',
        'Your subscription is now active. Enjoy all the premium features!',
        [{ text: 'Great!' }]
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

    if (result.success && result.tier !== 'free') {
      Alert.alert(
        'Purchases Restored',
        `Your ${allTiers[result.tier]?.name} subscription has been restored.`,
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

  const renderTierCard = (tierData, isCurrentTier) => {
    const isPopular = tierData.id === 'plus';
    const features = tierData.features;

    return (
      <Card
        key={tierData.id}
        variant={isCurrentTier ? 'elevated' : 'outlined'}
        style={[
          styles.tierCard,
          isCurrentTier && { borderColor: colors.primary.main, borderWidth: 2 },
          isPopular && !isCurrentTier && { borderColor: colors.secondary.main, borderWidth: 2 },
        ]}
      >
        {/* Popular Badge - Corner Ribbon */}
        {isPopular && !isCurrentTier && (
          <View style={styles.popularBadgeContainer}>
            <View style={[styles.popularBadge, { backgroundColor: colors.secondary.main }]}>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
          </View>
        )}

        {/* Current Plan Badge */}
        {isCurrentTier && (
          <View style={[styles.currentBadge, { backgroundColor: colors.primary.main }]}>
            <Text style={styles.currentBadgeText}>
              {isTrialPeriod ? 'TRIAL' : 'CURRENT PLAN'}
            </Text>
          </View>
        )}

        {/* Tier Header */}
        <View style={styles.tierHeader}>
          <Text style={[styles.tierName, { color: colors.text.primary }]}>
            {tierData.name}
          </Text>
          <View style={styles.priceRow}>
            {tierData.price === 0 ? (
              <Text style={[styles.price, { color: colors.text.primary }]}>Free</Text>
            ) : (
              <>
                <Text style={[styles.priceAmount, { color: colors.text.primary }]}>
                  ${tierData.price}
                </Text>
                <Text style={[styles.pricePeriod, { color: colors.text.secondary }]}>
                  /month
                </Text>
              </>
            )}
          </View>
          <Text style={[styles.tierDescription, { color: colors.text.secondary }]}>
            {tierData.description}
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresList}>
          <FeatureRow
            icon="👶"
            label={`Up to ${features.maxKids} children`}
            colors={colors}
          />
          <FeatureRow
            icon="🎯"
            label={
              features.dailyRecommendations === 'unlimited'
                ? 'Unlimited daily recommendations'
                : `${features.dailyRecommendations} recommendations/day`
            }
            colors={colors}
          />
          <FeatureRow
            icon="📋"
            label={
              features.historyDays === 365
                ? '1 year of history'
                : `${features.historyDays} days of history`
            }
            colors={colors}
          />
          {features.categories === 'all' && (
            <FeatureRow
              icon="📚"
              label="All activity categories"
              colors={colors}
            />
          )}
          {features.customActivities && (
            <FeatureRow
              icon="✨"
              label="Custom activities"
              colors={colors}
            />
          )}
          {features.offlineMode && (
            <FeatureRow
              icon="📴"
              label="Offline mode"
              colors={colors}
            />
          )}
        </View>

        {/* Action Button */}
        {!isCurrentTier && tierData.id !== 'free' && (() => {
          const pkg = getPackageForTier(tierData.id);
          const trialInfo = getTrialInfo(pkg);

          return (
            <>
              <Button
                onPress={() => handleSubscribe(tierData.id)}
                variant={isPopular ? 'primary' : 'secondary'}
                fullWidth
                style={styles.subscribeButton}
                loading={purchaseLoading}
                disabled={purchaseLoading || restoring}
              >
                {trialInfo
                  ? `Start ${trialInfo.duration} Free Trial`
                  : tierData.price === 0
                    ? 'Downgrade'
                    : `Subscribe - ${tierData.priceLabel}`}
              </Button>
              {trialInfo && (
                <Text style={[styles.trialInfoText, { color: colors.text.tertiary }]}>
                  Then {tierData.priceLabel}. Cancel anytime.
                </Text>
              )}
            </>
          );
        })()}

        {isCurrentTier && tierData.id !== 'free' && (
          <View style={[styles.managePlanRow, { borderTopColor: colors.border.light }]}>
            <TouchableOpacity
              onPress={() => Alert.alert('Manage Subscription', 'You can manage your subscription in your device settings.')}
            >
              <Text style={[styles.managePlanText, { color: colors.primary.main }]}>
                Manage Subscription
              </Text>
            </TouchableOpacity>
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
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Subscription
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trial Period Banner */}
        {isTrialPeriod && (
          <Card
            variant="filled"
            style={[styles.trialBanner, { backgroundColor: colors.warning.light }]}
          >
            <View style={styles.trialBannerContent}>
              <Text style={styles.trialIcon}>🎁</Text>
              <View style={styles.trialTextContainer}>
                <Text style={[styles.trialTitle, { color: colors.warning.dark }]}>
                  Free Trial Active
                </Text>
                <Text style={[styles.trialSubtitle, { color: colors.warning.dark }]}>
                  {getTrialDaysRemaining() > 0
                    ? `${getTrialDaysRemaining()} day${getTrialDaysRemaining() !== 1 ? 's' : ''} remaining`
                    : 'Trial ends today'}
                </Text>
              </View>
            </View>
            <Text style={[styles.trialNote, { color: colors.warning.dark }]}>
              You have full access to {tierConfig?.name} features during your trial.
            </Text>
          </Card>
        )}

        {/* Current Usage */}
        {usage?.recommendations && (
          <Card variant="filled" style={styles.usageCard}>
            <Text style={[styles.usageTitle, { color: colors.text.primary }]}>
              Today's Usage
            </Text>
            <View style={styles.usageRow}>
              <Text style={[styles.usageLabel, { color: colors.text.secondary }]}>
                Recommendations
              </Text>
              <Text style={[styles.usageValue, { color: colors.text.primary }]}>
                {usage.recommendations.remaining === 'unlimited'
                  ? 'Unlimited'
                  : `${usage.recommendations.used} / ${usage.recommendations.limit}`}
              </Text>
            </View>
          </Card>
        )}

        {/* Tier Cards */}
        <View style={styles.tiersContainer}>
          {Object.values(allTiers).map((tierData) =>
            renderTierCard(tierData, tierData.id === tier)
          )}
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

        {/* Legal */}
        <Text style={[styles.legalText, { color: colors.text.tertiary }]}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
          Your account will be charged for renewal within 24 hours prior to the end of the current period.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

// Feature row component
const FeatureRow = ({ icon, label, colors }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={[styles.featureLabel, { color: colors.text.secondary }]}>
      {label}
    </Text>
    <Text style={[styles.checkmark, { color: colors.success.main }]}>✓</Text>
  </View>
);

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
  trialBanner: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trialIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  trialTextContainer: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  trialSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  trialNote: {
    fontSize: 12,
    opacity: 0.8,
  },
  usageCard: {
    padding: 16,
    marginBottom: 20,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tiersContainer: {
    gap: 16,
  },
  tierCard: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
    width: 120,
    height: 120,
  },
  popularBadge: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 150,
    paddingVertical: 6,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tierHeader: {
    marginBottom: 20,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  tierDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscribeButton: {
    marginTop: 8,
  },
  trialInfoText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  managePlanRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  managePlanText: {
    fontSize: 14,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});

export default SubscriptionScreen;
