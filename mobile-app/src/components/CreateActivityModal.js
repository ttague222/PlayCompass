/**
 * PlayCompass Create/Edit Activity Modal
 *
 * Full-screen modal for creating and editing custom activities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Chip } from './ui';
import { CATEGORIES, DURATIONS, LOCATIONS, ENERGY_LEVELS, AGE_GROUPS } from '../data/activitySchema';
import {
  createCustomActivity,
  updateCustomActivity,
} from '../services/customActivityService';

// Common emoji options for activities
const EMOJI_OPTIONS = [
  '🎯', '🎨', '🎮', '📚', '🏃', '🎵', '🔬', '👨‍🍳',
  '🎪', '🎲', '🌳', '🧩', '✏️', '🎭', '⚽', '🧘',
  '🎸', '🏊', '🚴', '🎤', '🎬', '🃏', '🧸', '🎈',
];

const CreateActivityModal = ({ visible, onClose, editActivity }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const isEditing = editActivity && !editActivity.isTemplate;
  const isFromTemplate = editActivity?.isTemplate;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [category, setCategory] = useState('creative');
  const [duration, setDuration] = useState('medium');
  const [location, setLocation] = useState('both');
  const [energy, setEnergy] = useState('medium');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState(['preschool', 'early_elementary']);
  const [saving, setSaving] = useState(false);

  // Initialize form when modal opens or edit activity changes
  useEffect(() => {
    if (visible) {
      if (editActivity) {
        setTitle(isFromTemplate ? '' : editActivity.title || '');
        setDescription(editActivity.description || '');
        setEmoji(editActivity.emoji || '🎯');
        setCategory(editActivity.category || 'creative');
        setDuration(editActivity.duration || 'medium');
        setLocation(editActivity.location || 'both');
        setEnergy(editActivity.energy || 'medium');
        setSelectedAgeGroups(editActivity.ageGroups || ['preschool', 'early_elementary']);
      } else {
        // Reset to defaults for new activity
        setTitle('');
        setDescription('');
        setEmoji('🎯');
        setCategory('creative');
        setDuration('medium');
        setLocation('both');
        setEnergy('medium');
        setSelectedAgeGroups(['preschool', 'early_elementary']);
      }
    }
  }, [visible, editActivity, isFromTemplate]);

  const toggleAgeGroup = (ageGroupId) => {
    setSelectedAgeGroups((prev) => {
      if (prev.includes(ageGroupId)) {
        // Don't allow removing last age group
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== ageGroupId);
      }
      return [...prev, ageGroupId];
    });
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an activity title');
      return;
    }

    if (selectedAgeGroups.length === 0) {
      Alert.alert('Required', 'Please select at least one age group');
      return;
    }

    setSaving(true);

    const activityData = {
      title: title.trim(),
      description: description.trim(),
      emoji,
      category,
      duration,
      location,
      energy,
      ageGroups: selectedAgeGroups,
    };

    try {
      let result;
      if (isEditing) {
        result = await updateCustomActivity(user.uid, editActivity.id, activityData);
      } else {
        result = await createCustomActivity(user.uid, activityData);
      }

      if (result.success) {
        onClose(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to save activity');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => onClose(false) },
        ]
      );
    } else {
      onClose(false);
    }
  };

  const renderSectionHeader = (title, subtitle) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
      )}
    </View>
  );

  const renderOptionGrid = (options, selectedValue, onSelect, columns = 4) => (
    <View style={[styles.optionGrid, { gap: 8 }]}>
      {Object.values(options).map((option) => {
        const isSelected = selectedValue === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              {
                backgroundColor: isSelected ? colors.primary.light : colors.surface.secondary,
                borderColor: isSelected ? colors.primary.main : 'transparent',
                width: columns === 4 ? '23%' : columns === 3 ? '31%' : '48%',
              },
            ]}
            onPress={() => onSelect(option.id)}
            activeOpacity={0.7}
          >
            {option.emoji && <Text style={styles.optionEmoji}>{option.emoji}</Text>}
            <Text
              style={[
                styles.optionLabel,
                { color: isSelected ? colors.primary.dark : colors.text.secondary },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: colors.surface.primary,
              borderBottomColor: colors.border.light,
            },
          ]}
        >
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {isEditing ? 'Edit Activity' : isFromTemplate ? 'New from Template' : 'New Activity'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={saving || !title.trim()}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: title.trim() ? colors.primary.main : colors.text.tertiary,
                },
              ]}
            >
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Emoji Selector */}
          {renderSectionHeader('Emoji', 'Choose an icon for your activity')}
          <View style={styles.emojiSection}>
            <View style={[styles.selectedEmoji, { backgroundColor: colors.surface.secondary }]}>
              <Text style={styles.selectedEmojiText}>{emoji}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiList}
            >
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.emojiOption,
                    {
                      backgroundColor: emoji === e ? colors.primary.light : colors.surface.secondary,
                    },
                  ]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title Input */}
          {renderSectionHeader('Title', 'Give your activity a name')}
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Backyard Treasure Hunt"
            maxLength={50}
            style={styles.input}
          />

          {/* Description Input */}
          {renderSectionHeader('Description', 'Optional - what is this activity about?')}
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the activity..."
            multiline
            numberOfLines={3}
            maxLength={200}
            style={styles.input}
          />

          {/* Category */}
          {renderSectionHeader('Category')}
          {renderOptionGrid(CATEGORIES, category, setCategory, 4)}

          {/* Duration */}
          {renderSectionHeader('Duration')}
          {renderOptionGrid(DURATIONS, duration, setDuration, 3)}

          {/* Location */}
          {renderSectionHeader('Location')}
          {renderOptionGrid(LOCATIONS, location, setLocation, 3)}

          {/* Energy Level */}
          {renderSectionHeader('Energy Level')}
          {renderOptionGrid(ENERGY_LEVELS, energy, setEnergy, 3)}

          {/* Age Groups */}
          {renderSectionHeader('Age Groups', 'Select all that apply')}
          <View style={styles.ageGroupGrid}>
            {Object.values(AGE_GROUPS).map((ageGroup) => {
              const isSelected = selectedAgeGroups.includes(ageGroup.id);
              return (
                <TouchableOpacity
                  key={ageGroup.id}
                  style={[
                    styles.ageGroupItem,
                    {
                      backgroundColor: isSelected ? colors.primary.light : colors.surface.secondary,
                      borderColor: isSelected ? colors.primary.main : 'transparent',
                    },
                  ]}
                  onPress={() => toggleAgeGroup(ageGroup.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ageGroupEmoji}>{ageGroup.emoji}</Text>
                  <View style={styles.ageGroupText}>
                    <Text
                      style={[
                        styles.ageGroupLabel,
                        { color: isSelected ? colors.primary.dark : colors.text.primary },
                      ]}
                    >
                      {ageGroup.label}
                    </Text>
                    <Text
                      style={[
                        styles.ageGroupRange,
                        { color: isSelected ? colors.primary.dark : colors.text.secondary },
                      ]}
                    >
                      {ageGroup.min}-{ageGroup.max} years
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={[styles.checkmark, { color: colors.primary.main }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button (also at bottom for easy access) */}
          <Button
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            disabled={saving || !title.trim()}
            style={styles.saveButton}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Activity'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 70,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    marginBottom: 8,
  },
  emojiSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedEmoji: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedEmojiText: {
    fontSize: 36,
  },
  emojiList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiOptionText: {
    fontSize: 24,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  optionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  ageGroupGrid: {
    gap: 10,
    marginBottom: 24,
  },
  ageGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  ageGroupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  ageGroupText: {
    flex: 1,
  },
  ageGroupLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  ageGroupRange: {
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: 24,
  },
});

export default CreateActivityModal;
