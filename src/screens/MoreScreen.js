import Text from '../components/AppText';
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import QuickActionCard from '../components/QuickActionCard';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { Shadows } from '../styles/Shadows';

const MoreScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenHeader title="More" subtitle="Menu & Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Sales Caller Pro</Text>
          <Text style={styles.infoText}>
            Your daily calling companion for sales teams. Manage calls, track
            analytics, and boost your performance.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },

  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  infoTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default MoreScreen;
