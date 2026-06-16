import { Linking, Alert } from 'react-native';

export const openWhatsApp = (phone) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const url = `whatsapp://send?phone=${cleanPhone}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert('Error', 'WhatsApp is not installed on your device');
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => console.error('An error occurred', err));
};

export const openSMS = (phone) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const url = `sms:${cleanPhone}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert('Error', 'SMS is not supported on your device');
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => console.error('An error occurred', err));
};
