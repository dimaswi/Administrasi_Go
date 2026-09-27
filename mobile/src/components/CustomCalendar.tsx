import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';

const DAYS_SHORT = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export interface CalendarEvent {
  time: string;
  label: string;
  color: string;
}

export interface CalendarMarkedDate {
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
  isOffDay?: boolean;
  shiftName?: string;
  hasClockIn?: boolean;
  hasClockOut?: boolean;
  events?: CalendarEvent[];
}

interface CustomCalendarProps {
  current?: string;
  markedDates?: Record<string, CalendarMarkedDate>;
  onDayPress?: (day: { dateString: string }) => void;
}

function formatDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekdayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CustomCalendar({
  current,
  markedDates = {},
  onDayPress,
}: CustomCalendarProps) {
  const { colors, activeTheme } = useThemeContext();
  const today = new Date();
  const init = current ? new Date(current + 'T00:00:00') : today;

  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstOffset = getFirstWeekdayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstOffset + daysInMonth) / 7) * 7;

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstOffset + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const borderColor = colors.border;
  const numColor = activeTheme === 'dark' ? '#334155' : '#E2E8F0';
  const emptyCellBg = activeTheme === 'dark' ? '#0F172A' : '#FAFAFA';

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card }]}>
      {/* Month Navigator */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.teal} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.textMain }]}>
          {MONTH_NAMES_ID[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={colors.teal} />
        </TouchableOpacity>
      </View>

      {/* Day Header Row */}
      <View style={[styles.dayHeaderRow, { borderBottomColor: borderColor }]}>
        {DAYS_SHORT.map((d, i) => (
          <View key={d} style={[styles.dayHeaderCell, i < 6 && { borderRightWidth: 1, borderRightColor: borderColor }]}>
            <Text style={[
              styles.dayHeaderText,
              { color: colors.textMuted },
              (i === 5 || i === 6) && { opacity: 0.6 }
            ]}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.row, rowIdx < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
          {row.map((day, colIdx) => {
            if (!day) {
              return (
                <View
                  key={colIdx}
                  style={[
                    styles.cell,
                    colIdx < 6 && { borderRightWidth: 1, borderRightColor: borderColor },
                    { backgroundColor: emptyCellBg }
                  ]}
                />
              );
            }

            const dateStr = formatDate(viewYear, viewMonth, day);
            const mark = markedDates[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = !!mark?.selected;
            const isWeekend = colIdx === 5 || colIdx === 6;
            const isOff = mark?.isOffDay !== undefined ? mark.isOffDay : true;

            // Clean background tint (Red if empty/off, Green if meeting/work)
            const cellBg = isOff
              ? (activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.14)' : '#FFEFEF')
              : (activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.20)' : '#DCFCE7');

            const hasIn = !!mark?.hasClockIn;
            const hasOut = !!mark?.hasClockOut;

            return (
              <TouchableOpacity
                key={colIdx}
                style={[
                  styles.cell,
                  { backgroundColor: cellBg },
                  colIdx < 6 && { borderRightWidth: 1, borderRightColor: borderColor }
                ]}
                onPress={() => onDayPress?.({ dateString: dateStr })}
                activeOpacity={0.6}
              >
                {/* Top Dots Row: Left for Check-In, Right for Check-Out */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 2, marginTop: 2 }}>
                  {hasIn ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#10B981', // Green dot for Check-In (Left)
                      }}
                    />
                  ) : <View style={{ width: 6, height: 6 }} />}

                  {hasOut ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#0A7973', // Teal dot for Check-Out (Right)
                      }}
                    />
                  ) : <View style={{ width: 6, height: 6 }} />}
                </View>

                {/* Absolute overlay for selection highlight without layout shift */}
                {isSelected && (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.selectedOutline,
                      { borderColor: isOff ? '#EF4444' : '#10B981' }
                    ]}
                  />
                )}

                {/* Date number — bottom-right */}
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isOff ? (activeTheme === 'dark' ? '#F87171' : '#EF4444') : (activeTheme === 'dark' ? '#34D399' : '#059669') },
                    isToday && { color: '#2563EB', opacity: 1.0, fontWeight: '900' },
                    isSelected && { color: isOff ? '#EF4444' : '#10B981', opacity: 1.0 },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBtn: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    minHeight: 72,
    padding: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedOutline: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderWidth: 2.5,
    borderRadius: 6,
    zIndex: 10,
  },
  eventsContainer: {
    position: 'absolute',
    top: 5,
    left: 4,
    right: 4,
    zIndex: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  eventTime: {
    fontSize: 9,
    fontWeight: '600',
    flexShrink: 1,
  },
  singleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
    marginTop: 2,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    marginLeft: 2,
    zIndex: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dayNumber: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
    zIndex: 1,
  },
  todayDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    zIndex: 3,
  },
});
