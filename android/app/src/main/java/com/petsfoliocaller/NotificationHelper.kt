package com.petsfoliocaller

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

object NotificationHelper {
    private const val CHANNEL_ID = "call_channel"
    private const val NOTIFICATION_ID_CALL = 1001
    private const val NOTIFICATION_ID_MISSED = 1002

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Phone Calls"
            val descriptionText = "Notifications for incoming and active calls"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setSound(null, null) 
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun getMainActivityIntent(context: Context): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getActivity(context, 0, intent, flags)
    }

    fun showOngoingCallNotification(context: Context, callerNameOrNumber: String, state: String) {
        createChannel(context)

        val title = if (state == "RINGING") "Incoming Call" else "Ongoing Call"
        val pendingIntent = getMainActivityIntent(context)

        val endCallIntent = Intent(context, CallActionReceiver::class.java).apply {
            action = "ACTION_END_CALL"
        }
        val endCallPendingIntent = PendingIntent.getBroadcast(
            context, 0, endCallIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher) 
            .setContentTitle(title)
            .setContentText(callerNameOrNumber)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(pendingIntent)

        if (state == "ACTIVE") {
            builder.addAction(0, "End Call", endCallPendingIntent)
        }

        if (state == "RINGING") {
            builder.setFullScreenIntent(pendingIntent, true)
        }

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID_CALL, builder.build())
    }

    fun cancelOngoingCallNotification(context: Context) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID_CALL)
    }

    fun showMissedCallNotification(context: Context, callerNameOrNumber: String) {
        createChannel(context)
        val pendingIntent = getMainActivityIntent(context)

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Missed Call")
            .setContentText(callerNameOrNumber)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID_MISSED, builder.build())
    }
}
