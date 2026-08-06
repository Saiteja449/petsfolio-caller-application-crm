import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppProvider from './src/context/AppProvider';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { 
  isXiaomiDevice, 
  openAutostartSettings, 
  checkOverlayPermission, 
  requestOverlayPermission,
  checkBatteryOptimizationExempt,
  requestBatteryOptimizationExempt,
  openOemAutostartSettings
} from './src/utils/DefaultDialer';
import { startCallMonitorService } from './src/utils/PostCallBridge';
import { Colors } from './src/styles/Colors';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
            PermissionsAndroid.PERMISSIONS.CALL_PHONE,
            PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          ]);

          if (
            granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
              PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('Permissions granted');

            // Start foreground call monitoring service
            try {
              await startCallMonitorService();
              console.log('Foreground Call Monitor Service started');
            } catch (serviceErr) {
              console.warn('Failed to start call monitor service:', serviceErr);
            }

            const checkBatteryAndOemSettings = async () => {
              const isBatteryExempt = await checkBatteryOptimizationExempt();
              if (!isBatteryExempt) {
                Alert.alert(
                  'Battery Optimization Exemption',
                  'To ensure call logging works reliably in the background, please exclude Petsfolio from battery optimizations.',
                  [
                    { 
                      text: 'Later', 
                      style: 'cancel',
                      onPress: () => checkOemAutostart()
                    },
                    { 
                      text: 'Exclude App', 
                      onPress: async () => {
                        await requestBatteryOptimizationExempt();
                        setTimeout(() => checkOemAutostart(), 3000);
                      }
                    }
                  ]
                );
              } else {
                await checkOemAutostart();
              }
            };

            const checkOemAutostart = async () => {
              const isXiaomi = await isXiaomiDevice();
              const manufacturer = Platform.constants?.Manufacturer?.toLowerCase() || '';
              const isKnownOem = isXiaomi || 
                                 manufacturer.includes('oppo') || 
                                 manufacturer.includes('vivo') || 
                                 manufacturer.includes('realme') || 
                                 manufacturer.includes('oneplus') || 
                                 manufacturer.includes('samsung');
                                 
              if (isKnownOem) {
                Alert.alert(
                  'Background Permissions Required',
                  'To reliably receive calls when the app is closed, please enable "Autostart" and "Background Popups" in your system settings.',
                  [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => openOemAutostartSettings() }
                  ]
                );
              }
            };

            // Check Overlay (Appear on top) permission
            const hasOverlay = await checkOverlayPermission();
            if (!hasOverlay) {
              Alert.alert(
                'Appear on Top Permission Required',
                'To automatically display lead popups after a call ends, please enable the "Appear on top" (Display over other apps) permission.',
                [
                  { 
                    text: 'Later', 
                    style: 'cancel',
                    onPress: () => checkBatteryAndOemSettings()
                  },
                  { 
                    text: 'Open Settings', 
                    onPress: async () => {
                      await requestOverlayPermission();
                      setTimeout(() => checkBatteryAndOemSettings(), 3000);
                    }
                  },
                ]
              );
            } else {
              await checkBatteryAndOemSettings();
            }
          } else {
            console.log('Permissions denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }

      // Artificial delay to allow splash screen animation to play
      setTimeout(() => {
        setIsAppReady(true);
      }, 1500);
    };

    requestPermissions();
  }, []);

  if (!isAppReady) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={Colors.card}
        />
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
