import Text from './AppText';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { BackspaceIcon, PhoneIcon } from '../icons/Icons';
import { formatPhone } from '../utils/formatters';
import { makeCall } from '../utils/DefaultDialer';

const DIAL_KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

const DialerModal = ({ visible, onClose }) => {
  const [dialedNumber, setDialedNumber] = useState('');

  const handleKeyPress = (digit) => {
    setDialedNumber(dialedNumber + digit);
  };

  const handleBackspace = () => {
    setDialedNumber(dialedNumber.slice(0, -1));
  };

  const handleCall = async () => {
    if (!dialedNumber) return;
    await makeCall(dialedNumber);
    setDialedNumber('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              
              <Text style={styles.display}>
                {dialedNumber ? formatPhone(dialedNumber) : 'Enter number'}
              </Text>

              <View style={styles.keysGrid}>
                {DIAL_KEYS.map((key) => (
                  <TouchableOpacity
                    key={key.digit}
                    style={styles.dialKey}
                    onPress={() => handleKeyPress(key.digit)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.dialKeyText}>{key.digit}</Text>
                    {key.sub ? <Text style={styles.dialSubText}>{key.sub}</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.callRow}>
                <TouchableOpacity
                  style={styles.backspaceBtn}
                  onPress={handleBackspace}
                  onLongPress={() => setDialedNumber('')}
                >
                  <BackspaceIcon size={28} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <PhoneIcon size={28} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.backspaceBtn} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Theme.borderRadiusLg,
    borderTopRightRadius: Theme.borderRadiusLg,
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  display: {
    fontSize: Fonts.sizes.xxxl,
    fontFamily: Fonts.family.regular,
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    minHeight: 60,
  },
  keysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 280,
    gap: Spacing.md,
  },
  dialKey: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.dialPadKey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialKeyText: {
    fontSize: Fonts.sizes.xxl,
    color: Colors.dialPadKeyText,
  },
  dialSubText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xxl,
  },
  backspaceBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: 64,
    height: 64,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.callGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DialerModal;
