/**
 * Find Activity - Step 1: Kids Selection
 *
 * Simple screen to select which children to find activities for
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useKids } from '../../context/KidsContext';
import { Button, IconButton, ScreenWrapper } from '../../components';

const KidsSelectStep = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { kids } = useKids();
  const insets = useSafeAreaInsets();

  // Initialize with all kids selected
  const [selectedKidIds, setSelectedKidIds] = useState(() => kids.map((k) => k.id));

  // Sync selectedKidIds when kids array changes (e.g., new kid added)
  useEffect(() => {
    setSelectedKidIds(kids.map((k) => k.id));
  }, [kids]);

  const toggleKidSelection = (kidId) => {
    setSelectedKidIds((prev) => {
      if (prev.includes(kidId)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== kidId);
      }
      return [...prev, kidId];
    });
  };

  const selectAll = () => {
    setSelectedKidIds(kids.map((k) => k.id));
  };

  const selectedKids = kids.filter((k) => selectedKidIds.includes(k.id));

  const handleNext = () => {
    navigation.navigate('TimeLocationStep', {
      selectedKids: selectedKids,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const bottomBarHeight = 90 + insets.bottom;

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Find Activity
          </Text>
          <Text style={[styles.stepIndicator, { color: colors.text.secondary }]}>
            Step 1 of 3
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface.secondary }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary.main, width: '33%' }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Question */}
        <View style={styles.questionSection}>
          <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
          <Text style={[styles.questionTitle, { color: colors.text.primary }]}>
            Who's playing today?
          </Text>
          <Text style={[styles.questionSubtitle, { color: colors.text.secondary }]}>
            Select the children to find activities for
          </Text>
        </View>

        {/* Kids Grid */}
        <View style={styles.kidsGrid}>
          {kids.map((kid) => {
            const isSelected = selectedKidIds.includes(kid.id);
            return (
              <TouchableOpacity
                key={kid.id}
                style={[
                  styles.kidCard,
                  {
                    backgroundColor: isSelected ? colors.primary.main : colors.surface.primary,
                    borderColor: isSelected ? colors.primary.main : colors.border.light,
                  },
                ]}
                onPress={() => toggleKidSelection(kid.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.kidAvatar}>{kid.avatar}</Text>
                <Text
                  style={[
                    styles.kidName,
                    { color: isSelected ? '#fff' : colors.text.primary },
                  ]}
                  numberOfLines={1}
                >
                  {kid.name}
                </Text>
                <Text
                  style={[
                    styles.kidAge,
                    { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.text.secondary },
                  ]}
                >
                  {kid.age} years old
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick actions */}
        {kids.length > 1 && (
          <TouchableOpacity
            style={[styles.selectAllButton, { borderColor: colors.border.light }]}
            onPress={selectAll}
          >
            <Text style={[styles.selectAllText, { color: colors.primary.main }]}>
              Select All Kids
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface.primary,
            borderTopColor: colors.border.light,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <Button
          onPress={handleNext}
          disabled={selectedKids.length === 0}
          style={styles.nextButton}
          icon="→"
          iconPosition="right"
        >
          Next: Time & Location
        </Button>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    height: 4,
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  kidsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  kidCard: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  kidAvatar: {
    fontSize: 48,
    marginBottom: 12,
  },
  kidName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  kidAge: {
    fontSize: 14,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectAllButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  nextButton: {
    width: '100%',
  },
});

export default KidsSelectStep;
