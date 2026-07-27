import Text from '../components/AppText';
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
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
import CustomDatePicker from '../components/CustomDatePicker';
import CustomTimePicker from '../components/CustomTimePicker';
import {
  HistoryIcon,
  SettingsIcon,
  ChevronRightIcon,
  DialPadIcon,
} from '../icons/Icons';

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

const LeadsScreen = () => {
  const navigation = useNavigation();
  const { fetchPaginatedLeads, updateLead } = useLeads();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Pagination states
  const [leadsList, setLeadsList] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tabCounts, setTabCounts] = useState({});

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch paginated leads function
  const fetchLeadsData = async (
    pageNumber,
    shouldAppend = false,
    isRefresh = false,
  ) => {
    if (pageNumber === 0) {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLeadsList([]);
        setIsLoading(true);
      }
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await fetchPaginatedLeads({
        page: pageNumber,
        limit: 10,
        search: debouncedSearch,
        leadTypeTab: activeTab,
      });

      if (data) {
        if (shouldAppend) {
          setLeadsList(prev => [...prev, ...data.leads]);
        } else {
          setLeadsList(data.leads);
        }
        setTotalPages(data.totalPages || 0);
        setTotalCount(data.totalCount || 0);
        setTabCounts(data.tabCounts || {});
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching leads data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // Fetch leads on activeTab or search changes
  useEffect(() => {
    fetchLeadsData(0, false);
  }, [activeTab, debouncedSearch]);

  const handleEditLead = lead => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      phone: lead.phone,
      status: lead.status || 'New',
      service: lead.service || 'Grooming',
      nextFollowUp: lead.nextFollowUp || '',
      followupTime: lead.followupTime || '',
      comments: lead.notes || lead.comments || '',
      followupType: lead.followupType || 'Call',
      importantLead: lead.importantLead || false,
    });
    setIsStatusOpen(false);
    setIsServiceOpen(false);
    setIsFollowupTypeOpen(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (selectedLead) {
      const res = await updateLead(selectedLead.id, editForm);
      if (res.success) {
        fetchLeadsData(0, false);
      }
      setEditModalVisible(false);
      setSelectedLead(null);
    }
  };

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || isRefreshing) return;
    // Guard check properly: if there is only one lead (or none), it should not fetch on listend
    if (leadsList.length <= 1) return;
    if (page + 1 >= totalPages) return;

    fetchLeadsData(page + 1, true);
  };

  const handleRefresh = () => {
    fetchLeadsData(0, false, true);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: Spacing.md, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const getTabCount = tabKey => {
    const count = tabCounts[tabKey];
    return count !== undefined ? ` (${count})` : '';
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Assigned Leads"
        subtitle={`${totalCount} leads to follow`}
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
              {getTabCount(tab.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && leadsList.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={leadsList}
          keyExtractor={item => item.id}
          initialNumToRender={10}
          windowSize={5}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
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
                onCall={() => {
                  const cleanPhone = lead.phone
                    ? lead.phone.replace(/[^0-9+]/g, '')
                    : '';
                  makeCall(cleanPhone);
                }}
                onEdit={() => handleEditLead(lead)}
              />
            );
          }}
        />
      )}

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
                onChangeText={text =>
                  setEditForm({
                    ...editForm,
                    phone: text.replace(/[^0-9+]/g, ''),
                  })
                }
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
                  {(editForm.service === 'Pet Insurance'
                    ? [...STATUS_OPTIONS, 'Policy Active']
                    : STATUS_OPTIONS
                  ).map(opt => (
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

                  <Text style={styles.inputLabel}>Next Follow Up Date</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setIsDatePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.dropdownSelectorText,
                        !editForm.nextFollowUp && { color: Colors.textMuted },
                      ]}
                    >
                      {editForm.nextFollowUp || 'Select Date'}
                    </Text>
                    <ChevronRightIcon size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <CustomDatePicker
                    visible={isDatePickerVisible}
                    selectedDate={editForm.nextFollowUp}
                    onClose={() => setIsDatePickerVisible(false)}
                    onSelect={date => {
                      setEditForm({ ...editForm, nextFollowUp: date });
                      setIsDatePickerVisible(false);
                    }}
                  />

                  <Text style={styles.inputLabel}>Follow Up Time</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setIsTimePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.dropdownSelectorText,
                        !editForm.followupTime && { color: Colors.textMuted },
                      ]}
                    >
                      {editForm.followupTime || 'Select Time'}
                    </Text>
                    <ChevronRightIcon size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <CustomTimePicker
                    visible={isTimePickerVisible}
                    selectedTime={editForm.followupTime}
                    onClose={() => setIsTimePickerVisible(false)}
                    onSelect={time => {
                      setEditForm({ ...editForm, followupTime: time });
                      setIsTimePickerVisible(false);
                    }}
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
    flexGrow: 1,
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
