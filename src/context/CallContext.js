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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLeads } from './LeadsContext';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

const { DefaultDialer } = NativeModules;
const dialerEmitter = new NativeEventEmitter(DefaultDialer);

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [callLogs, setCallLogs] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

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
    if (!hasFetched || callLogs.length === 0) return;

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

      for (const log of callLogs) {
        const logTimestamp = new Date(log.date).getTime();
        if (logTimestamp > lastProcessed) {
          if (logTimestamp > maxTimestamp) maxTimestamp = logTimestamp;

          if (userRef.current?.name) {
            const logDate = new Date(logTimestamp);
            const dateStr = logDate.getFullYear() + '-' + String(logDate.getMonth() + 1).padStart(2, '0') + '-' + String(logDate.getDate()).padStart(2, '0');
            
            axios.post(API_ENDPOINTS.ANALYTICS.LOG_CALL, {
              salesperson: userRef.current.name,
              date: dateStr,
              duration: log.duration,
              callType: log.callType,
              status: log.status
            }).catch(e => console.log('Analytics sync error:', e));
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

          if (!existingLead) {
            if (log.callType === 'missed') {
              if (createLeadRef.current) {
                createLeadRef.current({
                  name:
                    log.customerName === 'Unknown'
                      ? 'Unknown Caller'
                      : log.customerName,
                  phone: log.phoneNumber,
                  source: 'Call',
                  service: 'General Enquiry',
                  status: 'New',
                });
              }
            }
          } else {
            if (isUnanswered && log.callType === 'outgoing') {
              if (updateLeadRef.current && !['Joined', 'Converted', 'Lost', 'Job Posted', 'Job Assigned'].includes(existingLead.status)) {
                updateLeadRef.current(existingLead.id, { ...existingLead, status: 'Not Attended' });
              }
            }
          }
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
    }
  }, [hasFetched, callLogs]);

  useEffect(() => {
    syncNewCallsToCRM();
  }, [syncNewCallsToCRM]);

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

      setActiveCall(prev => {
        if (!prev) return prev;
        const leadName = findLeadNameByPhone(prev.phoneNumber);
        if (leadName && prev.customerName !== leadName) {
          return { ...prev, customerName: leadName };
        }
        return prev;
      });

      setIncomingCall(prev => {
        if (!prev) return prev;
        const leadName = findLeadNameByPhone(prev.phoneNumber);
        if (leadName && prev.customerName !== leadName) {
          return { ...prev, customerName: leadName };
        }
        return prev;
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
          }
        }
      }
    };
    fetchCallLogs();

    if (Platform.OS === 'android') {
      const handleCallStateChange = event => {
        const { state, phoneNumber, name } = event;
        const resolvedName =
          findLeadNameByPhone(phoneNumber) || name || 'Unknown';

        if (state === 'RINGING') {
          setIncomingCall({
            id: `incoming-${Date.now()}`,
            customerName: resolvedName,
            phoneNumber: phoneNumber,
            callType: 'incoming',
            status: 'ringing',
            date: new Date().toISOString(),
          });
        } else if (state === 'ACTIVE' || state === 'DIALING') {
          setIncomingCall(null);
          setActiveCall({
            id: `call-${Date.now()}`,
            customerName: resolvedName,
            phoneNumber: phoneNumber,
            callType: state === 'DIALING' ? 'outgoing' : 'incoming',
            status: state.toLowerCase(),
            date: new Date().toISOString(),
          });
        } else if (state === 'DISCONNECTED') {
          setIncomingCall(null);
          setActiveCall(null);
          setTimeout(fetchCallLogs, 1500); // refresh logs after call ends
        }
      };

      import('../utils/DefaultDialer').then(({ getCurrentCall }) => {
        getCurrentCall().then(stateObj => {
          if (stateObj && stateObj.state && stateObj.state !== 'DISCONNECTED') {
            handleCallStateChange(stateObj);
          }
        });
      });

      const subscription = dialerEmitter.addListener(
        'onCallStateChanged',
        handleCallStateChange,
      );
      return () => subscription.remove();
    }
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

  const simulateIncomingCall = useCallback(contact => {
    setIncomingCall({
      id: `incoming-${Date.now()}`,
      customerName: contact.name,
      phoneNumber: contact.phone,
      contactId: contact.id,
      callType: 'incoming',
      status: 'ringing',
      date: new Date().toISOString(),
    });
  }, []);

  const acceptCall = useCallback(() => {
    if (incomingCall) {
      setActiveCall({ ...incomingCall, status: 'connected' });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      addCallLog({
        ...incomingCall,
        id: `call-${Date.now()}`,
        status: 'missed',
        callType: 'missed',
        duration: 0,
        isResolved: false,
      });
      setIncomingCall(null);
    }
  }, [incomingCall, addCallLog]);

  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  return (
    <CallContext.Provider
      value={{
        callLogs,
        activeCall,
        incomingCall,
        recentNumbers,
        addCallLog,
        markMissedResolved,
        getFilteredCalls,
        getMissedCalls,
        getCallById,
        simulateIncomingCall,
        acceptCall,
        rejectCall,
        endCall,
        setIncomingCall,
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
