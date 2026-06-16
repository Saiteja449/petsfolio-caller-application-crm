package com.petsfoliocaller

import android.content.Intent
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.telecom.Call
import android.telecom.InCallService
import android.util.Log

class CallService : InCallService() {

    private var wasRinging = false
    private var hasBeenActive = false
    private var ringtone: Ringtone? = null

    private fun startRingtone() {
        if (ringtone == null) {
            try {
                val uri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                ringtone = RingtoneManager.getRingtone(applicationContext, uri)
                ringtone?.play()
            } catch (e: Exception) {
                Log.e("CallService", "Error playing ringtone", e)
            }
        }
    }

    private fun stopRingtone() {
        ringtone?.stop()
        ringtone = null
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        CallManager.callService = this
        Log.d("CallService", "onCallAdded")
        CallManager.updateCall(call)
        call.registerCallback(callCallback)
        
        if (call.state == Call.STATE_RINGING) {
            wasRinging = true
            startRingtone()
        }
        if (call.state == Call.STATE_ACTIVE) {
            hasBeenActive = true
        }

        val callerInfo = call.details?.handle?.schemeSpecificPart ?: "Unknown Caller"
        if (call.state == Call.STATE_RINGING || call.state == Call.STATE_ACTIVE) {
            val stateStr = if (call.state == Call.STATE_RINGING) "RINGING" else "ACTIVE"
            NotificationHelper.showOngoingCallNotification(this, callerInfo, stateStr)
        }

        // If it's an incoming ringing call, wake up MainActivity
        if (call.state == Call.STATE_RINGING) {
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            }
            startActivity(intent)
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.d("CallService", "onCallRemoved")
        call.unregisterCallback(callCallback)
        CallManager.removeCall(call)
        if (CallManager.currentCall == null) {
            CallManager.callService = null
        }
        stopRingtone()

        NotificationHelper.cancelOngoingCallNotification(this)

        if (wasRinging && !hasBeenActive) {
            val callerInfo = call.details?.handle?.schemeSpecificPart ?: "Unknown Caller"
            NotificationHelper.showMissedCallNotification(this, callerInfo)
        }
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            Log.d("CallService", "onStateChanged: $state")
            CallManager.updateCall(call)

            if (state == Call.STATE_RINGING) {
                wasRinging = true
                startRingtone()
            } else {
                stopRingtone()
            }
            if (state == Call.STATE_ACTIVE) {
                hasBeenActive = true
            }

            val callerInfo = call.details?.handle?.schemeSpecificPart ?: "Unknown Caller"
            if (state == Call.STATE_ACTIVE || state == Call.STATE_RINGING) {
                val stateStr = if (state == Call.STATE_RINGING) "RINGING" else "ACTIVE"
                NotificationHelper.showOngoingCallNotification(this@CallService, callerInfo, stateStr)
            } else if (state == Call.STATE_DISCONNECTED) {
                NotificationHelper.cancelOngoingCallNotification(this@CallService)
            }
        }
    }
}
