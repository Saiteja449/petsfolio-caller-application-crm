import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Text from '../components/AppText';
import { useCalls } from '../context/CallContext';
import { useLeads } from '../context/LeadsContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { RejectIcon, ChevronRightIcon } from '../icons/Icons';
import { getInitials, formatPhone } from '../utils/formatters';
import { endCall, setMute, setSpeaker } from '../utils/DefaultDialer';
import CustomDatePicker from '../components/CustomDatePicker';

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

const STATUS_OPTIONS = [
  'New',
  'Follow Up',
  'Not Attended',
  'Not Answered',
  'Price Issue',
  'Joined',
  'Job Posted',
  'Job Assigned',
];

const SERVICE_OPTIONS = [
  'Grooming',
  'Walking',
  'Training',
  'Sitting',
  'Insurance',
];

const FOLLOWUP_TYPES = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Consultation'];

const ActiveCallScreen = () => {
  const { activeCall } = useCalls();
  const { leads, updateLead, createLead } = useLeads();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [existingLeadId, setExistingLeadId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: '',
    service: '',
    nextFollowUp: '',
    comments: '',
    followupType: '',
    importantLead: false,
  });

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isFollowupTypeOpen, setIsFollowupTypeOpen] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let interval;
    if (activeCall?.status === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  useEffect(() => {
    if (activeCall && leads.length > 0) {
      const normalize = p => String(p).replace(/\D/g, '');
      const searchPhone = normalize(activeCall.phoneNumber);
      const match = leads.find(l => {
        const p = normalize(l.phone);
        return (
          p &&
          p.length > 5 &&
          (p.includes(searchPhone) || searchPhone.includes(p))
        );
      });

      if (match) {
        setExistingLeadId(match.id);
        setFormData({
          name: match.name,
          phone: match.phone,
          status: match.status || 'New',
          service: match.service || 'Grooming',
          nextFollowUp: match.nextFollowUp || '',
          comments: match.comments || '',
          followupType: match.followupType || 'Call',
          importantLead: match.importantLead || false,
        });
      } else {
        setExistingLeadId(null);
        setFormData({
          name:
            activeCall.customerName && activeCall.customerName !== 'Unknown'
              ? activeCall.customerName
              : '',
          phone: activeCall.phoneNumber,
          status: 'New',
          service: '',
          nextFollowUp: '',
          comments: '',
          followupType: '',
          importantLead: false,
        });
      }
    }
  }, [activeCall?.phoneNumber, leads]);

  if (!activeCall) return null;
  const callData = activeCall;

  const handleEndCall = () => {
    endCall();
  };

  const handleSave = async () => {
    setIsSaving(true);
    let res;
    if (existingLeadId) {
      res = await updateLead(existingLeadId, formData);
    } else {
      res = await createLead({
        ...formData,
        name: formData.name || 'Unknown Caller',
        source: 'Call',
      });
      if (res.success && res.data?.id) {
        setExistingLeadId(res.data.id);
      }
    }
    setIsSaving(false);
    if (res.success) {
      endCall();
    } else {
      Alert.alert('Error', 'Failed to save lead details.');
    }
  };

  const formatDuration = seconds => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top 35% - Call Controls */}
        <View style={styles.topSection}>
          <View style={styles.callerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(callData.customerName)}
              </Text>
            </View>
            <View style={styles.callerTextWrap}>
              <Text style={styles.name}>
                {callData.customerName || 'Unknown Caller'}
              </Text>
              <Text style={styles.phone}>
                {formatPhone(callData.phoneNumber)}
              </Text>
              <Text style={styles.status}>
                {callData.status === 'dialing'
                  ? 'Dialing...'
                  : callData.status === 'active'
                  ? formatDuration(callDuration)
                  : 'Connecting...'}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <CircleButton
              label="Mute"
              iconText="M"
              active={isMuted}
              onPress={() => {
                setMute(!isMuted);
                setIsMuted(!isMuted);
              }}
            />
            <CircleButton
              label="Speaker"
              iconText="S"
              active={isSpeaker}
              onPress={() => {
                setSpeaker(!isSpeaker);
                setIsSpeaker(!isSpeaker);
              }}
            />
          </View>
        </View>

        {/* Bottom 65% - Lead Form */}
        <View style={styles.bottomSection}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {existingLeadId ? 'Update Lead' : 'Create Lead'}
            </Text>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save to End</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor={Colors.textMuted}
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={text => setFormData({ ...formData, phone: text })}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Service Interest</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsServiceOpen(!isServiceOpen)}
            >
              <Text style={styles.dropdownSelectorText}>
                {formData.service || 'Select Service'}
              </Text>
              <ChevronRightIcon size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {isServiceOpen && (
              <View style={styles.dropdownOptionsContainer}>
                {SERVICE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setFormData({ ...formData, service: opt });
                      setIsServiceOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.service === opt &&
                          styles.dropdownOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsStatusOpen(!isStatusOpen)}
            >
              <Text style={styles.dropdownSelectorText}>
                {formData.status || 'Select Status'}
              </Text>
              <ChevronRightIcon size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {isStatusOpen && (
              <ScrollView
                style={styles.dropdownOptionsContainerScroll}
                nestedScrollEnabled={true}
              >
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setFormData({ ...formData, status: opt });
                      setIsStatusOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        formData.status === opt &&
                          styles.dropdownOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {formData.status === 'Follow Up' && (
              <View style={styles.followUpContainer}>
                <Text style={styles.label}>Follow-up Type</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setIsFollowupTypeOpen(!isFollowupTypeOpen)}
                >
                  <Text style={styles.dropdownSelectorText}>
                    {formData.followupType || 'Select Type'}
                  </Text>
                  <ChevronRightIcon size={16} color={Colors.textMuted} />
                </TouchableOpacity>
                {isFollowupTypeOpen && (
                  <View style={styles.dropdownOptionsContainer}>
                    {FOLLOWUP_TYPES.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setFormData({ ...formData, followupType: opt });
                          setIsFollowupTypeOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            formData.followupType === opt &&
                              styles.dropdownOptionTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.label}>
                  Next Follow Up Date
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setIsDatePickerVisible(true)}
                >
                  <Text style={[styles.dropdownSelectorText, !formData.nextFollowUp && { color: Colors.textMuted }]}>
                    {formData.nextFollowUp || 'Select Date (e.g. 2026-06-20)'}
                  </Text>
                  <ChevronRightIcon size={16} color={Colors.textMuted} />
                </TouchableOpacity>

                <CustomDatePicker
                  visible={isDatePickerVisible}
                  selectedDate={formData.nextFollowUp}
                  onClose={() => setIsDatePickerVisible(false)}
                  onSelect={(date) => {
                    setFormData({ ...formData, nextFollowUp: date });
                    setIsDatePickerVisible(false);
                  }}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.importantToggle}
              activeOpacity={0.8}
              onPress={() =>
                setFormData({
                  ...formData,
                  importantLead: !formData.importantLead,
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.importantLead && styles.checkboxActive,
                ]}
              />
              <Text style={styles.importantToggleText}>
                🔥 Important Hot Lead
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Comments / Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.comments}
              onChangeText={text =>
                setFormData({ ...formData, comments: text })
              }
              placeholder="Enter your comments..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topSection: {
    flex: 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.huge,
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 36,
    color: Colors.white,
    fontFamily: Fonts.family.bold,
  },
  callerTextWrap: {
    alignItems: 'center',
  },
  name: {
    fontSize: Fonts.sizes.xxl,
    color: Colors.white,
    fontFamily: Fonts.family.bold,
    textAlign: 'center',
  },
  phone: {
    fontSize: Fonts.sizes.lg,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  status: {
    fontSize: Fonts.sizes.md,
    color: Colors.white,
    marginTop: Spacing.sm,
    opacity: 0.9,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.huge,
  },
  actionCol: {
    alignItems: 'center',
    width: 70,
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  circleBtnActive: {
    backgroundColor: Colors.white,
  },
  circleBtnIcon: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.family.bold,
  },
  circleBtnIconActive: {
    color: Colors.text,
  },
  actionLabel: {
    color: Colors.white,
    fontSize: Fonts.sizes.xs,
    opacity: 0.9,
  },
  bottomSection: {
    flex: 0.55,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Theme.borderRadius,
  },
  saveBtnText: {
    color: Colors.white,
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.sizes.sm,
  },
  formScroll: {
    flex: 1,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    fontFamily: Fonts.family.regular,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  dropdownSelectorText: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    fontFamily: Fonts.family.regular,
  },
  dropdownOptionsContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Theme.borderRadius,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  dropdownOptionsContainerScroll: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Theme.borderRadius,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
    maxHeight: 120,
  },
  dropdownOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownOptionText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.regular,
  },
  dropdownOptionTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.family.semiBold,
  },
  followUpContainer: {
    marginTop: Spacing.sm,
  },
  importantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
    marginRight: Spacing.md,
    backgroundColor: Colors.card,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  importantToggleText: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    fontFamily: Fonts.family.bold,
  },
});

export default ActiveCallScreen;
