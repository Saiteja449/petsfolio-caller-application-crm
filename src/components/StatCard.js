import Text from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { Shadows } from '../styles/Shadows';
import Theme from '../styles/Theme';

const StatCard = ({ label, value, color, icon, subtitle, style }) => (
  <View style={[styles.card, style]}>
    {icon && <View style={styles.iconWrap}>{icon}</View>}
    <Text style={[styles.value, color && { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    ...Shadows.card,
    minWidth: 100,
  },
  iconWrap: {
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export default StatCard;
