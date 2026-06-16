import Text from '../components/AppText';
import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import CustomButton from '../components/CustomButton';
import { useCalls } from '../context/CallContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { Shadows } from '../styles/Shadows';
import {
  PhoneIcon,
  WhatsAppIcon,
  SMSIcon,
  AcceptIcon,
  RejectIcon,
  ClockIcon,
} from '../icons/Icons';
import {
  formatDate,
  formatTime,
  formatDuration,
  getInitials,
} from '../utils/formatters';
import { openWhatsApp, openSMS } from '../utils/ExternalLinks';
import { makeCall } from '../utils/DefaultDialer';

const CallDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { getCallById, addCallLog } = useCalls();
  const call = getCallById(route.params?.callId);

  if (!call) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Call Details"
          showBack
          onBack={() => navigation.goBack()}
        />
        <Text style={styles.errorText}>Call not found</Text>
      </View>
    );
  }

  const typeColor = getCallTypeColor(call.callType);

  const handleCallAgain = () => {
    makeCall(call.phoneNumber);
  };

  const handleCallbackReminder = () => {
    Alert.alert('Reminder Set', 'Callback reminder set for 1 hour from now.');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Call Details"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: typeColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(call.customerName)}
            </Text>
          </View>
          <Text style={styles.name}>{call.customerName}</Text>
          <Text style={styles.phone}>{call.phoneNumber}</Text>
          <View
            style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}
          >
            <Text style={[styles.typeText, { color: typeColor }]}>
              {call.callType.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="Duration" value={formatDuration(call.duration)} />
          <DetailRow label="Date" value={formatDate(call.date)} />
          <DetailRow label="Time" value={formatTime(call.date)} />
          <DetailRow
            label="Status"
            value={call.status.replace('_', ' ')}
            valueColor={getStatusColor(call.status)}
          />
        </View>

        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionGrid}>
          <CustomButton
            title="Call Again"
            onPress={handleCallAgain}
            icon={<PhoneIcon size={18} color={Colors.white} />}
            style={styles.actionBtn}
          />
          <CustomButton
            title="WhatsApp"
            variant="success"
            onPress={() => openWhatsApp(call.phoneNumber)}
            icon={<WhatsAppIcon size={18} color={Colors.white} />}
            style={styles.actionBtn}
          />
          <CustomButton
            title="Send SMS"
            variant="outline"
            onPress={() => openSMS(call.phoneNumber)}
            icon={<SMSIcon size={18} color={Colors.primary} />}
            style={styles.actionBtn}
          />
        </View>

        <Text style={styles.sectionTitle}>Call Controls</Text>
        <View style={styles.controlsRow}>
          <View style={styles.controlItem}>
            <AcceptIcon size={48} />
            <Text style={styles.controlLabel}>Accept</Text>
          </View>
          <View style={styles.controlItem}>
            <RejectIcon size={48} />
            <Text style={styles.controlLabel}>Reject</Text>
          </View>
          <TouchableOpacity
            style={styles.controlItem}
            onPress={() => openWhatsApp(call.phoneNumber)}
          >
            <WhatsAppIcon size={32} />
            <Text style={styles.controlLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlItem}
            onPress={() => openSMS(call.phoneNumber)}
          >
            <SMSIcon size={32} />
            <Text style={styles.controlLabel}>SMS</Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title="Set Callback Reminder"
          variant="ghost"
          onPress={handleCallbackReminder}
          icon={<ClockIcon size={18} color={Colors.text} />}
          style={styles.reminderBtn}
        />
      </ScrollView>
    </View>
  );
};

const DetailRow = ({ label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
      {value}
    </Text>
  </View>
);

const getStatusColor = status => {
  const map = {
    connected: Colors.success,
    missed: Colors.danger,
    rejected: Colors.warning,
    not_connected: Colors.textMuted,
  };
  return map[status];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  errorText: {
    textAlign: 'center',
    marginTop: Spacing.xxxl,
    color: Colors.textSecondary,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Theme.borderRadiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
  },
  name: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  phone: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  typeBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Theme.borderRadiusFull,
  },
  typeText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.semiBold,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.semiBold,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  actionGrid: {
    gap: Spacing.md,
  },
  actionBtn: {
    marginBottom: Spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  controlItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  controlLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  reminderBtn: {
    marginTop: Spacing.lg,
  },
});

export default CallDetailsScreen;
