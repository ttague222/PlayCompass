/**
 * PlayCompass History Screen
 *
 * Displays activity history with stats and filtering
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { Card, Badge, Button, EmptyState, ScreenWrapper, IconButton } from '../components';
import { CATEGORIES } from '../data/activitySchema';
import { Analytics } from '../services';

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { history, stats, loadHistory, clearHistory, hasHistory } = useHistory();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState('all'); // 'all', 'liked', 'passed'
  const [refreshing, setRefreshing] = useState(false);

  // Track screen view
  useEffect(() => {
    Analytics.viewHistory();
    Analytics.viewScreen('History');
  }, []);

  // Reload history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const filteredHistory = useMemo(() => {
    if (filter === 'liked') return history.filter((h) => h.liked);
    if (filter === 'passed') return history.filter((h) => !h.liked);
    return history;
  }, [history, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleActivityPress = (historyEntry) => {
    Analytics.viewActivityDetail(historyEntry.activity_id);
    // Navigate to activity detail with the activity info from history
    navigation.navigate('ActivityDetail', {
      activity: {
        id: historyEntry.activity_id,
        title: historyEntry.activity_title,
        emoji: historyEntry.activity_emoji,
        category: historyEntry.activity_category,
        // Note: Full activity details won't be available from history
      },
    });
  };

  const handleClearHistory = async () => {
    await clearHistory();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderStats = () => {
    if (!stats || stats.total === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success.main }]}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{stats.liked}</Text>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.85)' }]}>Liked</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.error.main }]}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{stats.passed}</Text>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.85)' }]}>Passed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.primary.main }]}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{stats.likeRate}%</Text>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.85)' }]}>Like Rate</Text>
        </View>
      </View>
    );
  };

  const renderFilters = () => {
    const filters = [
      { key: 'all', label: 'All', icon: '📋' },
      { key: 'liked', label: 'Liked', icon: '❤️' },
      { key: 'passed', label: 'Passed', icon: '👎' },
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isActive ? colors.primary.main : colors.surface.secondary,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={styles.filterIcon}>{f.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#fff' : colors.text.secondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderHistoryItem = (item, index) => {
    const category = CATEGORIES[item.activity_category?.toUpperCase()];

    return (
      <TouchableOpacity
        key={`${item.activity_id}-${index}`}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.historyItem, { backgroundColor: colors.surface.primary }]}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyEmoji}>{item.activity_emoji}</Text>
          </View>
          <View style={styles.historyMiddle}>
            <Text style={[styles.historyTitle, { color: colors.text.primary }]} numberOfLines={1}>
              {item.activity_title}
            </Text>
            <View style={styles.historyMeta}>
              {category && (
                <Badge
                  variant="secondary"
                  size="sm"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Text style={{ color: category.color, fontSize: 10 }}>{category.label}</Text>
                </Badge>
              )}
              <Text style={[styles.historyDate, { color: colors.text.tertiary }]}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
          <View style={styles.historyRight}>
            <Text style={styles.likeIcon}>{item.liked ? '❤️' : '👎'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <IconButton
          icon="←"
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>History</Text>
        {hasHistory ? (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButtonContainer}>
            <Text style={[styles.clearButton, { color: colors.error.main }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {!hasHistory ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji="📋"
            title="No History Yet"
            description="Start swiping on activities to build your history. We'll keep track of what you liked!"
          />
          <Button
            onPress={() => navigation.navigate('Home')}
            variant="secondary"
            style={styles.emptyButton}
          >
            Get Recommendations
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
            {/* Stats */}
            {renderStats()}

            {/* Filters */}
            {renderFilters()}

            {/* History List */}
            <View style={styles.historyList}>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => renderHistoryItem(item, index))
              ) : (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsText, { color: colors.text.secondary }]}>
                    No {filter === 'liked' ? 'liked' : 'passed'} activities yet
                  </Text>
                </View>
              )}
            </View>

            {/* Recent Activity Summary */}
            {stats && stats.recentCount > 0 && (
              <Card variant="outlined" style={styles.summaryCard}>
                <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
                  This Week
                </Text>
                <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
                  You've reviewed {stats.recentCount} activities in the last 7 days
                </Text>
            </Card>
          )}
        </ScrollView>
      )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyButton: {
    marginTop: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyList: {
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyLeft: {
    marginRight: 12,
  },
  historyEmoji: {
    fontSize: 32,
  },
  historyMiddle: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 12,
  },
  historyRight: {
    marginLeft: 12,
  },
  likeIcon: {
    fontSize: 20,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
  },
  summaryCard: {
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
  },
});

export default HistoryScreen;
