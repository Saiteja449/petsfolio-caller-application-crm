import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppProvider from './src/context/AppProvider';
import AppNavigator from './src/navigation/AppNavigator';
import { requestDefaultDialer } from './src/utils/DefaultDialer';
import { Colors } from './src/styles/Colors';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
            PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          ]);
          
          if (
            granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('Permissions granted');
          } else {
            console.log('Permissions denied');
          }

          // Request default dialer
          await requestDefaultDialer();

        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={Colors.card} />
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
