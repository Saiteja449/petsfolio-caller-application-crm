package com.petsfoliocaller.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "call_events",
    indices = [
        Index(value = ["submitted"], name = "idx_pending"),
        Index(value = ["syncStatus"], name = "idx_sync"),
        Index(value = ["dedupeKey"], unique = true)
    ]
)
data class CallEventEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    val phoneNumber: String = "Unknown",
    val contactName: String? = null,

    /** "INCOMING" or "OUTGOING" */
    val callDirection: String = "INCOMING",

    /** "CONNECTED", "MISSED", "REJECTED", "NOT_CONNECTED", "CANCELLED" */
    val callStatus: String = "MISSED",

    val startTimestamp: Long = 0L,
    val endTimestamp: Long = 0L,
    val durationSeconds: Int = 0,

    /** 1 if call ever rang, 0 otherwise */
    val wasRinging: Int = 0,
    /** 1 if call was answered/active, 0 otherwise */
    val wasActive: Int = 0,

    /** SIM slot index, -1 if unknown */
    val simSlot: Int = -1,

    /** 0 = pending, 1 = popup was displayed to user */
    val popupShown: Int = 0,
    /** 0 = not yet submitted, 1 = user submitted form */
    val submitted: Int = 0,
    /** JSON blob of submitted form data, null if not yet submitted */
    val submittedData: String? = null,

    /** "PENDING", "SYNCED", "FAILED" */
    val syncStatus: String = "PENDING",
    val retryCount: Int = 0,

    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),

    /** Unique key for deduplication: "{phoneNumber}_{endTimestamp}" */
    val dedupeKey: String = ""
)
