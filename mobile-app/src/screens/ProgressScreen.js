/**
 * PlayCompass Progress Screen
 *
 * Displays user achievements, stats, and progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { useSubscription } from '../context/SubscriptionContext';
import { ScreenWrapper, TopBar, Card, Badge, Button } from '../components/ui';

const ProgressScreen = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const {
    achievements,
    unlockedAchievements,
    loading,
    getStats,
    isAchievementUnlocked,
    getAchievementProgress,
    loadProgress,
    loadMonthlyReport,
    monthlyReport,
  } = useProgress();
  const { hasFeature } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const stats = getStats();
  const isPremium = hasFeature('progressTracking');

  // Load monthly report on mount
  useEffect(() => {
    if (isPremium) {
      loadMonthlyReport();
    }
  }, [isPremium, loadMonthlyReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    if (isPremium) {
      await loadMonthlyReport();
    }
    setRefreshing(false);
  };

  // Group achievements by category
  const achievementCategories = [
    { id: 'all', label: 'All', emoji: '🏆' },
    { id: 'milestone', label: 'Milestones', emoji: '🎯' },
    { id: 'streak', label: 'Streaks', emoji: '🔥' },
    { id: 'category', label: 'Categories', emoji: '📚' },
    { id: 'special', label: 'Special', emoji: '✨' },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.type === selectedCategory || a.category === selectedCategory);

  const renderStatCard = (emoji, value, label, color = colors.primary.main) => (
    <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{label}</Text>
    </View>
  );

  const renderAchievement = (achievement) => {
    const isUnlocked = isAchievementUnlocked(achievement.id);
    const progress = getAchievementProgress(achievement);

    const getRarityColor = () => {
      switch (achievement.rarity) {
        case 'legendary': return '#FFD700';
        case 'epic': return '#9333EA';
        case 'rare': return '#3B82F6';
        default: return colors.text.tertiary;
      }
    };

    return (
      <Pressable
        key={achievement.id}
        style={[
          styles.achievementCard,
          {
            backgroundColor: colors.background.secondary,
            opacity: isUnlocked ? 1 : 0.6,
          },
        ]}
      >
        {/* Badge */}
        <View
          style={[
            styles.achievementBadge,
            {
              backgroundColor: isUnlocked ? getRarityColor() + '20' : colors.neutral[200],
              borderColor: isUnlocked ? getRarityColor() : colors.neutral[300],
            },
          ]}
        >
          <Text style={[styles.achievementIcon, { opacity: isUnlocked ? 1 : 0.4 }]}>
            {isUnlocked ? achievement.icon : '🔒'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.achievementInfo}>
          <View style={styles.achievementHeader}>
            <Text
              style={[
                styles.achievementName,
                { color: isUnlocked ? colors.text.primary : colors.text.tertiary },
              ]}
            >
              {achievement.name}
            </Text>
            {isUnlocked && (
              <Badge variant="success" size="sm">Unlocked</Badge>
            )}
          </View>
          <Text
            style={[
              styles.achievementDesc,
              { color: colors.text.secondary },
            ]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.neutral[200] }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: getRarityColor(),
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          )}
        </View>

        {/* Points */}
        {achievement.points && (
          <View style={[styles.pointsBadge, { backgroundColor: getRarityColor() + '20' }]}>
            <Text style={[styles.pointsValue, { color: getRarityColor() }]}>
              {achievement.points}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenWrapper>
      <TopBar
        title="Progress"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          {renderStatCard('🎯', stats.totalActivities, 'Activities', colors.primary.main)}
          {renderStatCard('🔥', stats.currentStreak, 'Day Streak', colors.warning.main)}
          {renderStatCard('🏆', `${stats.achievementsUnlocked}/${stats.totalAchievements}`, 'Achievements', colors.success.main)}
          {renderStatCard('⭐', stats.longestStreak, 'Best Streak', '#9333EA')}
        </View>

        {/* Favorite Category */}
        {stats.favoriteCategory && (
          <Card style={styles.favoriteCategoryCard}>
            <View style={styles.favoriteCategoryContent}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Favorite Category
              </Text>
              <View style={styles.favoriteCategoryBadge}>
                <Text style={styles.favoriteCategoryEmoji}>
                  {getCategoryEmoji(stats.favoriteCategory)}
                </Text>
                <Text style={[styles.favoriteCategoryName, { color: colors.text.primary }]}>
                  {stats.favoriteCategory}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Monthly Report (Premium) */}
        {isPremium && monthlyReport && (
          <Card style={styles.reportCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Monthly Report
            </Text>
            <View style={styles.reportStats}>
              <View style={styles.reportStat}>
                <Text style={[styles.reportValue, { color: colors.primary.main }]}>
                  {monthlyReport.activitiesThisMonth}
                </Text>
                <Text style={[styles.reportLabel, { color: colors.text.secondary }]}>
                  This Month
                </Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={[styles.reportValue, { color: colors.success.main }]}>
                  {monthlyReport.comparedToLastMonth > 0 ? '+' : ''}{monthlyReport.comparedToLastMonth}
                </Text>
                <Text style={[styles.reportLabel, { color: colors.text.secondary }]}>
                  vs Last Month
                </Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={[styles.reportValue, { color: '#9333EA' }]}>
                  {monthlyReport.activeDays}
                </Text>
                <Text style={[styles.reportLabel, { color: colors.text.secondary }]}>
                  Active Days
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Premium Upsell */}
        {!isPremium && (
          <Card style={[styles.premiumCard, { backgroundColor: '#9333EA' + '15' }]}>
            <View style={styles.premiumContent}>
              <Text style={styles.premiumEmoji}>📊</Text>
              <View style={styles.premiumInfo}>
                <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
                  Unlock Detailed Reports
                </Text>
                <Text style={[styles.premiumDesc, { color: colors.text.secondary }]}>
                  Get monthly reports, trends, and personalized insights
                </Text>
              </View>
              <Button
                variant="primary"
                size="sm"
                onPress={() => navigation.navigate('Store')}
              >
                Upgrade
              </Button>
            </View>
          </Card>
        )}

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Achievements
          </Text>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {achievementCategories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat.id
                      ? colors.primary.main
                      : colors.background.secondary,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: selectedCategory === cat.id
                        ? '#ffffff'
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Achievement List */}
          <View style={styles.achievementsList}>
            {filteredAchievements.map(renderAchievement)}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

// Helper function for category emoji
const getCategoryEmoji = (category) => {
  const emojis = {
    'outdoor': '🌳',
    'creative': '🎨',
    'educational': '📚',
    'physical': '⚽',
    'social': '👥',
    'indoor': '🏠',
    'cooking': '👨‍🍳',
    'music': '🎵',
    'science': '🔬',
    'nature': '🌿',
  };
  return emojis[category?.toLowerCase()] || '📌';
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    width: '46%',
    margin: '2%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  favoriteCategoryCard: {
    marginBottom: 16,
  },
  favoriteCategoryContent: {
    alignItems: 'center',
    padding: 8,
  },
  favoriteCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  favoriteCategoryEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  favoriteCategoryName: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportCard: {
    marginBottom: 16,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  reportStat: {
    alignItems: 'center',
  },
  reportValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  reportLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  premiumCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9333EA' + '30',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  premiumInfo: {
    flex: 1,
    marginRight: 12,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  achievementsSection: {
    marginTop: 8,
  },
  categoryFilter: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    width: 36,
    textAlign: 'right',
  },
  pointsBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProgressScreen;
