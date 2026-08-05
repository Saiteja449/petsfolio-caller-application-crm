package com.petsfoliocaller

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.petsfoliocaller.db.CallEventDatabase

/**
 * Handles BOOT_COMPLETED to check for pending call events
 * that were queued before a reboot.
 * 
 * If there are pending (unsubmitted) events, launches the app
 * so the user can fill in the call details.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Boot completed, checking for pending call events")
            try {
                val dao = CallEventDatabase.getInstance(context).callEventDao()
                val pendingCount = dao.getPendingCount()
                if (pendingCount > 0) {
                    Log.d("BootReceiver", "Found $pendingCount pending call events, showing notification")
                    NotificationHelper.showPostCallNotification(context)
                }
            } catch (e: Exception) {
                Log.e("BootReceiver", "Error checking pending events on boot", e)
            }
        }
    }
}
