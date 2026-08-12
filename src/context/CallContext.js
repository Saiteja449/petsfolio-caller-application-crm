import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import CallLogs from 'react-native-call-log';
import {
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  NativeModules,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLeads } from './LeadsContext';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [callLogs, setCallLogs] = useState([]);
  const [pendingLeadUpdate, setPendingLeadUpdate] = useState(null);
  const [isSyncingCalls, setIsSyncingCalls] = useState(true);
  const [hasFetchedCalls, setHasFetchedCalls] = useState(false);

  const { leads, hasFetched, createLead, updateLead } = useLeads();
  const { user } = useAuth();
  const leadsRef = useRef(leads);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const updateLeadRef = useRef(updateLead);
  useEffect(() => {
    updateLeadRef.current = updateLead;
  }, [updateLead]);

  const findLeadNameByPhone = useCallback(phoneStr => {
    const currentLeads = leadsRef.current;
    if (!phoneStr || !currentLeads) return null;
    const normalize = p => String(p).replace(/\D/g, '');
    const searchPhone = normalize(phoneStr);

    if (!searchPhone) return null;

    const exactMatch = currentLeads.find(l => l.phone === phoneStr);
    if (exactMatch) return exactMatch.name;

    const match = currentLeads.find(l => {
      const p = normalize(l.phone);
      return (
        p &&
        p.length > 5 &&
        (p.includes(searchPhone) || searchPhone.includes(p))
      );
    });
    return match ? match.name : null;
  }, []);

  const createLeadRef = useRef(createLead);
  useEffect(() => {
    createLeadRef.current = createLead;
  }, [createLead]);

  const syncNewCallsToCRM = useCallback(async () => {
    if (!hasFetched || !hasFetchedCalls) return;
    
    if (callLogs.length === 0) {
      setIsSyncingCalls(false);
      return;
    }
    
    setIsSyncingCalls(true);

    try {
      const lastStr = await AsyncStorage.getItem('lastProcessedCallTimestamp');
      let lastProcessed;
      if (lastStr) {
        lastProcessed = parseInt(lastStr);
      } else {
        lastProcessed = Date.now();
        await AsyncStorage.setItem(
          'lastProcessedCallTimestamp',
          lastProcessed.toString(),
        );
      }
      let maxTimestamp = lastProcessed;
      const newlyAddedPhones = new Set();

      for (const log of callLogs) {
        const logTimestamp = new Date(log.date).getTime();
        if (logTimestamp > lastProcessed) {
          if (logTimestamp > maxTimestamp) maxTimestamp = logTimestamp;

          if (userRef.current?.name) {
            const logDate = new Date(logTimestamp);
            const dateStr =
              logDate.getFullYear() +
              '-' +
              String(logDate.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(logDate.getDate()).padStart(2, '0');

            axios
              .post(API_ENDPOINTS.ANALYTICS.LOG_CALL, {
                salesperson: userRef.current.name,
                date: dateStr,
                duration: log.duration,
                callType: log.callType,
                status: log.status,
              })
              .catch(e => console.log('Analytics sync error:', e));
          }

          const isUnanswered = ['missed', 'rejected', 'not-connected'].includes(
            log.status,
          );

          const normalize = p => String(p).replace(/\D/g, '');
          const searchPhone = normalize(log.phoneNumber);
          const existingLead = leadsRef.current?.find(l => {
            const p = normalize(l.phone);
            return (
              p &&
              searchPhone &&
              p.length > 5 &&
              (p.includes(searchPhone) || searchPhone.includes(p))
            );
          });

          if (!existingLead && !newlyAddedPhones.has(searchPhone)) {
            if (log.callType === 'missed') {
              newlyAddedPhones.add(searchPhone);
              if (createLeadRef.current) {
                createLeadRef.current({
                  name:
                    log.customerName === 'Unknown'
                      ? 'Unknown Caller'
                      : log.customerName,
                  phone: log.phoneNumber,
                  source: 'Call',
                  service: 'Miniature Cow Sales',
                  status: 'New',
                });
              }
            }
          }
          // Intentionally removed auto-update for outgoing/unanswered calls. Users will update status manually.
        }
      }

      if (maxTimestamp > lastProcessed) {
        await AsyncStorage.setItem(
          'lastProcessedCallTimestamp',
          maxTimestamp.toString(),
        );
      }
    } catch (err) {
      console.error('Sync new calls error', err);
    } finally {
      setIsSyncingCalls(false);
    }
  }, [hasFetched, hasFetchedCalls, callLogs]);

  useEffect(() => {
    syncNewCallsToCRM();
  }, [syncNewCallsToCRM]);

  const loadPending = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingLeadUpdate');
      if (stored) {
        setPendingLeadUpdate(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading pending lead', err);
    }
  };

  useEffect(() => {
    loadPending();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadPending();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const clearPendingLeadUpdate = useCallback(async () => {
    setPendingLeadUpdate(null);
    await AsyncStorage.removeItem('pendingLeadUpdate');
  }, []);

  // Update existing logs/calls when leads change
  useEffect(() => {
    if (leads && leads.length > 0) {
      setCallLogs(prevLogs => {
        let changed = false;
        const updatedLogs = prevLogs.map(log => {
          const leadName = findLeadNameByPhone(log.phoneNumber);
          if (leadName && log.customerName !== leadName) {
            changed = true;
            return { ...log, customerName: leadName };
          }
          return log;
        });
        return changed ? updatedLogs : prevLogs;
      });
    }
  }, [leads, findLeadNameByPhone]);

  useEffect(() => {
    const fetchCallLogs = async () => {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        );
        if (permission) {
          try {
            const logs = await CallLogs.load(1000); // load last 1000 calls
            const formattedLogs = logs.map(log => {
              let callType = 'unknown';
              let status = 'completed';

              const typeStr = String(log.type).toUpperCase();
              switch (typeStr) {
                case '1':
                case 'INCOMING_TYPE':
                case 'INCOMING':
                  callType = 'incoming';
                  status = log.duration > 0 ? 'connected' : 'missed';
                  break;
                case '2':
                case 'OUTGOING_TYPE':
                case 'OUTGOING':
                  callType = 'outgoing';
                  status = log.duration > 0 ? 'connected' : 'not-connected';
                  break;
                case '3':
                case 'MISSED_TYPE':
                case 'MISSED':
                  callType = 'missed';
                  status = 'missed';
                  break;
                case '5':
                case 'REJECTED_TYPE':
                case 'REJECTED':
                  callType = 'rejected';
                  status = 'rejected';
                  break;
                default:
                  callType = 'incoming';
              }

              const resolvedName =
                findLeadNameByPhone(log.phoneNumber) || log.name || 'Unknown';

              return {
                id: `call-${log.timestamp}`,
                contactId: null, // would need cross-referencing with contacts
                customerName: resolvedName,
                phoneNumber: log.phoneNumber,
                callType: callType,
                status: status,
                date: new Date(parseInt(log.timestamp)).toISOString(),
                duration: log.duration,
                isResolved: false,
              };
            });
            setCallLogs(formattedLogs);
          } catch (e) {
            console.error('Failed to fetch call logs', e);
          } finally {
            setHasFetchedCalls(true);
          }
        } else {
          setHasFetchedCalls(true);
        }
      } else {
        setHasFetchedCalls(true);
      }
    };

    fetchCallLogs();
  }, []);

  const addCallLog = useCallback(call => {
    setCallLogs(prev => [call, ...prev]);
  }, []);

  const markMissedResolved = useCallback(callId => {
    setCallLogs(prev =>
      prev.map(c => (c.id === callId ? { ...c, isResolved: true } : c)),
    );
  }, []);

  const getFilteredCalls = useCallback(
    filter => {
      if (filter === 'all') return callLogs;
      if (filter === 'incoming') {
        return callLogs.filter(
          c => c.callType === 'incoming' && c.status === 'connected',
        );
      }
      if (filter === 'outgoing') {
        return callLogs.filter(
          c => c.callType === 'outgoing' && c.status === 'connected',
        );
      }
      return callLogs.filter(c => c.callType === filter || c.status === filter);
    },
    [callLogs],
  );

  const getMissedCalls = useCallback(
    () =>
      callLogs.filter(c => c.callType === 'missed' || c.status === 'missed'),
    [callLogs],
  );

  const getCallById = useCallback(
    id => callLogs.find(c => c.id === id),
    [callLogs],
  );

  const recentNumbers = Array.from(new Set(callLogs.map(c => c.phoneNumber)))
    .slice(0, 5)
    .map(phone => {
      const log = callLogs.find(c => c.phoneNumber === phone);
      return { phone, name: log.customerName || 'Unknown' };
    });


  return (
    <CallContext.Provider
      value={{
        callLogs,
        recentNumbers,
        addCallLog,
        markMissedResolved,
        getFilteredCalls,
        getMissedCalls,
        getCallById,
        pendingLeadUpdate,
        clearPendingLeadUpdate,
        isSyncingCalls,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCalls = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCalls must be used within CallProvider');
  return context;
};

export default CallContext;
