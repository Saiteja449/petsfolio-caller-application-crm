import Text from './AppText';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { Shadows } from '../styles/Shadows';
import Theme from '../styles/Theme';
import {
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  PhoneMissedIcon,
  WhatsAppIcon,
  SMSIcon,
  InfoIcon,
} from '../icons/Icons';
import { formatDate, formatTime, formatDuration, getCallTypeColor } from '../utils/formatters';

const CallTypeIcon = ({ type, size = 20 }) => {
  switch (type) {
    case 'incoming':
      return <PhoneIncomingIcon size={size} />;
    case 'outgoing':
      return <PhoneOutgoingIcon size={size} />;
    case 'missed':
      return <PhoneMissedIcon size={size} />;
    default:
      return <PhoneIcon size={size} color={Colors.textMuted} />;
  }
};

const CallCard = ({
  call,
  onCallAgain,
  onWhatsApp,
  onSMS,
  onViewDetails,
  showActions = true,
  detailsLabel = 'Details',
  DetailsIcon = InfoIcon,
}) => {
  const typeColor = getCallTypeColor(call.callType);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.mainRow} onPress={onViewDetails} activeOpacity={0.7}>
        <View style={[styles.typeIndicator, { backgroundColor: typeColor + '18' }]}>
          <CallTypeIcon type={call.callType} size={20} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{call.customerName}</Text>
          <Text style={styles.phone}>{call.phoneNumber}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {call.callType.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{formatDate(call.date)}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{formatTime(call.date)}</Text>
          </View>
        </View>
        <View style={styles.rightCol}>
          {call.duration > 0 && (
            <Text style={styles.duration}>{formatDuration(call.duration)}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(call.status) + '18' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(call.status) }]}>
              {call.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onCallAgain}>
            <PhoneIcon size={16} color={Colors.primary} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onWhatsApp}>
            <WhatsAppIcon size={16} />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onSMS}>
            <SMSIcon size={16} />
            <Text style={styles.actionText}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onViewDetails}>
            <DetailsIcon size={16} color={Colors.primary} />
            <Text style={styles.actionText}>{detailsLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const getStatusColor = (status) => {
  const map = {
    connected: Colors.success,
    missed: Colors.danger,
    rejected: Colors.warning,
    not_connected: Colors.textMuted,
  };
  return map[status] || Colors.textSecondary;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  typeIndicator: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.semiBold,
    color: Colors.text,
  },
  phone: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  typeText: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.family.semiBold,
  },
  meta: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
  },
  dot: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadiusFull,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.family.semiBold,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  actionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
  },
});

export default CallCard;
