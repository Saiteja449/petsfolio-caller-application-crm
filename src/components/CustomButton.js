import Text from './AppText';
import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const variantStyles = {
    primary: { bg: Colors.primary, text: Colors.white },
    success: { bg: Colors.success, text: Colors.white },
    danger: { bg: Colors.danger, text: Colors.white },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
    ghost: { bg: Colors.background, text: Colors.text },
  };

  const v = variantStyles[variant] || variantStyles.primary;
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === 'sm' && styles.buttonSm,
        size === 'lg' && styles.buttonLg,
        { backgroundColor: v.bg },
        isOutline && { borderWidth: 1, borderColor: v.border },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Theme.borderRadius,
    gap: Spacing.sm,
  },
  buttonSm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  buttonLg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Theme.borderRadiusLg,
  },
  text: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.semiBold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CustomButton;
