/**
 * PlayCompass Home Screen
 *
 * Home Hub pattern - single main action, calm and focused
 * Secondary items (Kids, Profile, Settings) in top bar overflow menu
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
// Auth context available if needed in future
// import { useAuth } from '../context/AuthContext';
import { useKids } from '../context/KidsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button, Paywall, ScreenWrapper, TopBar, FABMenu } from '../components';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { kids, hasKids, getAgeRangeString } = useKids();
  const { usage, checkCanGetRecommendations, isPremium, isInTrial, daysRemaining, trialExpired, loading: subscriptionLoading } = useSubscription();

  const [showPaywall, setShowPaywall] = useState(false);
  const [recommendationsAllowed, setRecommendationsAllowed] = useState(true);

  // Check recommendation usage on mount
  useEffect(() => {
    const checkUsage = async () => {
      const result = await checkCanGetRecommendations();
      setRecommendationsAllowed(result.allowed);
    };
    checkUsage();
  }, [checkCanGetRecommendations]);

  const handleGetRecommendation = async () => {
    // If no kids, prompt to add first
    if (!hasKids) {
      navigation.navigate('KidsList');
      return;
    }

    // Check if user can get more recommendations
    const result = await checkCanGetRecommendations();
    if (!result.allowed) {
      setShowPaywall(true);
      return;
    }
    navigation.navigate('TimeSelect');
  };

  const handleSetupKids = () => {
    navigation.navigate('KidsList');
  };

  return (
    <ScreenWrapper edges={['left', 'right', 'bottom']}>
      {/* Top Bar with overflow menu */}
      <TopBar />

      {/* Welcome Bonus Banner - only show after subscription loaded */}
      {!subscriptionLoading && isInTrial && (
        <TouchableOpacity
          style={[styles.trialBanner, { backgroundColor: colors.secondary.light }]}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.8}
        >
          <View style={styles.trialTextContainer}>
            <Text style={[styles.trialTitle, { color: colors.text.primary }]}>
              Welcome Bonus Active
            </Text>
            <Text style={[styles.trialSubtext, { color: colors.text.secondary }]}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} of bonus features remaining
            </Text>
          </View>
          <Text style={[styles.trialArrow, { color: colors.secondary.dark }]}>→</Text>
        </TouchableOpacity>
      )}

      {/* Bonus Ended Banner - only show after subscription loaded */}
      {!subscriptionLoading && trialExpired && !isPremium && (
        <TouchableOpacity
          style={[styles.trialBanner, { backgroundColor: colors.warning.light }]}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.8}
        >
          <View style={styles.trialTextContainer}>
            <Text style={[styles.trialTitle, { color: colors.text.primary }]}>
              Welcome Bonus Ended
            </Text>
            <Text style={[styles.trialSubtext, { color: colors.text.secondary }]}>
              Upgrade for premium features • Tap to view plans
            </Text>
          </View>
          <Text style={[styles.trialArrow, { color: colors.warning.dark }]}>→</Text>
        </TouchableOpacity>
      )}

      {/* Main Content - Centered CTA */}
      <View style={styles.mainContent}>
        {/* Big Visual - Compass icon */}
        <View style={[styles.heroContainer, { backgroundColor: colors.primary.main + '15' }]}>
          <Text style={styles.heroEmoji}>🧭</Text>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: colors.text.primary }]}>
          {hasKids ? 'What should we do?' : 'Get Started'}
        </Text>

        {/* Subtext - personalized for kids */}
        {hasKids ? (
          <TouchableOpacity onPress={handleSetupKids} activeOpacity={0.7}>
            <Text style={[styles.subtext, { color: colors.text.secondary }]}>
              Activity ideas for {kids.map(k => k.name).join(' & ')}
            </Text>
            <Text style={[styles.agesText, { color: colors.text.tertiary }]}>
              Ages {getAgeRangeString()} • Tap to manage
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.subtext, { color: colors.text.secondary }]}>
            Add your kids to get personalized activity recommendations
          </Text>
        )}

        {/* Main CTA Button */}
        <View style={styles.ctaContainer}>
          <Button
            onPress={handleGetRecommendation}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!recommendationsAllowed && !isPremium && hasKids}
          >
            {!hasKids
              ? 'Add Your Kids'
              : (!recommendationsAllowed && !isPremium)
                ? 'Get More Ideas'
                : 'Find an Activity'}
          </Button>

          {/* Usage indicator */}
          {hasKids && !isPremium && usage?.recommendations && (
            <Text style={[styles.usageText, { color: colors.text.tertiary }]}>
              {usage.recommendations.remaining === 'unlimited'
                ? 'Unlimited recommendations'
                : `${usage.recommendations.remaining} of ${usage.recommendations.limit} left today`}
            </Text>
          )}

          {/* Upgrade link when limit reached */}
          {hasKids && !recommendationsAllowed && !isPremium && (
            <TouchableOpacity
              onPress={() => setShowPaywall(true)}
              style={styles.upgradeLink}
            >
              <Text style={[styles.upgradeText, { color: colors.primary.main }]}>
                Upgrade for unlimited →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>


      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        blockedFeature="dailyRecommendations"
      />

      {/* FAB Menu for navigation */}
      <FABMenu onFindActivity={handleGetRecommendation} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100, // Extra space for FAB button
    marginTop: -20, // Slight upward shift to balance with banner
  },
  heroContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 56,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  agesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  ctaContainer: {
    width: '100%',
    marginTop: 32,
    alignItems: 'center',
  },
  usageText: {
    fontSize: 13,
    marginTop: 12,
  },
  upgradeLink: {
    marginTop: 8,
    padding: 8,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 23,
    borderRadius: 12,
  },
  trialTextContainer: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  trialSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  trialArrow: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
