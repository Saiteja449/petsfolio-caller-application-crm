package com.petsfoliocaller

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class CallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d("CallActionReceiver", "Received intent: ${intent?.action}")
        if (intent?.action == "ACTION_END_CALL") {
            CallManager.disconnect()
        }
    }
}
