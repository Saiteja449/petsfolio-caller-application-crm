import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const makeCall = async (phoneNumber) => {
  try {
    const url = `tel:${phoneNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await AsyncStorage.setItem('pendingLeadUpdate', JSON.stringify({ phone: phoneNumber }));
      await Linking.openURL(url);
      return true;
    } else {
      console.warn('Phone dialer is not available');
      return false;
    }
  } catch (error) {
    console.error('Error making call:', error);
    return false;
  }
};
