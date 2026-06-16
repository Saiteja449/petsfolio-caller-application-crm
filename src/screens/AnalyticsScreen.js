import Text from '../components/AppText';
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import StatCard from '../components/StatCard';
import AnalyticsCard from '../components/AnalyticsCard';
import CustomButton from '../components/CustomButton';
import { useAnalytics } from '../context/AnalyticsContext';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';
import { formatDuration, formatTalkTime } from '../utils/formatters';
import { TrendingUpIcon } from '../icons/Icons';

const ChartBar = ({ label, value, maxValue, color }) => {
  const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${width}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
};

const AnalyticsScreen = () => {
  const navigation = useNavigation();
  const {
    overview,
    today,
    weekly,
    monthly,
    callTypeBreakdown,
    durationBreakdown,
    topContacts,
  } = useAnalytics();

  const maxCallType = Math.max(...Object.values(callTypeBreakdown));
  const maxDuration = Math.max(...Object.values(durationBreakdown));

  return (
    <View style={styles.container}>
      <ScreenHeader title="Call Analytics" subtitle="Performance Dashboard" />

      <ScrollView contentContainerStyle={styles.content}>

        <AnalyticsCard title="Today" subtitle="Today's activity">
          <View style={styles.statGrid}>
            <StatCard
              label="Calls Today"
              value={today.callsToday}
              style={styles.statItem}
            />
            <StatCard
              label="Talk Time"
              value={formatTalkTime(today.talkTimeToday)}
              style={styles.statItem}
            />
            <StatCard
              label="Missed Today"
              value={today.missedToday}
              color={Colors.danger}
              style={styles.statItem}
            />
            <StatCard
              label="Connected"
              value={today.connectedToday}
              color={Colors.success}
              style={styles.statItem}
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard
          title="Last 5 Days Summary"
          subtitle="Recent performance"
        >
          <View style={styles.statGrid}>
            <StatCard
              label="Total Calls"
              value={weekly.totalCalls}
              style={styles.statItem}
            />
            <StatCard
              label="Incoming"
              value={weekly.incomingCalls}
              color={Colors.primary}
              style={styles.statItem}
            />
            <StatCard
              label="Outgoing"
              value={weekly.outgoingCalls}
              color={Colors.success}
              style={styles.statItem}
            />
            <StatCard
              label="Missed"
              value={weekly.missedCalls}
              color={Colors.danger}
              style={styles.statItem}
            />
            <StatCard
              label="Connected"
              value={weekly.connectedCalls}
              color={Colors.success}
              style={styles.statItem}
            />
            <StatCard
              label="Rejected"
              value={weekly.rejectedCalls}
              color={Colors.warning}
              style={styles.statItem}
            />
            <StatCard
              label="Not Connected"
              value={weekly.notConnectedCalls}
              color={Colors.textMuted}
              style={styles.statItem}
            />
            <StatCard
              label="Talk Time"
              value={formatTalkTime(weekly.totalTalkTime)}
              style={styles.statItem}
            />
            <StatCard
              label="Avg Duration"
              value={formatDuration(weekly.averageDuration)}
              style={styles.statItem}
            />
            <StatCard
              label="Longest Call"
              value={formatDuration(weekly.longestDuration)}
              style={styles.statItem}
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Call Type Breakdown">
          <View style={styles.chartPlaceholder}>
            <ChartBar
              label="Incoming"
              value={callTypeBreakdown.incoming}
              maxValue={maxCallType}
              color={Colors.chart1}
            />
            <ChartBar
              label="Outgoing"
              value={callTypeBreakdown.outgoing}
              maxValue={maxCallType}
              color={Colors.chart2}
            />
            <ChartBar
              label="Missed"
              value={callTypeBreakdown.missed}
              maxValue={maxCallType}
              color={Colors.chart3}
            />
            <ChartBar
              label="Rejected"
              value={callTypeBreakdown.rejected}
              maxValue={maxCallType}
              color={Colors.chart4}
            />
            <ChartBar
              label="Not Connected"
              value={callTypeBreakdown.notConnected}
              maxValue={maxCallType}
              color={Colors.chart5}
            />
          </View>
        </AnalyticsCard>
      </ScrollView>
    </View>
  );
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
  perfBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '47%',
    flexGrow: 1,
  },
  chartPlaceholder: {
    gap: Spacing.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    width: 100,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.semiBold,
    color: Colors.text,
    width: 30,
    textAlign: 'right',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topRank: {
    width: 28,
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.bold,
    color: Colors.primary,
  },
  topName: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  topCount: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
  },
});

export default AnalyticsScreen;
