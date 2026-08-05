import { Platform, Linking, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DefaultDialer } = NativeModules;

export const requestDefaultDialer = async () => {
  if (Platform.OS === 'android' && DefaultDialer?.requestDefaultDialer) {
    try {
      return await DefaultDialer.requestDefaultDialer();
    } catch (error) {
      console.error('Failed to request default dialer:', error);
      return false;
    }
  }
  return false;
};

export const checkDefaultDialer = async () => {
  if (Platform.OS === 'android' && DefaultDialer?.checkDefaultDialer) {
    try {
      return await DefaultDialer.checkDefaultDialer();
    } catch (error) {
      console.error('Failed to check default dialer:', error);
      return false;
    }
  }
  return false;
};

export const isXiaomiDevice = async () => {
  if (Platform.OS === 'android' && DefaultDialer?.isXiaomiDevice) {
    try {
      return await DefaultDialer.isXiaomiDevice();
    } catch (error) {
      console.error('Failed to check if Xiaomi device:', error);
      return false;
    }
  }
  return false;
};

export const openAutostartSettings = async () => {
  if (Platform.OS === 'android' && DefaultDialer?.openAutostartSettings) {
    try {
      return await DefaultDialer.openAutostartSettings();
    } catch (error) {
      console.error('Failed to open autostart settings:', error);
      return false;
    }
  }
  return false;
};

export const checkOverlayPermission = async () => {
  if (Platform.OS === 'android' && DefaultDialer?.checkOverlayPermission) {
    try {
      return await DefaultDialer.checkOverlayPermission();
    } catch (error) {
      console.error('Failed to check overlay permission:', error);
      return false;
    }
  }
  return false;
};

export const requestOverlayPermission = async () => {
  if (Platform.OS === 'android' && DefaultDialer?.requestOverlayPermission) {
    try {
      return await DefaultDialer.requestOverlayPermission();
    } catch (error) {
      console.error('Failed to request overlay permission:', error);
      return false;
    }
  }
  return false;
};

export const makeCall = async (phoneNumber) => {
  try {
    let cleanNumber = String(phoneNumber).replace(/[^\d+]/g, '');
    if (!cleanNumber.startsWith('+')) {
      if (cleanNumber.startsWith('91') && cleanNumber.length > 10) {
        cleanNumber = '+' + cleanNumber;
      } else if (cleanNumber.length === 10) {
        cleanNumber = '+91' + cleanNumber;
      }
    }
    const url = `tel:${cleanNumber}`;
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
