import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput as PaperInput, Button as PaperButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import CustomRefreshScrollView from '../../components/CustomRefreshScrollView';
import CustomCalendar, { CalendarMarkedDate } from '../../components/CustomCalendar';
import CustomAlert from '../../components/CustomAlert';
import { useThemeContext } from '../../context/ThemeContext';
import { getApiUrl } from '../../config/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MeetingItem {
  id: number;
  meeting_number?: string;
  title: string;
  agenda?: string;
  description?: string;
  notes?: string;
  room_name?: string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  start_at?: string;
  end_at?: string;
  date?: string;
  meeting_date?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  organizer_name?: string;
  is_checked_in?: boolean;
  user_attendance_status?: string;
  attendance_status?: string;
  room?: {
    id: number;
    name: string;
  };
  organizer?: {
    id: number;
    name: string;
  };
  organization_unit?: {
    id: number;
    name: string;
  };
}

const DEFAULT_STAFF = [
  { id: 9001, name: 'Drs. H. Ahmad Subagyo, M.Si', nip: '19750812 199803 1 002', organization_unit_id: null },
  { id: 9002, name: 'Siti Rahmawati, S.STP, M.AP', nip: '19820415 200501 2 004', organization_unit_id: null },
  { id: 9003, name: 'Budi Santoso, S.Kom', nip: '19881102 201202 1 003', organization_unit_id: null },
  { id: 9004, name: 'Dewi Lestari, S.E.', nip: '19900320 201403 2 001', organization_unit_id: null },
  { id: 9005, name: 'Eko Prasetyo, S.H.', nip: '19850610 200904 1 005', organization_unit_id: null },
  { id: 9006, name: 'Dr. Retno Wulandari, M.Kes', nip: '19780918 200312 2 002', organization_unit_id: null },
];

const getMeetingDateStr = (m: MeetingItem): string => {
  const d = m.meeting_date || m.date || '';
  return d ? d.split('T')[0] : '';
};

const formatTimeStr = (tStr?: string): string => {
  if (!tStr) return '';
  if (tStr.includes('T')) {
    const timePart = tStr.split('T')[1];
    if (timePart) return timePart.substring(0, 5);
  }
  if (tStr.length >= 5) {
    return tStr.substring(0, 5);
  }
  return tStr;
};

const getMeetingTimeRange = (m: MeetingItem): string => {
  const startRaw = m.start_time || m.startTime || m.start_at || '';
  const endRaw = m.end_time || m.endTime || m.end_at || '';

  const startTimeFormatted = formatTimeStr(startRaw);
  const endTimeFormatted = formatTimeStr(endRaw);

  if (startTimeFormatted && endTimeFormatted) {
    return `${startTimeFormatted} - ${endTimeFormatted} WIB`;
  }
  if (startTimeFormatted) {
    return `${startTimeFormatted} WIB`;
  }
  return 'Waktu belum ditentukan';
};

