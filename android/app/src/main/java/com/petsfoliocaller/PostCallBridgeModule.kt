package com.petsfoliocaller

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.petsfoliocaller.db.CallEventDatabase
import com.petsfoliocaller.db.CallEventEntity

/**
 * React Native Native Module that exposes the Room call event queue to JavaScript.
 * 
 * JS can call:
 *   - getPendingEvents() → returns array of unsubmitted events
 *   - getEventCount() → returns count of pending events
 *   - markPopupShown(eventId) → marks event as popup displayed
 *   - markSubmitted(eventId, formDataJson) → marks event as submitted
 *   - getNextPendingEvent() → returns the next event in queue
 */
class PostCallBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PostCallBridge"

    private fun getDao() = CallEventDatabase.getInstance(reactApplicationContext).callEventDao()

    private fun entityToMap(entity: CallEventEntity): WritableMap {
        val map = Arguments.createMap()
        map.putDouble("id", entity.id.toDouble())
        map.putString("phoneNumber", entity.phoneNumber)
        map.putString("contactName", entity.contactName)
        map.putString("callDirection", entity.callDirection)
        map.putString("callStatus", entity.callStatus)
        map.putDouble("startTimestamp", entity.startTimestamp.toDouble())
        map.putDouble("endTimestamp", entity.endTimestamp.toDouble())
        map.putInt("durationSeconds", entity.durationSeconds)
        map.putBoolean("wasRinging", entity.wasRinging == 1)
        map.putBoolean("wasActive", entity.wasActive == 1)
        map.putInt("simSlot", entity.simSlot)
        map.putBoolean("popupShown", entity.popupShown == 1)
        map.putBoolean("submitted", entity.submitted == 1)
        map.putString("submittedData", entity.submittedData)
        map.putString("syncStatus", entity.syncStatus)
        map.putInt("retryCount", entity.retryCount)
        map.putDouble("createdAt", entity.createdAt.toDouble())
        map.putDouble("updatedAt", entity.updatedAt.toDouble())
        return map
    }

    /**
     * Get all pending (unsubmitted) events, ordered by createdAt ASC (FIFO).
     */
    @ReactMethod
    fun getPendingEvents(promise: Promise) {
        try {
            val events = getDao().getPendingEvents()
            val array: WritableArray = Arguments.createArray()
            for (event in events) {
                array.pushMap(entityToMap(event))
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to get pending events: ${e.message}")
        }
    }

    /**
     * Get count of pending events.
     */
    @ReactMethod
    fun getEventCount(promise: Promise) {
        try {
            val count = getDao().getPendingCount()
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to get event count: ${e.message}")
        }
    }

    /**
     * Get the next pending event (first in FIFO queue).
     */
    @ReactMethod
    fun getNextPendingEvent(promise: Promise) {
        try {
            val event = getDao().getNextPendingEvent()
            if (event != null) {
                promise.resolve(entityToMap(event))
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to get next event: ${e.message}")
        }
    }

    /**
     * Mark an event as popup shown.
     */
    @ReactMethod
    fun markPopupShown(eventId: Double, promise: Promise) {
        try {
            getDao().markPopupShown(eventId.toLong())
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to mark popup shown: ${e.message}")
        }
    }

    /**
     * Mark an event as submitted with form data JSON.
     * Pass null for formDataJson to mark as skipped.
     */
    @ReactMethod
    fun markSubmitted(eventId: Double, formDataJson: String?, promise: Promise) {
        try {
            getDao().markSubmitted(eventId.toLong(), formDataJson)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to mark submitted: ${e.message}")
        }
    }

    /**
     * Update sync status for an event after API call.
     */
    @ReactMethod
    fun updateSyncStatus(eventId: Double, status: String, promise: Promise) {
        try {
            getDao().updateSyncStatus(eventId.toLong(), status)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to update sync status: ${e.message}")
        }
    }

    /**
     * Purge old synced events (older than 30 days).
     */
    @ReactMethod
    fun purgeOldEvents(promise: Promise) {
        try {
            val thirtyDaysAgo = System.currentTimeMillis() - (30L * 24 * 60 * 60 * 1000)
            getDao().purgeOldSyncedEvents(thirtyDaysAgo)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", "Failed to purge old events: ${e.message}")
        }
    }

    @ReactMethod
    fun startCallMonitorService(promise: Promise) {
        try {
            CallMonitorService.start(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to start service: ${e.message}")
        }
    }

    @ReactMethod
    fun stopCallMonitorService(promise: Promise) {
        try {
            CallMonitorService.stop(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed to stop service: ${e.message}")
        }
    }

    @ReactMethod
    fun isCallMonitorServiceRunning(promise: Promise) {
        try {
            val manager = reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            @Suppress("DEPRECATION")
            val runningServices = manager.getRunningServices(Integer.MAX_VALUE)
            val isRunning = runningServices.any { it.service.className == CallMonitorService::class.java.name }
            promise.resolve(isRunning)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter
    }
}
