package com.petsfoliocaller

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import android.view.WindowManager
import android.os.Build
import android.content.Intent
import android.util.Log

class MainActivity : ReactActivity() {

  companion object {
    /** Static flag so CallEventCoordinator can check if Activity is alive */
    var isAlive = false
      private set
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    super.onCreate(savedInstanceState)
    isAlive = true

    // Handle ACTION_POST_CALL on cold start
    handlePostCallIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Handle ACTION_POST_CALL when activity already exists (singleTask)
    handlePostCallIntent(intent)
  }

  override fun onResume() {
    super.onResume()
    isAlive = true
  }

  override fun onDestroy() {
    super.onDestroy()
    isAlive = false
  }

  /**
   * If launched via ACTION_POST_CALL, send a JS event to trigger queue refresh.
   * The JS layer will query Room DB for pending events and show the popup.
   */
  private fun handlePostCallIntent(intent: Intent?) {
    if (intent?.action == "ACTION_POST_CALL") {
      Log.d("MainActivity", "Received ACTION_POST_CALL intent")
      // The JS layer will pick up pending events via PostCallBridgeModule
      // on mount or via the onPostCallEvent native event.
      // Clear the action so it doesn't re-trigger on config changes.
      intent.action = null
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "petsfoliocaller"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
