package com.petsfoliocaller.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface CallEventDao {

    /**
     * Insert a new call event. Uses IGNORE strategy so duplicate dedupeKeys
     * are silently skipped (no crash, no duplicate).
     */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    fun insertEvent(event: CallEventEntity): Long

    /**
     * Get all pending (unsubmitted) events, ordered oldest first (FIFO).
     */
    @Query("SELECT * FROM call_events WHERE submitted = 0 ORDER BY createdAt ASC")
    fun getPendingEvents(): List<CallEventEntity>

    /**
     * Get the next pending event (first in queue).
     */
    @Query("SELECT * FROM call_events WHERE submitted = 0 ORDER BY createdAt ASC LIMIT 1")
    fun getNextPendingEvent(): CallEventEntity?

    /**
     * Count of unsubmitted events (queue size).
     */
    @Query("SELECT COUNT(*) FROM call_events WHERE submitted = 0")
    fun getPendingCount(): Int

    /**
     * Mark an event as popup shown.
     */
    @Query("UPDATE call_events SET popupShown = 1, updatedAt = :now WHERE id = :eventId")
    fun markPopupShown(eventId: Long, now: Long = System.currentTimeMillis())

    /**
     * Mark an event as submitted with form data.
     */
    @Query("UPDATE call_events SET submitted = 1, submittedData = :formDataJson, updatedAt = :now WHERE id = :eventId")
    fun markSubmitted(eventId: Long, formDataJson: String?, now: Long = System.currentTimeMillis())

    /**
     * Update sync status after API call.
     */
    @Query("UPDATE call_events SET syncStatus = :status, retryCount = retryCount + 1, updatedAt = :now WHERE id = :eventId")
    fun updateSyncStatus(eventId: Long, status: String, now: Long = System.currentTimeMillis())

    /**
     * Get all events that need syncing.
     */
    @Query("SELECT * FROM call_events WHERE submitted = 1 AND syncStatus = 'PENDING' ORDER BY createdAt ASC")
    fun getUnsyncedEvents(): List<CallEventEntity>

    /**
     * Get event by ID.
     */
    @Query("SELECT * FROM call_events WHERE id = :eventId")
    fun getEventById(eventId: Long): CallEventEntity?

    /**
     * Purge old submitted+synced events (housekeeping).
     * Deletes events older than the given timestamp.
     */
    @Query("DELETE FROM call_events WHERE submitted = 1 AND syncStatus = 'SYNCED' AND createdAt < :olderThan")
    fun purgeOldSyncedEvents(olderThan: Long)
}
