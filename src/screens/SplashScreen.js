import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Colors } from '../styles/Colors';

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
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
        <View style={styles.imageWrapper}>
          <Image 
            source={require('../../assets/images/Logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>
        <Text style={styles.title}>Petsfolio</Text>
        <Text style={styles.subtitle}>Sales Manager</Text>
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
  imageWrapper: {
    width: 140,
    height: 140,
    backgroundColor: Colors.white,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    padding: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    letterSpacing: 1,
    fontWeight: '500',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 15,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
