import Text from './AppText';
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { Shadows } from '../styles/Shadows';
import Theme from '../styles/Theme';

const QuickActionCard = ({ icon, label, onPress, color = Colors.primary, style }) => (
  <TouchableOpacity
    style={[styles.card, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
      {icon}
    </View>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    ...Shadows.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    fontFamily: Fonts.family.medium,
    textAlign: 'center',
  },
});

export default QuickActionCard;
