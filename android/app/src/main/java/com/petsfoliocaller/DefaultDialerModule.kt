package com.petsfoliocaller

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.util.Log
import java.io.File
import java.io.IOException
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DefaultDialerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val REQUEST_ID_MULTIPLE_PERMISSIONS = 1
    private var dialerPromise: Promise? = null
    private var mediaPlayer: android.media.MediaPlayer? = null

    private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == REQUEST_ID_MULTIPLE_PERMISSIONS) {
                if (resultCode == Activity.RESULT_OK) {
                    dialerPromise?.resolve(true)
                } else {
                    dialerPromise?.resolve(false)
                }
                dialerPromise = null
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
        CallManager.reactContext = reactContext
    }

    override fun getName(): String {
        return "DefaultDialer"
    }

    @ReactMethod
    fun requestDefaultDialer(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = reactApplicationContext.getSystemService(Context.ROLE_SERVICE) as RoleManager
            val isRoleAvailable = roleManager.isRoleAvailable(RoleManager.ROLE_DIALER)
            val isRoleHeld = roleManager.isRoleHeld(RoleManager.ROLE_DIALER)

            if (isRoleHeld) {
                promise.resolve(true)
                return
            }

            if (isRoleAvailable) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)
                dialerPromise = promise
                getCurrentActivity()?.startActivityForResult(intent, REQUEST_ID_MULTIPLE_PERMISSIONS)
            } else {
                promise.reject("UNAVAILABLE", "Dialer role is not available")
            }
        } else {
            val intent = Intent(android.telecom.TelecomManager.ACTION_CHANGE_DEFAULT_DIALER)
            intent.putExtra(android.telecom.TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, reactApplicationContext.packageName)
            dialerPromise = promise
            getCurrentActivity()?.startActivityForResult(intent, REQUEST_ID_MULTIPLE_PERMISSIONS)
        }
    }
    
    @ReactMethod
    fun checkDefaultDialer(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = reactApplicationContext.getSystemService(Context.ROLE_SERVICE) as RoleManager
            val isRoleHeld = roleManager.isRoleHeld(RoleManager.ROLE_DIALER)
            promise.resolve(isRoleHeld)
        } else {
            promise.resolve(false) 
        }
    }

    @ReactMethod
    fun makeCall(phoneNumber: String, promise: Promise) {
        val telecomManager = reactApplicationContext.getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        val uri = android.net.Uri.fromParts("tel", phoneNumber, null)
        
        try {
            if (androidx.core.content.ContextCompat.checkSelfPermission(reactApplicationContext, android.Manifest.permission.READ_PHONE_STATE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                val accounts = telecomManager.callCapablePhoneAccounts
                if (accounts.size > 1) {
                    val activity = getCurrentActivity()
                    if (activity != null) {
                        activity.runOnUiThread {
                            val builder = android.app.AlertDialog.Builder(activity)
                            builder.setTitle("Select SIM to call")
                            
                            val simNames: Array<CharSequence> = accounts.map { accountHandle ->
                                val account = telecomManager.getPhoneAccount(accountHandle)
                                (account?.label ?: accountHandle.id ?: "SIM") as CharSequence
                            }.toTypedArray()
                            
                            builder.setItems(simNames) { _, which ->
                                val selectedAccount = accounts[which]
                                val extras = android.os.Bundle()
                                extras.putParcelable(android.telecom.TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, selectedAccount)
                                try {
                                    telecomManager.placeCall(uri, extras)
                                    promise.resolve(true)
                                } catch (e: SecurityException) {
                                    promise.reject("PERMISSION_DENIED", "CALL_PHONE permission denied")
                                } catch (e: Exception) {
                                    promise.reject("ERROR", e.message)
                                }
                            }
                            builder.setOnCancelListener {
                                promise.reject("CANCELLED", "User cancelled SIM selection")
                            }
                            builder.show()
                        }
                        return
                    }
                }
            }

            val extras = android.os.Bundle()
            telecomManager.placeCall(uri, extras)
            promise.resolve(true)
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "CALL_PHONE permission denied")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun answerCall() {
        CallManager.answer()
    }

    @ReactMethod
    fun rejectCall() {
        CallManager.reject()
    }

    @ReactMethod
    fun endCall() {
        CallManager.disconnect()
    }

    @ReactMethod
    fun setMute(muted: Boolean) {
        CallManager.setMute(muted)
    }

    @ReactMethod
    fun setSpeaker(speaker: Boolean) {
        CallManager.setSpeaker(speaker)
    }

    @ReactMethod
    fun getCurrentCall(promise: Promise) {
        promise.resolve(CallManager.getCurrentCallState())
    }

    @ReactMethod
    fun checkActiveCall(promise: Promise) {
        try {
            val tm = reactApplicationContext.getSystemService(Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager
            val state = tm.callState
            if (state == android.telephony.TelephonyManager.CALL_STATE_OFFHOOK || state == android.telephony.TelephonyManager.CALL_STATE_RINGING) {
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getLatestAudioFile(promise: Promise) {
        try {
            val uri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            val projection = arrayOf(
                android.provider.MediaStore.Audio.Media._ID,
                android.provider.MediaStore.Audio.Media.DATA,
                android.provider.MediaStore.Audio.Media.DISPLAY_NAME,
                android.provider.MediaStore.Audio.Media.DATE_ADDED
            )
            val sortOrder = "${android.provider.MediaStore.Audio.Media.DATE_ADDED} DESC"
            
            // Exclude WhatsApp, Telegram and Android internal/cache media folders 
            // since they trigger constant writes and swamp actual call recordings.
            val selection = "${android.provider.MediaStore.Audio.Media.DATA} NOT LIKE ? AND ${android.provider.MediaStore.Audio.Media.DATA} NOT LIKE ? AND ${android.provider.MediaStore.Audio.Media.DATA} NOT LIKE ?"
            val selectionArgs = arrayOf("%WhatsApp%", "%/Android/%", "%Telegram%")

            reactApplicationContext.contentResolver.query(
                uri,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Audio.Media._ID)
                    val nameColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Audio.Media.DISPLAY_NAME)
                    
                    val id = cursor.getLong(idColumn)
                    val fileName = cursor.getString(nameColumn)
                    
                    val contentUri = android.content.ContentUris.withAppendedId(
                        android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                        id
                    )
                    
                    // Copy file to internal cache to bypass Android 10+ Scoped Storage restrictions
                    val cacheFile = java.io.File(reactApplicationContext.cacheDir, fileName)
                    if (!reactApplicationContext.cacheDir.exists()) {
                        reactApplicationContext.cacheDir.mkdirs()
                    }
                    
                    reactApplicationContext.contentResolver.openInputStream(contentUri)?.use { input ->
                        java.io.FileOutputStream(cacheFile).use { output ->
                            input.copyTo(output)
                        }
                    }
                    
                    val map = com.facebook.react.bridge.Arguments.createMap()
                    map.putString("uri", "file://" + cacheFile.absolutePath)
                    map.putString("name", fileName)
                    promise.resolve(map)
                } else {
                    promise.reject("NOT_FOUND", "No audio files found on device")
                }
            } ?: promise.reject("ERROR", "Failed to query media store")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun playAudio(filePath: String, promise: Promise) {
        try {
            val path = filePath.replace("file://", "")
            val file = java.io.File(path)
            if (!file.exists() || file.length() == 0L) {
                promise.reject("PLAYBACK_ERROR", "Audio file is empty or does not exist.")
                return
            }
            
            mediaPlayer?.release()
            mediaPlayer = android.media.MediaPlayer().apply {
                setDataSource(file.absolutePath)
                prepare()
                start()
                setOnCompletionListener {
                    // Send an event or just resolve if we passed a callback, but we can't resolve twice.
                }
            }
            promise.resolve("STARTED")
        } catch (e: Exception) {
            promise.reject("PLAYBACK_ERROR", "Failed to play audio: ${e.message}")
        }
    }

    @ReactMethod
    fun stopAudio(promise: Promise) {
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
            mediaPlayer = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PLAYBACK_ERROR", "Failed to stop audio: ${e.message}")
        }
    }

    @ReactMethod
    fun getAudioDuration(filePath: String, promise: Promise) {
        try {
            val path = filePath.replace("file://", "")
            val file = java.io.File(path)
            if (!file.exists() || file.length() == 0L) {
                promise.resolve(0)
                return
            }
            val retriever = android.media.MediaMetadataRetriever()
            retriever.setDataSource(path)
            val time = retriever.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION)
            val durationMs = time?.toLongOrNull() ?: 0L
            retriever.release()
            promise.resolve((durationMs / 1000).toInt())
        } catch (e: Exception) {
            promise.resolve(0)
        }
    }

    @ReactMethod
    fun isXiaomiDevice(promise: Promise) {
        val manufacturer = Build.MANUFACTURER.lowercase()
        val brand = Build.BRAND.lowercase()
        val isXiaomi = manufacturer.contains("xiaomi") || 
                       manufacturer.contains("redmi") || 
                       manufacturer.contains("poco") || 
                       brand.contains("xiaomi") || 
                       brand.contains("redmi") || 
                       brand.contains("poco")
        promise.resolve(isXiaomi)
    }

    @ReactMethod
    fun openAutostartSettings(promise: Promise) {
        try {
            val intent = Intent().apply {
                component = android.content.ComponentName(
                    "com.miui.securitycenter",
                    "com.miui.permcenter.autostart.AutoStartManagementActivity"
                )
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            try {
                // Fallback to app info settings if specific security center fails
                val intent = Intent().apply {
                    action = android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                    data = android.net.Uri.fromParts("package", reactApplicationContext.packageName, null)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(false)
            } catch (ex: Exception) {
                promise.reject("ERROR", "Could not open settings: ${ex.message}")
            }
        }
    }

    @ReactMethod
    fun checkBatteryOptimizationExempt(promise: Promise) {
        try {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val isExempt = pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
                promise.resolve(isExempt)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestBatteryOptimizationExempt(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                val isExempt = pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
                if (!isExempt) {
                    val intent = Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = android.net.Uri.parse("package:${reactApplicationContext.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactApplicationContext.startActivity(intent)
                    promise.resolve(true)
                    return
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            try {
                val intent = Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(false)
            } catch (ex: Exception) {
                promise.reject("ERROR", "Could not open settings: ${ex.message}")
            }
        }
    }

    @ReactMethod
    fun openOemAutostartSettings(promise: Promise) {
        val manufacturer = Build.MANUFACTURER.lowercase()
        val intents = mutableListOf<Intent>()

        when {
            manufacturer.contains("xiaomi") || manufacturer.contains("redmi") || manufacturer.contains("poco") -> {
                intents.add(Intent().setComponent(android.content.ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")))
            }
            manufacturer.contains("oppo") || manufacturer.contains("realme") -> {
                intents.add(Intent().setComponent(android.content.ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity")))
                intents.add(Intent().setComponent(android.content.ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")))
                intents.add(Intent().setComponent(android.content.ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity")))
                intents.add(Intent().setComponent(android.content.ComponentName("com.coloros.settings", "com.coloros.settings.backgroundclean.BackgroundCleanActivity")))
            }
            manufacturer.contains("vivo") -> {
                intents.add(Intent().setComponent(android.content.ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity")))
                intents.add(Intent().setComponent(android.content.ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity")))
                intents.add(Intent().setComponent(android.content.ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManagerActivity")))
            }
            manufacturer.contains("oneplus") -> {
                intents.add(Intent().setComponent(android.content.ComponentName("com.oneplus.security", "com.oneplus.security.chainlaunch.smartlaunch.SmartLaunchAppListActivity")))
            }
        }

        // Add fallback standard app info settings
        val appSettingsIntent = Intent().apply {
            action = android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS
            data = android.net.Uri.fromParts("package", reactApplicationContext.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        intents.add(appSettingsIntent)

        for (intent in intents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
                return
            } catch (e: Exception) {
                // Try next intent
                Log.d("DefaultDialerModule", "Failed intent: ${intent.component?.className ?: "app info"}")
            }
        }
        promise.reject("ERROR", "Could not open any setting activity")
    }


    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val canDraw = android.provider.Settings.canDrawOverlays(reactApplicationContext)
                promise.resolve(canDraw)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${reactApplicationContext.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Could not open overlay settings: ${e.message}")
        }
    }
}
