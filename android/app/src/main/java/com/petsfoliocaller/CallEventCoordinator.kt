package com.petsfoliocaller

import android.content.Context
import android.content.Intent
import android.util.Log
import com.petsfoliocaller.db.CallEventDatabase
import com.petsfoliocaller.db.CallEventEntity
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Central orchestrator for post-call events.
 * 
 * Responsibilities:
 * 1. Receive call-ended data from CallService
 * 2. Persist to Room DB (with deduplication)
 * 3. Decide whether to launch the app or send a JS event
 * 4. Thread-safe for back-to-back calls
 */
object CallEventCoordinator {

    private const val TAG = "CallEventCoordinator"
    private val lock = Any()

    /**
     * Called from CallService.onCallRemoved() with all the call metadata.
     * This is the single entry point for recording a completed call.
     */
    fun onCallEnded(
        context: Context,
        phoneNumber: String,
        wasRinging: Boolean,
        wasActive: Boolean,
        callDirection: String,    // "INCOMING" or "OUTGOING"
        startTimestamp: Long,
        endTimestamp: Long
    ) {
        synchronized(lock) {
            try {
                val db = CallEventDatabase.getInstance(context)
                val dao = db.callEventDao()

                // Compute call status
                val callStatus = computeCallStatus(callDirection, wasRinging, wasActive)

                // Compute duration
                val durationSeconds = if (endTimestamp > startTimestamp) {
                    ((endTimestamp - startTimestamp) / 1000).toInt()
                } else {
                    0
                }

                // Normalize phone for dedup key
                val normalizedPhone = phoneNumber.replace(Regex("[^0-9+]"), "")
                val dedupeKey = "${normalizedPhone}_${endTimestamp}"

                val event = CallEventEntity(
                    phoneNumber = phoneNumber,
                    callDirection = callDirection,
                    callStatus = callStatus,
                    startTimestamp = startTimestamp,
                    endTimestamp = endTimestamp,
                    durationSeconds = durationSeconds,
                    wasRinging = if (wasRinging) 1 else 0,
                    wasActive = if (wasActive) 1 else 0,
                    dedupeKey = dedupeKey
                )

                // INSERT OR IGNORE — dedupeKey UNIQUE constraint prevents duplicates
                val insertedId = dao.insertEvent(event)
                if (insertedId == -1L) {
                    Log.d(TAG, "Duplicate event ignored: $dedupeKey")
                    return
                }

                Log.d(TAG, "Event persisted: id=$insertedId, phone=$phoneNumber, status=$callStatus")

                val pendingCount = dao.getPendingCount()

                // Decide whether to launch app or send event
                launchOrNotify(context, pendingCount)

            } catch (e: Exception) {
                Log.e(TAG, "Failed to process call ended event", e)
            }
        }
    }

    /**
     * Compute call status from direction and state flags.
     */
    private fun computeCallStatus(direction: String, wasRinging: Boolean, wasActive: Boolean): String {
        return when {
            wasActive -> "CONNECTED"
            direction == "INCOMING" && wasRinging && !wasActive -> "MISSED"
            direction == "OUTGOING" && !wasActive -> "NOT_CONNECTED"
            else -> "MISSED"
        }
    }

    /**
     * Launch the app or send a native event if already alive.
     * 
     * - If there's an active call (another call in progress), do NOT launch yet.
     *   The event is safely persisted in Room and will be picked up when the last call ends.
     * - If app is alive, send a JS event to refresh the queue.
     * - If app is dead, launch MainActivity.
     */
    private fun launchOrNotify(context: Context, pendingCount: Int) {
        // Don't launch if there's still an active call
        if (CallManager.currentCall != null) {
            Log.d(TAG, "Active call in progress, skipping launch. Event is persisted.")
            return
        }

        // Try sending event to JS if React context is alive
        val reactContext = CallManager.reactContext
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            try {
                val params = Arguments.createMap()
                params.putInt("pendingCount", pendingCount)
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onPostCallEvent", params)
                Log.d(TAG, "Sent onPostCallEvent to JS (pendingCount=$pendingCount)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send JS event", e)
            }
        }

        // Always bring the activity to the foreground/launch it
        launchMainActivity(context)
    }

    /**
     * Launch MainActivity with ACTION_POST_CALL intent.
     */
    private fun launchMainActivity(context: Context) {
        try {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = "ACTION_POST_CALL"
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            }
            context.startActivity(intent)
            Log.d(TAG, "Launched MainActivity with ACTION_POST_CALL")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch MainActivity, showing notification fallback", e)
            NotificationHelper.showPostCallNotification(context)
        }
    }
}
