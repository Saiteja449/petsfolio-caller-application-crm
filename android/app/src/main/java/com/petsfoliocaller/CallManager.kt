package com.petsfoliocaller

import android.telecom.Call
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

import android.telecom.InCallService
import android.telecom.CallAudioState

object CallManager {
    var currentCall: Call? = null
    var reactContext: ReactApplicationContext? = null
    var callService: InCallService? = null

    fun updateCall(call: Call) {
        currentCall = call
        val number = call.details?.handle?.schemeSpecificPart ?: "Unknown"
        val stateString = getCallStateString(call.state)
        
        val params = Arguments.createMap()
        params.putString("state", stateString)
        params.putString("phoneNumber", number)
        
        sendEvent("onCallStateChanged", params)
    }

    fun removeCall(call: Call) {
        if (currentCall == call) {
            currentCall = null
            val params = Arguments.createMap()
            params.putString("state", "DISCONNECTED")
            params.putString("phoneNumber", call.details?.handle?.schemeSpecificPart ?: "Unknown")
            sendEvent("onCallStateChanged", params)
        }
    }

    fun getCurrentCallState(): WritableMap? {
        val call = currentCall ?: return null
        val number = call.details?.handle?.schemeSpecificPart ?: "Unknown"
        val stateString = getCallStateString(call.state)
        
        val params = Arguments.createMap()
        params.putString("state", stateString)
        params.putString("phoneNumber", number)
        return params
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }

    private fun getCallStateString(state: Int): String {
        return when (state) {
            Call.STATE_RINGING -> "RINGING"
            Call.STATE_ACTIVE -> "ACTIVE"
            Call.STATE_HOLDING -> "HOLDING"
            Call.STATE_DIALING -> "DIALING"
            Call.STATE_DISCONNECTED -> "DISCONNECTED"
            else -> "UNKNOWN"
        }
    }
    
    fun answer() {
        currentCall?.answer(0)
    }
    
    fun reject() {
        currentCall?.reject(false, null)
    }
    
    fun disconnect() {
        currentCall?.disconnect()
    }
    
    fun setMute(muted: Boolean) {
        callService?.setMuted(muted)
    }

    fun setSpeaker(speaker: Boolean) {
        val route = if (speaker) CallAudioState.ROUTE_SPEAKER else CallAudioState.ROUTE_EARPIECE
        callService?.setAudioRoute(route)
    }
}
