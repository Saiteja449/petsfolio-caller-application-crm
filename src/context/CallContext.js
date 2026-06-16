import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import CallLogs from 'react-native-call-log';
import {
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

const { DefaultDialer } = NativeModules;
const dialerEmitter = new NativeEventEmitter(DefaultDialer);

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [callLogs, setCallLogs] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const fetchCallLogs = async () => {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        );
        if (permission) {
          try {
            const logs = await CallLogs.load(100); // load last 100 calls
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

              return {
                id: `call-${log.timestamp}`,
                contactId: null, // would need cross-referencing with contacts
                customerName: log.name || 'Unknown',
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
      const subscription = dialerEmitter.addListener(
        'onCallStateChanged',
        event => {
          const { state, phoneNumber } = event;

          if (state === 'RINGING') {
            setIncomingCall({
              id: `incoming-${Date.now()}`,
              customerName: 'Unknown',
              phoneNumber: phoneNumber,
              callType: 'incoming',
              status: 'ringing',
              date: new Date().toISOString(),
            });
          } else if (state === 'ACTIVE' || state === 'DIALING') {
            setIncomingCall(null);
            setActiveCall({
              id: `call-${Date.now()}`,
              customerName: 'Unknown',
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
        },
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
    (filter) => {
      if (filter === 'all') return callLogs;
      if (filter === 'incoming') {
        return callLogs.filter((c) => c.callType === 'incoming' && c.status === 'connected');
      }
      if (filter === 'outgoing') {
        return callLogs.filter((c) => c.callType === 'outgoing' && c.status === 'connected');
      }
      return callLogs.filter((c) => c.callType === filter || c.status === filter);
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
