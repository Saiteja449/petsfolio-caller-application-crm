import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../styles/Colors';

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📞</Text>
        </View>
        <Text style={styles.title}>Petsfolio</Text>
        <Text style={styles.subtitle}>Caller & Manager</Text>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          position: 'absolute',
          bottom: 60,
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Colors.white} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.borderLight,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  loadingText: {
    color: Colors.borderLight,
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SplashScreen;
