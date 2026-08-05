package com.petsfoliocaller.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [CallEventEntity::class], version = 1, exportSchema = false)
abstract class CallEventDatabase : RoomDatabase() {

    abstract fun callEventDao(): CallEventDao

    companion object {
        @Volatile
        private var INSTANCE: CallEventDatabase? = null

        fun getInstance(context: Context): CallEventDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    CallEventDatabase::class.java,
                    "call_events_db"
                )
                    // Allow main thread queries for synchronous insert from InCallService
                    // (the insert is fast — single row with no joins)
                    .allowMainThreadQueries()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
