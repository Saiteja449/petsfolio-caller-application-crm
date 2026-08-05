import { NativeModules } from 'react-native';

const { PostCallBridge } = NativeModules;

/**
 * JS wrapper for the PostCallBridge native module.
 * Exposes Room DB call event queue to React Native.
 */

/**
 * Get all pending (unsubmitted) call events, FIFO ordered.
 * @returns {Promise<Array>} Array of call event objects
 */
export const getPendingEvents = () => {
  return PostCallBridge.getPendingEvents();
};

/**
 * Get count of pending (unsubmitted) events.
 * @returns {Promise<number>}
 */
export const getEventCount = () => {
  return PostCallBridge.getEventCount();
};

/**
 * Get the next event in the FIFO queue.
 * @returns {Promise<Object|null>}
 */
export const getNextPendingEvent = () => {
  return PostCallBridge.getNextPendingEvent();
};

/**
 * Mark an event as popup shown to user.
 * @param {number} eventId
 * @returns {Promise<boolean>}
 */
export const markPopupShown = (eventId) => {
  return PostCallBridge.markPopupShown(eventId);
};

/**
 * Mark an event as submitted with form data.
 * Pass null for formDataJson to mark as skipped.
 * @param {number} eventId
 * @param {string|null} formDataJson - JSON string of form data, or null if skipped
 * @returns {Promise<boolean>}
 */
export const markSubmitted = (eventId, formDataJson) => {
  return PostCallBridge.markSubmitted(eventId, formDataJson);
};

/**
 * Update sync status after API call.
 * @param {number} eventId
 * @param {string} status - "SYNCED" | "FAILED"
 * @returns {Promise<boolean>}
 */
export const updateSyncStatus = (eventId, status) => {
  return PostCallBridge.updateSyncStatus(eventId, status);
};

/**
 * Purge old synced events (older than 30 days).
 * @returns {Promise<boolean>}
 */
export const purgeOldEvents = () => {
  return PostCallBridge.purgeOldEvents();
};
