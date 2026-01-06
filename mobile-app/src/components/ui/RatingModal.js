/**
 * PlayCompass Rating Modal Component
 *
 * Modal for rating and providing feedback on activities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';
import StarRating from './StarRating';

const FEEDBACK_TAGS = [
  { id: 'fun', label: 'Fun', emoji: '\ud83c\udf89' },
  { id: 'educational', label: 'Educational', emoji: '\ud83d\udcda' },
  { id: 'creative', label: 'Creative', emoji: '\ud83c\udfa8' },
  { id: 'easy_setup', label: 'Easy Setup', emoji: '\u26a1' },
  { id: 'engaging', label: 'Engaging', emoji: '\ud83c\udfaf' },
  { id: 'messy', label: 'Messy', emoji: '\ud83e\uddf9' },
  { id: 'repeat', label: 'Would Repeat', emoji: '\ud83d\udd01' },
  { id: 'all_ages', label: 'All Ages Enjoyed', emoji: '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66' },
];

const RatingModal = ({
  visible,
  onClose,
  onSubmit,
  activity,
  initialRating = null,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [stars, setStars] = useState(initialRating?.stars || 0);
  const [feedback, setFeedback] = useState(initialRating?.feedback || '');
  const [selectedTags, setSelectedTags] = useState(initialRating?.tags || []);

  // Reset state when modal opens with new activity
  useEffect(() => {
    if (visible) {
      setStars(initialRating?.stars || 0);
      setFeedback(initialRating?.feedback || '');
      setSelectedTags(initialRating?.tags || []);
    }
  }, [visible, initialRating]);

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = () => {
    if (stars === 0) return;
    onSubmit({
      stars,
      feedback: feedback.trim(),
      tags: selectedTags,
    });
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface.primary,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={[styles.closeText, { color: colors.text.tertiary }]}>
                    {'\u2715'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Activity Info */}
              <View style={styles.activityInfo}>
                <Text style={styles.activityEmoji}>{activity?.emoji}</Text>
                <Text style={[styles.activityTitle, { color: colors.text.primary }]}>
                  How was it?
                </Text>
                <Text style={[styles.activityName, { color: colors.text.secondary }]}>
                  {activity?.title}
                </Text>
              </View>

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <StarRating
                  rating={stars}
                  onRatingChange={setStars}
                  size="lg"
                  showLabel
                />
              </View>

              {/* Tags */}
              {stars > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
                    What did you like? (optional)
                  </Text>
                  <View style={styles.tagsGrid}>
                    {FEEDBACK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.tagButton,
                            {
                              backgroundColor: isSelected
                                ? colors.primary.main
                                : colors.surface.secondary,
                              borderColor: isSelected
                                ? colors.primary.main
                                : colors.border.light,
                            },
                          ]}
                          onPress={() => toggleTag(tag.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                          <Text
                            style={[
                              styles.tagLabel,
                              { color: isSelected ? '#fff' : colors.text.secondary },
                            ]}
                          >
                            {tag.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Feedback Input */}
              {stars > 0 && (
                <View style={styles.feedbackSection}>
                  <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
                    Any notes? (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.feedbackInput,
                      {
                        backgroundColor: colors.surface.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    placeholder="e.g., 'Kids loved the mess!', 'Try with older kids'"
                    placeholderTextColor={colors.text.tertiary}
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />
                  <Text style={[styles.charCount, { color: colors.text.tertiary }]}>
                    {feedback.length}/200
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttons}>
              {stars > 0 ? (
                <Button onPress={handleSubmit} fullWidth>
                  Save Rating
                </Button>
              ) : (
                <Button onPress={handleSkip} variant="ghost" fullWidth>
                  Skip for now
                </Button>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    fontWeight: '300',
  },
  activityInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  activityEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 16,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tagsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tagEmoji: {
    fontSize: 14,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});

export default RatingModal;
