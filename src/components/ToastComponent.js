import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform, SafeAreaView } from 'react-native';
import { useToast } from '../context/ToastContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { Shadows } from '../styles/Shadows';
import { AcceptIcon, RejectIcon } from '../icons/Icons'; // Assuming we can use these for success/error

const ToastComponent = () => {
  const { toast } = useToast();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [toast.visible]);

  if (!toast.visible && opacity._value === 0) return null;

  const isSuccess = toast.type === 'success';

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="none">
      <Animated.View style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: isSuccess ? Colors.success : Colors.danger,
        }
      ]}>
        <View style={styles.iconContainer}>
          {isSuccess ? <AcceptIcon size={20} /> : <RejectIcon size={20} />}
        </View>
        <Text style={styles.messageText}>{toast.message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Platform.OS === 'ios' ? 0 : Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Theme.borderRadius,
    ...Shadows.card,
    elevation: 10,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  messageText: {
    flex: 1,
    color: Colors.white,
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.sizes.sm,
  }
});

export default ToastComponent;
