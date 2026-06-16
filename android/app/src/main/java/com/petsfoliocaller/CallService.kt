package com.petsfoliocaller

import android.content.Intent
import android.telecom.Call
import android.telecom.InCallService
import android.util.Log

class CallService : InCallService() {

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        Log.d("CallService", "onCallAdded")
        CallManager.updateCall(call)
        call.registerCallback(callCallback)

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
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            Log.d("CallService", "onStateChanged: $state")
            CallManager.updateCall(call)
        }
    }
}
