import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './AppText';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';

const CustomDatePicker = ({ visible, onClose, onSelect, selectedDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    if (visible) {
      let init;
      if (selectedDate && !isNaN(new Date(selectedDate).getTime())) {
        init = new Date(selectedDate);
      } else {
        init = new Date();
      }
      setCurrentMonth(new Date(init.getFullYear(), init.getMonth(), 1));
    }
  }, [visible, selectedDate]);

  const goToPrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = currentMonth.getDay(); // 0 (Sun) to 6 (Sat)

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const renderDays = () => {
    let days = [];
    // Empty slots for the first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const thisDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isPast = thisDate < today;
      
      let isSelected = false;
      if (selectedDate && !isNaN(new Date(selectedDate).getTime())) {
        const sd = new Date(selectedDate);
        if (sd.getFullYear() === thisDate.getFullYear() && sd.getMonth() === thisDate.getMonth() && sd.getDate() === thisDate.getDate()) {
          isSelected = true;
        }
      }

      const isToday = thisDate.getFullYear() === today.getFullYear() && thisDate.getMonth() === today.getMonth() && thisDate.getDate() === today.getDate();

      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isToday && !isSelected && styles.dayCellToday,
          ]}
          disabled={isPast}
          onPress={() => {
            const yyyy = thisDate.getFullYear();
            const mm = String(thisDate.getMonth() + 1).padStart(2, '0');
            const dd = String(thisDate.getDate()).padStart(2, '0');
            onSelect(`${yyyy}-${mm}-${dd}`);
          }}
        >
          <Text style={[
            styles.dayText,
            isPast && styles.dayTextDisabled,
            isSelected && styles.dayTextSelected,
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekRow}>
            {dayNames.map(d => (
              <View key={d} style={styles.dayCell}>
                <Text style={styles.weekText}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {renderDays()}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  monthText: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  navBtn: {
    padding: Spacing.sm,
  },
  navBtnText: {
    fontSize: Fonts.sizes.lg,
    color: Colors.primary,
    fontFamily: Fonts.family.bold,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    fontFamily: Fonts.family.medium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 4,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    fontFamily: Fonts.family.regular,
  },
  dayTextDisabled: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  dayTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.family.bold,
  },
  cancelBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
  },
});

export default CustomDatePicker;
