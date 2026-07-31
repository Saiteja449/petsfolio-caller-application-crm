import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import Text from '../components/AppText';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { ScrollView } from 'react-native';

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Invalid Password', 'Please enter your password.');
      return;
    }
    
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert(
        'Login Failed',
        result.message || 'Invalid credentials. Please try again.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.imageWrapper}>
            <Image 
              source={require('../../assets/images/Logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to Petsfolio Sales Manager</Text>
        </View>

        <View style={styles.formContainer}>
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

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <CustomButton
            title={isLoading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.button}
          />
        </View>
      </ScrollView>
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
    alignItems: 'center',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    backgroundColor: Colors.white,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    padding: 8,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.regular,
    textAlign: 'center',
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
