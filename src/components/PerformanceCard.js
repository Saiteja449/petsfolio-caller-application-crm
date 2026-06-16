import Text from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { Shadows } from '../styles/Shadows';
import Theme from '../styles/Theme';

const PerformanceCard = ({ label, value, unit, color, progress }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueRow}>
      <Text style={[styles.value, color && { color }]}>{value}</Text>
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
    {progress !== undefined && (
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(progress, 100)}%`, backgroundColor: color || Colors.primary },
          ]}
        />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    ...Shadows.card,
    width: '47%',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  unit: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default PerformanceCard;
