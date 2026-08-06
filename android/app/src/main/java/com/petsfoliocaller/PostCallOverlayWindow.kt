package com.petsfoliocaller

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.util.Log

object PostCallOverlayWindow {
    private const val TAG = "PostCallOverlayWindow"
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    /**
     * Show the post call popup overlay on the screen.
     * Uses WindowManager to overlay other applications, bypassing background activity restrictions.
     */
    fun show(
        context: Context,
        phoneNumber: String,
        callDirection: String,
        callStatus: String,
        durationSeconds: Int
    ) {
        // Run on main thread to avoid UI thread exceptions
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            if (overlayView != null) {
                dismiss()
            }

            try {
                val appContext = context.applicationContext
                windowManager = appContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                val inflater = appContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
                
                // Inflate custom native overlay layout
                overlayView = inflater.inflate(R.layout.post_call_overlay, null)

                // Setup view contents
                val txtNumber = overlayView?.findViewById<TextView>(R.id.txt_caller_number)
                val txtDetails = overlayView?.findViewById<TextView>(R.id.txt_call_details)
                val btnRecord = overlayView?.findViewById<Button>(R.id.btn_record_details)
                val btnDismiss = overlayView?.findViewById<Button>(R.id.btn_dismiss_overlay)

                txtNumber?.text = phoneNumber
                
                val durationText = if (durationSeconds > 0) "${durationSeconds}s" else "No duration"
                txtDetails?.text = "$callDirection • $callStatus • $durationText"

                btnRecord?.setOnClickListener {
                    try {
                        val intent = Intent(appContext, MainActivity::class.java).apply {
                            action = "ACTION_POST_CALL"
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                        }
                        appContext.startActivity(intent)
                        Log.d(TAG, "Launched MainActivity from overlay click")
                    } catch (ex: Exception) {
                        Log.e(TAG, "Failed to launch MainActivity from overlay", ex)
                    }
                    dismiss()
                }

                btnDismiss?.setOnClickListener {
                    dismiss()
                }

                // WindowManager layout type setup
                val layoutParamsType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }

                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutParamsType,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                    PixelFormat.TRANSLUCENT
                ).apply {
                    gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                    x = 0
                    y = 120 // Top offset to avoid overlaying notification tray/status bar directly
                    windowAnimations = android.R.style.Animation_Dialog
                }

                windowManager?.addView(overlayView, params)
                Log.d(TAG, "Overlay window successfully added to WindowManager")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to show overlay window", e)
            }
        }
    }

    /**
     * Remove the overlay window.
     */
    fun dismiss() {
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            try {
                if (overlayView != null && windowManager != null) {
                    windowManager?.removeView(overlayView)
                    overlayView = null
                    Log.d(TAG, "Overlay window successfully dismissed")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to dismiss overlay window", e)
            }
        }
    }
}
