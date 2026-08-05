package com.petsfoliocaller

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.CallLog
import android.telephony.TelephonyManager
import android.util.Log
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Static BroadcastReceiver that listens for PHONE_STATE broadcasts.
 * 
 * When a call transitions to IDLE (call ends), it queries the system Call Log
 * after a brief delay (to allow the OS to write the database) and processes it.
 */
class CallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "CallReceiver"
        private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            Log.d(TAG, "PHONE_STATE changed to: $state")

            if (state == TelephonyManager.EXTRA_STATE_IDLE) {
                Log.d(TAG, "Call ended (IDLE state detected). Scheduling call log query...")
                
                // Querying the Call Log must be done on a background thread after a brief delay
                // to ensure the OS has finished writing the call log.
                Handler(Looper.getMainLooper()).postDelayed({
                    executor.execute {
                        queryLatestCallLog(context)
                    }
                }, 1500) // 1.5 seconds delay is the industry standard for Call Log updates
            }
        }
    }

    private fun queryLatestCallLog(context: Context) {
        var cursor: Cursor? = null
        try {
            val queryUri: Uri = CallLog.Calls.CONTENT_URI
            val projection = arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.TYPE,
                CallLog.Calls.DATE,
                CallLog.Calls.DURATION
            )
            
            // Query the single latest call log entry
            cursor = context.contentResolver.query(
                queryUri,
                projection,
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )

            if (cursor != null && cursor.moveToFirst()) {
                val id = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls._ID))
                val number = cursor.getString(cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER))
                val type = cursor.getInt(cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE))
                val date = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls.DATE))
                val duration = cursor.getInt(cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION))

                Log.d(TAG, "Retrieved call log: id=$id, number=$number, type=$type, date=$date, duration=$duration")

                // Verify this call ended recently to prevent duplicate processing
                val callEndTime = date + (duration * 1000L)
                val now = System.currentTimeMillis()
                val ageMs = Math.abs(now - callEndTime)
                if (ageMs > 30000) { // 30 seconds threshold
                    Log.d(TAG, "Call log entry ended too long ago (${ageMs}ms ago). Skipping processing.")
                    return
                }

                // Skip emergency numbers
                val emergencyNumbers = setOf("100", "101", "108", "112", "911", "110", "999")
                val normalizedPhone = number.replace(Regex("[^0-9]"), "")
                if (normalizedPhone in emergencyNumbers) {
                    Log.d(TAG, "Skipping emergency number: $number")
                    return
                }

                // Map ContentProvider call type to our coordinator directions
                val callDirection = if (type == CallLog.Calls.OUTGOING_TYPE) {
                    "OUTGOING"
                } else {
                    "INCOMING"
                }

                // Determine ringing/answered flags
                val wasRinging = type == CallLog.Calls.MISSED_TYPE || type == CallLog.Calls.REJECTED_TYPE || type == CallLog.Calls.INCOMING_TYPE
                val wasActive = type == CallLog.Calls.INCOMING_TYPE || type == CallLog.Calls.OUTGOING_TYPE

                CallEventCoordinator.onCallEnded(
                    context = context,
                    phoneNumber = number,
                    wasRinging = wasRinging,
                    wasActive = wasActive,
                    callDirection = callDirection,
                    startTimestamp = date - (duration * 1000L), // Approximate start time
                    endTimestamp = date
                )
            } else {
                Log.w(TAG, "No call log entries found.")
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing READ_CALL_LOG permission", e)
        } catch (e: Exception) {
            Log.e(TAG, "Error querying call log", e)
        } finally {
            cursor?.close()
        }
    }
}
