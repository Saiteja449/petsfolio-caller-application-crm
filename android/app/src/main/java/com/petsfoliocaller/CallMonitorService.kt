package com.petsfoliocaller

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import android.database.Cursor
import android.net.Uri
import android.provider.CallLog

class CallMonitorService : Service() {

    companion object {
        private const val TAG = "CallMonitorService"
        private const val NOTIFICATION_ID = 1004
        private val executor: ExecutorService = Executors.newSingleThreadExecutor()
        
        fun start(context: Context) {
            val intent = Intent(context, CallMonitorService::class.java)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
                Log.d(TAG, "Started CallMonitorService successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start CallMonitorService", e)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, CallMonitorService::class.java)
            try {
                context.stopService(intent)
                Log.d(TAG, "Stopped CallMonitorService successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to stop CallMonitorService", e)
            }
        }
    }

    private var telephonyManager: TelephonyManager? = null
    private var telemetryCallback: Any? = null 
    private var phoneStateListener: PhoneStateListener? = null
    
    private var isCallActive = false
    private var lastState = TelephonyManager.CALL_STATE_IDLE

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "CallMonitorService created")
        telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        registerCallStateListener()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "CallMonitorService starting command")
        
        // Start in foreground immediately to avoid OS background execution restrictions
        val notification = NotificationHelper.getMonitorNotification(this)
        startForeground(NOTIFICATION_ID, notification)
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "CallMonitorService destroyed")
        unregisterCallStateListener()
    }

    private fun registerCallStateListener() {
        val tm = telephonyManager ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                    override fun onCallStateChanged(state: Int) {
                        handleCallStateChange(state)
                    }
                }
                tm.registerTelephonyCallback(mainExecutor, callback)
                telemetryCallback = callback
                Log.d(TAG, "Registered TelephonyCallback for call state monitoring")
            } else {
                val listener = object : PhoneStateListener() {
                    override fun onCallStateChanged(state: Int, incomingNumber: String?) {
                        handleCallStateChange(state)
                    }
                }
                tm.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
                phoneStateListener = listener
                Log.d(TAG, "Registered PhoneStateListener for call state monitoring")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register telephony state listener", e)
        }
    }

    private fun unregisterCallStateListener() {
        val tm = telephonyManager ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telemetryCallback?.let {
                    tm.unregisterTelephonyCallback(it as TelephonyCallback)
                    telemetryCallback = null
                }
            } else {
                phoneStateListener?.let {
                    tm.listen(it, PhoneStateListener.LISTEN_NONE)
                    phoneStateListener = null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unregister listener", e)
        }
    }

    private fun handleCallStateChange(state: Int) {
        Log.d(TAG, "Call state changed in service: lastState=$lastState, newState=$state")
        
        if (state == TelephonyManager.CALL_STATE_OFFHOOK || state == TelephonyManager.CALL_STATE_RINGING) {
            isCallActive = true
        } else if (state == TelephonyManager.CALL_STATE_IDLE) {
            if (isCallActive || lastState == TelephonyManager.CALL_STATE_OFFHOOK) {
                Log.d(TAG, "Call ended transition detected in foreground service. Scheduling CallLog query...")
                isCallActive = false
                
                // Query call log after a brief delay (1.5 seconds) to allow the OS database write to finish.
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    executor.execute {
                        queryLatestCallLog(this)
                    }
                }, 1500)
            }
        }
        lastState = state
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

                Log.d(TAG, "Retrieved call log in service: id=$id, number=$number, type=$type, date=$date, duration=$duration")

                val callEndTime = date + (duration * 1000L)
                val now = System.currentTimeMillis()
                val ageMs = Math.abs(now - callEndTime)
                if (ageMs > 30000) { 
                    Log.d(TAG, "Call log entry too old (${ageMs}ms). Skipping.")
                    return
                }

                val emergencyNumbers = setOf("100", "101", "108", "112", "911", "110", "999")
                val normalizedPhone = number.replace(Regex("[^0-9]"), "")
                if (normalizedPhone in emergencyNumbers) {
                    Log.d(TAG, "Skipping emergency number: $number")
                    return
                }

                val callDirection = if (type == CallLog.Calls.OUTGOING_TYPE) "OUTGOING" else "INCOMING"
                val wasRinging = type == CallLog.Calls.MISSED_TYPE || type == CallLog.Calls.REJECTED_TYPE || type == CallLog.Calls.INCOMING_TYPE
                val wasActive = type == CallLog.Calls.INCOMING_TYPE || type == CallLog.Calls.OUTGOING_TYPE

                CallEventCoordinator.onCallEnded(
                    context = context,
                    phoneNumber = number,
                    wasRinging = wasRinging,
                    wasActive = wasActive,
                    callDirection = callDirection,
                    startTimestamp = date - (duration * 1000L),
                    endTimestamp = date
                )
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing READ_CALL_LOG permission", e)
        } catch (e: Exception) {
            Log.e(TAG, "Error querying call log in service", e)
        } finally {
            cursor?.close()
        }
    }
}