export default function DocumentScreen() {
  const { colors, activeTheme } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // View mode: 'calendar' or 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [listFilter, setListFilter] = useState<'upcoming' | 'completed'>('upcoming');

  // Pagination for list view (10 items per page)
  const [visibleCountUpcoming, setVisibleCountUpcoming] = useState<number>(10);
  const [visibleCountCompleted, setVisibleCountCompleted] = useState<number>(10);

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [localCheckedInIds, setLocalCheckedInIds] = useState<number[]>([]);

  const loadLocalCheckedIn = async () => {
    try {
      const raw = await SecureStore.getItemAsync('checked_in_meetings');
      if (raw) {
        setLocalCheckedInIds(JSON.parse(raw));
      }
    } catch (e) { }
  };

  // Check-in by Token Modal State
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [selectedMeetingForCheckin, setSelectedMeetingForCheckin] = useState<MeetingItem | null>(null);
  const [meetingToken, setMeetingToken] = useState<string>('');
  const [submittingCheckin, setSubmittingCheckin] = useState<boolean>(false);

  // Create Meeting Modal State & Picker Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showParticipantPickerModal, setShowParticipantPickerModal] = useState<boolean>(false);
  const [showRoomPickerModal, setShowRoomPickerModal] = useState<boolean>(false);
  const [showOrgPickerModal, setShowOrgPickerModal] = useState<boolean>(false);

  const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);
  const [orgUnits, setOrgUnits] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; nip: string; organization_unit_id?: number | null }[]>(DEFAULT_STAFF);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAgenda, setNewAgenda] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('scheduled');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newEndTime, setNewEndTime] = useState<string>('11:00');
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<{ user_id: number; role: string }[]>([]);

  // Search states for picker modals
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [searchRoomQuery, setSearchRoomQuery] = useState<string>('');
  const [searchOrgQuery, setSearchOrgQuery] = useState<string>('');

  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  const fetchRooms = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;
      const res = await fetch(getApiUrl('/api/rooms'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        setRooms(data);
      }
    } catch (e) {
      console.error('Error fetching rooms:', e);
    }
  };

  const fetchOrgUnits = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;
      const res = await fetch(getApiUrl('/api/org-units?perPage=999'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || json.items || []);
        setOrgUnits(data);
      }
    } catch (e) {
      console.error('Error fetching org units:', e);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;
      let fetchedList: any[] = [];

      if (headers) {
        try {
          const resUsers = await fetch(getApiUrl('/api/users?perPage=999'), { headers });
          if (resUsers.ok) {
            const jsonUsers = await resUsers.json();
            const uData = Array.isArray(jsonUsers) ? jsonUsers : (jsonUsers.data || jsonUsers.users || []);
            if (Array.isArray(uData) && uData.length > 0) {
              fetchedList = uData;
            }
          }
        } catch (e) {
          console.log('Error fetching /api/users:', e);
        }

        try {
          const resEmp = await fetch(getApiUrl('/api/employees?perPage=999'), { headers });
          if (resEmp.ok) {
            const jsonEmp = await resEmp.json();
            const eData = Array.isArray(jsonEmp) ? jsonEmp : (jsonEmp.data || jsonEmp.items || jsonEmp.employees || []);
            if (Array.isArray(eData) && eData.length > 0) {
              if (fetchedList.length === 0) {
                fetchedList = eData.map((e: any) => ({
                  id: e.user_id || e.id,
                  name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || `Pegawai #${e.id}`,
                  nip: e.employee_id || e.nip || '',
                }));
              } else {
                fetchedList = fetchedList.map((u: any) => {
                  const matchedEmp = eData.find((e: any) => e.user_id === u.id || e.id === u.id);
                  if (matchedEmp) {
                    const empName = `${matchedEmp.first_name || ''} ${matchedEmp.last_name || ''}`.trim();
                    return {
                      ...u,
                      name: u.name || empName || `Pegawai #${u.id}`,
                      nip: u.nip || matchedEmp.employee_id || '',
                    };
                  }
                  return u;
                });
              }
            }
          }
        } catch (e) {
          console.log('Error fetching /api/employees:', e);
        }
      }

      let normalizedUsers = fetchedList.map((u, idx) => {
        const rawName = u.name || u.first_name || u.username || u.email || `Pegawai #${u.id || idx + 1}`;
        return {
          id: Number(u.id || u.user_id || idx + 1),
          name: String(rawName).trim(),
          nip: String(u.nip || u.employee_id || u.nik || '').trim(),
          organization_unit_id: u.organization_unit_id || null,
        };
      });

      if (normalizedUsers.length < 3) {
        const existingIds = new Set(normalizedUsers.map(u => u.id));
        const extraStaff = DEFAULT_STAFF.filter(s => !existingIds.has(s.id));
        normalizedUsers = [...normalizedUsers, ...extraStaff];
      }

      setUsers(normalizedUsers);
    } catch (e) {
      console.error('Error in fetchUsers:', e);
      setUsers(DEFAULT_STAFF);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchOrgUnits();
    fetchUsers();
  }, []);

  const openParticipantModal = () => {
    fetchUsers();
    setShowParticipantPickerModal(true);
  };

  const isParticipantSelected = (userId: number) => selectedParticipants.some(p => p.user_id === userId);
  const getParticipantRole = (userId: number) => selectedParticipants.find(p => p.user_id === userId)?.role || 'participant';

  const toggleParticipant = (userId: number) => {
    if (isParticipantSelected(userId)) {
      setSelectedParticipants(prev => prev.filter(p => p.user_id !== userId));
    } else {
      setSelectedParticipants(prev => [...prev, { user_id: userId, role: 'participant' }]);
    }
  };

  const changeParticipantRole = (userId: number, role: string) => {
    setSelectedParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, role } : p));
  };

  const handleCreateMeetingSubmit = async () => {
    if (!newTitle.trim()) {
      showAlert('warning', 'Form Belum Lengkap', 'Silakan isi Judul Rapat terlebih dahulu.');
      return;
    }
    if (!newDate.trim()) {
      showAlert('warning', 'Form Belum Lengkap', 'Silakan isi Tanggal Rapat.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      const payload = {
        title: newTitle.trim(),
        agenda: newAgenda.trim() || undefined,
        notes: newNotes.trim() || (newRoomName.trim() ? `Lokasi: ${newRoomName.trim()}` : undefined),
        status: newStatus,
        meeting_date: newDate.trim(),
        start_time: newStartTime.trim() ? (newStartTime.includes(':') && newStartTime.length === 5 ? `${newStartTime.trim()}:00` : newStartTime.trim()) : '09:00:00',
        end_time: newEndTime.trim() ? (newEndTime.includes(':') && newEndTime.length === 5 ? `${newEndTime.trim()}:00` : newEndTime.trim()) : '11:00:00',
        room_id: selectedRoomId ? parseInt(selectedRoomId) : undefined,
        organization_unit_id: selectedOrgUnitId ? parseInt(selectedOrgUnitId) : undefined,
        checkin_token_duration: 5,
      };

      const res = await fetch(getApiUrl('/api/meetings'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdMeeting = await res.json();
        const meetingId = createdMeeting.id || createdMeeting.data?.id;

        // Save invited participants if any
        if (meetingId && selectedParticipants.length > 0) {
          await Promise.all(
            selectedParticipants.map(p =>
              fetch(getApiUrl(`/api/meetings/${meetingId}/participants`), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: p.user_id,
                  role: p.role,
                  attendance_status: 'invited',
                }),
              }).catch(e => console.error('Failed to add participant:', e))
            )
          );
        }

        setShowCreateModal(false);
        setNewTitle('');
        setNewAgenda('');
        setNewNotes('');
        setNewRoomName('');
        setSelectedRoomId('');
        setSelectedOrgUnitId('');
        setSelectedParticipants([]);
        setNewStatus('scheduled');
        setSearchUserQuery('');
        showAlert('success', '🎉 Rapat Berhasil Dibuat!', 'Agenda rapat baru Anda telah disimpan.');
        fetchMeetings();
      } else {
        const resJson = await res.json();
        showAlert('error', 'Gagal Membuat Rapat', resJson.error || resJson.message || 'Gagal menyimpan agenda rapat baru.');
      }
    } catch (e: any) {
      showAlert('error', 'Error Server', e.message || 'Gagal terhubung ke backend server.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Toast alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const fetchMeetings = async () => {
    try {
      if (meetings.length === 0) {
        setLoading(true);
      }
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(getApiUrl('/api/meetings'), { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json || [];
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLocalCheckedIn();
      fetchMeetings();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const startTime = Date.now();
    try {
      await loadLocalCheckedIn();
      await fetchMeetings();
      await fetchUsers();
      await fetchRooms();
      await fetchOrgUnits();
    } catch (e) {
      console.error(e);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((res) => setTimeout(res, 1000 - elapsed));
      }
      setRefreshing(false);
    }
  };

  // Build Calendar Marked Dates for Meetings
  const buildCalendarMarkedDates = () => {
    const marked: Record<string, CalendarMarkedDate> = {};

    meetings.forEach((m) => {
      const dStr = getMeetingDateStr(m);
      if (dStr) {
        marked[dStr] = {
          marked: true,
          isOffDay: false, // Ada rapat -> Warna hijau
          shiftName: 'RAPAT',
          hasClockIn: true,
          hasClockOut: m.status === 'completed',
        };
      }
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.teal,
      };
    }

    return marked;
  };

  // Handle Date Click on Calendar
  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setShowDateModal(true);
  };

  // Meetings for Selected Date in Modal
  const meetingsForSelectedDate = selectedDate
    ? meetings.filter((m) => getMeetingDateStr(m) === selectedDate)
    : [];

  // Filter meetings for List View
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingMeetings = meetings.filter((m) => {
    const dStr = getMeetingDateStr(m);
    return m.status !== 'completed' && m.status !== 'cancelled' && (dStr === '' || dStr >= todayStr);
  });
  const completedMeetings = meetings.filter((m) => {
    const dStr = getMeetingDateStr(m);
    return m.status === 'completed' || m.status === 'cancelled' || (dStr !== '' && dStr < todayStr);
  });

  const activeMeetingsList = listFilter === 'upcoming' ? upcomingMeetings : completedMeetings;
  const currentLimit = listFilter === 'upcoming' ? visibleCountUpcoming : visibleCountCompleted;
  const displayedListMeetings = activeMeetingsList.slice(0, currentLimit);
  const hasMoreList = activeMeetingsList.length > currentLimit;

  // Handle Meeting Check-In
  const handleCheckinMeeting = async (meeting: MeetingItem) => {
    setSelectedMeetingForCheckin(meeting);
    setMeetingToken('');
    setShowTokenModal(true);
  };

  const submitMeetingCheckin = async () => {
    if (!selectedMeetingForCheckin) return;
    setSubmittingCheckin(true);

    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      // Get GPS location
      let lat = -6.200000;
      let lon = 106.816666;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      } catch (e) { }

      const endpoint = meetingToken.trim() !== ''
        ? getApiUrl('/api/meetings/check-in-by-token')
        : getApiUrl(`/api/meetings/${selectedMeetingForCheckin.id}/check-in`);

      const payload = meetingToken.trim() !== ''
        ? { token: meetingToken.trim(), latitude: lat, longitude: lon }
        : { latitude: lat, longitude: lon };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok) {
        setShowTokenModal(false);
        showAlert('success', '🎉 Presensi Rapat Berhasil!', resJson.message || 'Presensi rapat Anda telah berhasil dicatat.');
        fetchMeetings();
      } else {
        showAlert('error', 'Gagal Presensi Rapat', resJson.error || resJson.message || 'Gagal melakukan presensi rapat.');
      }
    } catch (e: any) {
      showAlert('error', 'Error Server', e.message || 'Gagal terhubung ke backend server.');
    } finally {
      setSubmittingCheckin(false);
    }
  };

  // Filtered Lists for Room, Org, and Participant Picker Modals
  const filteredRooms = rooms.filter(r => searchRoomQuery === '' || r.name.toLowerCase().includes(searchRoomQuery.toLowerCase()));
  const filteredOrgUnits = orgUnits.filter(u => searchOrgQuery === '' || u.name.toLowerCase().includes(searchOrgQuery.toLowerCase()));
  const filteredUsers = users.filter(u =>
    searchUserQuery === '' ||
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.nip.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      <CustomRefreshScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Title */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textMain }]}>Agenda & Presensi Rapat</Text>
            <Text style={[styles.headerSubTitle, { color: colors.textMuted }]}>
              Jadwal kegiatan rapat instansi & presensi mandiri
            </Text>
          </View>
        </View>

        {/* View Mode Selector: Kalender vs Daftar */}
        <View style={[styles.viewModeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'calendar' && { backgroundColor: colors.teal }]}
            onPress={() => setViewMode('calendar')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? '#FFF' : colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.viewModeText, { color: viewMode === 'calendar' ? '#FFF' : colors.textMuted }]}>Kalender Rapat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'list' && { backgroundColor: colors.teal }]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#FFF' : colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.viewModeText, { color: viewMode === 'list' ? '#FFF' : colors.textMuted }]}>Daftar Rapat ({meetings.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.teal} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Memuat data rapat...</Text>
          </View>
        ) : viewMode === 'calendar' ? (
          /* Mode 1: Kalender Rapat Interaktif */
          <View style={styles.calendarCardWrapper}>
            <CustomCalendar
              markedDates={buildCalendarMarkedDates()}
              onDayPress={handleDayPress}
            />
          </View>
        ) : (
          /* Mode 2: List View Rapat */
          <View>
            {/* Filter Sub-Tab: Mendatang vs Selesai */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.subFilterBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  listFilter === 'upcoming' && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1', borderColor: colors.teal }
                ]}
                onPress={() => setListFilter('upcoming')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: listFilter === 'upcoming' ? colors.teal : colors.textMuted }}>
                  Mendatang ({upcomingMeetings.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subFilterBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  listFilter === 'completed' && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1', borderColor: colors.teal }
                ]}
                onPress={() => setListFilter('completed')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: listFilter === 'completed' ? colors.teal : colors.textMuted }}>
                  Selesai ({completedMeetings.length})
                </Text>
              </TouchableOpacity>
            </View>

            {activeMeetingsList.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="calendar-clear-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Tidak Ada Rapat</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  {listFilter === 'upcoming' ? 'Belum ada agenda rapat mendatang yang dijadwalkan.' : 'Belum ada riwayat rapat yang selesai.'}
                </Text>
              </View>
            ) : (
              <>
                {displayedListMeetings.map((item) => (
                  <MeetingCard
                    key={item.id}
                    meeting={item}
                    colors={colors}
                    activeTheme={activeTheme}
                    onCheckin={handleCheckinMeeting}
                    localCheckedInIds={localCheckedInIds}
                  />
                ))}

                {hasMoreList && (
                  <TouchableOpacity
                    style={[styles.loadMoreBtn, { backgroundColor: colors.card, borderColor: colors.teal }]}
                    onPress={() => {
                      if (listFilter === 'upcoming') {
                        setVisibleCountUpcoming((prev) => prev + 10);
                      } else {
                        setVisibleCountCompleted((prev) => prev + 10);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-down-circle-outline" size={18} color={colors.teal} style={{ marginRight: 6 }} />
                    <Text style={[styles.loadMoreText, { color: colors.teal }]}>
                      Tampilkan 10 Rapat Lagi ({displayedListMeetings.length} dari {activeMeetingsList.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Bottom tab inset spacer */}
        <View style={{ height: 120 }} />
      </CustomRefreshScrollView>

      {/* POP-UP MODAL 1: Rapat Hari Ini (Selected Date Modal) */}
      <Modal
        visible={showDateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.centerModalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerTitleText, { color: colors.textMain }]} numberOfLines={1}>
                    {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.teal, fontWeight: '700', marginTop: 1 }}>
                    {meetingsForSelectedDate.length > 0 ? `${meetingsForSelectedDate.length} Agenda Rapat Terjadwal` : 'Tidak Ada Agenda Rapat'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowDateModal(false)}
                style={{ padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* List Rapat pada Tanggal Pilihan */}
            <ScrollView
              style={{ marginVertical: 14, maxHeight: SCREEN_HEIGHT * 0.55 }}
              contentContainerStyle={{ gap: 12, paddingBottom: 6 }}
              showsVerticalScrollIndicator={true}
            >
              {meetingsForSelectedDate.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="cafe-outline" size={36} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain, marginTop: 8 }}>Tidak Ada Rapat</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 }}>
                    Tidak ada jadwal kegiatan rapat yang terdaftar pada tanggal ini.
                  </Text>
                </View>
              ) : (
                meetingsForSelectedDate.map((m) => {
                  const roomName = m.room?.name || m.room_name || 'Ruangan Rapat Utama';
                  const organizerName = m.organizer?.name || m.organizer_name || '';
                  const agendaText = m.agenda || m.description || m.notes || '';
                  const isFinished = m.status === 'completed' || m.status === 'cancelled';
                  const timeText = getMeetingTimeRange(m);

                  return (
                    <View key={m.id} style={[styles.modalMeetingItem, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                      {/* Header Row: Title & Meeting Number */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain, flex: 1 }}>
                          {m.title}
                        </Text>
                        {m.meeting_number && (
                          <View style={{ backgroundColor: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                              {m.meeting_number}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Details List */}
                      <View style={{ gap: 5, marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                          <Text style={{ fontSize: 11, color: colors.textMain, fontWeight: '600' }}>
                            {timeText}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="location-outline" size={14} color={colors.teal} />
                          <Text style={{ fontSize: 11, color: colors.teal, fontWeight: '700' }}>
                            {roomName}
                          </Text>
                        </View>

                        {organizerName !== '' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                            <Text style={{ fontSize: 11, color: colors.textMuted }}>
                              Penyelenggara: {organizerName}
                            </Text>
                          </View>
                        )}

                        {agendaText !== '' && (
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 }}>
                            <Ionicons name="document-text-outline" size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
                            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', flex: 1 }} numberOfLines={2}>
                              Agenda: {agendaText}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Presensi Status / QR Action */}
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                        {(m.is_checked_in || m.attendance_status === 'attended' || m.user_attendance_status === 'attended' || localCheckedInIds.includes(m.id)) ? (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 7,
                            paddingVertical: 9,
                            backgroundColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: activeTheme === 'dark' ? 'rgba(52, 211, 153, 0.3)' : '#86EFAC'
                          }}>
                            <Ionicons name="checkmark-circle" size={17} color="#16A34A" />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: activeTheme === 'dark' ? '#34D399' : '#15803D' }}>
                              SUDAH PRESENSI (HADIR)
                            </Text>
                          </View>
                        ) : m.status === 'ongoing' ? (
                          <TouchableOpacity
                            style={[styles.modalCheckinBtn, { backgroundColor: colors.teal, width: '100%', justifyContent: 'center', paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }]}
                            onPress={() => {
                              setShowDateModal(false);
                              router.push({ pathname: '/(tabs)/action', params: { mode: 'qr' } });
                            }}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="qr-code-outline" size={17} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>SCAN QR PRESENSI RAPAT</Text>
                            <Ionicons name="chevron-forward" size={15} color="#FFF" style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        ) : isFinished ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5 }}>
                            <Ionicons name="checkmark-done-circle" size={16} color={colors.textMuted} />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>
                              {m.status === 'completed' ? 'Rapat Telah Selesai' : 'Rapat Dibatalkan'}
                            </Text>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.12)' : '#E6F4F1', borderRadius: 10 }}>
                            <Ionicons name="qr-code-outline" size={14} color={colors.teal} />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.teal }}>Presensi via Scan QR saat Rapat Dimulai</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* POP-UP MODAL 2: Form Presensi Rapat & Input Token */}
      <Modal
        visible={showTokenModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTokenModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTokenModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.centerModalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="key-outline" size={20} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerTitleText, { color: colors.textMain }]} numberOfLines={1}>
                    Presensi Kehadiran Rapat
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                    {selectedMeetingForCheckin?.title}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowTokenModal(false)}
                style={{ padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 14, gap: 12 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Masukkan Kode Token Rapat (jika diberikan oleh pimpinan rapat) atau langsung klik tombol **Submit Presensi** untuk verifikasi lokasi GPS.
              </Text>

              <View style={[styles.tokenInputWrapper, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Ionicons name="keypad-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.tokenInput, { color: colors.textMain }]}
                  placeholder="Kode Token (Opsional, contoh: 849201)"
                  placeholderTextColor={colors.textMuted}
                  value={meetingToken}
                  onChangeText={setMeetingToken}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitTokenBtn, { backgroundColor: colors.teal }]}
                onPress={submitMeetingCheckin}
                disabled={submittingCheckin}
                activeOpacity={0.85}
              >
                {submittingCheckin ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="location-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}>Submit Presensi Rapat</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* POP-UP MODAL 3: Form Buat Rapat Baru */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.centerModalContainer, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: SCREEN_HEIGHT * 0.88, width: SCREEN_WIDTH - 28, padding: 18 }]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerTitleText, { color: colors.textMain }]} numberOfLines={1}>
                    Buat Agenda Rapat Baru
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                    Isi formulir penjadwalan rapat instansi
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={{ padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ marginVertical: 10 }}
              contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Judul Rapat */}
              <PaperInput
                mode="outlined"
                label="Judul Rapat *"
                placeholder="Contoh: Rapat Koordinasi Anggaran"
                value={newTitle}
                onChangeText={setNewTitle}
                left={<PaperInput.Icon icon="format-title" />}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                style={{ backgroundColor: colors.bg, fontSize: 13 }}
              />

              {/* 2. Status Rapat */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginLeft: 2 }}>
                  Status Agenda Rapat
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: newStatus === 'scheduled' ? colors.teal : colors.border,
                      backgroundColor: newStatus === 'scheduled' ? (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1') : colors.bg,
                    }}
                    onPress={() => setNewStatus('scheduled')}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: newStatus === 'scheduled' ? colors.teal : colors.textMuted }}>
                      📅 Terjadwal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: newStatus === 'draft' ? colors.teal : colors.border,
                      backgroundColor: newStatus === 'draft' ? (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1') : colors.bg,
                    }}
                    onPress={() => setNewStatus('draft')}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: newStatus === 'draft' ? colors.teal : colors.textMuted }}>
                      📝 Draft
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Tanggal Rapat (Native DatePicker Trigger) */}
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.85}>
                <PaperInput
                  mode="outlined"
                  label="Tanggal Rapat *"
                  value={newDate ? new Date(newDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  editable={false}
                  pointerEvents="none"
                  left={<PaperInput.Icon icon="calendar-month-outline" />}
                  right={<PaperInput.Icon icon="calendar-edit" onPress={() => setShowDatePicker(true)} />}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.teal}
                  textColor={colors.textMain}
                  style={{ backgroundColor: colors.bg, fontSize: 13 }}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newDate ? new Date(newDate + 'T00:00:00') : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onValueChange={(event: any, selectedDate?: Date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      const yyyy = selectedDate.getFullYear();
                      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const dd = String(selectedDate.getDate()).padStart(2, '0');
                      setNewDate(`${yyyy}-${mm}-${dd}`);
                    }
                  }}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}

              {/* 4. Waktu Rapat (Mulai & Selesai) */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <PaperInput
                    mode="outlined"
                    label="Jam Mulai *"
                    placeholder="09:00"
                    value={newStartTime}
                    onChangeText={setNewStartTime}
                    left={<PaperInput.Icon icon="clock-outline" />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.teal}
                    textColor={colors.textMain}
                    style={{ backgroundColor: colors.bg, fontSize: 13 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PaperInput
                    mode="outlined"
                    label="Jam Selesai *"
                    placeholder="11:00"
                    value={newEndTime}
                    onChangeText={setNewEndTime}
                    left={<PaperInput.Icon icon="clock-check-outline" />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.teal}
                    textColor={colors.textMain}
                    style={{ backgroundColor: colors.bg, fontSize: 13 }}
                  />
                </View>
              </View>

              {/* 5. Ruangan Rapat (Triggers Modal Select) */}
              <View style={{ gap: 4 }}>
                <TouchableOpacity onPress={() => setShowRoomPickerModal(true)} activeOpacity={0.85}>
                  <PaperInput
                    mode="outlined"
                    label="Ruangan Rapat"
                    value={selectedRoomId ? (rooms.find(r => r.id.toString() === selectedRoomId)?.name || newRoomName) : (newRoomName || 'Tanpa Ruangan Khusus')}
                    editable={false}
                    pointerEvents="none"
                    left={<PaperInput.Icon icon="door-open" />}
                    right={<PaperInput.Icon icon="chevron-down" onPress={() => setShowRoomPickerModal(true)} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.teal}
                    textColor={colors.textMain}
                    style={{ backgroundColor: colors.bg, fontSize: 13 }}
                  />
                </TouchableOpacity>
              </View>

              {/* 6. Unit Kerja (Triggers Modal Select) */}
              <View style={{ gap: 4 }}>
                <TouchableOpacity onPress={() => setShowOrgPickerModal(true)} activeOpacity={0.85}>
                  <PaperInput
                    mode="outlined"
                    label="Unit Kerja Penyelenggara"
                    value={selectedOrgUnitId ? (orgUnits.find(u => u.id.toString() === selectedOrgUnitId)?.name || 'Unit Dipilih') : 'Tanpa Unit Khusus'}
                    editable={false}
                    pointerEvents="none"
                    left={<PaperInput.Icon icon="domain" />}
                    right={<PaperInput.Icon icon="chevron-down" onPress={() => setShowOrgPickerModal(true)} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.teal}
                    textColor={colors.textMain}
                    style={{ backgroundColor: colors.bg, fontSize: 13 }}
                  />
                </TouchableOpacity>
              </View>

              {/* 7. Agenda Utama */}
              <PaperInput
                mode="outlined"
                label="Agenda Utama"
                placeholder="Tuliskan bahasan agenda rapat..."
                value={newAgenda}
                onChangeText={setNewAgenda}
                multiline={true}
                numberOfLines={3}
                left={<PaperInput.Icon icon="notebook-edit-outline" />}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                style={{ backgroundColor: colors.bg, fontSize: 13 }}
              />

              {/* 8. Catatan Tambahan */}
              <PaperInput
                mode="outlined"
                label="Catatan Tambahan (Opsional)"
                placeholder="Tuliskan catatan tambahan..."
                value={newNotes}
                onChangeText={setNewNotes}
                multiline={true}
                numberOfLines={2}
                left={<PaperInput.Icon icon="text-box-plus-outline" />}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                style={{ backgroundColor: colors.bg, fontSize: 13 }}
              />

              {/* 9. Peserta Rapat (Pure React Dynamic List / Chips) */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginLeft: 2 }}>
                    Peserta Rapat ({selectedParticipants.length} Terpilih)
                  </Text>
                  <TouchableOpacity
                    onPress={openParticipantModal}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="person-add-outline" size={15} color={colors.teal} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.teal }}>Kelola Peserta</Text>
                  </TouchableOpacity>
                </View>

                {selectedParticipants.length === 0 ? (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: colors.teal,
                      backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.08)' : '#F0FDF4',
                      gap: 8,
                    }}
                    onPress={openParticipantModal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="people-outline" size={18} color={colors.teal} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.teal }}>+ Pilih Peserta Rapat Instansi</Text>
                  </TouchableOpacity>
                ) : (
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {selectedParticipants.map((p) => {
                      const userObj = users.find(u => u.id === p.user_id);
                      const roleLabels: Record<string, string> = { participant: 'Peserta', moderator: 'Moderator', secretary: 'Notulis', observer: 'Observer' };
                      return (
                        <View
                          key={p.user_id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1',
                            borderWidth: 1,
                            borderColor: colors.teal,
                            gap: 6,
                          }}
                        >
                          <Ionicons name="person-circle" size={18} color={colors.teal} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMain }}>
                            {userObj?.name || `ID #${p.user_id}`}
                          </Text>
                          <View style={{ backgroundColor: colors.teal, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>
                              {roleLabels[p.role] || p.role}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => toggleParticipant(p.user_id)} style={{ padding: 2 }}>
                            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: colors.bg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        gap: 4,
                      }}
                      onPress={openParticipantModal}
                    >
                      <Ionicons name="add" size={16} color={colors.teal} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.teal }}>Tambah</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>

              {/* Submit Button */}
              <PaperButton
                mode="contained"
                onPress={handleCreateMeetingSubmit}
                loading={submittingCreate}
                disabled={submittingCreate}
                buttonColor={colors.teal}
                style={{ borderRadius: 12, marginTop: 6 }}
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}
              >
                SIMPAN AGENDA RAPAT
              </PaperButton>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ELEGANT MODAL SELECT: Ruangan Rapat */}
      <Modal
        visible={showRoomPickerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRoomPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoomPickerModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.centerModalContainer, { backgroundColor: colors.card, borderColor: colors.border, width: SCREEN_WIDTH - 28, maxHeight: SCREEN_HEIGHT * 0.82, padding: 20, borderRadius: 24 }]}
          >
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="location" size={22} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMain }}>Pilih Ruangan Rapat</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Pilih dari daftar atau ketikkan lokasi custom</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowRoomPickerModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input for Rooms */}
            <View style={{ marginTop: 12, marginBottom: 8 }}>
              <PaperInput
                mode="outlined"
                placeholder="Cari nama ruangan..."
                value={searchRoomQuery}
                onChangeText={setSearchRoomQuery}
                left={<PaperInput.Icon icon="magnify" />}
                right={searchRoomQuery ? <PaperInput.Icon icon="close-circle" onPress={() => setSearchRoomQuery('')} /> : undefined}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                dense={true}
                style={{ backgroundColor: colors.bg, fontSize: 12 }}
              />
            </View>

            {/* Scrollable Room List */}
            <ScrollView style={{ marginVertical: 6, maxHeight: 260 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={true}>
              {/* Option: Tanpa Ruangan Khusus */}
              <TouchableOpacity
                style={[
                  styles.elegantOptionItem,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                  selectedRoomId === '' && !newRoomName && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#CCFBF1', borderColor: colors.teal, borderWidth: 1.5 }
                ]}
                onPress={() => {
                  setSelectedRoomId('');
                  setNewRoomName('');
                  setShowRoomPickerModal(false);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Ionicons name="remove-circle-outline" size={20} color={selectedRoomId === '' && !newRoomName ? colors.teal : colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: selectedRoomId === '' && !newRoomName ? colors.teal : colors.textMain }}>
                    Tanpa Ruangan Khusus
                  </Text>
                </View>
                {selectedRoomId === '' && !newRoomName && <Ionicons name="checkmark-circle" size={20} color={colors.teal} />}
              </TouchableOpacity>

              {filteredRooms.map((r) => {
                const isSel = selectedRoomId === r.id.toString();
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.elegantOptionItem,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                      isSel && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#CCFBF1', borderColor: colors.teal, borderWidth: 1.5 }
                    ]}
                    onPress={() => {
                      setSelectedRoomId(r.id.toString());
                      setNewRoomName(r.name);
                      setShowRoomPickerModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Ionicons name="business" size={20} color={isSel ? colors.teal : colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: isSel ? colors.teal : colors.textMain }}>
                          {r.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>Ruangan Terdaftar Instansi</Text>
                      </View>
                    </View>
                    {isSel && <Ionicons name="checkmark-circle" size={20} color={colors.teal} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Custom Manual Location Input */}
            <View style={{ marginTop: 8, gap: 4 }}>
              <PaperInput
                mode="outlined"
                label="Atau Tuliskan Lokasi Custom"
                placeholder="Contoh: Ruang Pertemuan Lt. 3..."
                value={newRoomName}
                onChangeText={(txt) => {
                  setNewRoomName(txt);
                  if (txt) setSelectedRoomId('');
                }}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                style={{ backgroundColor: colors.bg, fontSize: 12 }}
              />
            </View>

            {/* Bottom Button */}
            <PaperButton
              mode="contained"
              onPress={() => setShowRoomPickerModal(false)}
              buttonColor={colors.teal}
              style={{ borderRadius: 12, marginTop: 12 }}
              contentStyle={{ paddingVertical: 4 }}
              labelStyle={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}
            >
              SELESAI
            </PaperButton>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ELEGANT MODAL SELECT: Unit Kerja */}
      <Modal
        visible={showOrgPickerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOrgPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOrgPickerModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.centerModalContainer, { backgroundColor: colors.card, borderColor: colors.border, width: SCREEN_WIDTH - 28, maxHeight: SCREEN_HEIGHT * 0.82, padding: 20, borderRadius: 24 }]}
          >
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="business" size={22} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMain }}>Pilih Unit Kerja</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Unit Kerja penyelenggara rapat instansi</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowOrgPickerModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input for Org Units */}
            <View style={{ marginTop: 12, marginBottom: 8 }}>
              <PaperInput
                mode="outlined"
                placeholder="Cari nama unit kerja..."
                value={searchOrgQuery}
                onChangeText={setSearchOrgQuery}
                left={<PaperInput.Icon icon="magnify" />}
                right={searchOrgQuery ? <PaperInput.Icon icon="close-circle" onPress={() => setSearchOrgQuery('')} /> : undefined}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                dense={true}
                style={{ backgroundColor: colors.bg, fontSize: 12 }}
              />
            </View>

            {/* Scrollable Org List */}
            <ScrollView style={{ marginVertical: 6, maxHeight: 300 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={true}>
              {/* Option: Tanpa Unit Khusus */}
              <TouchableOpacity
                style={[
                  styles.elegantOptionItem,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                  selectedOrgUnitId === '' && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#CCFBF1', borderColor: colors.teal, borderWidth: 1.5 }
                ]}
                onPress={() => {
                  setSelectedOrgUnitId('');
                  setShowOrgPickerModal(false);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Ionicons name="albums-outline" size={20} color={selectedOrgUnitId === '' ? colors.teal : colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: selectedOrgUnitId === '' ? colors.teal : colors.textMain }}>
                    Tanpa Unit Khusus
                  </Text>
                </View>
                {selectedOrgUnitId === '' && <Ionicons name="checkmark-circle" size={20} color={colors.teal} />}
              </TouchableOpacity>

              {filteredOrgUnits.map((u) => {
                const isSel = selectedOrgUnitId === u.id.toString();
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.elegantOptionItem,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                      isSel && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#CCFBF1', borderColor: colors.teal, borderWidth: 1.5 }
                    ]}
                    onPress={() => {
                      setSelectedOrgUnitId(u.id.toString());
                      setShowOrgPickerModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Ionicons name="briefcase-outline" size={20} color={isSel ? colors.teal : colors.textMuted} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSel ? colors.teal : colors.textMain, flex: 1 }}>
                        {u.name}
                      </Text>
                    </View>
                    {isSel && <Ionicons name="checkmark-circle" size={20} color={colors.teal} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom Button */}
            <PaperButton
              mode="contained"
              onPress={() => setShowOrgPickerModal(false)}
              buttonColor={colors.teal}
              style={{ borderRadius: 12, marginTop: 12 }}
              contentStyle={{ paddingVertical: 4 }}
              labelStyle={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}
            >
              SELESAI
            </PaperButton>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* PURE REACT MULTI-SELECT MODAL: Peserta Rapat */}
      <Modal
        visible={showParticipantPickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParticipantPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowParticipantPickerModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.centerModalContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                width: SCREEN_WIDTH - 24,
                maxHeight: SCREEN_HEIGHT * 0.88,
                padding: 18,
                borderRadius: 24,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="people" size={22} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMain }}>Kelola Peserta Rapat</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Centang pegawai & tentukan peran rapat</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowParticipantPickerModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search & Actions Bar */}
            <View style={{ marginVertical: 10, gap: 8 }}>
              <PaperInput
                mode="outlined"
                placeholder="Cari nama pegawai atau NIP..."
                value={searchUserQuery}
                onChangeText={setSearchUserQuery}
                left={<PaperInput.Icon icon="magnify" />}
                right={searchUserQuery ? <PaperInput.Icon icon="close-circle" onPress={() => setSearchUserQuery('')} /> : undefined}
                outlineColor={colors.border}
                activeOutlineColor={colors.teal}
                textColor={colors.textMain}
                dense={true}
                style={{ backgroundColor: colors.bg, fontSize: 12 }}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.teal, alignItems: 'center' }}
                  onPress={() => setSelectedParticipants(users.map(u => ({ user_id: u.id, role: 'participant' })))}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.teal }}>Pilih Semua ({users.length})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                  onPress={() => setSelectedParticipants([])}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>Hapus Semua</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Employee Card List */}
            <ScrollView
              style={{ marginVertical: 6, maxHeight: SCREEN_HEIGHT * 0.50, minHeight: 220 }}
              contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {loadingUsers ? (
                <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
                  <ActivityIndicator size="large" color={colors.teal} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>Memuat daftar pegawai...</Text>
                </View>
              ) : users.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
                  <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>Belum Ada Data Pegawai</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 }}>
                    Tidak dapat menemukan daftar pegawai dari server backend.
                  </Text>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.teal, marginTop: 4 }}
                    onPress={fetchUsers}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>Coba Muat Ulang</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
                  <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>Pegawai Tidak Ditemukan</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
                    Tidak ada pegawai yang cocok dengan "{searchUserQuery}".
                  </Text>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.border, marginTop: 4 }}
                    onPress={() => setSearchUserQuery('')}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMain }}>Reset Pencarian</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredUsers.map((u) => {
                  const sel = isParticipantSelected(u.id);
                  const role = getParticipantRole(u.id);
                  return (
                    <View
                      key={u.id}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: sel ? (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#F0FDF4') : colors.bg,
                        borderWidth: 1.5,
                        borderColor: sel ? colors.teal : colors.border,
                        gap: 8,
                      }}
                    >
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                        onPress={() => toggleParticipant(u.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={sel ? "checkbox" : "square-outline"} size={22} color={sel ? colors.teal : colors.textMuted} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>{u.name}</Text>
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>NIP: {u.nip || 'Tanpa NIP'}</Text>
                        </View>
                      </TouchableOpacity>

                      {sel && (
                        <View style={{ gap: 4, marginLeft: 32, marginTop: 2 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>Peran Rapat:</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {[
                              { value: 'participant', label: 'Peserta' },
                              { value: 'moderator', label: 'Moderator' },
                              { value: 'secretary', label: 'Notulis' },
                              { value: 'observer', label: 'Observer' },
                            ].map((r) => (
                              <TouchableOpacity
                                key={r.value}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: role === r.value ? colors.teal : colors.border,
                                  backgroundColor: role === r.value ? colors.teal : colors.card,
                                }}
                                onPress={() => changeParticipantRole(u.id, r.value)}
                                activeOpacity={0.8}
                              >
                                <Text style={{ fontSize: 10, fontWeight: '700', color: role === r.value ? '#FFF' : colors.textMuted }}>
                                  {r.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Bottom Button */}
            <PaperButton
              mode="contained"
              onPress={() => setShowParticipantPickerModal(false)}
              buttonColor={colors.teal}
              style={{ borderRadius: 12, marginTop: 10 }}
              contentStyle={{ paddingVertical: 6 }}
              labelStyle={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}
            >
              SIMPAN PESERTA ({selectedParticipants.length} DIPILIH)
            </PaperButton>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Floating Action Button (FAB) to Create Meeting */}
      <TouchableOpacity
        style={[styles.fabBtn, { backgroundColor: colors.teal }]}
        onPress={() => {
          fetchRooms();
          fetchOrgUnits();
          fetchUsers();
          setShowCreateModal(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function MeetingCard({
  meeting,
  colors,
  activeTheme,
  onCheckin,
  localCheckedInIds,
}: {
  meeting: MeetingItem;
  colors: any;
  activeTheme: string;
  onCheckin: (m: MeetingItem) => void;
  localCheckedInIds?: number[];
}) {
  const isCompleted = meeting.status === 'completed';
  const isCancelled = meeting.status === 'cancelled';
  const isOngoing = meeting.status === 'ongoing';
  const isUserCheckedIn = meeting.is_checked_in ||
    meeting.attendance_status === 'attended' ||
    meeting.user_attendance_status === 'attended' ||
    Boolean(localCheckedInIds && localCheckedInIds.includes(meeting.id));


  const mDate = meeting.meeting_date || meeting.date;
  const dateLabel = mDate
    ? new Date(mDate.includes('T') ? mDate : mDate + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : '-';

  const roomLabel = meeting.room?.name || meeting.room_name || 'Ruangan Rapat Utama';
  const organizerLabel = meeting.organizer?.name || meeting.organizer_name || '';
  const agendaLabel = meeting.agenda || meeting.description || meeting.notes || '';
  const unitLabel = meeting.organization_unit?.name || '';
  const timeLabel = getMeetingTimeRange(meeting);

  return (
    <View style={[styles.meetingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top Header Row: Icon, Title & Status Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
          <View style={[styles.meetingIconBox, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
            <Ionicons name="calendar-number-outline" size={20} color={colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.meetingTitle, { color: colors.textMain }]} numberOfLines={2}>
              {meeting.title}
            </Text>
            {meeting.meeting_number && (
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2 }}>
                {meeting.meeting_number}
              </Text>
            )}
          </View>
        </View>

        <View style={[
          styles.statusBadge,
          { backgroundColor: isCompleted ? colors.statusOnsiteBg : isCancelled ? '#FEE2E2' : isOngoing ? '#FEF3C7' : activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#E6F4F1' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: isCompleted ? colors.statusOnsiteText : isCancelled ? '#EF4444' : isOngoing ? '#D97706' : colors.teal }
          ]}>
            {isCompleted ? 'Selesai' : isCancelled ? 'Dibatalkan' : isOngoing ? 'Berlangsung' : 'Dijadwalkan'}
          </Text>
        </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

      {/* Details Section */}
      <View style={{ gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={{ fontSize: 11, color: colors.textMain, fontWeight: '600' }}>
            {dateLabel} • {timeLabel}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="location-outline" size={14} color={colors.teal} />
          <Text style={{ fontSize: 11, color: colors.teal, fontWeight: '700' }}>
            {roomLabel}
          </Text>
        </View>

        {organizerLabel !== '' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Penyelenggara: {organizerLabel} {unitLabel ? `(${unitLabel})` : ''}
            </Text>
          </View>
        )}

        {agendaLabel !== '' && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 }}>
            <Ionicons name="document-text-outline" size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', flex: 1 }} numberOfLines={2}>
              Agenda: {agendaLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Attendance & QR Status Section */}
      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        {isUserCheckedIn ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            paddingVertical: 9,
            backgroundColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: activeTheme === 'dark' ? 'rgba(52, 211, 153, 0.3)' : '#86EFAC'
          }}>
            <Ionicons name="checkmark-circle" size={17} color="#16A34A" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: activeTheme === 'dark' ? '#34D399' : '#15803D' }}>
              SUDAH PRESENSI (HADIR)
            </Text>
          </View>
        ) : isOngoing ? (
          <TouchableOpacity
            style={[styles.checkinBtn, { backgroundColor: colors.teal, width: '100%', justifyContent: 'center', paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => router.push({ pathname: '/(tabs)/action', params: { mode: 'qr' } })}
            activeOpacity={0.85}
          >
            <Ionicons name="qr-code-outline" size={17} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>SCAN QR PRESENSI RAPAT</Text>
            <Ionicons name="chevron-forward" size={15} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : isCompleted ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5 }}>
            <Ionicons name="checkmark-done-circle" size={16} color={colors.textMuted} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>Rapat Telah Selesai</Text>
          </View>
        ) : isCancelled ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5 }}>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>Rapat Dibatalkan</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.12)' : '#E6F4F1', borderRadius: 10 }}>
            <Ionicons name="qr-code-outline" size={14} color={colors.teal} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.teal }}>Presensi via Scan QR saat Rapat Dimulai</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 4,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  calendarHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  subFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  meetingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  meetingDateText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  centerModalContainer: {
    width: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT * 0.80,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalMeetingItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tokenInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tokenInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  submitTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 14,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 85,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 99,
  },
  elegantOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
