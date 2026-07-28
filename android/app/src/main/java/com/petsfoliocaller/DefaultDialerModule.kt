package com.petsfoliocaller

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
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
}
