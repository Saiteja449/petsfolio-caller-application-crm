import Text from '../components/AppText';
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import CallCard from '../components/CallCard';
import EmptyState from '../components/EmptyState';
import DialerModal from '../components/DialerModal';
import { useCalls } from '../context/CallContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import { HistoryIcon, DialPadIcon } from '../icons/Icons';

import { makeCall } from '../utils/DefaultDialer';
import SearchBar from '../components/SearchBar';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'incoming', label: 'Incoming' },
  { key: 'outgoing', label: 'Outgoing' },
  { key: 'missed', label: 'Missed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'not-connected', label: 'Not Connected' },
];

const CallLogsScreen = () => {
  const navigation = useNavigation();
  const { getFilteredCalls } = useCalls();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [isDialerVisible, setIsDialerVisible] = useState(false);

  const calls = getFilteredCalls(activeTab).filter(
    c =>
      !search ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search),
  );

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const displayedCalls = calls.slice(0, page * PAGE_SIZE);

  const handleLoadMore = () => {
    if (displayedCalls.length < calls.length) {
      setPage(prev => prev + 1);
    }
  };

  const navigateToDetails = callId => {
    navigation.navigate('CallDetails', { callId });
  };





  return (
    <View style={styles.container}>
      <ScreenHeader title="Call History" subtitle={`${calls.length} calls`} />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search calls..."
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
        data={displayedCalls}
        keyExtractor={item => item.id}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon={<HistoryIcon size={48} color={Colors.textMuted} />}
            title="No calls found"
            message="Your call history for this filter is empty"
          />
        }
        renderItem={({ item: call }) => (
          <CallCard
            call={call}
            onCallAgain={() => makeCall(call.phoneNumber)}


            onViewDetails={() => navigateToDetails(call.id)}
          />
        )}
      />

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
});

export default CallLogsScreen;
