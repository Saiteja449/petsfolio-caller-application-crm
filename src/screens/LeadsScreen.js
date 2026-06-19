import Text from '../components/AppText';
import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import ContactCard from '../components/ContactCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { useLeads } from '../context/LeadsContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { Shadows } from '../styles/Shadows';
import {
  HistoryIcon,
  SettingsIcon,
  ChevronRightIcon,
  DialPadIcon,
} from '../icons/Icons';
import { openWhatsApp, openSMS } from '../utils/ExternalLinks';
import { makeCall } from '../utils/DefaultDialer';
import DialerModal from '../components/DialerModal';

const TABS = [
  { key: 'New', label: 'New' },
  { key: 'TodayFollowup', label: 'Today Followups' },
  { key: 'UpcomingFollowup', label: 'Upcoming Followups' },
  { key: 'NotAttended', label: 'Not Attended' },
  { key: 'Joined', label: 'Joined' },
  { key: 'JobPosted', label: 'Job Posted' },
  { key: 'Converted', label: 'Converted' },
  { key: 'Lost', label: 'Lost' },
];

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

const LeadsScreen = () => {
  const navigation = useNavigation();
  const { getMyLeads, updateLead } = useLeads();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('New');
  const [isDialerVisible, setIsDialerVisible] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editForm, setEditForm] = useState({
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

  const myLeads = getMyLeads().filter(l => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);

    if (!matchesSearch) return false;

    const s = (l.status || '').toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];
    const leadFollowUp = l.nextFollowUp || '';

    if (activeTab === 'New') return s === 'new';
    if (activeTab === 'TodayFollowup')
      return s === 'follow up' && leadFollowUp === todayStr;
    if (activeTab === 'UpcomingFollowup')
      return s === 'follow up' && leadFollowUp > todayStr;
    if (activeTab === 'JobPosted') return s === 'job posted';
    if (activeTab === 'Converted') return s === 'job assigned';
    if (activeTab === 'Joined') return s === 'joined';
    if (activeTab === 'Lost')
      return (
        s === 'price issue' || s === 'not answered' || s === 'not interested'
      );
    if (activeTab === 'NotAttended')
      return (
        s === 'not attended' ||
        s === 'not responding' ||
        (s === 'follow up' && leadFollowUp < todayStr)
      );

    return true;
  });

  const handleEditLead = lead => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      phone: lead.phone,
      status: lead.status || 'New',
      service: lead.service || 'Grooming',
      nextFollowUp: lead.nextFollowUp || '',
      comments: lead.comments || '',
      followupType: lead.followupType || 'Call',
      importantLead: lead.importantLead || false,
    });
    setIsStatusOpen(false);
    setIsServiceOpen(false);
    setIsFollowupTypeOpen(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (selectedLead) {
      updateLead(selectedLead.id, editForm);
      setEditModalVisible(false);
      setSelectedLead(null);
    }
  };

  const navigateToWhatsApp = (phone, name) => {
    openWhatsApp(phone);
  };

  const navigateToSMS = (phone, name) => {
    openSMS(phone);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Assigned Leads"
        subtitle={`${myLeads.length} leads to follow`}
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search leads..."
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={myLeads}
        keyExtractor={item => item.id}
        initialNumToRender={10}
        windowSize={5}
        ListEmptyComponent={
          <EmptyState
            icon={<HistoryIcon size={48} color={Colors.textMuted} />}
            title="No leads found"
            message="You have no assigned leads matching the criteria."
          />
        }
        renderItem={({ item: lead, index }) => {
          return (
            <ContactCard
              contact={lead}
              index={index}
              onCall={() => makeCall(lead.phone)}
              onWhatsApp={() => navigateToWhatsApp(lead.phone, lead.name)}
              onSMS={() => navigateToSMS(lead.phone, lead.name)}
              onEdit={() => handleEditLead(lead)}
            />
          );
        }}
      />

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Details</Text>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.huge }}
            >
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={text => setEditForm({ ...editForm, name: text })}
                placeholder="Lead Name"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={text => setEditForm({ ...editForm, phone: text })}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Service Interest</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsServiceOpen(!isServiceOpen)}
              >
                <Text style={styles.dropdownSelectorText}>
                  {editForm.service || 'Select Service'}
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
                        setEditForm({ ...editForm, service: opt });
                        setIsServiceOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          editForm.service === opt &&
                            styles.dropdownOptionTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Status</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsStatusOpen(!isStatusOpen)}
              >
                <Text style={styles.dropdownSelectorText}>
                  {editForm.status || 'Select Status'}
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
                        setEditForm({ ...editForm, status: opt });
                        setIsStatusOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          editForm.status === opt &&
                            styles.dropdownOptionTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {editForm.status === 'Follow Up' && (
                <View style={styles.followUpContainer}>
                  <Text style={styles.inputLabel}>Follow-up Type</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setIsFollowupTypeOpen(!isFollowupTypeOpen)}
                  >
                    <Text style={styles.dropdownSelectorText}>
                      {editForm.followupType || 'Select Type'}
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
                            setEditForm({ ...editForm, followupType: opt });
                            setIsFollowupTypeOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              editForm.followupType === opt &&
                                styles.dropdownOptionTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.inputLabel}>
                    Next Follow Up Date (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.nextFollowUp}
                    onChangeText={text =>
                      setEditForm({ ...editForm, nextFollowUp: text })
                    }
                    placeholder="e.g. 2026-06-20"
                  />

                  <Text style={styles.inputLabel}>Comments</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.comments}
                    onChangeText={text =>
                      setEditForm({ ...editForm, comments: text })
                    }
                    placeholder="Enter your comments..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.importantToggle}
                activeOpacity={0.8}
                onPress={() =>
                  setEditForm({
                    ...editForm,
                    importantLead: !editForm.importantLead,
                  })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    editForm.importantLead && styles.checkboxActive,
                  ]}
                />
                <Text style={styles.importantToggleText}>
                  🔥 Important Hot Lead
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsDialerVisible(true)}
        activeOpacity={0.8}
      >
        <DialPadIcon size={24} color={Colors.white} />
      </TouchableOpacity>

      <DialerModal
        visible={isDialerVisible}
        onClose={() => setIsDialerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
  },
  tabScroll: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 48,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    fontFamily: Fonts.family.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.family.semiBold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Aligns modal to the bottom
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%', // Exactly 80% of screen height
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    ...Shadows.card,
  },
  modalHeader: {
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    fontFamily: Fonts.family.regular,
    marginBottom: Spacing.md,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Theme.borderRadius,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.sizes.sm,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Theme.borderRadius,
  },
  saveButtonText: {
    color: Colors.card,
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.sizes.sm,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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

export default LeadsScreen;
