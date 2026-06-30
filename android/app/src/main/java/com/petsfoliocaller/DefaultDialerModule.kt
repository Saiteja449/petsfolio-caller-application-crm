package com.petsfoliocaller

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DefaultDialerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val REQUEST_ID_MULTIPLE_PERMISSIONS = 1
    private var dialerPromise: Promise? = null

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
}
