import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/AppText';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';

const LoginScreen = () => {
  const { login, sendOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    const result = await sendOtp(email);
    setIsLoading(false);

    if (result.success) {
      setIsOtpSent(true);
      Alert.alert(
        'OTP Sent',
        result.message || 'An OTP has been sent to your email.',
      );
    } else {
      Alert.alert(
        'Error',
        result.message || 'Failed to send OTP. Please check your email.',
      );
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid OTP.');
      return;
    }
    setIsLoading(true);
    const result = await login(email, otp);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert(
        'Login Failed',
        result.message || 'Invalid OTP. Please try again.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>
      </View>

      <View style={styles.formContainer}>
        {!isOtpSent ? (
          <>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <CustomButton
              title={isLoading ? 'Sending...' : 'Send OTP'}
              onPress={handleSendOtp}
              disabled={isLoading}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <CustomButton
              title={isLoading ? 'Verifying...' : 'Login'}
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.button}
            />
            <CustomButton
              title="Back to Email"
              variant="outline"
              onPress={() => setIsOtpSent(false)}
              disabled={isLoading}
              style={styles.backButton}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.regular,
  },
  formContainer: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: Theme.borderRadius,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Theme.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.regular,
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  button: {
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.md,
  },
});

export default LoginScreen;
