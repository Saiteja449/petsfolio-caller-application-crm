import Text from '../components/AppText';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useCalls } from '../context/CallContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { RejectIcon } from '../icons/Icons';
import { getInitials, formatPhone } from '../utils/formatters';
import { endCall } from '../utils/DefaultDialer';

// Simple fallback icons for in-call actions since we might not have them all
const CircleButton = ({ label, iconText, active, onPress, color }) => (
  <TouchableOpacity style={styles.actionCol} onPress={onPress}>
    <View
      style={[
        styles.circleBtn,
        active && styles.circleBtnActive,
        color && { backgroundColor: color },
      ]}
    >
      <Text
        style={[styles.circleBtnIcon, active && styles.circleBtnIconActive]}
      >
        {iconText}
      </Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActiveCallScreen = () => {
  const { activeCall } = useCalls();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isRecording, setIsRecording] = useState(true);

  const callData = activeCall || {
    customerName: 'Test Caller',
    phoneNumber: '+1 234 567 8900',
    status: 'connected',
  };

  const handleEndCall = () => {
    endCall();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(callData.customerName || callData.phoneNumber)}
          </Text>
        </View>
        <Text style={styles.name}>{callData.customerName}</Text>
        <Text style={styles.phone}>{formatPhone(callData.phoneNumber)}</Text>
        <Text style={styles.status}>
          {callData.status === 'dialing' ? 'Dialing...' : '00:00'}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.grid}>
          <CircleButton
            label="Mute"
            iconText="M"
            active={isMuted}
            onPress={() => setIsMuted(!isMuted)}
          />
          <CircleButton
            label="Speaker"
            iconText="S"
            active={isSpeaker}
            onPress={() => setIsSpeaker(!isSpeaker)}
          />
          <CircleButton
            label="Record"
            iconText="R"
            active={isRecording}
            onPress={() => setIsRecording(!isRecording)}
          />
        </View>

        <TouchableOpacity style={styles.endCallWrap} onPress={handleEndCall}>
          <View style={styles.endCallBtn}>
            <RejectIcon size={40} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B', // Dark Truecaller style background
    zIndex: 1000,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Fonts.sizes.xxxxl,
    fontFamily: Fonts.family.bold,
  },
  name: {
    fontSize: 28,
    fontFamily: Fonts.family.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  phone: {
    fontSize: Fonts.sizes.lg,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  status: {
    fontSize: Fonts.sizes.md,
    color: Colors.white,
    opacity: 0.8,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 60,
  },
  actionCol: {
    alignItems: 'center',
    width: 80,
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  circleBtnActive: {
    backgroundColor: Colors.white,
  },
  circleBtnIcon: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: Fonts.family.bold,
  },
  circleBtnIconActive: {
    color: Colors.text,
  },
  actionLabel: {
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    opacity: 0.9,
  },
  endCallWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444', // Red end call button
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default ActiveCallScreen;
