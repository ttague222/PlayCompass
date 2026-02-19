/**
 * PlayCompass Favorites Screen
 *
 * Displays saved favorite activities
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { Card, Badge, Button, EmptyState, ScreenWrapper, IconButton } from '../components';
import { CATEGORIES, DURATIONS } from '../data/activitySchema';
import { Analytics } from '../services';
import { getActivityById } from '../services/activitiesService';

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { favorites, hasFavorites, toggleFavorite, getActivityRating, clearAllFavorites } = useFavorites();
  const insets = useSafeAreaInsets();

  // Track screen view
  useEffect(() => {
    Analytics.viewScreen('Favorites');
  }, []);

  const handleActivityPress = (activity) => {
    Analytics.viewActivityDetail(activity.id);
    // Try to get full activity data from catalog, fall back to stored favorite data
    const fullActivity = getActivityById(activity.id);
    navigation.navigate('ActivityDetail', { activity: fullActivity || activity });
  };

  const handleRemoveFavorite = async (activity) => {
    await toggleFavorite(activity);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all favorites? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllFavorites,
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
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

  const renderFavoriteItem = (item, index) => {
    const category = CATEGORIES[item.category?.toUpperCase()];
    const durationInfo = DURATIONS[item.duration?.toUpperCase()];
    const rating = getActivityRating(item.id);

    return (
      <TouchableOpacity
        key={`${item.id}-${index}`}
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
              {rating.feedback && (
                <Text style={[styles.feedbackPreview, { color: colors.text.tertiary }]} numberOfLines={1}>
                  "{rating.feedback}"
                </Text>
              )}
            </View>
          )}

          <Text style={[styles.addedDate, { color: colors.text.tertiary }]}>
            Added {formatDate(item.addedAt)}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={'\u2190'}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Favorites
        </Text>
        {hasFavorites ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButtonContainer}>
            <Text style={[styles.clearButton, { color: colors.error.main }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {!hasFavorites ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji={'\u2665'}
            title="No Favorites Yet"
            description="Tap the heart icon on activities you love to save them here for quick access."
          />
          <Button
            onPress={() => navigation.navigate('KidsSelectStep')}
            variant="primary"
            style={styles.emptyButton}
          >
            Find Activities
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Banner */}
          <View style={[styles.statsBanner, { backgroundColor: colors.primary.light }]}>
            <Text style={styles.statsEmoji}>{'\u2665'}</Text>
            <Text style={[styles.statsText, { color: colors.primary.dark }]}>
              {favorites.length} saved {favorites.length === 1 ? 'activity' : 'activities'}
            </Text>
          </View>

          {/* Favorites Grid */}
          <View style={styles.favoritesGrid}>
            {favorites.map((item, index) => renderFavoriteItem(item, index))}
          </View>
        </ScrollView>
      )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
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
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsEmoji: {
    fontSize: 20,
    marginRight: 10,
    color: '#e91e63',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesGrid: {
    gap: 16,
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
  feedbackPreview: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  addedDate: {
    fontSize: 11,
  },
});

export default FavoritesScreen;
