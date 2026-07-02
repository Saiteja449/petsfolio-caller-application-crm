import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Text from './AppText';
import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { Spacing } from '../styles/Spacing';
import Theme from '../styles/Theme';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const CustomTimePicker = ({ visible, onClose, onSelect, selectedTime }) => {
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (visible && selectedTime) {
      // Parse something like "10:30 AM"
      const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        setHour(parseInt(match[1], 10));
        setMinute(match[2]);
        setPeriod(match[3].toUpperCase());
      }
    }
  }, [visible, selectedTime]);

  const handleConfirm = () => {
    const formattedHour = hour.toString().padStart(2, '0');
    onSelect(`${formattedHour}:${minute} ${period}`);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Time</Text>
          
          <View style={styles.pickerContainer}>
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Hour</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={`h-${h}`}
                    style={[styles.item, hour === h && styles.itemSelected]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.itemText, hour === h && styles.itemTextSelected]}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.separator}>
              <Text style={styles.separatorText}>:</Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.columnHeader}>Minute</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={`m-${m}`}
                    style={[styles.item, minute === m && styles.itemSelected]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.itemText, minute === m && styles.itemTextSelected]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.periodColumn}>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'AM' && styles.periodBtnSelected]}
                onPress={() => setPeriod('AM')}
              >
                <Text style={[styles.periodText, period === 'AM' && styles.periodTextSelected]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'PM' && styles.periodBtnSelected]}
                onPress={() => setPeriod('PM')}
              >
                <Text style={[styles.periodText, period === 'PM' && styles.periodTextSelected]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
  title: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    marginBottom: Spacing.xl,
  },
  column: {
    width: 60,
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    fontFamily: Fonts.family.medium,
    marginBottom: Spacing.sm,
  },
  scrollList: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Theme.borderRadius,
    backgroundColor: Colors.background,
  },
  item: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: Colors.primary,
  },
  itemText: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    fontFamily: Fonts.family.medium,
  },
  itemTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.family.bold,
  },
  separator: {
    marginHorizontal: Spacing.sm,
    height: '100%',
    justifyContent: 'center',
    paddingTop: 24, // offset for header
  },
  separatorText: {
    fontSize: Fonts.sizes.xl,
    color: Colors.text,
    fontFamily: Fonts.family.bold,
  },
  periodColumn: {
    marginLeft: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: 24,
  },
  periodBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius,
    backgroundColor: Colors.background,
  },
  periodBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    fontFamily: Fonts.family.medium,
  },
  periodTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.family.bold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Theme.borderRadius,
  },
  cancelBtnText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.family.medium,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Theme.borderRadius,
  },
  confirmBtnText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    fontFamily: Fonts.family.semiBold,
  },
});

export default CustomTimePicker;
