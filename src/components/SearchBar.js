import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { SearchIcon } from '../icons/Icons';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}) => (
  <View style={[styles.container, style]}>
    <SearchIcon size={20} color={Colors.textMuted} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      returnKeyType="search"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    padding: 0,
    fontFamily: Fonts.family.regular,
  }
});

export default SearchBar;
