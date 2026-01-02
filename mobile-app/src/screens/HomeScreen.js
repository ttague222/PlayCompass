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
import { useAuth } from '../context/AuthContext';
import { useKids } from '../context/KidsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button, Paywall, ScreenWrapper, TopBar } from '../components';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isAnonymous } = useAuth();
  const { kids, hasKids, getAgeRangeString } = useKids();
  const { usage, checkCanGetRecommendations, isPremium } = useSubscription();

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

      {/* Main Content - Centered CTA */}
      <View style={styles.mainContent}>
        {/* Big Visual */}
        <View style={[styles.heroContainer, { backgroundColor: colors.surface.secondary }]}>
          <Text style={styles.heroEmoji}>🎯</Text>
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
            icon="✨"
            disabled={!recommendationsAllowed && !isPremium && hasKids}
          >
            {!hasKids
              ? 'Add Your Kids'
              : (!recommendationsAllowed && !isPremium)
                ? 'Daily Limit Reached'
                : 'Recommend Something'}
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

      {/* Guest mode indicator */}
      {isAnonymous && (
        <View style={[styles.guestBanner, { backgroundColor: colors.surface.secondary }]}>
          <Text style={[styles.guestText, { color: colors.text.tertiary }]}>
            Guest Mode • Sign in to save your data
          </Text>
        </View>
      )}

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        blockedFeature="dailyRecommendations"
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  heroContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
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
    marginTop: 40,
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
  guestBanner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 13,
  },
});

export default HomeScreen;
