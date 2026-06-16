import React, { createContext, useContext, useMemo } from 'react';
import { useCalls } from './CallContext';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  const { callLogs } = useCalls();

  const analytics = useMemo(() => {
    const totalCalls = callLogs.length;
    const incomingCalls = callLogs.filter((c) => c.callType === 'incoming').length;
    const outgoingCalls = callLogs.filter((c) => c.callType === 'outgoing').length;
    const missedCalls = callLogs.filter((c) => c.callType === 'missed' || c.status === 'missed').length;
    const connectedCalls = callLogs.filter((c) => c.status === 'connected').length;
    const rejectedCalls = callLogs.filter((c) => c.status === 'rejected').length;
    const notConnectedCalls = callLogs.filter((c) => c.status === 'not-connected').length;

    const durations = callLogs.filter((c) => c.duration > 0).map((c) => parseInt(c.duration));
    const totalTalkTime = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = durations.length > 0 ? Math.round(totalTalkTime / durations.length) : 0;
    const longestDuration = durations.length > 0 ? Math.max(...durations) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCalls = callLogs.filter((c) => new Date(c.date) >= today);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCalls = callLogs.filter((c) => new Date(c.date) >= weekAgo);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthCalls = callLogs.filter((c) => new Date(c.date) >= monthAgo);
    const monthConnected = monthCalls.filter((c) => c.status === 'connected').length;
    const monthTotal = monthCalls.length;
    const monthDurations = monthCalls.filter((c) => c.duration > 0);

    const durationBuckets = { '0-30s': 0, '30-60s': 0, '1-3min': 0, '3-5min': 0, '5min+': 0 };
    callLogs.forEach((c) => {
      const d = parseInt(c.duration);
      if (d <= 30) durationBuckets['0-30s']++;
      else if (d <= 60) durationBuckets['30-60s']++;
      else if (d <= 180) durationBuckets['1-3min']++;
      else if (d <= 300) durationBuckets['3-5min']++;
      else durationBuckets['5min+']++;
    });

    const callCounts = {};
    const missedCounts = {};
    const longestCalls = {};

    callLogs.forEach((c) => {
      const id = c.phoneNumber;
      callCounts[id] = (callCounts[id] || 0) + 1;
      if (c.status === 'missed') {
        missedCounts[id] = (missedCounts[id] || 0) + 1;
      }
      if (parseInt(c.duration) > (longestCalls[id]?.duration || 0)) {
        longestCalls[id] = { contactId: id, name: c.customerName, duration: parseInt(c.duration) };
      }
    });

    const mostCalled = Object.entries(callCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        contactId: id,
        name: callLogs.find((c) => c.phoneNumber === id)?.customerName || id,
        count,
      }));

    const mostMissed = Object.entries(missedCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        contactId: id,
        name: callLogs.find((c) => c.phoneNumber === id)?.customerName || id,
        count,
      }));

    const longestConversations = Object.values(longestCalls)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const overview = {
      totalCalls, incomingCalls, outgoingCalls, missedCalls, connectedCalls,
      rejectedCalls, notConnectedCalls, totalTalkTime, averageDuration, longestDuration,
    };

    const monthly = {
      callVolume: monthTotal,
      talkTime: monthCalls.reduce((sum, c) => sum + parseInt(c.duration), 0),
      averageDuration: monthDurations.length > 0
        ? Math.round(monthDurations.reduce((s, c) => s + parseInt(c.duration), 0) / monthDurations.length)
        : 0,
      responseRate: monthTotal > 0 ? Math.round(((monthTotal - missedCalls) / monthTotal) * 100) : 0,
      connectionRate: monthTotal > 0 ? Math.round((monthConnected / monthTotal) * 100) : 0,
    };

    return {
      overview,
      today: {
        callsToday: todayCalls.length,
        talkTimeToday: todayCalls.reduce((sum, c) => sum + parseInt(c.duration), 0),
        missedToday: todayCalls.filter((c) => c.status === 'missed').length,
        connectedToday: todayCalls.filter((c) => c.status === 'connected').length,
      },
      weekly: {
        callsThisWeek: weekCalls.length,
        talkTime: weekCalls.reduce((sum, c) => sum + parseInt(c.duration), 0),
        performanceScore: 87, // Mocked score
      },
      monthly,
      callTypeBreakdown: {
        incoming: incomingCalls,
        outgoing: outgoingCalls,
        missed: missedCalls,
        rejected: rejectedCalls,
        notConnected: notConnectedCalls,
      },
      durationBreakdown: durationBuckets,
      topContacts: { mostCalled, mostMissed, longestConversations },
    };
  }, [callLogs]);

  const performance = useMemo(() => {
    return {
      callsMade: analytics.overview.outgoingCalls,
      callsAttended: analytics.overview.incomingCalls - analytics.overview.missedCalls,
      callsMissed: analytics.overview.missedCalls,
      responseRate: analytics.monthly.responseRate,
      connectionRate: analytics.monthly.connectionRate,
      averageCallDuration: analytics.overview.averageDuration,
      performanceScore: 91, // Mocked
    };
  }, [analytics]);

  const dailyRecords = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayCalls = callLogs.filter(c => {
        const d = new Date(c.date);
        return d >= dayStart && d <= dayEnd;
      });

      return {
        id: `analytics-${i + 1}`,
        date: date.toISOString(),
        totalCalls: dayCalls.length,
        incoming: dayCalls.filter((c) => c.callType === 'incoming').length,
        outgoing: dayCalls.filter((c) => c.callType === 'outgoing').length,
        missed: dayCalls.filter((c) => c.callType === 'missed' || c.status === 'missed').length,
        talkTime: dayCalls.reduce((sum, c) => sum + parseInt(c.duration), 0),
        connected: dayCalls.filter((c) => c.status === 'connected').length,
      };
    });
  }, [callLogs]);

  return (
    <AnalyticsContext.Provider
      value={{
        analytics,
        performance,
        dailyRecords,
        overview: analytics.overview,
        today: analytics.today,
        weekly: analytics.weekly,
        monthly: analytics.monthly,
        callTypeBreakdown: analytics.callTypeBreakdown,
        durationBreakdown: analytics.durationBreakdown,
        topContacts: analytics.topContacts,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};

export default AnalyticsContext;
