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
  requestOverlayPermission 
} from './src/utils/DefaultDialer';
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
            // Check Overlay (Appear on top) permission
            const hasOverlay = await checkOverlayPermission();
            if (!hasOverlay) {
              Alert.alert(
                'Appear on Top Permission Required',
                'To automatically display lead popups after a call ends, please enable the "Appear on top" (Display over other apps) permission.',
                [
                  { text: 'Later', style: 'cancel' },
                  { 
                    text: 'Open Settings', 
                    onPress: async () => {
                      await requestOverlayPermission();
                      // After overlay, check Xiaomi Autostart
                      const isXiaomi = await isXiaomiDevice();
                      if (isXiaomi) {
                        setTimeout(async () => {
                          Alert.alert(
                            'Xiaomi Background Autostart',
                            'Please also enable the "Autostart" permission in settings to allow call detection when the app is closed.',
                            [
                              { text: 'Later', style: 'cancel' },
                              { text: 'Open Settings', onPress: () => openAutostartSettings() },
                            ]
                          );
                        }, 2500);
                      }
                    }
                  },
                ]
              );
            } else {
              // Overlay already granted, check Xiaomi Autostart directly
              const isXiaomi = await isXiaomiDevice();
              if (isXiaomi) {
                Alert.alert(
                  'Xiaomi Background Autostart',
                  'To reliably detect call ends and show lead popups when the app is closed, please enable "Autostart" in your phone settings.',
                  [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => openAutostartSettings() },
                  ]
                );
              }
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
