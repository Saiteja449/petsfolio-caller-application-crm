import Text from './AppText';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { Shadows } from '../styles/Shadows';
import Theme from '../styles/Theme';
import { PhoneIcon, WhatsAppIcon, SMSIcon } from '../icons/Icons';
import { formatDate, formatPhone, getInitials, getAvatarColor } from '../utils/formatters';

const ContactCard = ({
  contact,
  index = 0,
  onCall,
  onWhatsApp,
  onSMS,
  showActions = true,
}) => {
  const avatarColor = getAvatarColor(index);

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.phone}>{formatPhone(contact.phone)}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Last: {formatDate(contact.lastCall)}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{contact.callCount} calls</Text>
          </View>
        </View>
        {contact.isFavorite && (
          <View style={styles.favBadge}>
            <Text style={styles.favText}>★</Text>
          </View>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onCall}>
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
        </View>
      )}
    </View>
  );
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.bold,
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
  favBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadiusFull,
  },
  favText: {
    color: Colors.warning,
    fontSize: Fonts.sizes.sm,
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

export default ContactCard;
