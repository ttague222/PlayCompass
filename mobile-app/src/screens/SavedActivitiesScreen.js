/**
 * PlayCompass Saved Activities Screen
 *
 * Unified screen combining History, Favorites, and Scheduled activities
 * Uses tabs for easy navigation between different saved activity types
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { useFavorites } from '../context/FavoritesContext';
import { useScheduler } from '../context/SchedulerContext';
import { Card, Badge, Button, EmptyState, ScreenWrapper, IconButton, ScheduleActivityModal } from '../components';
import { CATEGORIES, DURATIONS } from '../data/activitySchema';
import { Analytics } from '../services';
import { getActivityById } from '../services/activitiesService';

const TABS = [
  { key: 'liked', label: 'Liked', emoji: '\u2764\ufe0f' },
  { key: 'favorites', label: 'Favorites', emoji: '\u2b50' },
  { key: 'scheduled', label: 'Scheduled', emoji: '\ud83d\udcc5' },
];

const SavedActivitiesScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { history, stats, loadHistory, clearHistory } = useHistory();
  const { favorites, hasFavorites, toggleFavorite, getActivityRating, clearAllFavorites } = useFavorites();
  const { schedules, refreshSchedules, cancelSchedule, completeSchedule } = useScheduler();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('liked');
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activityToSchedule, setActivityToSchedule] = useState(null);

  // Track screen view
  useEffect(() => {
    Analytics.viewScreen('SavedActivities');
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
      refreshSchedules();
    }, [loadHistory, refreshSchedules])
  );

  // Get liked activities from history (only those swiped right)
  const likedActivities = useMemo(() => {
    return history.filter((h) => h.liked);
  }, [history]);

  // Get upcoming schedules (not completed)
  const upcomingSchedules = useMemo(() => {
    return schedules.filter((s) => !s.completed);
  }, [schedules]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(), refreshSchedules()]);
    setRefreshing(false);
  };

  const handleActivityPress = (activity, isHistoryEntry = false) => {
    const activityId = isHistoryEntry ? activity.activity_id : activity.id;
    Analytics.viewActivityDetail(activityId);

    const fullActivity = getActivityById(activityId);
    navigation.navigate('ActivityDetail', {
      activity: fullActivity || (isHistoryEntry ? {
        id: activity.activity_id,
        title: activity.activity_title,
        emoji: activity.activity_emoji,
        category: activity.activity_category,
      } : activity),
    });
  };

  const handleSchedulePress = (activity, isHistoryEntry = false) => {
    const fullActivity = isHistoryEntry ? getActivityById(activity.activity_id) || {
      id: activity.activity_id,
      title: activity.activity_title,
      emoji: activity.activity_emoji,
      category: activity.activity_category,
    } : activity;

    setActivityToSchedule(fullActivity);
    setShowScheduleModal(true);
  };

  const handleRemoveFavorite = async (activity) => {
    await toggleFavorite(activity);
  };

  const handleCancelSchedule = (scheduleId) => {
    Alert.alert(
      'Cancel Activity',
      'Remove this scheduled activity?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => cancelSchedule(scheduleId),
        },
      ]
    );
  };

  const handleCompleteSchedule = async (scheduleId) => {
    await completeSchedule(scheduleId);
  };

  const handleClearAll = () => {
    if (activeTab === 'liked') {
      Alert.alert(
        'Clear Liked Activities',
        'This will clear your swipe history. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: clearHistory },
        ]
      );
    } else if (activeTab === 'favorites') {
      Alert.alert(
        'Clear All Favorites',
        'Remove all favorites? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: clearAllFavorites },
        ]
      );
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 0) {
      // Future date (for scheduled)
      const futureDays = Math.abs(diffDays);
      if (futureDays === 0) return 'Today';
      if (futureDays === 1) return 'Tomorrow';
      if (futureDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatScheduleTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderStars = (activityId) => {
    const rating = getActivityRating(activityId);
    if (!rating) return null;

    return (
      <View style={styles.ratingBadge}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.starIcon,
              { opacity: star <= rating.stars ? 1 : 0.3 },
            ]}
          >
            {star <= rating.stars ? '\u2605' : '\u2606'}
          </Text>
        ))}
      </View>
    );
  };

  // Render liked activity item (from history)
  const renderLikedItem = (item, index) => {
    const category = CATEGORIES[item.activity_category?.toUpperCase()];

    return (
      <TouchableOpacity
        key={`liked-${item.activity_id}-${index}`}
        onPress={() => handleActivityPress(item, true)}
        activeOpacity={0.7}
      >
        <View style={[styles.activityItem, { backgroundColor: colors.surface.primary }]}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemEmoji}>{item.activity_emoji}</Text>
          </View>
          <View style={styles.itemMiddle}>
            <Text style={[styles.itemTitle, { color: colors.text.primary }]} numberOfLines={1}>
              {item.activity_title}
            </Text>
            <View style={styles.itemMeta}>
              {category && (
                <Badge
                  variant="secondary"
                  size="sm"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Text style={{ color: category.color, fontSize: 10 }}>{category.label}</Text>
                </Badge>
              )}
              <Text style={[styles.itemDate, { color: colors.text.tertiary }]}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.scheduleBtn, { backgroundColor: colors.primary.light }]}
            onPress={() => handleSchedulePress(item, true)}
          >
            <Text style={[styles.scheduleBtnText, { color: colors.primary.dark }]}>
              {'\ud83d\udcc5'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render favorite item
  const renderFavoriteItem = (item, index) => {
    const category = CATEGORIES[item.category?.toUpperCase()];
    const durationInfo = DURATIONS[item.duration?.toUpperCase()];
    const rating = getActivityRating(item.id);

    return (
      <TouchableOpacity
        key={`fav-${item.id}-${index}`}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        <Card variant="elevated" style={styles.favoriteCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.favoriteEmoji}>{item.emoji}</Text>
            <TouchableOpacity
              onPress={() => handleRemoveFavorite(item)}
              style={styles.heartButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.heartIcon}>{'\u2665'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.favoriteTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={[styles.favoriteDescription, { color: colors.text.secondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardMeta}>
            {category && (
              <Badge
                variant="secondary"
                size="sm"
                style={{ backgroundColor: category.color + '20' }}
              >
                <Text style={{ color: category.color, fontSize: 11 }}>
                  {category.emoji} {category.label}
                </Text>
              </Badge>
            )}
            {durationInfo && (
              <View style={[styles.durationBadge, { backgroundColor: colors.surface.secondary }]}>
                <Text style={[styles.durationText, { color: colors.text.secondary }]}>
                  {durationInfo.emoji} {durationInfo.label}
                </Text>
              </View>
            )}
          </View>

          {rating && (
            <View style={styles.ratingRow}>
              {renderStars(item.id)}
            </View>
          )}

          {/* Action row */}
          <View style={styles.favoriteActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary.main }]}
              onPress={() => handleSchedulePress(item)}
            >
              <Text style={styles.actionBtnText}>{'\ud83d\udcc5'} Schedule</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render scheduled item
  const renderScheduledItem = (schedule, index) => {
    const activity = schedule.activity;
    const category = CATEGORIES[activity?.category?.toUpperCase()];
    const scheduledDate = new Date(schedule.scheduledDate);
    const isPast = scheduledDate < new Date();

    return (
      <View
        key={`sched-${schedule.id}-${index}`}
        style={[
          styles.scheduleCard,
          { backgroundColor: colors.surface.primary },
          isPast && { opacity: 0.7 },
        ]}
      >
        <View style={styles.scheduleHeader}>
          <View style={[styles.dateBox, { backgroundColor: colors.primary.light }]}>
            <Text style={[styles.dateDay, { color: colors.primary.dark }]}>
              {scheduledDate.getDate()}
            </Text>
            <Text style={[styles.dateMonth, { color: colors.primary.main }]}>
              {scheduledDate.toLocaleDateString('en-US', { month: 'short' })}
            </Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={[styles.scheduleTime, { color: colors.text.secondary }]}>
              {formatScheduleTime(schedule.scheduledDate)}
            </Text>
            <TouchableOpacity onPress={() => handleActivityPress(activity)}>
              <Text style={[styles.scheduleTitle, { color: colors.text.primary }]} numberOfLines={1}>
                {activity?.emoji} {activity?.title}
              </Text>
            </TouchableOpacity>
            {category && (
              <Badge
                variant="secondary"
                size="sm"
                style={{ backgroundColor: category.color + '20', marginTop: 4 }}
              >
                <Text style={{ color: category.color, fontSize: 10 }}>{category.label}</Text>
              </Badge>
            )}
          </View>
        </View>

        <View style={styles.scheduleActions}>
          {!isPast && (
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: colors.success.light }]}
              onPress={() => handleCompleteSchedule(schedule.id)}
            >
              <Text style={[styles.completeBtnText, { color: colors.success.dark }]}>
                {'\u2713'} Done
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.surface.secondary }]}
            onPress={() => handleCancelSchedule(schedule.id)}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text.secondary }]}>
              {'\u2715'} Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'liked':
        if (likedActivities.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <EmptyState
                emoji={'\u2764\ufe0f'}
                title="No Liked Activities"
                description="Swipe right on activities you like to save them here."
              />
              <Button
                onPress={() => navigation.navigate('TimeSelect')}
                variant="primary"
                style={styles.emptyButton}
              >
                Find Activities
              </Button>
            </View>
          );
        }
        return (
          <View style={styles.listContainer}>
            {/* Stats summary */}
            {stats && stats.total > 0 && (
              <View style={styles.statsRow}>
                <View style={[styles.statPill, { backgroundColor: colors.success.light }]}>
                  <Text style={[styles.statText, { color: colors.success.dark }]}>
                    {'\u2764\ufe0f'} {stats.liked} liked
                  </Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.surface.secondary }]}>
                  <Text style={[styles.statText, { color: colors.text.secondary }]}>
                    {stats.likeRate}% like rate
                  </Text>
                </View>
              </View>
            )}
            {likedActivities.map((item, index) => renderLikedItem(item, index))}
          </View>
        );

      case 'favorites':
        if (!hasFavorites) {
          return (
            <View style={styles.emptyContainer}>
              <EmptyState
                emoji={'\u2b50'}
                title="No Favorites Yet"
                description="Tap the star on activities you love to save them here."
              />
              <Button
                onPress={() => navigation.navigate('TimeSelect')}
                variant="primary"
                style={styles.emptyButton}
              >
                Find Activities
              </Button>
            </View>
          );
        }
        return (
          <View style={styles.favoritesGrid}>
            <View style={[styles.statsBanner, { backgroundColor: colors.primary.light }]}>
              <Text style={styles.statsEmoji}>{'\u2b50'}</Text>
              <Text style={[styles.statsText, { color: colors.primary.dark }]}>
                {favorites.length} saved {favorites.length === 1 ? 'activity' : 'activities'}
              </Text>
            </View>
            {favorites.map((item, index) => renderFavoriteItem(item, index))}
          </View>
        );

      case 'scheduled':
        if (upcomingSchedules.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <EmptyState
                emoji={'\ud83d\udcc5'}
                title="Nothing Scheduled"
                description="Schedule activities to get reminders and stay on track."
              />
              <Button
                onPress={() => navigation.navigate('Schedule')}
                variant="primary"
                style={styles.emptyButton}
              >
                View Calendar
              </Button>
            </View>
          );
        }
        return (
          <View style={styles.listContainer}>
            <View style={[styles.statsBanner, { backgroundColor: colors.secondary.light }]}>
              <Text style={styles.statsEmoji}>{'\ud83d\udcc5'}</Text>
              <Text style={[styles.statsText, { color: colors.secondary.dark }]}>
                {upcomingSchedules.length} upcoming {upcomingSchedules.length === 1 ? 'activity' : 'activities'}
              </Text>
            </View>
            {upcomingSchedules.map((schedule, index) => renderScheduledItem(schedule, index))}
          </View>
        );

      default:
        return null;
    }
  };

  const showClearButton = (activeTab === 'liked' && likedActivities.length > 0) ||
                          (activeTab === 'favorites' && hasFavorites);

  return (
    <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={'\u2190'}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Saved</Text>
        {showClearButton ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButtonContainer}>
            <Text style={[styles.clearButton, { color: colors.error.main }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border.light }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.key === 'liked' ? likedActivities.length :
                       tab.key === 'favorites' ? favorites.length :
                       upcomingSchedules.length;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && [styles.activeTab, { borderBottomColor: colors.primary.main }],
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary.main : colors.text.secondary },
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.tabBadge,
                  { backgroundColor: isActive ? colors.primary.main : colors.surface.secondary },
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    { color: isActive ? '#fff' : colors.text.secondary },
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Schedule Modal */}
      <ScheduleActivityModal
        visible={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setActivityToSchedule(null);
        }}
        activity={activityToSchedule}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  clearButtonContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyButton: {
    marginTop: 24,
  },
  listContainer: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  itemLeft: {
    marginRight: 12,
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemMiddle: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDate: {
    fontSize: 12,
  },
  scheduleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scheduleBtnText: {
    fontSize: 18,
  },
  // Favorites styles
  favoritesGrid: {
    gap: 16,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  statsEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  favoriteEmoji: {
    fontSize: 48,
  },
  heartButton: {
    padding: 4,
  },
  heartIcon: {
    fontSize: 24,
    color: '#e91e63',
  },
  favoriteTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  favoriteDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
  },
  starIcon: {
    fontSize: 14,
    color: '#f59e0b',
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Scheduled styles
  scheduleCard: {
    padding: 16,
    borderRadius: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  completeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SavedActivitiesScreen;
