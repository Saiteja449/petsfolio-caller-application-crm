import Text from '../components/AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useCalls } from '../context/CallContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { AcceptIcon, RejectIcon, WhatsAppIcon, SMSIcon } from '../icons/Icons';
import { getInitials } from '../utils/formatters';
import { answerCall, rejectCall } from '../utils/DefaultDialer';
import { openWhatsApp, openSMS } from '../utils/ExternalLinks';

const IncomingCallScreen = () => {
  const { incomingCall } = useCalls();
  if (!incomingCall) return null;
  const callData = incomingCall;

  const handleAccept = () => {
    answerCall();
  };

  const handleReject = () => {
    rejectCall();
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.label}>Incoming Call</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(callData.customerName)}
            </Text>
          </View>
          <Text style={styles.name}>{callData.customerName}</Text>
          <Text style={styles.phone}>{callData.phoneNumber}</Text>
          <Text style={styles.ringing}>Ringing...</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionCol} onPress={handleReject}>
              <RejectIcon size={56} />
              <Text style={styles.actionLabel}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCol} onPress={handleAccept}>
              <AcceptIcon size={56} />
              <Text style={styles.actionLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  label: {
    fontSize: Fonts.sizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Fonts.sizes.xxxl,
    fontFamily: Fonts.family.bold,
  },
  name: {
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
    color: Colors.white,
  },
  phone: {
    fontSize: Fonts.sizes.lg,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  ringing: {
    fontSize: Fonts.sizes.md,
    color: Colors.primaryLight,
    marginTop: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.huge,
    marginTop: Spacing.huge,
  },
  actionCol: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  actionLabel: {
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    marginTop: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.xxxl,
    marginTop: Spacing.xxxl,
  },
  quickItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
  },
});

export default IncomingCallScreen;
