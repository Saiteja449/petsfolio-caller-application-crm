import { NativeModules, Platform } from 'react-native';

const { DefaultDialer } = NativeModules;

export const requestDefaultDialer = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await DefaultDialer.requestDefaultDialer();
    return result;
  } catch (error) {
    console.error('Error requesting default dialer:', error);
    return false;
  }
};

export const checkDefaultDialer = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await DefaultDialer.checkDefaultDialer();
    return result;
  } catch (error) {
    console.error('Error checking default dialer:', error);
    return false;
  }
};

export const makeCall = async (phoneNumber) => {
  if (Platform.OS !== 'android') return false;
  try {
    return await DefaultDialer.makeCall(phoneNumber);
  } catch (error) {
    console.error('Error making call:', error);
    return false;
  }
};

export const answerCall = () => {
  if (Platform.OS !== 'android') return;
  DefaultDialer.answerCall();
};

export const rejectCall = () => {
  if (Platform.OS !== 'android') return;
  DefaultDialer.rejectCall();
};

export const endCall = () => {
  if (Platform.OS !== 'android') return;
  DefaultDialer.endCall();
};

export const setMute = (muted) => {
  if (Platform.OS !== 'android') return;
  DefaultDialer.setMute(muted);
};

export const setSpeaker = (speaker) => {
  if (Platform.OS !== 'android') return;
  DefaultDialer.setSpeaker(speaker);
};

export const getCurrentCall = async () => {
  if (Platform.OS !== 'android') return null;
  try {
    return await DefaultDialer.getCurrentCall();
  } catch (error) {
    console.error('Error getting current call:', error);
    return null;
  }
};
