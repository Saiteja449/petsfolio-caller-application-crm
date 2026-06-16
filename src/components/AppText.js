import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { Fonts } from '../styles/Fonts';

const AppText = ({ style, ...props }) => {
  return <RNText style={[styles.defaultText, style]} {...props} />;
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: Fonts.family.regular,
  },
});

export default AppText;
