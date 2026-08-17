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
import { useToast } from '../context/ToastContext';
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
  PlusIcon,
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
  const { fetchPaginatedLeads, updateLead, createLead, lastUpdateTimestamp } =
    useLeads();
  const { showToast } = useToast();
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
    services: [],
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

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    status: 'New',
    services: ['Grooming'],
    nextFollowUp: '',
    followupTime: '',
    comments: '',
    followupType: 'Call',
    importantLead: false,
  });
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isCreateFollowupTypeOpen, setIsCreateFollowupTypeOpen] =
    useState(false);
  const [isCreateDatePickerVisible, setIsCreateDatePickerVisible] =
    useState(false);
  const [isCreateTimePickerVisible, setIsCreateTimePickerVisible] =
    useState(false);

  // Pagination states
  const [leadsList, setLeadsList] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Fetch leads on activeTab, search, or external update changes
  useEffect(() => {
    fetchLeadsData(0, false);
  }, [activeTab, debouncedSearch, lastUpdateTimestamp]);

  const handleEditLead = lead => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      phone: lead.phone,
      status: lead.status || 'New',
      services: lead.services && lead.services.length > 0 ? lead.services : ['Grooming'],
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
      if (
        editForm.status === 'Follow Up' &&
        editForm.nextFollowUp &&
        editForm.followupTime
      ) {
        const today = new Date();
        const selectedDate = new Date(editForm.nextFollowUp);
        if (
          selectedDate.getFullYear() === today.getFullYear() &&
          selectedDate.getMonth() === today.getMonth() &&
          selectedDate.getDate() === today.getDate()
        ) {
          const match = editForm.followupTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const period = match[3].toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const selectedTime = new Date(today);
            selectedTime.setHours(hours, minutes, 0, 0);
            if (selectedTime < today) {
              alert('You cannot select a past time for today.');
              return;
            }
          }
        }
      }

      setIsSaving(true);
      try {
        const res = await updateLead(selectedLead.id, editForm);
        if (res.success) {
          showToast('Lead updated successfully', 'success');
          fetchLeadsData(0, false);
        } else {
          showToast('Failed to update lead', 'error');
        }
        setEditModalVisible(false);
        setSelectedLead(null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveCreate = async () => {
    if (!createForm.name || !createForm.phone) {
      Alert.alert('Error', 'Name and Phone are required.');
      return;
    }

    if (
      createForm.status === 'Follow Up' &&
      createForm.nextFollowUp &&
      createForm.followupTime
    ) {
      const today = new Date();
      const selectedDate = new Date(createForm.nextFollowUp);
      if (
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate()
      ) {
        const match = createForm.followupTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const period = match[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          const selectedTime = new Date(today);
          selectedTime.setHours(hours, minutes, 0, 0);
          if (selectedTime < today) {
            alert('You cannot select a past time for today.');
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const res = await createLead({
        ...createForm,
        source: 'Mobile App',
      });
      if (res.success) {
        showToast('Lead created successfully', 'success');
        setCreateModalVisible(false);
        setCreateForm({
          name: '',
          phone: '',
          status: 'New',
          services: ['Grooming'],
          nextFollowUp: '',
          followupTime: '',
          comments: '',
          followupType: '',
          importantLead: false,
        });
        fetchLeadsData(0, false);
      } else {
        showToast('Failed to create lead', 'error');
      }
    } catch (error) {
      console.error('Save create error:', error);
      showToast('An error occurred while creating', 'error');
    } finally {
      setIsSaving(false);
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
        rightAction={
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            style={{ padding: 8 }}
          >
            <PlusIcon size={24} color={Colors.primary} />
          </TouchableOpacity>
        }
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
                  const cleanPhone = String(lead.phone).replace(/\D/g, '');
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

              <Text style={styles.inputLabel}>Services Interest</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsServiceOpen(!isServiceOpen)}
              >
                <Text style={styles.dropdownSelectorText}>
                  {editForm.services?.length > 0 ? editForm.services.join(', ') : 'Select Services'}
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
                        const newServices = editForm.services?.includes(opt)
                          ? editForm.services.filter(s => s !== opt)
                          : [...(editForm.services || []), opt];
                        setEditForm({ ...editForm, services: newServices });
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          editForm.services?.includes(opt) &&
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
                  {(editForm.services?.includes('Pet Insurance')
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
                  style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                  onPress={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Manual Lead</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.huge }}
            >
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={createForm.name}
                onChangeText={text =>
                  setCreateForm({ ...createForm, name: text })
                }
                placeholder="Lead Name"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={createForm.phone}
                onChangeText={text =>
                  setCreateForm({
                    ...createForm,
                    phone: text.replace(/[^0-9+]/g, ''),
                  })
                }
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Services Interest</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsCreateServiceOpen(!isCreateServiceOpen)}
              >
                <Text style={styles.dropdownSelectorText}>
                  {createForm.services?.length > 0 ? createForm.services.join(', ') : 'Select Services'}
                </Text>
                <ChevronRightIcon size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {isCreateServiceOpen && (
                <View style={styles.dropdownOptionsContainer}>
                  {SERVICE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownOption}
                      onPress={() => {
                        const newServices = createForm.services?.includes(opt)
                          ? createForm.services.filter(s => s !== opt)
                          : [...(createForm.services || []), opt];
                        setCreateForm({ ...createForm, services: newServices });
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          createForm.services?.includes(opt) &&
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
                onPress={() => setIsCreateStatusOpen(!isCreateStatusOpen)}
              >
                <Text style={styles.dropdownSelectorText}>
                  {createForm.status || 'Select Status'}
                </Text>
                <ChevronRightIcon size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {isCreateStatusOpen && (
                <ScrollView
                  style={styles.dropdownOptionsContainerScroll}
                  nestedScrollEnabled={true}
                >
                  {(createForm.services?.includes('Pet Insurance')
                    ? [...STATUS_OPTIONS, 'Policy Active']
                    : STATUS_OPTIONS
                  ).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setCreateForm({ ...createForm, status: opt });
                        setIsCreateStatusOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          createForm.status === opt &&
                            styles.dropdownOptionTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {createForm.status === 'Follow Up' && (
                <View style={styles.followUpContainer}>
                  <Text style={styles.inputLabel}>Follow-up Type</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() =>
                      setIsCreateFollowupTypeOpen(!isCreateFollowupTypeOpen)
                    }
                  >
                    <Text style={styles.dropdownSelectorText}>
                      {createForm.followupType || 'Select Type'}
                    </Text>
                    <ChevronRightIcon size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                  {isCreateFollowupTypeOpen && (
                    <View style={styles.dropdownOptionsContainer}>
                      {FOLLOWUP_TYPES.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setCreateForm({ ...createForm, followupType: opt });
                            setIsCreateFollowupTypeOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              createForm.followupType === opt &&
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
                    onPress={() => setIsCreateDatePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.dropdownSelectorText,
                        !createForm.nextFollowUp && { color: Colors.textMuted },
                      ]}
                    >
                      {createForm.nextFollowUp || 'Select Date'}
                    </Text>
                    <ChevronRightIcon size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <CustomDatePicker
                    visible={isCreateDatePickerVisible}
                    selectedDate={createForm.nextFollowUp}
                    onClose={() => setIsCreateDatePickerVisible(false)}
                    onSelect={date => {
                      setCreateForm({ ...createForm, nextFollowUp: date });
                      setIsCreateDatePickerVisible(false);
                    }}
                  />

                  <Text style={styles.inputLabel}>Follow Up Time</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setIsCreateTimePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.dropdownSelectorText,
                        !createForm.followupTime && { color: Colors.textMuted },
                      ]}
                    >
                      {createForm.followupTime || 'Select Time'}
                    </Text>
                    <ChevronRightIcon size={16} color={Colors.textMuted} />
                  </TouchableOpacity>

                  <CustomTimePicker
                    visible={isCreateTimePickerVisible}
                    selectedTime={createForm.followupTime}
                    onClose={() => setIsCreateTimePickerVisible(false)}
                    onSelect={time => {
                      setCreateForm({ ...createForm, followupTime: time });
                      setIsCreateTimePickerVisible(false);
                    }}
                  />

                  <Text style={styles.inputLabel}>Comments</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={createForm.comments}
                    onChangeText={text =>
                      setCreateForm({ ...createForm, comments: text })
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
                  setCreateForm({
                    ...createForm,
                    importantLead: !createForm.importantLead,
                  })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    createForm.importantLead && styles.checkboxActive,
                  ]}
                />
                <Text style={styles.importantToggleText}>
                  🔥 Important Hot Lead
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                  onPress={handleSaveCreate}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsDialerVisible(true)}
        activeOpacity={0.8}
      >
        <DialPadIcon size={24} color={Colors.white} />
      </TouchableOpacity>

      <DialerModal
        visible={isDialerVisible}
        onClose={() => setIsDialerVisible(false)}
      /> */}
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
