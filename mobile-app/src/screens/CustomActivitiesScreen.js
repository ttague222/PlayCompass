/**
 * PlayCompass Custom Activities Screen
 *
 * Allows premium users to view, create, and manage their custom activities
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Badge, Button, EmptyState, ScreenWrapper, IconButton, Paywall } from '../components';
import { CATEGORIES, DURATIONS } from '../data/activitySchema';
import {
  getCustomActivities,
  deleteCustomActivity,
  getActivityTemplates,
  MAX_CUSTOM_ACTIVITIES,
} from '../services/customActivityService';
import CreateActivityModal from '../components/CreateActivityModal';

const CustomActivitiesScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { checkFeature, isPremium } = useSubscription();
  const insets = useSafeAreaInsets();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const templates = getActivityTemplates();
  const hasCustomActivitiesFeature = checkFeature('customActivities');

  // Load activities
  const loadActivities = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const customActivities = await getCustomActivities(user.uid);
      setActivities(customActivities);
    } catch (error) {
      console.error('Error loading custom activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  // Load on mount and focus
  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const handleCreateNew = () => {
    if (!hasCustomActivitiesFeature) {
      setShowPaywall(true);
      return;
    }

    if (activities.length >= MAX_CUSTOM_ACTIVITIES) {
      Alert.alert(
        'Limit Reached',
        `You can create up to ${MAX_CUSTOM_ACTIVITIES} custom activities. Delete some to create more.`
      );
      return;
    }

    setEditingActivity(null);
    setShowCreateModal(true);
  };

  const handleUseTemplate = (template) => {
    if (!hasCustomActivitiesFeature) {
      setShowPaywall(true);
      return;
    }

    setEditingActivity({ ...template, isTemplate: true });
    setShowCreateModal(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowCreateModal(true);
  };

  const handleDeleteActivity = (activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCustomActivity(user.uid, activity.id);
            if (result.success) {
              loadActivities();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const handleActivityPress = (activity) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  const handleModalClose = (created) => {
    setShowCreateModal(false);
    setEditingActivity(null);
    if (created) {
      loadActivities();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const renderActivityCard = (activity) => {
    const category = CATEGORIES[activity.category?.toUpperCase()];
    const durationInfo = DURATIONS[activity.duration?.toUpperCase()];

    return (
      <TouchableOpacity
        key={activity.id}
        onPress={() => handleActivityPress(activity)}
        activeOpacity={0.7}
      >
        <Card variant="elevated" style={styles.activityCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.activityEmoji}>{activity.emoji}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEditActivity(activity)}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteActivity(activity)}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.activityTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {activity.title}
          </Text>

          {activity.description ? (
            <Text style={[styles.activityDescription, { color: colors.text.secondary }]} numberOfLines={2}>
              {activity.description}
            </Text>
          ) : null}

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

          <Text style={[styles.createdDate, { color: colors.text.tertiary }]}>
            Created {formatDate(activity.createdAt)}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderTemplateCard = (template) => {
    return (
      <TouchableOpacity
        key={template.id}
        onPress={() => handleUseTemplate(template)}
        activeOpacity={0.7}
        style={styles.templateCard}
      >
        <View style={[styles.templateInner, { backgroundColor: colors.surface.secondary }]}>
          <Text style={styles.templateEmoji}>{template.emoji}</Text>
          <Text style={[styles.templateTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {template.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const hasActivities = activities.length > 0;

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
          My Activities
        </Text>
        <TouchableOpacity
          onPress={handleCreateNew}
          style={[styles.addButtonContainer, { backgroundColor: colors.primary.main }]}
        >
          <Text style={[styles.addButton, { color: '#FFFFFF' }]}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Premium gate banner */}
      {!hasCustomActivitiesFeature && (
        <TouchableOpacity
          style={[styles.premiumBanner, { backgroundColor: colors.primary.light }]}
          onPress={() => setShowPaywall(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.premiumIcon}>✨</Text>
          <View style={styles.premiumTextContainer}>
            <Text style={[styles.premiumTitle, { color: colors.primary.dark }]}>
              Premium Feature
            </Text>
            <Text style={[styles.premiumSubtext, { color: colors.text.secondary }]}>
              Upgrade to create your own activities
            </Text>
          </View>
          <Text style={[styles.premiumArrow, { color: colors.primary.dark }]}>→</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading your activities...
          </Text>
        </View>
      ) : !hasActivities ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyContent}
          showsVerticalScrollIndicator={false}
        >
          <EmptyState
            emoji="🎨"
            title="No Custom Activities Yet"
            description="Create your own activities tailored to your kids' interests and your family's style."
          />

          <Button
            onPress={handleCreateNew}
            variant="primary"
            style={styles.createButton}
            icon="✨"
          >
            Create Your First Activity
          </Button>

          {/* Templates Section */}
          <View style={styles.templatesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Quick Start Templates
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Start with a template and customize it
            </Text>
            <View style={styles.templatesGrid}>
              {templates.map(renderTemplateCard)}
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Stats Banner */}
          <View style={[styles.statsBanner, { backgroundColor: colors.primary.main }]}>
            <Text style={styles.statsEmoji}>🎨</Text>
            <Text style={[styles.statsText, { color: '#FFFFFF' }]}>
              {activities.length} custom {activities.length === 1 ? 'activity' : 'activities'}
            </Text>
            <Text style={[styles.statsLimit, { color: 'rgba(255,255,255,0.7)' }]}>
              / {MAX_CUSTOM_ACTIVITIES} max
            </Text>
          </View>

          {/* Activities List */}
          <View style={styles.activitiesList}>
            {activities.map(renderActivityCard)}
          </View>

          {/* Templates Section */}
          <View style={styles.templatesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Templates
            </Text>
            <View style={styles.templatesGrid}>
              {templates.map(renderTemplateCard)}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <CreateActivityModal
        visible={showCreateModal}
        onClose={handleModalClose}
        editActivity={editingActivity}
      />

      {/* Paywall */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        blockedFeature="customActivities"
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
  actionRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  addButtonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  premiumIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  premiumSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  premiumArrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  createButton: {
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
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsLimit: {
    fontSize: 12,
    marginLeft: 4,
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityEmoji: {
    fontSize: 48,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  activityDescription: {
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
  createdDate: {
    fontSize: 11,
  },
  templatesSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '30%',
  },
  templateInner: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    height: 95,
  },
  templateEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  templateTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },
});

export default CustomActivitiesScreen;
