/**
 * PlayCompass Recommendation Screen
 *
 * Displays recommended activities with swipe interface
 * Uses backend API with fallback to local data
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useKids } from '../context/KidsContext';
import { useHistory } from '../context/HistoryContext';
import { Button, IconButton, Badge, ScreenWrapper } from '../components';
import { getRecommendedActivities } from '../services/activitiesService';
import { getRecommendations as getApiRecommendations } from '../services/apiService';
import { CATEGORIES, DURATIONS } from '../data/activitySchema';
import { Analytics, addBreadcrumb } from '../services';
import { useSubscription } from '../context/SubscriptionContext';
import {
  recordSwipe,
  getRecentlySeenActivityIds,
  getExcludedActivityIds,
  getLearningMessage,
} from '../services/preferenceLearningService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Map activity categories to kid interests for personalization
const CATEGORY_TO_INTEREST = {
  active: ['sports', 'dance'],
  creative: ['arts', 'building'],
  educational: ['reading', 'science'],
  social: ['games', 'theater'],
  calm: ['reading', 'nature'],
  outdoor: ['nature', 'sports'],
  music: ['music', 'dance'],
  games: ['games'],
};

// Simple hash function to get consistent but varied index from activity ID
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Generate a personalized, compelling reason for why this activity fits
const getPersonalizedReason = (activity, kids) => {
  if (!kids || kids.length === 0) return '';

  const kid = kids[0]; // Primary kid for personalization
  const kidName = kid.name;
  const category = activity.category?.toLowerCase();
  const energy = activity.energy?.toLowerCase();
  const location = activity.location?.toLowerCase();

  // Get hash for consistent but varied selection
  const hash = hashString(activity.id || activity.title || 'default');

  // Check if any kid's interests match the activity category
  const relatedInterests = CATEGORY_TO_INTEREST[category] || [];
  const matchingInterest = kid.interests?.find(i => relatedInterests.includes(i));

  // TIER 1: Interest-based personalization (strongest connection)
  if (matchingInterest) {
    const interestTemplates = {
      sports: [
        `${kidName} will love burning energy with this`,
        `Perfect way for ${kidName} to stay active`,
        `This matches ${kidName}'s love for movement`,
        `${kidName} thrives on active play like this`,
        `Just the kind of action ${kidName} enjoys`,
        `A great fit for ${kidName}'s sporty side`,
      ],
      arts: [
        `${kidName}'s creative side will shine here`,
        `A great outlet for ${kidName}'s imagination`,
        `${kidName} loves making things — perfect fit`,
        `This sparks the creativity ${kidName} loves`,
        `Right up ${kidName}'s artistic alley`,
        `${kidName} will enjoy expressing creativity here`,
      ],
      music: [
        `${kidName} will love the rhythm and fun`,
        `Great for ${kidName}'s musical side`,
        `This taps into ${kidName}'s love of music`,
        `${kidName}'s ears will perk up for this`,
        `A melodic match for ${kidName}`,
        `${kidName} loves musical activities like this`,
      ],
      reading: [
        `${kidName} will enjoy the quiet focus`,
        `A calming activity ${kidName} will appreciate`,
        `Perfect for ${kidName}'s thoughtful side`,
        `${kidName} loves this kind of focused fun`,
        `Great for ${kidName}'s reflective moments`,
        `A peaceful activity ${kidName} will enjoy`,
      ],
      science: [
        `${kidName} will love discovering how this works`,
        `Great for ${kidName}'s curious mind`,
        `This will spark ${kidName}'s sense of wonder`,
        `${kidName}'s inner scientist will love this`,
        `Perfect for ${kidName}'s inquisitive nature`,
        `${kidName} loves exploring and learning`,
      ],
      nature: [
        `${kidName} loves being outside — perfect fit`,
        `A great way to feed ${kidName}'s nature curiosity`,
        `${kidName} will enjoy connecting with nature`,
        `Right at home for nature-lover ${kidName}`,
        `${kidName} thrives with outdoor activities`,
        `Perfect for ${kidName}'s adventurous spirit`,
      ],
      building: [
        `${kidName} loves building — great match`,
        `Perfect for ${kidName}'s hands-on creativity`,
        `${kidName} will enjoy creating with this`,
        `${kidName}'s building skills will shine`,
        `A constructive activity ${kidName} will love`,
        `Great for ${kidName}'s maker mindset`,
      ],
      cooking: [
        `${kidName} will love getting hands-on`,
        `A tasty activity for ${kidName}`,
        `Great for ${kidName}'s love of kitchen fun`,
        `${kidName} enjoys cooking adventures`,
        `Perfect for ${kidName}'s culinary curiosity`,
        `${kidName} will have fun making something`,
      ],
      games: [
        `${kidName} will have a blast with this`,
        `This hits the fun factor ${kidName} loves`,
        `Perfect for ${kidName}'s playful energy`,
        `${kidName} loves games like this`,
        `A winning choice for ${kidName}`,
        `Just the kind of fun ${kidName} enjoys`,
      ],
      animals: [
        `${kidName}'s love of animals makes this a hit`,
        `Great for ${kidName}'s caring nature`,
        `${kidName} will connect with this one`,
        `Perfect for animal-lover ${kidName}`,
        `${kidName}'s gentle side will shine`,
        `A heartwarming pick for ${kidName}`,
      ],
      dance: [
        `${kidName} will love moving to this`,
        `Perfect for ${kidName}'s energetic spirit`,
        `This lets ${kidName} express through movement`,
        `${kidName} loves to move and groove`,
        `A rhythmic fit for ${kidName}`,
        `${kidName} will dance through this one`,
      ],
      theater: [
        `${kidName} will love the performance aspect`,
        `Great for ${kidName}'s dramatic flair`,
        `This brings out ${kidName}'s expressive side`,
        `${kidName}'s imagination will run wild`,
        `A stage-worthy pick for ${kidName}`,
        `${kidName} loves to put on a show`,
      ],
    };

    const options = interestTemplates[matchingInterest];
    if (options) {
      return options[hash % options.length];
    }
  }

  // TIER 2: Category-based personalization (covers ALL categories)
  const categoryTemplates = {
    active: [
      `Great for getting ${kidName} moving`,
      `${kidName} will love the energy of this`,
      `A fun way to keep ${kidName} active`,
      `Perfect for when ${kidName} needs to move`,
      `${kidName} will enjoy this active play`,
      `Gets ${kidName} up and moving`,
    ],
    creative: [
      `A creative adventure for ${kidName}`,
      `${kidName}'s imagination can run free`,
      `Let ${kidName} create something special`,
      `A fun way for ${kidName} to express ideas`,
      `${kidName} will enjoy making something`,
      `Creativity time for ${kidName}`,
    ],
    educational: [
      `${kidName} will learn while having fun`,
      `A discovery moment for ${kidName}`,
      `${kidName} will pick up something new`,
      `Fun learning awaits ${kidName}`,
      `${kidName} will enjoy exploring this`,
      `A brain boost for ${kidName}`,
    ],
    social: [
      `Quality time together with ${kidName}`,
      `${kidName} will enjoy the connection`,
      `A bonding moment for ${kidName}`,
      `Great for spending time with ${kidName}`,
      `${kidName} will love doing this together`,
      `Togetherness time with ${kidName}`,
    ],
    calm: [
      `A peaceful moment for ${kidName}`,
      `${kidName} will enjoy the calm vibes`,
      `Relaxing fun for ${kidName}`,
      `A quiet activity ${kidName} will appreciate`,
      `${kidName} can wind down with this`,
      `Gentle fun for ${kidName}`,
    ],
    outdoor: [
      `Fresh air fun for ${kidName}`,
      `${kidName} will enjoy being outside`,
      `An outdoor adventure for ${kidName}`,
      `Get ${kidName} out exploring`,
      `${kidName} will love this outdoor activity`,
      `Outside fun awaits ${kidName}`,
    ],
    music: [
      `${kidName} will enjoy the sounds`,
      `A musical moment for ${kidName}`,
      `${kidName} can make some noise`,
      `Rhythm and fun for ${kidName}`,
      `${kidName} will love this musical activity`,
      `Let ${kidName} explore music`,
    ],
    games: [
      `${kidName} will have fun with this game`,
      `Game time for ${kidName}`,
      `${kidName} loves this kind of play`,
      `A playful pick for ${kidName}`,
      `${kidName} will enjoy the challenge`,
      `Fun and games for ${kidName}`,
    ],
  };

  if (categoryTemplates[category]) {
    const options = categoryTemplates[category];
    return options[hash % options.length];
  }

  // TIER 3: Energy + Location based (if category somehow missing)
  const contextTemplates = [];

  if (energy === 'high') {
    contextTemplates.push(
      `Perfect for burning off ${kidName}'s energy`,
      `${kidName} will love the action`,
      `Great when ${kidName} needs to move`,
      `Active fun for ${kidName}`,
      `${kidName} can let loose with this`
    );
  } else if (energy === 'low') {
    contextTemplates.push(
      `A calm activity for ${kidName}`,
      `Relaxing fun ${kidName} will enjoy`,
      `${kidName} can take it easy with this`,
      `Gentle activity for ${kidName}`,
      `A mellow moment for ${kidName}`
    );
  } else {
    // Medium energy
    contextTemplates.push(
      `Just the right pace for ${kidName}`,
      `${kidName} will enjoy this activity`,
      `A balanced pick for ${kidName}`,
      `${kidName} will have fun with this`,
      `Nice activity for ${kidName}`
    );
  }

  // Add location flavor
  if (location === 'outdoor' && contextTemplates.length > 0) {
    contextTemplates.push(
      `${kidName} will enjoy this outside`,
      `Fresh air fun for ${kidName}`
    );
  } else if (location === 'indoor' && contextTemplates.length > 0) {
    contextTemplates.push(
      `Indoor fun for ${kidName}`,
      `${kidName} can do this right at home`
    );
  }

  if (contextTemplates.length > 0) {
    return contextTemplates[hash % contextTemplates.length];
  }

  // TIER 4: Age-based fallback (should rarely reach here)
  const age = kid.age || 0;
  const ageTemplates = [
    `Just right for ${kidName}`,
    `${kidName} will enjoy this`,
    `A good pick for ${kidName}`,
    `${kidName} is ready for this`,
    `Made for kids like ${kidName}`,
    `${kidName} will have a good time`,
  ];

  return ageTemplates[hash % ageTemplates.length];
};

const RecommendationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const { kids: allKids } = useKids();
  const { saveActivityToHistory } = useHistory();
  const { recordRecommendationUsage } = useSubscription();

  const { duration, location, energy, selectedKids: routeSelectedKids } = route.params || {};

  // Use selected kids from route params, or fall back to all kids
  const kids = routeSelectedKids || allKids;

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acceptedActivities, setAcceptedActivities] = useState([]);
  const [rejectedActivities, setRejectedActivities] = useState([]);
  const [learningMessage, setLearningMessage] = useState(null);

  // Fetch recommendations from API or fall back to local
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      addBreadcrumb('Fetching recommendations', 'recommendation', { duration, location, energy });
      Analytics.startSession(duration, kids.length);

      // Record usage for subscription tracking
      await recordRecommendationUsage();

      // Get activities to exclude based on learning
      const [recentIds, excludedIds] = await Promise.all([
        getRecentlySeenActivityIds(1), // Activities seen in last day
        getExcludedActivityIds(2), // Activities passed 2+ times
      ]);
      const excludedActivityIds = [...new Set([...recentIds, ...excludedIds])];
      addBreadcrumb('Excluding activities from learning', 'recommendation', {
        recentCount: recentIds.length,
        excludedCount: excludedIds.length,
      });

      try {
        // Try backend API first
        const response = await getApiRecommendations({
          kids,
          duration,
          location: location || 'both',
          energy,
          excludedActivityIds,
          count: 10,
        });

        if (response.activities && response.activities.length > 0) {
          // Transform API response to match local format
          const activities = response.activities.map((a) => ({
            ...a,
            ageGroups: a.age_groups,
            adultSupervision: a.adult_supervision,
            popularityScore: a.popularity_score,
            relevanceScore: a.relevance_score,
          }));
          setRecommendations(activities);
          addBreadcrumb('Recommendations loaded from API', 'recommendation', { count: activities.length });
        } else {
          throw new Error('No activities returned');
        }
      } catch (err) {
        console.log('API failed, falling back to local data:', err.message);
        addBreadcrumb('API failed, using local data', 'recommendation', { error: err.message });

        // Fallback to local data
        const durationObj = DURATIONS[duration?.toUpperCase()];
        const availableTime = durationObj?.max || 60;

        const localRecommendations = getRecommendedActivities(kids, {
          count: 10,
          location: location !== 'both' ? location : undefined,
          availableTime,
          energy,
        });

        setRecommendations(localRecommendations);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [kids, duration, location, energy]);

  const position = useState(new Animated.ValueXY())[0];

  const currentActivity = recommendations[currentIndex];
  const isLastCard = currentIndex >= recommendations.length && recommendations.length > 0;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAccept = useCallback(async () => {
    if (!currentActivity) return;

    setAcceptedActivities((prev) => [...prev, currentActivity]);
    Analytics.likeActivity(currentActivity.id, currentActivity.title, currentActivity.category);

    // Save to history immediately (liked = true)
    saveActivityToHistory(currentActivity, true, duration);

    // Record swipe for preference learning
    await recordSwipe(currentActivity, true);

    // Check for learning message update (after every few swipes)
    if (kids && kids.length > 0) {
      const message = await getLearningMessage(kids[0].name);
      if (message) {
        setLearningMessage(message);
      }
    }

    Animated.spring(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
    });
  }, [currentActivity, position, saveActivityToHistory, duration, kids]);

  const handleReject = useCallback(async () => {
    if (!currentActivity) return;

    setRejectedActivities((prev) => [...prev, currentActivity]);
    Analytics.skipActivity(currentActivity.id, currentActivity.title, currentActivity.category);

    // Save to history immediately (liked = false)
    saveActivityToHistory(currentActivity, false, duration);

    // Record swipe for preference learning
    await recordSwipe(currentActivity, false);

    Animated.spring(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
    });
  }, [currentActivity, position, saveActivityToHistory, duration]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            handleAccept();
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            handleReject();
          } else {
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              friction: 4,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [position, handleAccept, handleReject]
  );

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      {
        rotate: position.x.interpolate({
          inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          outputRange: ['-10deg', '0deg', '10deg'],
        }),
      },
    ],
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleViewAccepted = () => {
    navigation.navigate('AcceptedActivities', { activities: acceptedActivities });
  };

  const handleStartOver = () => {
    setCurrentIndex(0);
    setAcceptedActivities([]);
    setRejectedActivities([]);
  };

  const renderActivityCard = () => {
    if (!currentActivity) return null;

    const category = CATEGORIES[currentActivity.category?.toUpperCase()];
    const durationInfo = DURATIONS[currentActivity.duration?.toUpperCase()];

    return (
      <Animated.View
        style={[styles.card, cardStyle, { backgroundColor: colors.surface.primary }]}
        {...panResponder.panHandlers}
      >
        {/* Swipe feedback overlays */}
        <Animated.View style={[styles.likeOverlay, { opacity: likeOpacity, backgroundColor: colors.success.main + '15' }]}>
          <Text style={[styles.overlayEmoji]}>✓</Text>
        </Animated.View>
        <Animated.View style={[styles.nopeOverlay, { opacity: nopeOpacity, backgroundColor: colors.text.tertiary + '15' }]}>
          <Text style={[styles.overlayEmoji]}>✕</Text>
        </Animated.View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Emoji */}
          <Text style={styles.activityEmoji}>{currentActivity.emoji}</Text>

          {/* Title */}
          <Text style={[styles.activityTitle, { color: colors.text.primary }]}>
            {currentActivity.title}
          </Text>

          {/* Category Badge */}
          <Badge
            variant="secondary"
            style={[styles.categoryBadge, { backgroundColor: category?.color + '20' }]}
          >
            <Text style={{ color: category?.color }}>
              {category?.emoji} {category?.label}
            </Text>
          </Badge>

          {/* Description */}
          <Text style={[styles.activityDescription, { color: colors.text.secondary }]}>
            {currentActivity.description}
          </Text>

          {/* Personalized recommendation line */}
          {kids && kids.length > 0 && (
            <Text style={[styles.personalizedText, { color: colors.text.tertiary }]}>
              {getPersonalizedReason(currentActivity, kids)}
            </Text>
          )}

          {/* Quick Info Pills */}
          <View style={styles.pillsRow}>
            <View style={[styles.pill, { backgroundColor: colors.surface.secondary }]}>
              <Text style={styles.pillEmoji}>{durationInfo?.emoji || '⏰'}</Text>
              <Text style={[styles.pillText, { color: colors.text.secondary }]}>
                {durationInfo?.label || currentActivity.duration}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.surface.secondary }]}>
              <Text style={styles.pillEmoji}>
                {currentActivity.location === 'indoor' ? '🏠' : currentActivity.location === 'outdoor' ? '🌳' : '🏠🌳'}
              </Text>
              <Text style={[styles.pillText, { color: colors.text.secondary }]}>
                {currentActivity.location === 'indoor' ? 'Indoor' : currentActivity.location === 'outdoor' ? 'Outdoor' : 'Anywhere'}
              </Text>
            </View>
            {currentActivity.materials && currentActivity.materials !== 'none' && (
              <View style={[styles.pill, { backgroundColor: colors.surface.secondary }]}>
                <Text style={styles.pillEmoji}>🧺</Text>
                <Text style={[styles.pillText, { color: colors.text.secondary }]}>
                  {currentActivity.materials === 'basic' ? 'Basic supplies' : 'Supplies needed'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Track session completion when all cards are done
  useEffect(() => {
    if (isLastCard && recommendations.length > 0) {
      Analytics.completeSession(recommendations.length, acceptedActivities.length, duration);
      addBreadcrumb('Session completed', 'recommendation', {
        total: recommendations.length,
        liked: acceptedActivities.length,
      });
    }
  }, [isLastCard, recommendations.length, acceptedActivities.length, duration]);

  const renderCompletedView = () => (
    <View style={styles.completedContainer}>
      <Text style={styles.completedEmoji}>🎉</Text>
      <Text style={[styles.completedTitle, { color: colors.text.primary }]}>
        All Done!
      </Text>
      <Text style={[styles.completedSubtitle, { color: colors.text.secondary }]}>
        You've reviewed {recommendations.length} activities
      </Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.success.light }]}>
          <Text style={[styles.statNumber, { color: colors.success.dark }]}>{acceptedActivities.length}</Text>
          <Text style={[styles.statLabel, { color: colors.success.dark }]}>Liked</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.error.light }]}>
          <Text style={[styles.statNumber, { color: colors.error.dark }]}>{rejectedActivities.length}</Text>
          <Text style={[styles.statLabel, { color: colors.error.dark }]}>Passed</Text>
        </View>
      </View>

      {/* Learning feedback message */}
      {learningMessage && (
        <View style={[styles.learningBanner, { backgroundColor: colors.primary.light }]}>
          <Text style={styles.learningEmoji}>🧠</Text>
          <Text style={[styles.learningText, { color: colors.primary.dark }]}>
            {learningMessage}
          </Text>
        </View>
      )}

      {acceptedActivities.length > 0 ? (
        <Button onPress={handleViewAccepted} fullWidth icon="✨" style={styles.completedButton}>
          View Liked Activities
        </Button>
      ) : (
        <Button onPress={handleStartOver} variant="secondary" fullWidth style={styles.completedButton}>
          Try Again
        </Button>
      )}

      <TouchableOpacity onPress={handleStartOver} style={styles.startOverLink}>
        <Text style={[styles.startOverText, { color: colors.primary.main }]}>
          Start Over
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Get safe area insets for bottom padding
  const insets = useSafeAreaInsets();

  // Loading state
  if (loading) {
    return (
      <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <IconButton icon="←" onPress={handleBack} variant="ghost" size="md" />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Loading...</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.cardContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Finding perfect activities...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="←"
          onPress={handleBack}
          variant="ghost"
          size="md"
        />
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {isLastCard ? 'Results' : `${currentIndex + 1} of ${recommendations.length}`}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Card Area */}
      <View style={styles.cardContainer}>
        {isLastCard ? renderCompletedView() : renderActivityCard()}
      </View>

      {/* Action Buttons */}
      {!isLastCard && (
        <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton, { backgroundColor: colors.surface.secondary }]}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonLabel, { color: colors.text.secondary }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.doItButton, { backgroundColor: colors.primary.main }]}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonLabel, { color: '#ffffff' }]}>Let's Do It!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Swipe Hint */}
      {!isLastCard && currentIndex === 0 && (
        <View style={[styles.hintContainer, { bottom: Math.max(insets.bottom, 20) + 100 }]}>
          <Text style={[styles.hintText, { color: colors.text.tertiary }]}>
            Swipe right to do it, left for something else
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  likeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nopeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayEmoji: {
    fontSize: 80,
    opacity: 0.3,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  activityDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  personalizedText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {},
  doItButton: {},
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  hintText: {
    fontSize: 12,
  },
  // Completed view
  completedContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedButton: {
    marginBottom: 16,
  },
  startOverLink: {
    padding: 8,
  },
  startOverText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  learningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  learningEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  learningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default RecommendationScreen;
