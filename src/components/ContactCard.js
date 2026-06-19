import Text from './AppText';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { Shadows } from '../styles/Shadows';
import Theme from '../styles/Theme';
import { PhoneIcon, WhatsAppIcon, SMSIcon } from '../icons/Icons';
import {
  formatDate,
  formatPhone,
  getInitials,
  getAvatarColor,
} from '../utils/formatters';

const ContactCard = ({
  contact,
  index = 0,
  onCall,
  onWhatsApp,
  onSMS,
  onEdit,
  showActions = true,
}) => {
  const avatarColor = getAvatarColor(index);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.phone}>{formatPhone(contact.phone)}</Text>
          </View>
        </View>
        {onEdit && (
          <TouchableOpacity style={styles.editBadge} onPress={onEdit}>
            <Text style={styles.editBadgeText}>Update Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {(contact.notes ||
        (contact.status === 'Follow Up' && contact.nextFollowUp)) && (
        <View style={styles.bodyContent}>
          {contact.notes ? (
            <Text style={styles.notes} numberOfLines={2}>
              "{contact.notes}"
            </Text>
          ) : null}
          {contact.status === 'Follow Up' && contact.nextFollowUp && (
            <View style={styles.followupBadge}>
              <View style={styles.followupDot} />
              <Text style={styles.followupText}>
                Follow Up: {formatDate(contact.nextFollowUp)}
              </Text>
            </View>
          )}
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionCall]}
            onPress={onCall}
          >
            <PhoneIcon size={16} color={Colors.primary} />
            <Text style={[styles.actionText, styles.actionTextCall]}>Call</Text>
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
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius * 1.5,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    ...Shadows.card,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.light,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  phone: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
  },
  editBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius,
  },
  editBadgeText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.family.bold,
  },
  bodyContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  notes: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  followupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  followupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
    marginRight: 6,
  },
  followupText: {
    color: Colors.text,
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.semiBold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: '#F1F5F9',
    borderRadius: Theme.borderRadius,
    gap: 6,
  },
  actionCall: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  actionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.bold,
  },
  actionTextCall: {
    color: Colors.primary,
  },
});

export default ContactCard;
