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
  NativeModules,
  PermissionsAndroid,
} from 'react-native';
import Text from '../components/AppText';
import { useCalls } from '../context/CallContext';
import { useLeads } from '../context/LeadsContext';
import { useToast } from '../context/ToastContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { ChevronRightIcon } from '../icons/Icons';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomTimePicker from '../components/CustomTimePicker';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';

const STATUS_OPTIONS = [
  'New',
  'Follow Up',
  'Not Attended',
  'Price Issue',
  'Not Interested',
  'Not Responding',
  'Joined',
  'Job Posted',
  'Job Assigned',
];

const SERVICE_OPTIONS = [
  'Grooming',
  'Walking',
  'Training',
  'Pet Sitting',
  'Pet Insurance',
];

const FOLLOWUP_TYPES = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Consultation'];

const ActiveCallScreen = () => {
  const { pendingLeadUpdate, clearPendingLeadUpdate } = useCalls();
  const { leads, updateLead, createLead } = useLeads();
  const { showToast } = useToast();

  const [recordedFilePath, setRecordedFilePath] = useState(null);
  const [recordedFileName, setRecordedFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(null);

  const [existingLeadId, setExistingLeadId] = useState(null);
  const [originalStatus, setOriginalStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: '',
    service: '',
    nextFollowUp: '',
    followupTime: '',
    comments: '',
    followupType: '',
    importantLead: false,
  });

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isFollowupTypeOpen, setIsFollowupTypeOpen] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pendingLeadUpdate && leads) {
      const normalize = p => String(p).replace(/\D/g, '');
      const searchPhone = normalize(pendingLeadUpdate.phone);
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
        const matchStatus = match.status || 'New';
        setOriginalStatus(matchStatus);
        setFormData({
          name: match.name,
          phone: match.phone,
          status: matchStatus,
          service: match.service || 'Grooming',
          nextFollowUp: match.nextFollowUp || '',
          followupTime: match.followupTime || '',
          comments: match.notes || match.comments || '',
          followupType: match.followupType || 'Call',
          importantLead: match.importantLead || false,
        });
      } else {
        setExistingLeadId(null);
        setOriginalStatus('');
        setFormData({
          name: pendingLeadUpdate.name || '',
          phone: pendingLeadUpdate.phone,
          status: 'New',
          service: '',
          nextFollowUp: '',
          followupTime: '',
          comments: '',
          followupType: '',
          importantLead: false,
        });
      }
    }
  }, [pendingLeadUpdate, leads]);

  useEffect(() => {
    if (recordedFilePath && Platform.OS === 'android') {
      const { DefaultDialer } = NativeModules;
      if (DefaultDialer && DefaultDialer.getAudioDuration) {
        DefaultDialer.getAudioDuration(recordedFilePath).then(durationSec => {
          if (durationSec > 0) {
            setAudioDuration(durationSec);
          }
        }).catch(() => setAudioDuration(null));
      }
    } else {
      setAudioDuration(null);
      setIsPlaying(false);
    }
  }, [recordedFilePath]);

  if (!pendingLeadUpdate) return null;

  const requestStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleManualPick = async () => {
    try {
      const [res] = await pick({
        allowMultiSelection: false,
        type: [types.audio, types.allFiles],
        presentationStyle: 'fullScreen',
      });
      setRecordedFilePath(res.uri);
      setRecordedFileName(res.name);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled picker
      } else {
        console.error('DocumentPicker error:', err);
        Alert.alert('Error', 'Failed to pick recording file.');
      }
    }
  };

  const handleAttachRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const { DefaultDialer } = NativeModules;
        if (DefaultDialer) {
          const isActive = await DefaultDialer.checkActiveCall();
          if (isActive) {
            Alert.alert(
              'Active Call',
              'There is an active call. Please end the call first.',
            );
            return;
          }

          const hasPermission = await requestStoragePermission();
          if (hasPermission) {
            try {
              const file = await DefaultDialer.getLatestAudioFile();
              if (file && file.uri) {
                setRecordedFilePath(file.uri);
                setRecordedFileName(file.name);
                return;
              }
            } catch (err) {
              console.log(
                'Failed to auto-fetch audio, falling back to picker:',
                err,
              );
            }
          }
        }
      }

      // Fallback to manual document picker if auto fails or iOS
      await handleManualPick();
    } catch (err) {
      console.error('Error attaching recording:', err);
    }
  };

  const handlePlayAudio = async () => {
    if (!recordedFilePath) return;
    try {
      const { DefaultDialer } = NativeModules;
      if (DefaultDialer) {
        await DefaultDialer.playAudio(recordedFilePath);
        setIsPlaying(true);
        if (audioDuration) {
          setTimeout(() => setIsPlaying(false), audioDuration * 1000);
        }
      }
    } catch (err) {
      console.log('Playback error:', err);
    }
  };

  const handleStopAudio = async () => {
    try {
      const { DefaultDialer } = NativeModules;
      if (DefaultDialer) {
        await DefaultDialer.stopAudio();
        setIsPlaying(false);
      }
    } catch (err) {
      console.log('Stop error:', err);
    }
  };

  const handleSave = async () => {
    if (formData.status === 'Follow Up' && formData.nextFollowUp && formData.followupTime) {
      const today = new Date();
      const selectedDate = new Date(formData.nextFollowUp);
      if (
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate()
      ) {
        const match = formData.followupTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const period = match[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          const selectedTime = new Date(today);
          selectedTime.setHours(hours, minutes, 0, 0);
          if (selectedTime < today) {
            Alert.alert('Invalid Time', 'You cannot select a past time for today.');
            return;
          }
        }
      }
    }

    setIsSaving(true);
    let res;

    // Create payload, attaching recording if present
    const payload = { ...formData };
    if (recordedFilePath) {
      payload.recordingPath = recordedFilePath;
      payload.recordingName = recordedFileName;
    }

    if (existingLeadId) {
      res = await updateLead(existingLeadId, payload);
    } else {
      res = await createLead({
        ...payload,
        name: formData.name || 'Unknown Caller',
        source: 'Call',
      });
    }
    setIsSaving(false);
    if (res.success) {
      showToast('Lead saved successfully', 'success');
      clearPendingLeadUpdate();
      setRecordedFilePath(null);
      setRecordedFileName('');
    } else {
      showToast('Failed to save lead details', 'error');
    }
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.bottomSectionFull}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Update Lead Status</Text>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (isSaving || (existingLeadId && originalStatus === formData.status)) && { opacity: 0.5 }
              ]}
              onPress={handleSave}
              disabled={isSaving || (existingLeadId && originalStatus === formData.status)}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save & Close</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.recordingSection}>
              <Text style={styles.label}>Call Recording</Text>
              {recordedFilePath ? (
                <View style={styles.recordingSelected}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordingFileName} numberOfLines={1}>
                      {recordedFileName}
                    </Text>
                    {audioDuration !== null && (
                      <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        Duration: {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isPlaying ? (
                      <TouchableOpacity onPress={handleStopAudio} style={{ marginRight: 15 }}>
                        <Text style={{ color: Colors.danger, fontWeight: 'bold' }}>Stop</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={handlePlayAudio} style={{ marginRight: 15 }}>
                        <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Play</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        handleStopAudio();
                        setRecordedFilePath(null);
                        setRecordedFileName('');
                      }}
                    >
                      <Text style={styles.removeRecordingText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  <TouchableOpacity
                    style={styles.attachBtn}
                    onPress={handleAttachRecording}
                  >
                    <Text style={styles.attachBtnText}>
                      Auto-Fetch Latest Recording
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.attachBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
                    onPress={handleManualPick}
                  >
                    <Text style={[styles.attachBtnText, { color: Colors.primary }]}>
                      Choose File Manually
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

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
              onChangeText={text =>
                setFormData({
                  ...formData,
                  phone: text.replace(/[^0-9+]/g, ''),
                })
              }
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
                {(formData.service === 'Pet Insurance'
                  ? [...STATUS_OPTIONS, 'Policy Active']
                  : STATUS_OPTIONS
                ).map(opt => (
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

                <Text style={styles.label}>Next Follow Up Date</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setIsDatePickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      !formData.nextFollowUp && { color: Colors.textMuted },
                    ]}
                  >
                    {formData.nextFollowUp || 'Select Date (e.g. 2026-06-20)'}
                  </Text>
                  <ChevronRightIcon size={16} color={Colors.textMuted} />
                </TouchableOpacity>

                <CustomDatePicker
                  visible={isDatePickerVisible}
                  selectedDate={formData.nextFollowUp}
                  onClose={() => setIsDatePickerVisible(false)}
                  onSelect={date => {
                    setFormData({ ...formData, nextFollowUp: date });
                    setIsDatePickerVisible(false);
                  }}
                />

                <Text style={styles.label}>Follow Up Time</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setIsTimePickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      !formData.followupTime && { color: Colors.textMuted },
                    ]}
                  >
                    {formData.followupTime || 'Select Time'}
                  </Text>
                  <ChevronRightIcon size={16} color={Colors.textMuted} />
                </TouchableOpacity>

                <CustomTimePicker
                  visible={isTimePickerVisible}
                  selectedTime={formData.followupTime}
                  onClose={() => setIsTimePickerVisible(false)}
                  onSelect={time => {
                    setFormData({ ...formData, followupTime: time });
                    setIsTimePickerVisible(false);
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
  bottomSectionFull: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginTop: Spacing.huge,
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
  recordingSection: {
    marginBottom: Spacing.md,
  },
  attachBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  attachBtnText: {
    color: Colors.primary,
    fontFamily: Fonts.family.medium,
  },
  recordingSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.md,
    borderRadius: Theme.borderRadius,
  },
  recordingFileName: {
    color: Colors.text,
    fontFamily: Fonts.family.medium,
    flex: 1,
    marginRight: Spacing.md,
  },
  removeRecordingText: {
    color: Colors.danger || '#ef4444',
    fontFamily: Fonts.family.medium,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
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
