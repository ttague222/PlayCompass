/**
 * PlayCompass Recommendation Screen
 *
 * Displays recommended activities with swipe interface
 * Uses backend API with fallback to local data
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  getExcludedActivityIds,
  getLearningMessage,
  getCategoryBoosts,
} from '../services/preferenceLearningService';
import { getActivityWeatherTag, isActivitySuitableForWeather } from '../services/weatherService';

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

// Map age to age group for matching
const getAgeGroup = (age) => {
  if (age >= 1 && age <= 3) return 'toddler';
  if (age >= 4 && age <= 5) return 'preschool';
  if (age >= 6 && age <= 8) return 'early_elementary';
  if (age >= 9 && age <= 11) return 'late_elementary';
  if (age >= 12 && age <= 14) return 'middle_school';
  if (age >= 15 && age <= 18) return 'high_school';
  return 'early_elementary'; // fallback
};

// Get kids that match the activity's age groups
const getMatchingKids = (activity, kids) => {
  const activityAgeGroups = activity.age_groups || activity.ageGroups || [];
  return kids.filter(kid => {
    const kidAgeGroup = getAgeGroup(kid.age);
    return activityAgeGroups.includes(kidAgeGroup);
  });
};

// Format kid names naturally (e.g., "Rylee", "Rylee and Kassidy", "Rylee, Kassidy, and Sam")
const formatKidNames = (kids) => {
  if (kids.length === 0) return '';
  if (kids.length === 1) return kids[0].name;
  if (kids.length === 2) return `${kids[0].name} and ${kids[1].name}`;
  const lastKid = kids[kids.length - 1];
  const otherKids = kids.slice(0, -1).map(k => k.name).join(', ');
  return `${otherKids}, and ${lastKid.name}`;
};

// Get season color for badges
const getSeasonColor = (season) => {
  switch (season) {
    case 'spring': return '#22c55e'; // Green
    case 'summer': return '#f59e0b'; // Amber
    case 'fall': return '#ea580c'; // Orange
    case 'winter': return '#3b82f6'; // Blue
    default: return '#6b7280'; // Gray
  }
};

// Get season emoji for badges
const getSeasonEmoji = (season) => {
  switch (season) {
    case 'spring': return '🌸';
    case 'summer': return '☀️';
    case 'fall': return '🍂';
    case 'winter': return '❄️';
    default: return '📅';
  }
};

// Generate a personalized, compelling reason for why this activity fits
const getPersonalizedReason = (activity, kids) => {
  if (!kids || kids.length === 0) return '';

  // Find which kids this activity is suitable for based on age groups
  const matchingKids = getMatchingKids(activity, kids);

  // If no kids match (shouldn't happen with new filtering), fall back to all kids
  const relevantKids = matchingKids.length > 0 ? matchingKids : kids;

  // Use first matching kid for interest-based personalization
  const kid = relevantKids[0];
  const isMultipleKids = relevantKids.length > 1;
  const kidName = relevantKids.length === 1
    ? kid.name
    : relevantKids.length === kids.length
      ? (kids.length === 2 ? 'Both kids' : 'all the kids')
      : formatKidNames(relevantKids);
  const category = activity.category?.toLowerCase();
  const energy = activity.energy?.toLowerCase();
  const location = activity.location?.toLowerCase();

  // Get hash for consistent but varied selection
  const hash = hashString(activity.id || activity.title || 'default');

  // Check if any kid's interests match the activity category
  const relatedInterests = CATEGORY_TO_INTEREST[category] || [];
  const matchingInterest = kid.interests?.find(i => relatedInterests.includes(i));

  // TIER 1: Interest-based personalization (strongest connection)
  // Only use for single kid - multi-kid templates are simpler
  if (matchingInterest && !isMultipleKids) {
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

  // TIER 2: Category-based personalization
  // Use different templates for single kid vs multiple kids
  const singleKidTemplates = {
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

  const multiKidTemplates = {
    active: [
      `Great for getting ${kidName} moving together`,
      `${kidName} will love the energy of this`,
      `A fun way to keep ${kidName} active`,
      `Perfect when ${kidName} need to burn energy`,
      `${kidName} will enjoy this active play`,
      `Gets ${kidName} up and moving`,
    ],
    creative: [
      `A creative adventure ${kidName} can share`,
      `${kidName} can let their imaginations run free`,
      `${kidName} can create something special together`,
      `A fun way for ${kidName} to express ideas`,
      `${kidName} will enjoy making something together`,
      `Creativity time for ${kidName}`,
    ],
    educational: [
      `${kidName} will learn while having fun together`,
      `A discovery moment ${kidName} can share`,
      `${kidName} will pick up something new`,
      `Fun learning awaits ${kidName}`,
      `${kidName} will enjoy exploring this together`,
      `A brain boost for ${kidName}`,
    ],
    social: [
      `Quality time for ${kidName} together`,
      `${kidName} will enjoy doing this together`,
      `A bonding moment for ${kidName}`,
      `Great for ${kidName} to do as a team`,
      `${kidName} will love this together`,
      `Togetherness time for ${kidName}`,
    ],
    calm: [
      `A peaceful moment ${kidName} can share`,
      `${kidName} will enjoy the calm vibes together`,
      `Relaxing fun for ${kidName}`,
      `A quiet activity ${kidName} will appreciate`,
      `${kidName} can wind down together with this`,
      `Gentle fun for ${kidName}`,
    ],
    outdoor: [
      `Fresh air fun for ${kidName}`,
      `${kidName} will enjoy being outside together`,
      `An outdoor adventure ${kidName} can share`,
      `Get ${kidName} out exploring together`,
      `${kidName} will love this outdoor activity`,
      `Outside fun awaits ${kidName}`,
    ],
    music: [
      `${kidName} will enjoy the sounds together`,
      `A musical moment ${kidName} can share`,
      `${kidName} can make some noise together`,
      `Rhythm and fun for ${kidName}`,
      `${kidName} will love this musical activity`,
      `${kidName} can explore music together`,
    ],
    games: [
      `${kidName} will have fun with this game`,
      `Game time for ${kidName}`,
      `${kidName} will love this kind of play`,
      `A playful pick for ${kidName}`,
      `${kidName} will enjoy the challenge together`,
      `Fun and games for ${kidName}`,
    ],
  };

  const categoryTemplates = isMultipleKids ? multiKidTemplates : singleKidTemplates;

  if (categoryTemplates[category]) {
    const options = categoryTemplates[category];
    return options[hash % options.length];
  }

  // TIER 3: Energy + Location based (if category somehow missing)
  // Use different templates for single vs multiple kids
  let contextTemplates = [];

  if (isMultipleKids) {
    if (energy === 'high') {
      contextTemplates = [
        `${kidName} will love the action`,
        `Great when ${kidName} need to move`,
        `Active fun for ${kidName}`,
        `${kidName} can let loose with this`,
        `Perfect for burning off energy together`,
      ];
    } else if (energy === 'low') {
      contextTemplates = [
        `A calm activity for ${kidName}`,
        `Relaxing fun ${kidName} will enjoy`,
        `${kidName} can take it easy with this`,
        `Gentle activity for ${kidName}`,
        `A mellow moment ${kidName} can share`,
      ];
    } else {
      contextTemplates = [
        `Just the right pace for ${kidName}`,
        `${kidName} will enjoy this activity`,
        `A balanced pick for ${kidName}`,
        `${kidName} will have fun with this`,
        `A nice activity for ${kidName}`,
      ];
    }
  } else {
    if (energy === 'high') {
      contextTemplates = [
        `Perfect for burning off ${kidName}'s energy`,
        `${kidName} will love the action`,
        `Great when ${kidName} needs to move`,
        `Active fun for ${kidName}`,
        `${kidName} can let loose with this`,
      ];
    } else if (energy === 'low') {
      contextTemplates = [
        `A calm activity for ${kidName}`,
        `Relaxing fun ${kidName} will enjoy`,
        `${kidName} can take it easy with this`,
        `Gentle activity for ${kidName}`,
        `A mellow moment for ${kidName}`,
      ];
    } else {
      contextTemplates = [
        `Just the right pace for ${kidName}`,
        `${kidName} will enjoy this activity`,
        `A balanced pick for ${kidName}`,
        `${kidName} will have fun with this`,
        `A nice activity for ${kidName}`,
      ];
    }
  }

  // Add location flavor
  if (location === 'outdoor') {
    contextTemplates.push(
      `${kidName} will enjoy this outside`,
      `Fresh air fun for ${kidName}`
    );
  } else if (location === 'indoor') {
    contextTemplates.push(
      `Indoor fun for ${kidName}`,
      isMultipleKids ? `${kidName} can do this at home` : `${kidName} can do this right at home`
    );
  }

  if (contextTemplates.length > 0) {
    return contextTemplates[hash % contextTemplates.length];
  }

  // TIER 4: Age-based fallback (should rarely reach here)
  const ageTemplates = isMultipleKids
    ? [
        `Just right for ${kidName}`,
        `${kidName} will enjoy this`,
        `A good pick for ${kidName}`,
        `${kidName} will have a good time`,
        `A great activity for ${kidName}`,
      ]
    : [
        `Just right for ${kidName}`,
        `${kidName} will enjoy this`,
        `A good pick for ${kidName}`,
        `${kidName} is ready for this`,
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
  const { recordRecommendationUsage, effectiveTier, isInTrial } = useSubscription();

  const { duration, location, energy, materials, selectedKids: routeSelectedKids, surpriseActivity, weather, seasonFilter } = route.params || {};

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
    // Create abort controller to cancel previous requests
    const abortController = new AbortController();
    let isCancelled = false;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      // Validate kids array before proceeding
      if (!kids || kids.length === 0) {
        setError('No kids selected');
        setLoading(false);
        return;
      }

      // If we have a surprise activity, just use that
      if (surpriseActivity) {
        const activity = {
          ...surpriseActivity,
          ageGroups: surpriseActivity.age_groups,
          adultSupervision: surpriseActivity.adult_supervision,
          popularityScore: surpriseActivity.popularity_score,
        };
        if (!isCancelled) {
          setRecommendations([activity]);
          setLoading(false);
        }
        addBreadcrumb('Surprise activity loaded', 'recommendation', { activityId: activity.id });
        Analytics.startSession(duration, kids.length);
        await recordRecommendationUsage();
        return;
      }

      addBreadcrumb('Fetching recommendations', 'recommendation', { duration, location, energy, materials });
      Analytics.startSession(duration, kids.length);

      // Record usage for subscription tracking
      await recordRecommendationUsage();

      // Get activities to exclude and category boosts based on learning
      // Note: We only exclude activities that were explicitly passed multiple times
      // Recently seen activities are NOT excluded - users may want to do them again
      const [excludedIds, categoryBoosts] = await Promise.all([
        getExcludedActivityIds(3, 30), // Activities passed 3+ times in last 30 days
        getCategoryBoosts(), // Preference-based category boosts
      ]);

      // Check if request was cancelled during async operations
      if (isCancelled) return;

      const excludedActivityIds = excludedIds;
      addBreadcrumb('Excluding activities from learning', 'recommendation', {
        excludedCount: excludedIds.length,
        hasCategoryBoosts: Object.keys(categoryBoosts).length > 0,
      });

      // Determine current season for filtering
      const getCurrentSeason = () => {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
      };

      // Get weather tag if weather was provided
      const weatherTag = weather ? getActivityWeatherTag(weather) : null;

      try {
        // Try backend API first
        const response = await getApiRecommendations({
          kids,
          duration,
          location: location || 'both',
          energy,
          materials,
          season: seasonFilter === 'current' ? getCurrentSeason() : null,
          weather: weatherTag, // Pass weather tag (sunny, rainy, etc.) to API
          subscriptionTier: effectiveTier || 'free',
          excludedActivityIds,
          count: 10,
        });

        // Check if request was cancelled
        if (isCancelled) return;

        if (response.activities && response.activities.length > 0) {
          // Transform API response to match local format
          let activities = response.activities.map((a) => ({
            ...a,
            ageGroups: a.age_groups,
            adultSupervision: a.adult_supervision,
            popularityScore: a.popularity_score,
            relevanceScore: a.relevance_score,
          }));

          // If API returned fewer than requested, supplement with local data
          const targetCount = 10;
          if (activities.length < targetCount) {
            addBreadcrumb('Supplementing API results with local data', 'recommendation', {
              apiCount: activities.length,
              targetCount,
            });

            const durationObj = DURATIONS[duration?.toUpperCase()];
            const availableTime = durationObj?.max || 60;

            // Get IDs of activities we already have from API
            const apiActivityIds = new Set(activities.map((a) => a.id));

            // Get local recommendations, excluding activities already from API
            let localRecommendations = getRecommendedActivities(kids, {
              count: targetCount * 2, // Get extra to filter from
              location: location !== 'both' ? location : undefined,
              availableTime,
              energy,
              materials,
              categoryBoosts,
            });

            // Filter out activities we already have from API and ones that were excluded
            const excludedSet = new Set(excludedActivityIds);
            localRecommendations = localRecommendations.filter((a) =>
              !apiActivityIds.has(a.id) && !excludedSet.has(a.id)
            );

            if (weatherTag) {
              localRecommendations = localRecommendations.filter((a) =>
                isActivitySuitableForWeather(a, weatherTag)
              );
            }

            if (seasonFilter === 'current') {
              const currentSeason = getCurrentSeason();
              localRecommendations = localRecommendations.filter((a) =>
                !a.season || a.season === 'any' || a.season === currentSeason
              );
            }

            // Add local activities to reach target count
            const needed = targetCount - activities.length;
            activities = [...activities, ...localRecommendations.slice(0, needed)];
          }

          // Note: Weather and seasonal filtering are handled server-side via API params
          // We don't apply them again client-side to avoid double-filtering

          if (!isCancelled) {
            setRecommendations(activities);
          }
          addBreadcrumb('Recommendations loaded from API', 'recommendation', {
            count: activities.length,
            weatherFiltered: !!weatherTag,
            seasonFiltered: seasonFilter === 'current',
          });
        } else {
          throw new Error('No activities returned');
        }
      } catch (err) {
        // Check if request was cancelled
        if (isCancelled) return;

        console.log('API failed, falling back to local data:', err.message);
        addBreadcrumb('API failed, using local data', 'recommendation', { error: err.message });

        // Fallback to local data
        const durationObj = DURATIONS[duration?.toUpperCase()];
        const availableTime = durationObj?.max || 60;

        let localRecommendations = getRecommendedActivities(kids, {
          count: 10,
          location: location !== 'both' ? location : undefined,
          availableTime,
          energy,
          materials, // Apply materials filter (null = any)
          categoryBoosts, // Apply preference-based boosts
        });

        // Apply weather filtering to local recommendations
        if (weatherTag) {
          localRecommendations = localRecommendations.filter((a) =>
            isActivitySuitableForWeather(a, weatherTag)
          );
        }

        // Apply seasonal filtering
        if (seasonFilter === 'current') {
          const currentSeason = getCurrentSeason();
          localRecommendations = localRecommendations.filter((a) =>
            !a.season || a.season === 'any' || a.season === currentSeason
          );
        }

        if (!isCancelled) {
          setRecommendations(localRecommendations);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    // Cleanup function to cancel request on unmount or dependency change
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [kids, duration, location, energy, materials, surpriseActivity, weather, seasonFilter]);

  const position = useState(new Animated.ValueXY())[0];

  const currentActivity = recommendations[currentIndex];
  const isLastCard = currentIndex >= recommendations.length && recommendations.length > 0;

  // Use ref to always get the latest activity (avoids stale closure issues)
  const currentActivityRef = useRef(currentActivity);
  useEffect(() => {
    currentActivityRef.current = currentActivity;
  }, [currentActivity]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAccept = useCallback(async () => {
    // Use ref to get the latest activity (avoids stale closure)
    const activity = currentActivityRef.current;
    if (!activity) return;

    setAcceptedActivities((prev) => [...prev, activity]);
    Analytics.likeActivity(activity.id, activity.title, activity.category);

    // Save to history and record swipe - await both to ensure data persistence
    await Promise.all([
      saveActivityToHistory(activity, true, duration),
      recordSwipe(activity, true),
    ]);

    // Check for learning message update (after every few swipes)
    // Safely access kids array
    if (kids && kids.length > 0 && kids[0]?.name) {
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
  }, [position, saveActivityToHistory, duration, kids]);

  const handleReject = useCallback(async () => {
    // Use ref to get the latest activity (avoids stale closure)
    const activity = currentActivityRef.current;
    if (!activity) return;

    setRejectedActivities((prev) => [...prev, activity]);
    Analytics.skipActivity(activity.id, activity.title, activity.category);

    // Save to history and record swipe - await both to ensure data persistence
    await Promise.all([
      saveActivityToHistory(activity, false, duration),
      recordSwipe(activity, false),
    ]);

    Animated.spring(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
    });
  }, [position, saveActivityToHistory, duration]);

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
          {/* Premium Feature Badges - Show when using premium features during trial */}
          {(weather || (currentActivity.season && currentActivity.season !== 'any')) && (
            <View style={styles.premiumBadgeRow}>
              {/* Weather-Aware Badge - show when weather filtering is active */}
              {weather && (
                <Badge variant="secondary" size="sm" style={[styles.premiumFeatureBadge, { backgroundColor: colors.primary.main + '15' }]}>
                  <Text style={{ color: colors.primary.main, fontSize: 11, fontWeight: '600' }}>
                    🌦️ Weather-Aware {isInTrial && '✨'}
                  </Text>
                </Badge>
              )}
              {/* Seasonal Badge */}
              {currentActivity.season && currentActivity.season !== 'any' && (
                <Badge variant="secondary" size="sm" style={[styles.seasonBadge, { backgroundColor: getSeasonColor(currentActivity.season) + '20' }]}>
                  <Text style={{ color: getSeasonColor(currentActivity.season), fontSize: 11, fontWeight: '600' }}>
                    {getSeasonEmoji(currentActivity.season)} {currentActivity.season.charAt(0).toUpperCase() + currentActivity.season.slice(1)} {isInTrial && '✨'}
                  </Text>
                </Badge>
              )}
            </View>
          )}

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
            <View style={[styles.personalizedBadge, { backgroundColor: colors.primary.main + '20' }]}>
              <Text style={styles.personalizedIcon}>💡</Text>
              <Text style={[styles.personalizedText, { color: colors.text.secondary }]}>
                {getPersonalizedReason(currentActivity, kids)}
              </Text>
            </View>
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

  // Error state
  if (error) {
    return (
      <ScreenWrapper edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <IconButton icon="←" onPress={handleBack} variant="ghost" size="md" />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Oops</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.cardContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
          <Text style={[styles.loadingText, { color: colors.text.secondary, textAlign: 'center' }]}>
            {error}
          </Text>
          <Button
            variant="primary"
            onPress={handleBack}
            style={{ marginTop: 24 }}
          >
            Go Back
          </Button>
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
  premiumBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  premiumBadge: {
    backgroundColor: '#9333ea',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  seasonBadge: {
    alignSelf: 'center',
  },
  premiumFeatureBadge: {
    alignSelf: 'center',
  },
  activityDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  personalizedIcon: {
    fontSize: 18,
    marginRight: 10,
    flexShrink: 0,
  },
  personalizedText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
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
