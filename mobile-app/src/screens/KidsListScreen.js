/**
 * PlayCompass Kids List Screen
 *
 * Shows all child profiles with ability to add/edit/remove
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useKids } from '../context/KidsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Avatar, Badge, EmptyState, IconButton, ScreenWrapper } from '../components';

const KidsListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { kids, canAddKid, maxKids, getAgeGroup, INTERESTS } = useKids();
  const { tier, isPremium, allTiers } = useSubscription();
  const insets = useSafeAreaInsets();

  // Get upgrade info for users at their limit
  const getUpgradeInfo = () => {
    if (tier === 'free') {
      return {
        targetTier: allTiers.plus,
        message: `Upgrade to ${allTiers.plus.name} for up to ${allTiers.plus.features.maxKids} children`,
      };
    } else if (tier === 'plus') {
      return {
        targetTier: allTiers.family,
        message: `Upgrade to ${allTiers.family.name} for up to ${allTiers.family.features.maxKids} children`,
      };
    }
    return null;
  };

  const handleAddKid = () => {
    navigation.navigate('AddKid');
  };

  const handleEditKid = (kidId) => {
    navigation.navigate('AddKid', { kidId });
  };

  const getInterestLabels = (interestIds) => {
    return interestIds
      .map((id) => INTERESTS.find((i) => i.id === id))
      .filter(Boolean)
      .slice(0, 3); // Show max 3 interests
  };

  const renderKidCard = (kid) => {
    const ageGroup = getAgeGroup(kid.age);
    const interestItems = getInterestLabels(kid.interests || []);

    return (
      <Card
        key={kid.id}
        variant="elevated"
        onPress={() => handleEditKid(kid.id)}
        style={styles.kidCard}
      >
        <View style={styles.kidHeader}>
          <Avatar emoji={kid.avatar} size="lg" color={colors.primary.main} />
          <View style={styles.kidInfo}>
            <Text style={[styles.kidName, { color: colors.text.primary }]}>
              {kid.name}
            </Text>
            <View style={styles.kidMeta}>
              <Text style={[styles.kidAge, { color: colors.text.secondary }]}>
                {kid.age} years old
              </Text>
              {ageGroup && (
                <Badge variant="default" size="sm" style={styles.ageBadge}>
                  {ageGroup.emoji} {ageGroup.label}
                </Badge>
              )}
            </View>
          </View>
          <Text style={{ color: colors.text.tertiary, fontSize: 20 }}>›</Text>
        </View>

        {interestItems.length > 0 && (
          <View style={styles.interestsRow}>
            {interestItems.map((interest) => (
              <View
                key={interest.id}
                style={[styles.interestTag, { backgroundColor: colors.surface.secondary }]}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text style={[styles.interestLabel, { color: colors.text.secondary }]}>
                  {interest.label}
                </Text>
              </View>
            ))}
            {kid.interests?.length > 3 && (
              <Text style={[styles.moreInterests, { color: colors.text.tertiary }]}>
                +{kid.interests.length - 3} more
              </Text>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="←"
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          My Kids
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
          {kids.length === 0 ? (
            <EmptyState
              emoji="👶"
              title="No kids added yet"
              description="Add your children to get personalized activity recommendations tailored to their ages and interests."
              actionLabel="Add Your First Child"
              onAction={handleAddKid}
            />
          ) : (
            <>
              {/* Kids List */}
              <View style={styles.kidsList}>
                {kids.map(renderKidCard)}
              </View>

              {/* Add More Button */}
              {canAddKid && (
                <TouchableOpacity
                  style={[styles.addMoreButton, { borderColor: colors.border.medium }]}
                  onPress={handleAddKid}
                >
                  <Text style={[styles.addMoreIcon, { color: colors.primary.main }]}>
                    +
                  </Text>
                  <Text style={[styles.addMoreText, { color: colors.primary.main }]}>
                    Add Another Child
                  </Text>
                </TouchableOpacity>
              )}

              {!canAddKid && (
                <View style={styles.limitContainer}>
                  <Text style={[styles.limitText, { color: colors.text.tertiary }]}>
                    You've reached your limit of {maxKids} {maxKids === 1 ? 'child' : 'children'}
                  </Text>
                  {getUpgradeInfo() && (
                    <TouchableOpacity
                      style={[styles.upgradeButton, { backgroundColor: colors.primary.main }]}
                      onPress={() => navigation.navigate('Subscription')}
                    >
                      <Text style={styles.upgradeButtonText}>
                        {getUpgradeInfo().message}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}

          {/* Info Card */}
          <Card variant="filled" style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
              Why add children?
            </Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>🎯</Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Age-appropriate activity suggestions
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>💡</Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Personalized based on interests
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Activities that work for multiple kids
              </Text>
            </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
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
    paddingBottom: 40,
  },
  kidsList: {
    gap: 12,
    marginBottom: 20,
  },
  kidCard: {
    padding: 16,
  },
  kidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kidInfo: {
    flex: 1,
    marginLeft: 16,
  },
  kidName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  kidMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  kidAge: {
    fontSize: 14,
  },
  ageBadge: {
    marginLeft: 0,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  interestEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  interestLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 12,
    fontWeight: '500',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginBottom: 16,
  },
  addMoreIcon: {
    fontSize: 24,
    fontWeight: '300',
    marginRight: 8,
  },
  addMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  limitContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  limitText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    padding: 20,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});

export default KidsListScreen;
