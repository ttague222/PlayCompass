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

// Fun emojis that rotate based on time of day
const getTimeBasedEmoji = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return '🌅'; // Early morning
  if (hour >= 9 && hour < 12) return '🎨'; // Morning - creative time
  if (hour >= 12 && hour < 14) return '🏃'; // Midday - active time
  if (hour >= 14 && hour < 17) return '🎮'; // Afternoon - game time
  if (hour >= 17 && hour < 19) return '🌳'; // Evening - outdoor time
  if (hour >= 19 && hour < 21) return '📚'; // Night - calm/educational
  return '😌'; // Late night - wind down
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { kids, hasKids, getAgeRangeString } = useKids();
  const { usage, checkCanGetRecommendations, hasPremiumLifetime, loading: subscriptionLoading } = useSubscription();

  const [showPaywall, setShowPaywall] = useState(false);
  const [recommendationsAllowed, setRecommendationsAllowed] = useState(true);
  const [heroEmoji, setHeroEmoji] = useState(getTimeBasedEmoji());

  // Check recommendation usage on mount and update emoji
  // NOTE: Intentionally using [] deps - checkCanGetRecommendations calls setUsage()
  // which triggers SubscriptionContext re-renders. Running this on every function
  // reference change caused cascading state updates that crashed the app.
  useEffect(() => {
    const checkUsage = async () => {
      const result = await checkCanGetRecommendations();
      setRecommendationsAllowed(result.allowed);
    };
    checkUsage();

    // Update emoji based on time of day
    setHeroEmoji(getTimeBasedEmoji());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    navigation.navigate('KidsSelectStep');
  };

  const handleSetupKids = () => {
    navigation.navigate('KidsList');
  };

  return (
    <ScreenWrapper edges={['left', 'right', 'bottom']}>
      {/* Top Bar with overflow menu */}
      <TopBar />

      {/* Main Content - Centered CTA */}
      <View style={styles.mainContent}>
        {/* Big Visual - Rotates based on time of day */}
        <View style={[styles.heroContainer, { backgroundColor: colors.primary.main + '15' }]}>
          <Text style={styles.heroEmoji}>{hasKids ? heroEmoji : '👨‍👩‍👧‍👦'}</Text>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: colors.text.primary }]}>
          {hasKids ? 'What should we do?' : 'Get Started'}
        </Text>

        {/* Subtext - personalized for kids */}
        {hasKids ? (
          <TouchableOpacity onPress={handleSetupKids} activeOpacity={0.7}>
            <Text style={[styles.subtext, { color: colors.text.secondary }]}>
              Activity ideas for {(kids || []).map(k => k.name).join(' & ')}
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
            disabled={!recommendationsAllowed && !hasPremiumLifetime && hasKids}
          >
            {!hasKids
              ? 'Add Your Kids'
              : (!recommendationsAllowed && !hasPremiumLifetime)
                ? 'Get More Ideas'
                : 'Find an Activity'}
          </Button>

          {/* Usage indicator */}
          {hasKids && !hasPremiumLifetime && usage?.recommendations && (
            <Text style={[styles.usageText, { color: colors.text.tertiary }]}>
              {usage.recommendations.remaining === 'unlimited'
                ? 'Unlimited recommendations'
                : `${usage.recommendations.remaining} of ${usage.recommendations.limit} left today`}
            </Text>
          )}

          {/* Upgrade link when limit reached */}
          {hasKids && !recommendationsAllowed && !hasPremiumLifetime && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Store')}
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
});

export default HomeScreen;
