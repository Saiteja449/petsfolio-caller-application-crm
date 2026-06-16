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
        <AnalyticsCard title="Overview" subtitle="All-time statistics">
          <View style={styles.statGrid}>
            <StatCard
              label="Total Calls"
              value={overview.totalCalls}
              style={styles.statItem}
            />
            <StatCard
              label="Incoming"
              value={overview.incomingCalls}
              color={Colors.primary}
              style={styles.statItem}
            />
            <StatCard
              label="Outgoing"
              value={overview.outgoingCalls}
              color={Colors.success}
              style={styles.statItem}
            />
            <StatCard
              label="Missed"
              value={overview.missedCalls}
              color={Colors.danger}
              style={styles.statItem}
            />
            <StatCard
              label="Connected"
              value={overview.connectedCalls}
              color={Colors.success}
              style={styles.statItem}
            />
            <StatCard
              label="Rejected"
              value={overview.rejectedCalls}
              color={Colors.warning}
              style={styles.statItem}
            />
            <StatCard
              label="Not Connected"
              value={overview.notConnectedCalls}
              color={Colors.textMuted}
              style={styles.statItem}
            />
            <StatCard
              label="Talk Time"
              value={formatTalkTime(overview.totalTalkTime)}
              style={styles.statItem}
            />
            <StatCard
              label="Avg Duration"
              value={formatDuration(overview.averageDuration)}
              style={styles.statItem}
            />
            <StatCard
              label="Longest Call"
              value={formatDuration(overview.longestDuration)}
              style={styles.statItem}
            />
          </View>
        </AnalyticsCard>

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
          title="Weekly Summary"
          subtitle="This week's performance"
        >
          <View style={styles.statGrid}>
            <StatCard
              label="Calls This Week"
              value={weekly.callsThisWeek}
              style={styles.statItem}
            />
            <StatCard
              label="Talk Time"
              value={formatTalkTime(weekly.talkTime)}
              style={styles.statItem}
            />
            <StatCard
              label="Performance Score"
              value={`${weekly.performanceScore}%`}
              color={Colors.success}
              icon={<TrendingUpIcon size={20} />}
              style={styles.statItem}
            />
            <StatCard
              label="Follow-ups Done"
              value={weekly.followupsCompleted}
              style={styles.statItem}
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Monthly Summary" subtitle="Last 30 days">
          <View style={styles.statGrid}>
            <StatCard
              label="Call Volume"
              value={monthly.callVolume}
              style={styles.statItem}
            />
            <StatCard
              label="Talk Time"
              value={formatTalkTime(monthly.talkTime)}
              style={styles.statItem}
            />
            <StatCard
              label="Avg Duration"
              value={formatDuration(monthly.averageDuration)}
              style={styles.statItem}
            />
            <StatCard
              label="Response Rate"
              value={`${monthly.responseRate}%`}
              color={Colors.primary}
              style={styles.statItem}
            />
            <StatCard
              label="Connection Rate"
              value={`${monthly.connectionRate}%`}
              color={Colors.success}
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

        <AnalyticsCard title="Call Duration Analytics">
          <View style={styles.chartPlaceholder}>
            <ChartBar
              label="0-30 seconds"
              value={durationBreakdown['0-30s']}
              maxValue={maxDuration}
              color={Colors.chart1}
            />
            <ChartBar
              label="30-60 seconds"
              value={durationBreakdown['30-60s']}
              maxValue={maxDuration}
              color={Colors.chart2}
            />
            <ChartBar
              label="1-3 minutes"
              value={durationBreakdown['1-3min']}
              maxValue={maxDuration}
              color={Colors.chart3}
            />
            <ChartBar
              label="3-5 minutes"
              value={durationBreakdown['3-5min']}
              maxValue={maxDuration}
              color={Colors.chart4}
            />
            <ChartBar
              label="5+ minutes"
              value={durationBreakdown['5min+']}
              maxValue={maxDuration}
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
