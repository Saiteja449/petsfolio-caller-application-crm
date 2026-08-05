import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { AppState, NativeEventEmitter, NativeModules } from 'react-native';
import {
  getPendingEvents,
  markPopupShown,
  markSubmitted,
  updateSyncStatus,
} from '../utils/PostCallBridge';
import { useLeads } from './LeadsContext';
import { useToast } from './ToastContext';

const CallQueueContext = createContext(null);

const { PostCallBridge } = NativeModules;
const eventEmitter = new NativeEventEmitter(PostCallBridge);

export const CallQueueProvider = ({ children }) => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const { leads, createLead, updateLead } = useLeads();
  const { showToast } = useToast();

  // Load pending events from the native Room database
  const refreshQueue = useCallback(async () => {
    try {
      const events = await getPendingEvents();
      setPendingEvents(events);
      
      if (events.length > 0) {
        // If popup is not already visible, show the first one (FIFO)
        if (!isPopupVisible) {
          const nextEvent = events[0];
          setCurrentEvent(nextEvent);
          setIsPopupVisible(true);
          // Mark as shown in the DB
          await markPopupShown(nextEvent.id);
        }
      } else {
        setIsPopupVisible(false);
        setCurrentEvent(null);
      }
    } catch (error) {
      console.error('Failed to refresh call queue:', error);
    }
  }, [isPopupVisible]);

  // Handle AppState changes (e.g. app comes to foreground)
  useEffect(() => {
    refreshQueue();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshQueue();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshQueue]);

  // Handle native "onPostCallEvent" triggers (sent when a call ends while app is alive)
  useEffect(() => {
    const eventSubscription = eventEmitter.addListener('onPostCallEvent', () => {
      console.log('Received onPostCallEvent from native layer');
      refreshQueue();
    });

    return () => {
      eventSubscription.remove();
    };
  }, [refreshQueue]);

  // Submit form data for current call event and advance queue
  const submitEvent = useCallback(async (eventId, formData) => {
    try {
      // 1. Save to native DB so it's marked as submitted locally
      const formDataJson = JSON.stringify(formData);
      await markSubmitted(eventId, formDataJson);

      // 2. Perform API update/create in React Native
      let syncResult;
      
      // Determine if this number belongs to an existing lead
      const normalize = p => String(p).replace(/\D/g, '');
      const searchPhone = normalize(formData.phone);
      const matchedLead = leads?.find(l => {
        const p = normalize(l.phone);
        return p && p.length > 5 && (p.includes(searchPhone) || searchPhone.includes(p));
      });

      const payload = {
        name: formData.name,
        phone: formData.phone,
        status: formData.status,
        service: formData.service,
        nextFollowUp: formData.nextFollowUp,
        followupTime: formData.followupTime,
        comments: formData.comments,
        followupType: formData.followupType,
        importantLead: formData.importantLead,
      };

      if (formData.recordingPath) {
        payload.recordingPath = formData.recordingPath;
        payload.recordingName = formData.recordingName;
      }

      if (matchedLead) {
        syncResult = await updateLead(matchedLead.id, payload);
      } else {
        syncResult = await createLead({
          ...payload,
          name: formData.name || 'Unknown Caller',
          source: 'Call',
        });
      }

      // 3. Update sync status in Room
      if (syncResult && syncResult.success) {
        await updateSyncStatus(eventId, 'SYNCED');
        showToast('Lead details saved successfully', 'success');
      } else {
        await updateSyncStatus(eventId, 'FAILED');
        showToast('Saved locally, offline sync will retry later', 'warning');
      }

      // 4. Advance queue
      setIsPopupVisible(false);
      setCurrentEvent(null);
      
      // Brief timeout to let the modal close transition complete nicely before showing next
      setTimeout(() => {
        refreshQueue();
      }, 300);

    } catch (error) {
      console.error('Error submitting call event:', error);
      showToast('Error saving lead details', 'error');
    }
  }, [leads, createLead, updateLead, refreshQueue, showToast]);

  // Skip call event (mark as submitted with empty data)
  const skipEvent = useCallback(async (eventId) => {
    try {
      await markSubmitted(eventId, null);
      
      setIsPopupVisible(false);
      setCurrentEvent(null);

      setTimeout(() => {
        refreshQueue();
      }, 300);
      
      showToast('Call popup skipped', 'info');
    } catch (error) {
      console.error('Error skipping call event:', error);
    }
  }, [refreshQueue, showToast]);

  return (
    <CallQueueContext.Provider
      value={{
        pendingEvents,
        currentEvent,
        isPopupVisible,
        submitEvent,
        skipEvent,
        refreshQueue,
      }}
    >
      {children}
    </CallQueueContext.Provider>
  );
};

export const useCallQueue = () => {
  const context = useContext(CallQueueContext);
  if (!context) {
    throw new Error('useCallQueue must be used within a CallQueueProvider');
  }
  return context;
};

export default CallQueueContext;
