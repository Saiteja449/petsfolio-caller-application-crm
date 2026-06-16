import Text from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';

const EmptyState = ({ icon, title, message, style }) => (
  <View style={[styles.container, style]}>
    {icon && <View style={styles.iconWrap}>{icon}</View>}
    <Text style={styles.title}>{title}</Text>
    {message && <Text style={styles.message}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    paddingVertical: Spacing.huge,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
    opacity: 0.5,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.semiBold,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});

export default EmptyState;
