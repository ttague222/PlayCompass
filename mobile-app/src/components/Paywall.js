/**
 * PlayCompass Paywall Component
 *
 * Modal for upgrading subscription
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SUBSCRIPTION_TIERS, FEATURE_DESCRIPTIONS } from '../services/subscriptionService';
import Button from './ui/Button';
import Card from './ui/Card';

const Paywall = ({ visible, onClose, blockedFeature, suggestedTier }) => {
  const { colors } = useTheme();
  const [selectedTier, setSelectedTier] = useState(suggestedTier?.id || 'plus');
  const [processing, setProcessing] = useState(false);

  const tiers = Object.values(SUBSCRIPTION_TIERS).filter((t) => t.id !== 'free');

  const handlePurchase = async () => {
    setProcessing(true);
    // In a real app, this would integrate with RevenueCat or in-app purchases
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be available in the next update. For now, enjoy all features for free during our beta period!',
      [{ text: 'OK', onPress: () => onClose() }]
    );
    setProcessing(false);
  };

  const renderFeatureComparison = () => {
    const features = Object.keys(FEATURE_DESCRIPTIONS);

    return features.map((feature) => {
      const info = FEATURE_DESCRIPTIONS[feature];
      const freeValue = SUBSCRIPTION_TIERS.free.features[feature];
      const selectedValue = SUBSCRIPTION_TIERS[selectedTier]?.features[feature];

      // Format the value for display
      const formatValue = (val) => {
        if (val === true) return '✓';
        if (val === false) return '—';
        if (val === 'unlimited') return '∞';
        if (val === 'all') return 'All';
        if (Array.isArray(val)) return val.length;
        return val;
      };

      const isImproved = formatValue(selectedValue) !== formatValue(freeValue);

      return (
        <View key={feature} style={styles.featureRow}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureIcon}>{info.icon}</Text>
            <Text style={[styles.featureName, { color: colors.text.primary }]}>{info.name}</Text>
          </View>
          <View style={styles.featureValues}>
            <Text style={[styles.featureValue, { color: colors.text.tertiary }]}>
              {formatValue(freeValue)}
            </Text>
            <Text style={styles.arrow}>→</Text>
            <Text
              style={[
                styles.featureValue,
                styles.improvedValue,
                { color: isImproved ? colors.primary.main : colors.text.secondary },
              ]}
            >
              {formatValue(selectedValue)}
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.text.secondary }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text.primary }]}>Upgrade Your Plan</Text>
            {blockedFeature && (
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Unlock {FEATURE_DESCRIPTIONS[blockedFeature]?.name || blockedFeature} and more
              </Text>
            )}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tier Selection */}
            <View style={styles.tierSelection}>
              {tiers.map((tier) => (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor:
                        selectedTier === tier.id ? colors.primary.light : colors.surface.secondary,
                      borderColor:
                        selectedTier === tier.id ? colors.primary.main : colors.border.light,
                    },
                  ]}
                  onPress={() => setSelectedTier(tier.id)}
                  activeOpacity={0.7}
                >
                  {tier.id === 'plus' && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary.main }]}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={[styles.tierName, { color: colors.text.primary }]}>{tier.name}</Text>
                  <Text style={[styles.tierPrice, { color: colors.primary.main }]}>
                    {tier.priceLabel}
                  </Text>
                  <Text style={[styles.tierDescription, { color: colors.text.secondary }]}>
                    {tier.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Feature Comparison */}
            <Card variant="outlined" style={styles.comparisonCard}>
              <Text style={[styles.comparisonTitle, { color: colors.text.primary }]}>
                What you'll get
              </Text>
              <View style={styles.comparisonHeader}>
                <Text style={[styles.comparisonLabel, { color: colors.text.tertiary }]}>Free</Text>
                <Text style={[styles.comparisonLabel, { color: colors.primary.main }]}>
                  {SUBSCRIPTION_TIERS[selectedTier]?.name}
                </Text>
              </View>
              {renderFeatureComparison()}
            </Card>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Text style={styles.trustIcon}>🔒</Text>
                <Text style={[styles.trustText, { color: colors.text.secondary }]}>
                  Secure Payment
                </Text>
              </View>
              <View style={styles.trustBadge}>
                <Text style={styles.trustIcon}>↩️</Text>
                <Text style={[styles.trustText, { color: colors.text.secondary }]}>
                  Cancel Anytime
                </Text>
              </View>
              <View style={styles.trustBadge}>
                <Text style={styles.trustIcon}>⚡</Text>
                <Text style={[styles.trustText, { color: colors.text.secondary }]}>
                  Instant Access
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border.light }]}>
            <Button onPress={handlePurchase} fullWidth size="lg" disabled={processing}>
              {processing
                ? 'Processing...'
                : `Upgrade to ${SUBSCRIPTION_TIERS[selectedTier]?.name}`}
            </Button>
            <TouchableOpacity onPress={onClose} style={styles.restoreButton}>
              <Text style={[styles.restoreText, { color: colors.text.tertiary }]}>
                Restore Purchases
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
  tierSelection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tierCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  tierDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  comparisonCard: {
    padding: 16,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginBottom: 8,
    paddingRight: 8,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '500',
  },
  featureValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  arrow: {
    fontSize: 12,
    color: '#999',
  },
  improvedValue: {
    fontWeight: '700',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  trustBadge: {
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  restoreButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  restoreText: {
    fontSize: 12,
  },
});

export default Paywall;
