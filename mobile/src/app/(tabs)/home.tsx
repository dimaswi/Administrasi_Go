import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';
import CustomCalendar from '../../components/CustomCalendar';
import CustomRefreshScrollView from '../../components/CustomRefreshScrollView';
import CustomAlert from '../../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../../context/ThemeContext';
import { getApiUrl } from '../../config/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEAL = '#0A7973';
const BG = '#F4F6F8';
const WHITE = '#FFFFFF';
const TEXT_MAIN = '#111827';
const TEXT_MUTED = '#6B7280';

interface StatusBadgeInfo {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  textColor: string;
  borderColor: string;
}

const getAttendanceStatusConfig = (
  rawStatus: string | undefined,
  hasClockIn: boolean,
  isDark: boolean
): StatusBadgeInfo => {
  if (!rawStatus && !hasClockIn) {
    return {
      label: 'Belum Presensi',
      icon: 'alert-circle-outline',
      bg: isDark ? 'rgba(148, 163, 184, 0.12)' : '#F1F5F9',
      textColor: isDark ? '#94A3B8' : '#64748B',
      borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : '#E2E8F0',
    };
  }

  const s = (rawStatus || '').toLowerCase().trim();

  switch (s) {
    case 'present':
    case 'onsite':
      return {
        label: 'Hadir Tepat Waktu',
        icon: 'checkmark-circle',
        bg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
        textColor: isDark ? '#34D399' : '#15803D',
        borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#86EFAC',
      };
    case 'late':
      return {
        label: 'Terlambat',
        icon: 'time',
        bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
        textColor: isDark ? '#FBBF24' : '#B45309',
        borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FCD34D',
      };
    case 'leave':
    case 'leaves':
      return {
        label: 'Cuti',
        icon: 'calendar',
        bg: isDark ? 'rgba(99, 102, 241, 0.16)' : '#E0E7FF',
        textColor: isDark ? '#818CF8' : '#4338CA',
        borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : '#A5B4FC',
      };
    case 'sick':
      return {
        label: 'Sakit',
        icon: 'medkit',
        bg: isDark ? 'rgba(14, 165, 233, 0.16)' : '#E0F2FE',
        textColor: isDark ? '#38BDF8' : '#0369A1',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#7DD3FC',
      };
    case 'permit':
    case 'permission':
      return {
        label: 'Izin',
        icon: 'document-text',
        bg: isDark ? 'rgba(168, 85, 247, 0.16)' : '#F3E8FF',
        textColor: isDark ? '#C084FC' : '#7E22CE',
        borderColor: isDark ? 'rgba(192, 132, 252, 0.35)' : '#D8B4FE',
      };
    case 'absent':
    case 'alpha':
      return {
        label: 'Alpha (Tidak Hadir)',
        icon: 'close-circle',
        bg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
        textColor: isDark ? '#F87171' : '#B91C1C',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FCA5A5',
      };
    case 'early_leave':
      return {
        label: 'Pulang Awal',
        icon: 'log-out',
        bg: isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFEDD5',
        textColor: isDark ? '#FB923C' : '#C2410C',
        borderColor: isDark ? 'rgba(251, 146, 60, 0.35)' : '#FDBA74',
      };
    case 'late_early_leave':
      return {
        label: 'Terlambat & Pulang Awal',
        icon: 'alert-circle',
        bg: isDark ? 'rgba(244, 63, 94, 0.16)' : '#FFE4E6',
        textColor: isDark ? '#FB7185' : '#BE123C',
        borderColor: isDark ? 'rgba(251, 113, 133, 0.35)' : '#FDA4AF',
      };
    case 'wfh':
      return {
        label: 'WFH',
        icon: 'home',
        bg: isDark ? 'rgba(20, 184, 166, 0.16)' : '#CCFBF1',
        textColor: isDark ? '#2DD4BF' : '#0F766E',
        borderColor: isDark ? 'rgba(45, 212, 191, 0.35)' : '#5EEAD4',
      };
    case 'business_trip':
      return {
        label: 'Dinas Luar',
        icon: 'briefcase',
        bg: isDark ? 'rgba(6, 182, 212, 0.16)' : '#CFFAFE',
        textColor: isDark ? '#22D3EE' : '#0E7490',
        borderColor: isDark ? 'rgba(34, 211, 238, 0.35)' : '#67E8F9',
      };
    case 'off':
    case 'holiday':
      return {
        label: 'Hari Libur',
        icon: 'cafe',
        bg: isDark ? 'rgba(100, 116, 139, 0.16)' : '#F1F5F9',
        textColor: isDark ? '#94A3B8' : '#475569',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.28)' : '#CBD5E1',
      };
    default:
      if (hasClockIn) {
        return {
          label: 'Hadir',
          icon: 'checkmark-circle',
          bg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
          textColor: isDark ? '#34D399' : '#15803D',
          borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#86EFAC',
        };
      }
      return {
        label: rawStatus || 'Belum Presensi',
        icon: 'alert-circle-outline',
        bg: isDark ? 'rgba(148, 163, 184, 0.12)' : '#F1F5F9',
        textColor: isDark ? '#94A3B8' : '#64748B',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : '#E2E8F0',
      };
  }
};

interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
  cardBg: string;
  borderColor: string;
}

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  visible,
  onClose,
  children,
  maxHeight,
  cardBg,
  borderColor,
}) => {
  const [showModal, setShowModal] = useState(visible);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (showModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalRootContainer}>
        {/* Soft Fading Backdrop - Pinned full-screen, NEVER slides */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.42)',
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Sliding Card Container - Only this moves up from bottom */}
        <Animated.View
          style={[
            styles.animatedDrawerWrapper,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.formDrawerContainer,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
                maxHeight: maxHeight || SCREEN_HEIGHT * 0.88,
              },
            ]}
          >
            {/* Drag Handle Top Bar */}
            <View style={styles.sheetDragBar}>
              <View style={[styles.dragHandlePill, { backgroundColor: borderColor }]} />
            </View>

            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  const { colors, activeTheme, toggleTheme } = useThemeContext();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateDrawer, setShowDateDrawer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Compute today's date info
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;
  const todayLabel = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const toggleCalendar = () => {
    setShowCalendar(prev => !prev);
    if (showCalendar) setSelectedDate(null);
  };

  const [attendanceData, setAttendanceData] = useState<Record<string, { clockIn: string; clockOut: string; workHours: string; status: string }>>({});
  const [rosterMap, setRosterMap] = useState<Record<string, { workScheduleId: number; name?: string }>>({});
  const [employeeData, setEmployeeData] = useState<{
    name: string;
    role: string;
    jobCategory?: string;
    orgUnit?: string;
    avatar: string;
  } | null>(null);

  const checkIsOffDay = (dateStr: string | null) => {
    if (!dateStr) return true;
    const rosterItem = rosterMap[dateStr];
    if (rosterItem && rosterItem.workScheduleId > 0) {
      return false;
    }
    return true;
  };

  // State for employeeId and leave types
  const [employeeId, setEmployeeId] = useState<number>(0);
  const [leaveTypes, setLeaveTypes] = useState<Array<{ id: number; name: string; code?: string }>>([]);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number>(0);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectedLeaveType = leaveTypes.find(lt => lt.id === selectedLeaveTypeId);

  // Leave / Sick / Permission Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [startDate, setStartDate] = useState(todayString);
  const [endDate, setEndDate] = useState(todayString);
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Early Leave (Pulang Cepat) Modal
  const [showEarlyLeaveModal, setShowEarlyLeaveModal] = useState(false);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');

  // Colleagues (Karyawan Pengganti) State
  const [colleagues, setColleagues] = useState<Array<{ id: number; name: string; position?: string; employee_id?: string }>>([]);
  const [selectedDelegationId, setSelectedDelegationId] = useState<number | null>(null);
  const [isDelegationSelectOpen, setIsDelegationSelectOpen] = useState(false);
  const [delegationSearch, setDelegationSearch] = useState('');
  const [earlyLeaveDelegationId, setEarlyLeaveDelegationId] = useState<number | null>(null);
  const [isEarlyDelegationOpen, setIsEarlyDelegationOpen] = useState(false);

  // Unified History Modal (Cuti & Pulang Cepat)
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTab, setHistoryTab] = useState<'leaves' | 'early_leave'>('leaves');

  // Leave History
  const [leaveHistoryList, setLeaveHistoryList] = useState<Array<{
    id: number;
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
    approval_notes?: string;
    leave_type_name?: string;
    delegation_to_name?: string;
    created_at?: string;
  }>>([]);
  const [loadingLeaveHistory, setLoadingLeaveHistory] = useState(false);
  const [leaveHistoryFilter, setLeaveHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Early Leave (Pulang Cepat) History
  const [earlyLeaveHistoryList, setEarlyLeaveHistoryList] = useState<Array<{
    id: number;
    employee_id: number;
    date: string;
    clock_in?: string;
    clock_out?: string;
    status?: string;
    notes?: string;
    work_schedule_name?: string;
    created_at?: string;
  }>>([]);
  const [loadingEarlyLeaveHistory, setLoadingEarlyLeaveHistory] = useState(false);
  const [earlyLeaveFilter, setEarlyLeaveFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Custom Alert state
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

  const fetchColleagues = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;
      const res = await fetch(getApiUrl('/api/employees?perPage=100'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json || [];
        if (Array.isArray(list)) {
          setColleagues(list.map((e: any) => ({
            id: e.id,
            name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.employee_id || `Karyawan #${e.id}`,
            position: e.position || '',
            employee_id: e.employee_id || ''
          })));
        }
      }
    } catch (e) {
      console.log('Error fetching colleagues:', e);
    }
  };

  const openLeaveModal = (targetType?: 'cuti' | 'sakit' | 'izin') => {
    setStartDate(todayString);
    setEndDate(todayString);
    setTotalDays('1');
    setReason('');
    setEmergencyPhone('');
    setIsSelectOpen(false);
    setSelectedDelegationId(null);
    setIsDelegationSelectOpen(false);
    setDelegationSearch('');
    fetchColleagues();

    const autoMatch = (list: Array<{ id: number; name: string; code?: string }>) => {
      if (!list || list.length === 0) return;
      if (targetType) {
        const match = list.find(lt => {
          const name = (lt.name || '').toLowerCase();
          const code = (lt.code || '').toLowerCase();
          if (targetType === 'cuti') return code === 'ct' || name.includes('tahunan') || name.includes('cuti');
          if (targetType === 'sakit') return code === 'cs' || name.includes('sakit');
          if (targetType === 'izin') return code === 'ik' || name.includes('izin') || name.includes('khusus') || name.includes('alasan');
          return false;
        });
        setSelectedLeaveTypeId(match ? match.id : list[0].id);
      } else if (!selectedLeaveTypeId || selectedLeaveTypeId === 0) {
        setSelectedLeaveTypeId(list[0].id);
      }
    };

    if (leaveTypes.length > 0) {
      autoMatch(leaveTypes);
    } else {
      SecureStore.getItemAsync('userToken').then(token => {
        if (token) {
          fetch(getApiUrl('/api/leave-types'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => {
              const list = data.data || data || [];
              if (Array.isArray(list) && list.length > 0) {
                setLeaveTypes(list);
                autoMatch(list);
              }
            })
            .catch(() => { });
        }
      });
    }

    setShowLeaveModal(true);
  };

  const setPresetDays = (days: number) => {
    setTotalDays(String(days));
    const d = new Date(startDate || todayString);
    d.setDate(d.getDate() + days - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    setEndDate(`${yr}-${mo}-${dy}`);
  };

  const openEarlyLeaveModal = () => {
    const todayAtt = attendanceData[todayString];
    const hasTodayClockIn = !!(todayAtt && todayAtt.clockIn && todayAtt.clockIn !== '--:--');
    const hasTodayClockOut = !!(todayAtt && todayAtt.clockOut && todayAtt.clockOut !== '--:--');

    if (!hasTodayClockIn) {
      showAlert('info', 'Belum Presensi Masuk', 'Anda belum melakukan presensi masuk hari ini. Pulang cepat hanya dapat dilakukan setelah presensi masuk.');
      return;
    }

    if (hasTodayClockOut) {
      showAlert('info', 'Sudah Checkout', 'Anda sudah melakukan presensi pulang untuk hari ini.');
      return;
    }

    setEarlyLeaveReason('');
    setEarlyLeaveDelegationId(null);
    setIsEarlyDelegationOpen(false);
    fetchColleagues();
    setShowEarlyLeaveModal(true);
  };

  const incrementDays = () => {
    const cur = parseInt(totalDays) || 1;
    const next = cur + 1;
    setTotalDays(String(next));
    const d = new Date(startDate || todayString);
    d.setDate(d.getDate() + next - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    setEndDate(`${yr}-${mo}-${dy}`);
  };

  const decrementDays = () => {
    const cur = parseInt(totalDays) || 1;
    if (cur > 1) {
      const next = cur - 1;
      setTotalDays(String(next));
      const d = new Date(startDate || todayString);
      d.setDate(d.getDate() + next - 1);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      setEndDate(`${yr}-${mo}-${dy}`);
    }
  };

  const formatIndonesianDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayName = days[d.getDay()];
      const mName = months[Number(parts[1]) - 1] || parts[1];
      return `${dayName}, ${parts[2]} ${mName} ${parts[0]}`;
    }
    return dateStr;
  };

  const fetchLeaveHistory = async () => {
    setLoadingLeaveHistory(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setLoadingLeaveHistory(false);
        return;
      }
      const targetEmpId = employeeId > 0 ? employeeId : 1;
      const res = await fetch(getApiUrl(`/api/leaves?employee_id=${targetEmpId}&perPage=50`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json || [];
        if (Array.isArray(list)) {
          setLeaveHistoryList(list);
        }
      }
    } catch (e) {
      console.log('Error fetching leave history:', e);
    } finally {
      setLoadingLeaveHistory(false);
    }
  };

  const fetchEarlyLeaveHistory = async () => {
    setLoadingEarlyLeaveHistory(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setLoadingEarlyLeaveHistory(false);
        return;
      }
      const targetEmpId = employeeId > 0 ? employeeId : 1;
      const res = await fetch(getApiUrl('/api/attendances?perPage=1000'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json || [];
        if (Array.isArray(list)) {
          const earlyList = list.filter((item: any) => {
            const matchesEmp = item.employee_id == targetEmpId;
            if (!matchesEmp) return false;
            const st = (item.status || '').toLowerCase();
            const notes = item.notes || '';
            return st === 'early_leave' || st === 'late_early_leave' || notes.includes('Pulang Cepat') || notes.includes('Pulang Awal');
          });
          setEarlyLeaveHistoryList(earlyList);
        }
      }
    } catch (e) {
      console.log('Error fetching early leave history:', e);
    } finally {
      setLoadingEarlyLeaveHistory(false);
    }
  };

  const openUnifiedHistoryModal = (initialTab: 'leaves' | 'early_leave' = 'leaves') => {
    setHistoryTab(initialTab);
    setShowHistoryModal(true);
    fetchLeaveHistory();
    fetchEarlyLeaveHistory();
  };

  const openLeaveHistoryModal = () => openUnifiedHistoryModal('leaves');
  const openEarlyLeaveHistoryModal = () => openUnifiedHistoryModal('early_leave');

  const handleSendLeave = async () => {
    if (!selectedLeaveTypeId || selectedLeaveTypeId <= 0) {
      showAlert('warning', 'Pilih Jenis Cuti', 'Harap pilih jenis cuti terlebih dahulu.');
      return;
    }

    if (!reason.trim()) {
      showAlert('warning', 'Alasan Kosong', 'Harap isi alasan pengajuan cuti/izin Anda.');
      return;
    }

    setSubmittingLeave(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');

      let finalEmployeeId = employeeId;
      if (!finalEmployeeId || finalEmployeeId <= 0) {
        finalEmployeeId = 1;
      }

      const payload = {
        employee_id: finalEmployeeId,
        leave_type_id: selectedLeaveTypeId,
        start_date: startDate,
        end_date: endDate,
        total_days: parseInt(totalDays) || 1,
        is_half_day: false,
        reason: reason.trim(),
        emergency_phone: emergencyPhone.trim() || null,
        delegation_to: selectedDelegationId || null,
        status: 'pending'
      };

      const res = await fetch(getApiUrl('/api/leaves'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      setSubmittingLeave(false);

      if (res.ok) {
        setShowLeaveModal(false);
        const selName = leaveTypes.find(lt => lt.id === selectedLeaveTypeId)?.name || 'Cuti/Izin';
        showAlert(
          'success',
          'Pengajuan Terkirim',
          `Pengajuan ${selName} berhasil dikirim dan menunggu persetujuan HR.`
        );
        fetchLeaveHistory();
        loadUserData();
      } else {
        showAlert('error', 'Gagal Mengirim', resData.error || 'Terjadi kesalahan saat menyimpan pengajuan.');
      }
    } catch (e: any) {
      setSubmittingLeave(false);
      showAlert('error', 'Koneksi Gagal', 'Tidak dapat terhubung ke server backend.');
    }
  };

  const loadUserData = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let currentEmpId = 0;

      // 1. Get Me (User)
      const meRes = await fetch(getApiUrl('/api/auth/me'), { headers });
      if (!meRes.ok) throw new Error('Token invalid');
      const meData = await meRes.json();
      const userId = meData.user.id;

      // 2. Get Employee Profile
      const empRes = await fetch(getApiUrl(`/api/employees/by-user/${userId}`), { headers });
      if (empRes.ok) {
        const empJson = await empRes.json();
        const empData = empJson.data || empJson;
        if (empData) {
          currentEmpId = empData.id;
          setEmployeeId(empData.id);
          let roleTitle = empData.position || '';
          let jobCatName = '';
          let orgUnitName = '';

          // Fetch Job Category if present
          if (empData.job_category_id) {
            try {
              const jcRes = await fetch(getApiUrl(`/api/job-categories/${empData.job_category_id}`), { headers });
              if (jcRes.ok) {
                const jcData = await jcRes.json();
                jobCatName = (jcData.data || jcData).name || '';
              }
            } catch (e) { }
          }

          // Fetch Organization Unit if present
          if (empData.organization_unit_id) {
            try {
              const orgRes = await fetch(getApiUrl(`/api/org-units/${empData.organization_unit_id}`), { headers });
              if (orgRes.ok) {
                const orgData = await orgRes.json();
                orgUnitName = (orgData.data || orgData).name || '';
              }
            } catch (e) { }
          }

          setEmployeeData({
            name: `${empData.first_name || ''} ${empData.last_name || ''}`.trim() || meData.user?.name || 'Nama Pegawai',
            role: roleTitle || jobCatName || 'Pegawai',
            jobCategory: jobCatName,
            orgUnit: orgUnitName,
            avatar: empData.photo || 'https://i.pravatar.cc/150?img=11',
          });
        }
      }

      // Fetch Leave Types
      try {
        const ltRes = await fetch(getApiUrl('/api/leave-types'), { headers });
        if (ltRes.ok) {
          const ltJson = await ltRes.json();
          const list = ltJson.data || ltJson || [];
          if (Array.isArray(list) && list.length > 0) {
            setLeaveTypes(list);
          }
        }
      } catch (e) { }

      // 3. Get Roster Schedules
      try {
        const rosterRes = await fetch(getApiUrl('/api/roster-schedules?per_page=1000'), { headers });
        if (rosterRes.ok) {
          const rosterJson = await rosterRes.json();
          const list = rosterJson.data || [];
          const map: Record<string, { workScheduleId: number; name?: string }> = {};
          list.forEach((r: any) => {
            if (r.date) {
              const dStr = r.date.split('T')[0];
              map[dStr] = {
                workScheduleId: r.work_schedule_id,
                name: r.work_schedule_name || 'Shift Kerja'
              };
            }
          });
          setRosterMap(map);
        }
      } catch (e) { }

      // 4. Get Attendances
      const attRes = await fetch(getApiUrl('/api/attendances?perPage=1000'), { headers });
      if (attRes.ok) {
        const attJson = await attRes.json();
        const list = attJson.data || attJson || [];
        const formattedData: Record<string, any> = {};

        list.forEach((item: any) => {
          const itemEmpId = item.employee_id;
          const isMyAttendance = (currentEmpId > 0 && itemEmpId == currentEmpId) || itemEmpId == userId;

          if (isMyAttendance) {
            const dateStr = item.date ? String(item.date).split('T')[0] : '';
            if (dateStr) {
              formattedData[dateStr] = {
                clockIn: item.clock_in ? String(item.clock_in).substring(0, 5) : '--:--',
                clockOut: item.clock_out ? String(item.clock_out).substring(0, 5) : '--:--',
                status: item.status || (item.clock_in ? 'present' : ''),
              };
            }
          }
        });
        setAttendanceData(formattedData);

        // Populate early leaves for this employee
        const earlyList = list.filter((item: any) => {
          const itemEmpId = item.employee_id;
          const isMyAttendance = (currentEmpId > 0 && itemEmpId == currentEmpId) || itemEmpId == userId;
          if (!isMyAttendance) return false;
          const st = (item.status || '').toLowerCase();
          const notes = item.notes || '';
          return st === 'early_leave' || st === 'late_early_leave' || notes.includes('Pulang Cepat') || notes.includes('Pulang Awal');
        });
        setEarlyLeaveHistoryList(earlyList);

        // Fetch leave history list
        const targetEmpId = currentEmpId > 0 ? currentEmpId : (employeeId > 0 ? employeeId : 1);
        try {
          const lRes = await fetch(getApiUrl(`/api/leaves?employee_id=${targetEmpId}&perPage=50`), { headers });
          if (lRes.ok) {
            const lJson = await lRes.json();
            const lList = lJson.data || lJson || [];
            if (Array.isArray(lList)) {
              setLeaveHistoryList(lList);
            }
          }
        } catch (e) { }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const startTime = Date.now();
    try {
      await loadUserData();
    } catch (e) {
      console.error(e);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise(res => setTimeout(res, 1200 - elapsed));
      }
      setRefreshing(false);
    }
  };

  const selectedAttendance = selectedDate ? attendanceData[selectedDate] : null;

  const buildMarkedDates = () => {
    const marked: Record<string, any> = {};
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dStr = `${year}-${mm}-${dd}`;

      const isOff = checkIsOffDay(dStr);
      const shiftInfo = rosterMap[dStr];
      const att = attendanceData[dStr];

      const hasClockIn = !!(att && att.clockIn && att.clockIn !== '--:--');
      const hasClockOut = !!(att && att.clockOut && att.clockOut !== '--:--');

      marked[dStr] = {
        isOffDay: isOff,
        shiftName: isOff ? undefined : (shiftInfo?.name || 'MASUK'),
        marked: hasClockIn || hasClockOut,
        hasClockIn,
        hasClockOut,
      };
    }

    if (selectedDate) {
      const isOff = checkIsOffDay(selectedDate);
      const shiftInfo = rosterMap[selectedDate];
      const att = attendanceData[selectedDate];
      const hasClockIn = !!(att && att.clockIn && att.clockIn !== '--:--');
      const hasClockOut = !!(att && att.clockOut && att.clockOut !== '--:--');

      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.teal,
        isOffDay: isOff,
        shiftName: isOff ? undefined : (shiftInfo?.name || 'MASUK'),
        hasClockIn,
        hasClockOut,
      };
    }

    return marked;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <CustomRefreshScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Header - Top Row */}
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <Image
              source={{ uri: employeeData?.avatar || 'https://i.pravatar.cc/150?img=11' }}
              style={styles.avatar}
            />
            <View style={{ flexShrink: 1, maxWidth: 170 }}>
              <Text style={[styles.userName, { color: colors.textMain }]} numberOfLines={1}>{employeeData?.name || 'Loading...'}</Text>
              <Text style={[styles.userRole, { color: colors.textMuted }]} numberOfLines={1}>
                {employeeData?.role || '...'}
                {!!employeeData?.jobCategory && employeeData.jobCategory !== employeeData.role ? ` (${employeeData.jobCategory})` : ''}
              </Text>
              {!!employeeData?.orgUnit && (
                <Text style={[styles.userOrg, { color: colors.teal }]} numberOfLines={1}>
                  {employeeData.orgUnit}
                </Text>
              )}
            </View>
          </View>

          {/* Calendar toggle button */}
          <TouchableOpacity
            style={[
              styles.dateToggleBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              showCalendar && { backgroundColor: colors.teal, borderColor: colors.teal }
            ]}
            onPress={toggleCalendar}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showCalendar ? 'calendar' : 'calendar-outline'}
              size={16}
              color={showCalendar ? '#FFFFFF' : colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.dateText,
              { color: colors.textMuted },
              showCalendar && { color: '#FFFFFF' }
            ]}>
              {todayLabel}
            </Text>
            <Ionicons
              name={showCalendar ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={showCalendar ? '#FFFFFF' : colors.textMuted}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        {/* Conditional View: Replace Home Content when Calendar is Open */}
        {showCalendar ? (
          <View>
            <CustomCalendar
              current={todayString}
              markedDates={buildMarkedDates()}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowDateDrawer(true);
              }}
            />
          </View>
        ) : (
          /* Default Dashboard Content when Calendar is Closed */
          <View>
            {/* Status Presensi Hari Ini */}
            <View style={[styles.attendanceCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 20 }]}>
              <View style={styles.attendanceCardHeader}>
                <View>
                  <Text style={[styles.attendanceDateLabel, { color: colors.textMain }]}>Presensi Hari Ini</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{todayLabel}</Text>
                </View>
                {(() => {
                  const todayAtt = attendanceData[todayString];
                  const hasTodayClockIn = !!(todayAtt && todayAtt.clockIn && todayAtt.clockIn !== '--:--');
                  const badge = getAttendanceStatusConfig(todayAtt?.status, hasTodayClockIn, activeTheme === 'dark');
                  return (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: badge.bg,
                          borderColor: badge.borderColor,
                        },
                      ]}
                    >
                      <Ionicons name={badge.icon} size={13} color={badge.textColor} />
                      <Text style={[styles.statusText, { color: badge.textColor }]}>
                        {badge.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.clockRow}>
                <View style={styles.clockItem}>
                  <View style={[styles.clockIconWrapper, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
                    <Ionicons name="log-in-outline" size={18} color={colors.teal} />
                  </View>
                  <Text style={[styles.clockLabel, { color: colors.textMuted }]}>Jam Masuk</Text>
                  <Text style={[styles.clockTime, { color: colors.textMain }]}>
                    {attendanceData[todayString] ? attendanceData[todayString].clockIn : '--:--'}
                  </Text>
                </View>

                <View style={[styles.clockDivider, { backgroundColor: colors.border }]} />

                <View style={styles.clockItem}>
                  <View style={[styles.clockIconWrapper, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
                    <Ionicons name="log-out-outline" size={18} color={colors.teal} />
                  </View>
                  <Text style={[styles.clockLabel, { color: colors.textMuted }]}>Jam Pulang</Text>
                  <Text style={[styles.clockTime, { color: colors.textMain }]}>
                    {attendanceData[todayString] ? attendanceData[todayString].clockOut : '--:--'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Executive Quick Actions Hub */}
            <View style={styles.actionHubContainer}>
              <View style={styles.actionHubHeader}>
                <View>
                  <Text style={[styles.actionHubTitle, { color: colors.textMain }]}>Layanan & Perizinan</Text>
                  <Text style={[styles.actionHubSubtitle, { color: colors.textMuted }]}>Pengajuan mandiri & perizinan pegawai</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.historyActionBtn,
                    { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.18)' : '#CCFBF1', borderColor: colors.teal }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => openUnifiedHistoryModal('leaves')}
                >
                  <Ionicons name="time-outline" size={15} color={colors.teal} />
                  <Text style={[styles.historyActionBtnText, { color: colors.teal }]}>Riwayat</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionHubGrid}>
                {/* 1. Pengajuan Cuti & Perizinan (Satu pintu untuk cuti tahunan, sakit, dinas & izin khusus) */}
                <TouchableOpacity
                  style={[styles.hubCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.88}
                  onPress={() => openLeaveModal()}
                >
                  <LinearGradient
                    colors={activeTheme === 'dark' ? ['rgba(20, 184, 166, 0.14)', 'rgba(20, 184, 166, 0.02)'] : ['#F0FDFA', '#FFFFFF']}
                    style={styles.hubCardGradient}
                  >
                    <View style={styles.hubCardTop}>
                      <View style={[styles.hubIconFrame, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.25)' : '#CCFBF1' }]}>
                        <Ionicons name="document-text" size={22} color={colors.teal} />
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openUnifiedHistoryModal('leaves');
                        }}
                        style={[styles.hubPillTag, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.25)' : '#CCFBF1', flexDirection: 'row', alignItems: 'center', gap: 3 }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time-outline" size={11} color={colors.teal} />
                        <Text style={[styles.hubPillText, { color: colors.teal, fontWeight: '700' }]}>Riwayat</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hubCardTitle, { color: colors.textMain }]}>Cuti & Perizinan</Text>
                    <Text style={[styles.hubCardDesc, { color: colors.textMuted }]}>Tahunan, sakit, dinas & izin khusus</Text>
                    <View style={styles.hubCardFooter}>
                      <Text style={[styles.hubActionText, { color: colors.teal }]}>Ajukan Sekarang</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.teal} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 2. Pulang Cepat (Presensi Khusus Checkout Awal) */}
                <TouchableOpacity
                  style={[styles.hubCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.88}
                  onPress={openEarlyLeaveModal}
                >
                  <LinearGradient
                    colors={activeTheme === 'dark' ? ['rgba(249, 115, 22, 0.14)', 'rgba(249, 115, 22, 0.02)'] : ['#FFF7ED', '#FFFFFF']}
                    style={styles.hubCardGradient}
                  >
                    <View style={styles.hubCardTop}>
                      <View style={[styles.hubIconFrame, { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.25)' : '#FFEDD5' }]}>
                        <Ionicons name="log-out" size={22} color="#F97316" />
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openUnifiedHistoryModal('early_leave');
                        }}
                        style={[styles.hubPillTag, { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.25)' : '#FFEDD5', flexDirection: 'row', alignItems: 'center', gap: 3 }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time-outline" size={11} color="#F97316" />
                        <Text style={[styles.hubPillText, { color: '#F97316', fontWeight: '700' }]}>Riwayat</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hubCardTitle, { color: colors.textMain }]}>Pulang Cepat</Text>
                    <Text style={[styles.hubCardDesc, { color: colors.textMuted }]}>Checkout awal sebelum shift usai</Text>
                    <View style={styles.hubCardFooter}>
                      <Text style={[styles.hubActionText, { color: '#F97316' }]}>Checkout Awal</Text>
                      <Ionicons name="chevron-forward" size={14} color="#F97316" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Announcement / Info Card */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 14 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#E6F4F1', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="megaphone-outline" size={20} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>Pengumuman Instansi</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 16 }}>
                  Harap melakukan presensi harian secara tepat waktu sebelum pukul 08:00 WIB.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Spacer for bottom tab */}
        <View style={{ height: 120 }} />
      </CustomRefreshScrollView>

      {/* Slide-Up Bottom Sheet Drawer for Selected Date Details */}
      {/* Slide-Up Bottom Sheet Drawer for Selected Date Details */}
      <BottomDrawer
        visible={showDateDrawer}
        onClose={() => setShowDateDrawer(false)}
        cardBg={colors.card}
        borderColor={colors.border}
      >
        {(() => {
          const isOffDay = selectedDate ? checkIsOffDay(selectedDate) : false;
          const selectedAttendance = selectedDate ? attendanceData[selectedDate] : undefined;
          return (
            <>
              <View style={styles.formDrawerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[
                    styles.formHeaderIconCircle,
                    {
                      backgroundColor: isOffDay
                        ? (activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                        : (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1')
                    }
                  ]}>
                    <Ionicons name={isOffDay ? "cafe" : "calendar"} size={22} color={isOffDay ? '#EF4444' : colors.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formDrawerTitle, { color: colors.textMain }]} numberOfLines={1}>
                      {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </Text>
                    <Text style={{ fontSize: 11, color: isOffDay ? '#EF4444' : colors.teal, fontWeight: '700', marginTop: 1 }}>
                      {isOffDay ? 'Hari Libur / Off Day (Tidak Ada Shift)' : 'Shift Reguler Pagi (08:00 - 17:00 WIB)'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setShowDateDrawer(false)}
                  style={[styles.closeIconCircle, { backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Shift & Check-In / Check-Out Status Content */}
              <View style={{ gap: 10, marginVertical: 14 }}>
                {isOffDay ? (
                  <>
                    <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 }]}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="briefcase-outline" size={20} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>JADWAL SHIFT KERJA</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMain, marginTop: 2 }}>
                          Hari Libur (Tidak Ada Jam Kerja)
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 }]}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>STATUS PRESENSI</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMain, marginTop: 2 }}>
                          Bebas Presensi Harian
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Status Presensi Badge Row */}
                    {(() => {
                      const hasIn = !!(selectedAttendance && selectedAttendance.clockIn && selectedAttendance.clockIn !== '--:--');
                      const dateBadge = getAttendanceStatusConfig(selectedAttendance?.status, hasIn, activeTheme === 'dark');
                      return (
                        <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }]}>
                          <View>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>STATUS PRESENSI</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain, marginTop: 2 }}>
                              {hasIn ? 'Tercatat Kehadiran' : 'Tidak Ada Presensi'}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: dateBadge.bg, borderColor: dateBadge.borderColor }]}>
                            <Ionicons name={dateBadge.icon} size={13} color={dateBadge.textColor} />
                            <Text style={[styles.statusText, { color: dateBadge.textColor }]}>{dateBadge.label}</Text>
                          </View>
                        </View>
                      );
                    })()}

                    {/* Row 1: Check In Status */}
                    <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 }]}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: selectedAttendance && selectedAttendance.clockIn !== '--:--' ? (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#DCFCE7') : 'rgba(100, 116, 139, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="log-in-outline" size={20} color={selectedAttendance && selectedAttendance.clockIn !== '--:--' ? colors.teal : colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>JAM MASUK</Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain, marginTop: 2 }}>
                          {selectedAttendance && selectedAttendance.clockIn !== '--:--'
                            ? `${selectedAttendance.clockIn} WIB`
                            : 'Belum Check-In'}
                        </Text>
                      </View>
                    </View>

                    {/* Row 2: Check Out Status */}
                    <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 }]}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: selectedAttendance && selectedAttendance.clockOut !== '--:--' ? (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#DCFCE7') : 'rgba(100, 116, 139, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="log-out-outline" size={20} color={selectedAttendance && selectedAttendance.clockOut !== '--:--' ? colors.teal : colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>JAM PULANG</Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain, marginTop: 2 }}>
                          {selectedAttendance && selectedAttendance.clockOut !== '--:--'
                            ? `${selectedAttendance.clockOut} WIB`
                            : 'Belum Check-Out'}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.closeDrawerActionBtn, { backgroundColor: colors.teal }]}
                onPress={() => setShowDateDrawer(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeDrawerActionText}>Tutup</Text>
              </TouchableOpacity>
            </>
          );
        })()}
      </BottomDrawer>

      {/* Modal Form Pengajuan Cuti / Sakit / Izin - Full Width Bottom Sheet Drawer */}
      <BottomDrawer
        visible={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        cardBg={colors.card}
        borderColor={colors.border}
      >
        {/* Header */}
        <View style={styles.formDrawerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={[
              styles.formHeaderIconCircle,
              { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }
            ]}>
              <Ionicons name="document-text" size={22} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formDrawerTitle, { color: colors.textMain }]}>
                Pengajuan Cuti & Izin
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Form Pengajuan Cuti & Izin
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* <TouchableOpacity
              onPress={() => {
                setShowLeaveModal(false);
                openLeaveHistoryModal();
              }}
              style={[styles.historyHeaderBtn, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}
              activeOpacity={0.75}
            >
              <Ionicons name="time-outline" size={14} color={colors.teal} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.teal, marginLeft: 4 }}>Riwayat</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => setShowLeaveModal(false)}
              style={[styles.closeIconCircle, { backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          {/* Section 1: Standard Select Jenis Cuti / Perizinan */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="layers-outline" size={16} color={colors.teal} />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Jenis Cuti / Perizinan</Text>
            </View>

            {/* Select Trigger Box */}
            <TouchableOpacity
              style={[
                styles.selectTriggerBox,
                { backgroundColor: colors.card, borderColor: isSelectOpen ? colors.teal : colors.border }
              ]}
              onPress={() => setIsSelectOpen(!isSelectOpen)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.selectIconBadge, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
                  <Ionicons name="list" size={16} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.selectBoxText,
                    { color: selectedLeaveType ? colors.textMain : colors.textMuted, fontWeight: selectedLeaveType ? '700' : '500' }
                  ]}>
                    {selectedLeaveType ? selectedLeaveType.name : 'Pilih Jenis Cuti / Izin...'}
                  </Text>
                  {selectedLeaveType?.code && (
                    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                      Kode: {selectedLeaveType.code}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name={isSelectOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isSelectOpen ? colors.teal : colors.textMuted}
              />
            </TouchableOpacity>

            {/* Dropdown Options List */}
            {isSelectOpen && (
              <View style={[styles.dropdownListContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {leaveTypes.length === 0 ? (
                  <View style={{ padding: 14, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.teal} />
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Memuat data jenis cuti...</Text>
                  </View>
                ) : (
                  leaveTypes.map((item, idx) => {
                    const isSel = item.id === selectedLeaveTypeId;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.dropdownItem,
                          idx < leaveTypes.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          isSel && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#F0FDFA' }
                        ]}
                        onPress={() => {
                          setSelectedLeaveTypeId(item.id);
                          setIsSelectOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[
                            styles.codeBadge,
                            { backgroundColor: isSel ? colors.teal : (activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9') }
                          ]}>
                            <Text style={[styles.codeBadgeText, { color: isSel ? '#FFFFFF' : colors.textMuted }]}>
                              {item.code || String(item.id)}
                            </Text>
                          </View>
                          <Text style={[
                            styles.dropdownItemText,
                            { color: isSel ? colors.teal : colors.textMain, fontWeight: isSel ? '800' : '600' }
                          ]}>
                            {item.name}
                          </Text>
                        </View>
                        {isSel && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Section 2: Jadwal & Durasi Waktu */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="calendar-outline" size={16} color={colors.teal} />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Waktu & Durasi Hari</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={[styles.dateInputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.fieldMiniLabel, { color: colors.textMuted }]}>MULAI</Text>
                <TextInput
                  style={[styles.dateInputField, { color: colors.textMain }]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.dateInputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.fieldMiniLabel, { color: colors.textMuted }]}>SAMPAI</Text>
                <TextInput
                  style={[styles.dateInputField, { color: colors.textMain }]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Quick Presets */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              {[1, 2, 3, 5].map((preset) => {
                const isPresetSel = totalDays === String(preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setPresetDays(preset)}
                    style={[
                      styles.presetDayBtn,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isPresetSel && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.25)' : '#CCFBF1', borderColor: colors.teal }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.presetDayText,
                      { color: colors.textMuted },
                      isPresetSel && { color: colors.teal, fontWeight: '800' }
                    ]}>
                      {preset} Hari
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Stepper Duration */}
            <View style={styles.stepperContainer}>
              <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>Total Durasi Hari Kerja:</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  onPress={decrementDays}
                  style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={colors.textMain} />
                </TouchableOpacity>
                <View style={[styles.stepperValueBox, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
                  <Text style={[styles.stepperValueText, { color: colors.teal }]}>{totalDays} Hari</Text>
                </View>
                <TouchableOpacity
                  onPress={incrementDays}
                  style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.textMain} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 3: Karyawan Pengganti / Delegasi Tugas */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="people-outline" size={16} color={colors.teal} />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Karyawan Pengganti (Delegasi)</Text>
            </View>

            {/* Select Trigger Box */}
            <TouchableOpacity
              style={[
                styles.selectTriggerBox,
                { backgroundColor: colors.card, borderColor: isDelegationSelectOpen ? colors.teal : colors.border }
              ]}
              onPress={() => setIsDelegationSelectOpen(!isDelegationSelectOpen)}
              activeOpacity={0.8}
            >
              {(() => {
                const selCol = colleagues.find(c => c.id === selectedDelegationId);
                return (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.selectIconBadge, { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
                        <Ionicons name="person" size={16} color={colors.teal} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.selectBoxText,
                          { color: selCol ? colors.textMain : colors.textMuted, fontWeight: selCol ? '700' : '500' }
                        ]}>
                          {selCol ? selCol.name : 'Pilih Rekan Pengganti (Opsional)...'}
                        </Text>
                        {selCol?.position ? (
                          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                            {selCol.position} {selCol.employee_id ? `• NIP: ${selCol.employee_id}` : ''}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {selCol ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedDelegationId(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ) : (
                      <Ionicons
                        name={isDelegationSelectOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isDelegationSelectOpen ? colors.teal : colors.textMuted}
                      />
                    )}
                  </>
                );
              })()}
            </TouchableOpacity>

            {/* Dropdown Colleagues List */}
            {isDelegationSelectOpen && (
              <View style={[styles.dropdownListContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {colleagues.length > 5 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 }}>
                    <Ionicons name="search-outline" size={15} color={colors.textMuted} />
                    <TextInput
                      style={{ flex: 1, fontSize: 12, color: colors.textMain, paddingVertical: 0 }}
                      placeholder="Cari nama atau jabatan rekan kerja..."
                      placeholderTextColor={colors.textMuted}
                      value={delegationSearch}
                      onChangeText={setDelegationSearch}
                    />
                    {delegationSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setDelegationSearch('')}>
                        <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedDelegationId(null);
                    setIsDelegationSelectOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>Tanpa Karyawan Pengganti</Text>
                  {selectedDelegationId === null && <Ionicons name="checkmark-circle" size={18} color={colors.teal} />}
                </TouchableOpacity>

                {(() => {
                  const filtered = colleagues.filter(c => {
                    if (employeeId && c.id === employeeId) return false;
                    if (!delegationSearch) return true;
                    return c.name.toLowerCase().includes(delegationSearch.toLowerCase()) ||
                      (c.position && c.position.toLowerCase().includes(delegationSearch.toLowerCase()));
                  });

                  if (filtered.length === 0) {
                    return (
                      <View style={{ padding: 14, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {colleagues.length === 0 ? 'Memuat daftar rekan kerja...' : 'Rekan kerja tidak ditemukan'}
                        </Text>
                      </View>
                    );
                  }

                  return filtered.slice(0, 15).map((col, idx) => {
                    const isColSel = col.id === selectedDelegationId;
                    return (
                      <TouchableOpacity
                        key={col.id}
                        style={[
                          styles.dropdownItem,
                          idx < Math.min(filtered.length, 15) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          isColSel && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : '#F0FDFA' }
                        ]}
                        onPress={() => {
                          setSelectedDelegationId(col.id);
                          setIsDelegationSelectOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemText, { color: isColSel ? colors.teal : colors.textMain, fontWeight: isColSel ? '800' : '600' }]}>
                            {col.name}
                          </Text>
                          {col.position ? (
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                              {col.position} {col.employee_id ? `• ${col.employee_id}` : ''}
                            </Text>
                          ) : null}
                        </View>
                        {isColSel && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
                        )}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            )}
          </View>

          {/* Section 4: Alasan & Catatan */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="document-text-outline" size={16} color={colors.teal} />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Alasan / Keterangan</Text>
            </View>

            <TextInput
              style={[styles.textAreaBox, { backgroundColor: colors.card, color: colors.textMain, borderColor: colors.border, marginTop: 8 }]}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              placeholder="Tuliskan alasan atau keterangan keperluan cuti/izin..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Section 4: Kontak Darurat */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="call-outline" size={16} color={colors.teal} />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Nomor Kontak Darurat (Opsional)</Text>
            </View>
            <TextInput
              style={[styles.phoneInputBox, { backgroundColor: colors.card, color: colors.textMain, borderColor: colors.border }]}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              placeholder="Contoh: 081234567890"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Submit Gradient Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSendLeave}
            disabled={submittingLeave}
            style={styles.submitGradientWrapper}
          >
            <LinearGradient
              colors={['#0D9488', '#0A7973']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradientBtn}
            >
              {submittingLeave ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitGradientBtnText}>Kirimkan Pengajuan ke HR</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 14, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.12)' : '#F0FDFA', borderWidth: 1, borderColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.3)' : '#CCFBF1' }}
            onPress={() => {
              setShowLeaveModal(false);
              openUnifiedHistoryModal('leaves');
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="time-outline" size={16} color={colors.teal} />
            <Text style={{ fontSize: 13, color: colors.teal, fontWeight: '700' }}>Lihat Riwayat Pengajuan Cuti Saya</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.teal} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 10, paddingVertical: 8, alignItems: 'center' }}
            onPress={() => setShowLeaveModal(false)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600' }}>Tutup / Batal</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomDrawer>

      {/* Modal Riwayat Terpadu (Cuti & Pulang Cepat) - Full Width Bottom Sheet Drawer */}
      <BottomDrawer
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        cardBg={colors.card}
        borderColor={colors.border}
        maxHeight={SCREEN_HEIGHT * 0.88}
      >
        {/* Header */}
        <View style={styles.formDrawerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={[
              styles.formHeaderIconCircle,
              { backgroundColor: historyTab === 'leaves' 
                  ? (activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1')
                  : (activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5')
              }
            ]}>
              <Ionicons 
                name={historyTab === 'leaves' ? "document-text" : "log-out"} 
                size={22} 
                color={historyTab === 'leaves' ? colors.teal : "#F97316"} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formDrawerTitle, { color: colors.textMain }]}>
                Riwayat Perizinan & Presensi
              </Text>
              <Text style={[styles.formDrawerSubtitle, { color: colors.textMuted }]}>
                {employeeData?.name || 'Pegawai'} • Cuti & Pulang Cepat
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                fetchLeaveHistory();
                fetchEarlyLeaveHistory();
              }}
              style={[styles.closeIconCircle, { backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color={historyTab === 'leaves' ? colors.teal : "#F97316"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              style={[styles.closeIconCircle, { backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Switcher: Cuti & Izin vs Pulang Cepat */}
        <View style={{
          flexDirection: 'row',
          padding: 4,
          borderRadius: 14,
          backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
          marginBottom: 12,
          gap: 4
        }}>
          <TouchableOpacity
            onPress={() => setHistoryTab('leaves')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 9,
              borderRadius: 11,
              backgroundColor: historyTab === 'leaves' ? (activeTheme === 'dark' ? colors.card : '#FFFFFF') : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: historyTab === 'leaves' ? 0.08 : 0,
              shadowRadius: 2,
              elevation: historyTab === 'leaves' ? 2 : 0,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text" size={15} color={historyTab === 'leaves' ? colors.teal : colors.textMuted} />
            <Text style={{
              fontSize: 12,
              fontWeight: historyTab === 'leaves' ? '800' : '600',
              color: historyTab === 'leaves' ? (activeTheme === 'dark' ? '#fff' : colors.textMain) : colors.textMuted
            }}>
              Cuti & Izin ({leaveHistoryList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setHistoryTab('early_leave')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 9,
              borderRadius: 11,
              backgroundColor: historyTab === 'early_leave' ? (activeTheme === 'dark' ? colors.card : '#FFFFFF') : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: historyTab === 'early_leave' ? 0.08 : 0,
              shadowRadius: 2,
              elevation: historyTab === 'early_leave' ? 2 : 0,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={15} color={historyTab === 'early_leave' ? '#F97316' : colors.textMuted} />
            <Text style={{
              fontSize: 12,
              fontWeight: historyTab === 'early_leave' ? '800' : '600',
              color: historyTab === 'early_leave' ? (activeTheme === 'dark' ? '#fff' : colors.textMain) : colors.textMuted
            }}>
              Pulang Cepat ({earlyLeaveHistoryList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Cuti & Izin Content */}
        {historyTab === 'leaves' && (
          <>
            {/* Filter Pills */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: 'Menunggu' },
                { id: 'approved', label: 'Disetujui' },
                { id: 'rejected', label: 'Ditolak' }
              ].map((f) => {
                const isActive = leaveHistoryFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setLeaveHistoryFilter(f.id as any)}
                    style={[
                      styles.historyFilterTab,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                      isActive && { backgroundColor: activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.25)' : '#CCFBF1', borderColor: colors.teal }
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.historyFilterTabText,
                      { color: colors.textMuted },
                      isActive && { color: colors.teal, fontWeight: '800' }
                    ]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Leaves List */}
            {loadingLeaveHistory ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.teal} />
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>Memuat riwayat pengajuan...</Text>
              </View>
            ) : (() => {
              const filteredList = leaveHistoryList.filter(item => {
                if (leaveHistoryFilter === 'all') return true;
                return item.status?.toLowerCase() === leaveHistoryFilter;
              });

              if (filteredList.length === 0) {
                return (
                  <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="document-text-outline" size={30} color={colors.textMuted} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textMain }}>Belum Ada Riwayat Cuti</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                      {leaveHistoryFilter === 'all'
                        ? 'Anda belum memiliki riwayat pengajuan cuti atau perizinan.'
                        : `Tidak ada pengajuan cuti dengan status "${leaveHistoryFilter}".`}
                    </Text>
                    {leaveHistoryFilter === 'all' && (
                      <TouchableOpacity
                        style={[styles.historyEmptyBtn, { backgroundColor: colors.teal }]}
                        onPress={() => {
                          setShowHistoryModal(false);
                          openLeaveModal('cuti');
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Ajukan Cuti Baru</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }

              return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                  {filteredList.map((item) => {
                    const st = (item.status || 'pending').toLowerCase();
                    const statusConfig = st === 'approved'
                      ? { label: 'Disetujui', color: '#10B981', bg: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7', icon: 'checkmark-circle' }
                      : st === 'rejected'
                        ? { label: 'Ditolak', color: '#EF4444', bg: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', icon: 'close-circle' }
                        : { label: 'Menunggu HR', color: '#F59E0B', bg: activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', icon: 'time' };

                    const ltName = item.leave_type_name || (leaveTypes.find(lt => lt.id === item.leave_type_id)?.name) || 'Cuti';

                    return (
                      <View
                        key={item.id}
                        style={[styles.historyCardItem, { backgroundColor: colors.bg, borderColor: colors.border }]}
                      >
                        {/* Top row: Type & Status */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={[styles.historyTypeDot, { backgroundColor: colors.teal }]} />
                            <Text style={[styles.historyTypeName, { color: colors.textMain }]} numberOfLines={1}>
                              {ltName}
                            </Text>
                          </View>
                          <View style={[styles.historyStatusPill, { backgroundColor: statusConfig.bg }]}>
                            <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                            <Text style={[styles.historyStatusText, { color: statusConfig.color }]}>
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>

                        {/* Date row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>
                            {formatIndonesianDate(item.start_date)} s/d {formatIndonesianDate(item.end_date)}
                          </Text>
                          <View style={[styles.historyDaysBadge, { backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>
                              {item.total_days} Hari
                            </Text>
                          </View>
                        </View>

                        {/* Reason */}
                        {item.reason && (
                          <View style={[styles.historyReasonBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                              "{item.reason}"
                            </Text>
                          </View>
                        )}

                        {/* Karyawan Pengganti (Delegasi) */}
                        {item.delegation_to_name ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <Ionicons name="people-outline" size={13} color={colors.teal} />
                            <Text style={{ fontSize: 11, color: colors.textMuted }}>
                              Pengganti: <Text style={{ fontWeight: '700', color: colors.textMain }}>{item.delegation_to_name}</Text>
                            </Text>
                          </View>
                        ) : null}

                        {/* HR Approval Notes if present */}
                        {item.approval_notes && (
                          <View style={[
                            styles.historyNotesBox,
                            {
                              backgroundColor: st === 'approved'
                                ? (activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4')
                                : (activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'),
                              borderColor: st === 'approved' ? '#10B981' : '#EF4444'
                            }
                          ]}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: st === 'approved' ? '#10B981' : '#EF4444' }}>
                              CATATAN HR:
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textMain, marginTop: 2 }}>
                              {item.approval_notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              );
            })()}
          </>
        )}

        {/* Tab 2: Pulang Cepat Content */}
        {historyTab === 'early_leave' && (
          <>
            {/* Filter Pills for Early Leave */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: 'Menunggu ACC' },
                { id: 'approved', label: 'Disetujui' }
              ].map((f) => {
                const isActive = earlyLeaveFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setEarlyLeaveFilter(f.id as any)}
                    style={[
                      styles.historyFilterTab,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                      isActive && { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.25)' : '#FFEDD5', borderColor: '#F97316' }
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.historyFilterTabText,
                      { color: colors.textMuted },
                      isActive && { color: '#F97316', fontWeight: '800' }
                    ]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Early Leave List */}
            {loadingEarlyLeaveHistory ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>Memuat riwayat pulang cepat...</Text>
              </View>
            ) : (() => {
              const filteredList = earlyLeaveHistoryList.filter(item => {
                const isApproved = item.notes?.includes('Disetujui');
                const isPending = item.notes?.includes('Menunggu ACC') || (!isApproved && (item.status === 'early_leave' || item.status === 'late_early_leave'));

                if (earlyLeaveFilter === 'approved') return isApproved;
                if (earlyLeaveFilter === 'pending') return isPending;
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="log-out-outline" size={30} color={colors.textMuted} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textMain }}>Belum Ada Riwayat Pulang Cepat</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                      {earlyLeaveFilter === 'all'
                        ? 'Anda belum pernah melakukan presensi pulang cepat.'
                        : `Tidak ada riwayat pulang cepat dengan status "${earlyLeaveFilter === 'pending' ? 'Menunggu ACC' : 'Disetujui'}".`}
                    </Text>
                    {earlyLeaveFilter === 'all' && (
                      <TouchableOpacity
                        style={[styles.historyEmptyBtn, { backgroundColor: '#F97316' }]}
                        onPress={() => {
                          setShowHistoryModal(false);
                          openEarlyLeaveModal();
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="log-out" size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Pulang Cepat Hari Ini</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }

              return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                  {filteredList.map((item) => {
                    const isApproved = item.notes?.includes('Disetujui');
                    const isPending = item.notes?.includes('Menunggu ACC') || (!isApproved && (item.status === 'early_leave' || item.status === 'late_early_leave'));

                    const statusConfig = isApproved
                      ? { label: 'Disetujui HR', color: '#10B981', bg: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7', icon: 'checkmark-circle' }
                      : isPending
                        ? { label: 'Menunggu ACC HR', color: '#F59E0B', bg: activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', icon: 'time' }
                        : { label: 'Pulang Cepat', color: '#6366F1', bg: activeTheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF', icon: 'log-out-outline' };

                    // Parse Notes: remove prefix tags and split colleague
                    const rawNotes = item.notes || '';
                    const cleaned = rawNotes
                      .replace('[Pulang Cepat - Menunggu ACC HR]', '')
                      .replace('[Pulang Cepat - Disetujui HR]', '')
                      .replace('[Disetujui HR]', '')
                      .trim();

                    let reasonText = cleaned;
                    let substituteName = '';

                    if (cleaned.includes('• Pengganti:')) {
                      const parts = cleaned.split('• Pengganti:');
                      reasonText = parts[0]?.trim() || '';
                      substituteName = parts[1]?.trim() || '';
                    } else if (cleaned.includes('Pengganti:')) {
                      const parts = cleaned.split('Pengganti:');
                      reasonText = parts[0]?.trim() || '';
                      substituteName = parts[1]?.trim() || '';
                    }

                    const clockOutTime = item.clock_out ? item.clock_out.substring(0, 5) : '--:--';
                    const clockInTime = item.clock_in ? item.clock_in.substring(0, 5) : null;

                    return (
                      <View
                        key={item.id}
                        style={[styles.historyCardItem, { backgroundColor: colors.bg, borderColor: colors.border }]}
                      >
                        {/* Top row: Date & Status Pill */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <View style={[styles.historyTypeDot, { backgroundColor: '#F97316' }]} />
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMain }} numberOfLines={1}>
                              {formatIndonesianDate(item.date)}
                            </Text>
                            {item.work_schedule_name ? (
                              <View style={{ backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>{item.work_schedule_name}</Text>
                              </View>
                            ) : null}
                          </View>

                          <View style={[styles.historyStatusPill, { backgroundColor: statusConfig.bg }]}>
                            <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                            <Text style={[styles.historyStatusText, { color: statusConfig.color }]}>
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>

                        {/* Clock In / Out Time Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons name="log-out" size={14} color="#F97316" />
                            <Text style={{ fontSize: 12, color: colors.textMuted }}>
                              Jam Checkout: <Text style={{ fontWeight: '800', color: '#F97316' }}>{clockOutTime} WIB</Text>
                            </Text>
                          </View>

                          {clockInTime && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Ionicons name="log-in-outline" size={14} color={colors.textMuted} />
                              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                Masuk: <Text style={{ fontWeight: '700', color: colors.textMain }}>{clockInTime}</Text>
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Reason / Alasan Box */}
                        {reasonText ? (
                          <View style={[styles.historyReasonBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                              "{reasonText}"
                            </Text>
                          </View>
                        ) : null}

                        {/* Karyawan Pengganti Badge */}
                        {substituteName ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
                            <Ionicons name="people-outline" size={13} color="#F97316" />
                            <Text style={{ fontSize: 11, color: colors.textMuted }}>
                              Pengganti: <Text style={{ fontWeight: '700', color: colors.textMain }}>{substituteName}</Text>
                            </Text>
                          </View>
                        ) : null}

                        {/* Verification Status Banner */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 8,
                          paddingVertical: 5,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: isApproved
                            ? (activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4')
                            : (activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7')
                        }}>
                          <Ionicons 
                            name={isApproved ? "checkmark-done-circle" : "hourglass-outline"} 
                            size={13} 
                            color={isApproved ? '#10B981' : '#F59E0B'} 
                          />
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: isApproved ? '#10B981' : '#D97706'
                          }}>
                            {isApproved
                              ? 'Disetujui HR — Presensi pulang awal telah terverifikasi resmi.'
                              : 'Menunggu ACC HR — Menunggu tinjauan & persetujuan manajemen HR.'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              );
            })()}
          </>
        )}
      </BottomDrawer>

      {/* Modal Pulang Cepat - Full Width Bottom Sheet Drawer */}
      <BottomDrawer
        visible={showEarlyLeaveModal}
        onClose={() => setShowEarlyLeaveModal(false)}
        cardBg={colors.card}
        borderColor={colors.border}
      >
        <View style={styles.formDrawerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={[
              styles.formHeaderIconCircle,
              { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5' }
            ]}>
              <Ionicons name="log-out" size={24} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formDrawerTitle, { color: colors.textMain }]}>Presensi Pulang Cepat</Text>
              <Text style={[styles.formDrawerSubtitle, { color: colors.textMuted }]}>
                Checkout sebelum jam shift berakhir
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowEarlyLeaveModal(false)}
            style={[styles.closeIconCircle, { backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={[styles.earlyLeaveDescText, { color: colors.textMuted }]}>
            Shift kerja Anda hari ini belum selesai. Melakukan checkout sekarang akan otomatis tercatat sebagai "Pulang Awal / Pulang Cepat" oleh sistem HR.
          </Text>

          {/* Summary Shift Card */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="time-outline" size={16} color="#F97316" />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Informasi Shift Hari Ini</Text>
            </View>

            <View style={styles.earlySummaryRow}>
              <Text style={[styles.earlySummaryLabel, { color: colors.textMuted }]}>Jam Masuk Hari Ini:</Text>
              <Text style={[styles.earlySummaryValue, { color: colors.textMain }]}>
                {attendanceData[todayString]?.clockIn || '08:00 WIB'}
              </Text>
            </View>

            <View style={[styles.earlySummaryDivider, { backgroundColor: colors.border }]} />

            <View style={styles.earlySummaryRow}>
              <Text style={[styles.earlySummaryLabel, { color: colors.textMuted }]}>Jadwal Pulang Shift:</Text>
              <Text style={[styles.earlySummaryValue, { color: colors.textMain }]}>17:00 WIB</Text>
            </View>

            <View style={[styles.earlySummaryDivider, { backgroundColor: colors.border }]} />

            <View style={styles.earlySummaryRow}>
              <Text style={[styles.earlySummaryLabel, { color: colors.textMuted }]}>Status Presensi:</Text>
              <View style={{ backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#F97316' }}>Pulang Lebih Awal</Text>
              </View>
            </View>
          </View>

          {/* Quick Reason Options for Early Leave */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="chatbox-ellipses-outline" size={16} color="#F97316" />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Alasan Pulang Lebih Awal</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
              {['Urusan Keluarga Mendesak', 'Kondisi Badan Kurang Sehat', 'Tugas Luar Kantor / Dinas', 'Keperluan Medis'].map((rs, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => setEarlyLeaveReason(rs)}
                  style={[
                    styles.quickSuggChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    earlyLeaveReason === rs && { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.25)' : '#FFEDD5', borderColor: '#F97316' }
                  ]}
                >
                  <Text style={{ fontSize: 11, color: earlyLeaveReason === rs ? '#EA580C' : colors.textMuted, fontWeight: earlyLeaveReason === rs ? '700' : '500' }}>
                    + {rs}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.textAreaBox, { backgroundColor: colors.card, color: colors.textMain, borderColor: colors.border, minHeight: 64 }]}
              value={earlyLeaveReason}
              onChangeText={setEarlyLeaveReason}
              placeholder="Ketik alasan atau catatan kepulangan awal..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Rekan Pengganti / Pelimpahan Shift */}
          <View style={[styles.drawerCardSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.drawerSectionHead}>
              <Ionicons name="people-outline" size={16} color="#F97316" />
              <Text style={[styles.drawerSectionLabel, { color: colors.textMain }]}>Rekan Pengganti / Pelimpahan Shift</Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, marginBottom: 8 }}>
              Pilih rekan kerja yang menerima pelimpahan shift / tugas Anda (Opsional).
            </Text>

            <TouchableOpacity
              style={[
                styles.selectTriggerBox,
                { backgroundColor: colors.card, borderColor: isEarlyDelegationOpen ? '#F97316' : colors.border }
              ]}
              onPress={() => setIsEarlyDelegationOpen(!isEarlyDelegationOpen)}
              activeOpacity={0.8}
            >
              {(() => {
                const selCol = colleagues.find(c => c.id === earlyLeaveDelegationId);
                return (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.selectIconBadge, { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5' }]}>
                        <Ionicons name="person" size={16} color="#F97316" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.selectBoxText,
                          { color: selCol ? colors.textMain : colors.textMuted, fontWeight: selCol ? '700' : '500' }
                        ]}>
                          {selCol ? selCol.name : 'Pilih Rekan Pengganti (Opsional)...'}
                        </Text>
                        {selCol?.position ? (
                          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                            {selCol.position} {selCol.employee_id ? `• NIP: ${selCol.employee_id}` : ''}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {selCol ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setEarlyLeaveDelegationId(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ) : (
                      <Ionicons
                        name={isEarlyDelegationOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isEarlyDelegationOpen ? '#F97316' : colors.textMuted}
                      />
                    )}
                  </>
                );
              })()}
            </TouchableOpacity>

            {isEarlyDelegationOpen && (
              <View style={[styles.dropdownListContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => {
                    setEarlyLeaveDelegationId(null);
                    setIsEarlyDelegationOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>Tanpa Rekan Pengganti</Text>
                  {earlyLeaveDelegationId === null && <Ionicons name="checkmark-circle" size={18} color="#F97316" />}
                </TouchableOpacity>

                {(() => {
                  const filtered = colleagues.filter(c => {
                    if (employeeId && c.id === employeeId) return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <View style={{ padding: 14, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {colleagues.length === 0 ? 'Memuat daftar rekan kerja...' : 'Rekan kerja tidak ditemukan'}
                        </Text>
                      </View>
                    );
                  }

                  return filtered.slice(0, 15).map((col, idx) => {
                    const isColSel = col.id === earlyLeaveDelegationId;
                    return (
                      <TouchableOpacity
                        key={col.id}
                        style={[
                          styles.dropdownItem,
                          idx < Math.min(filtered.length, 15) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          isColSel && { backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED' }
                        ]}
                        onPress={() => {
                          setEarlyLeaveDelegationId(col.id);
                          setIsEarlyDelegationOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemText, { color: isColSel ? '#F97316' : colors.textMain, fontWeight: isColSel ? '800' : '600' }]}>
                            {col.name}
                          </Text>
                          {col.position ? (
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                              {col.position} {col.employee_id ? `• ${col.employee_id}` : ''}
                            </Text>
                          ) : null}
                        </View>
                        {isColSel && (
                          <Ionicons name="checkmark-circle" size={18} color="#F97316" />
                        )}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            )}
          </View>

          {/* Action Gradient Button */}
          <TouchableOpacity
            style={styles.earlyLeaveActionWrapper}
            activeOpacity={0.88}
            onPress={() => {
              setShowEarlyLeaveModal(false);
              const selCol = colleagues.find(c => c.id === earlyLeaveDelegationId);
              const noteParts: string[] = [];
              if (earlyLeaveReason.trim()) noteParts.push(earlyLeaveReason.trim());
              if (selCol) noteParts.push(`Pengganti: ${selCol.name}`);
              router.push({
                pathname: '/(tabs)/action',
                params: noteParts.length > 0 ? { earlyNotes: noteParts.join(' • ') } : {}
              });
            }}
          >
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.earlyLeaveActionBtn}
            >
              <Ionicons name="camera" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.earlyLeaveActionBtnText}>Buka Kamera & Presensi Pulang</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 14, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderRadius: 12, backgroundColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED', borderWidth: 1, borderColor: activeTheme === 'dark' ? 'rgba(249, 115, 22, 0.3)' : '#FFEDD5' }}
            onPress={() => {
              setShowEarlyLeaveModal(false);
              openUnifiedHistoryModal('early_leave');
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="time-outline" size={16} color="#F97316" />
            <Text style={{ fontSize: 13, color: '#F97316', fontWeight: '700' }}>Lihat Riwayat Pulang Cepat Saya</Text>
            <Ionicons name="chevron-forward" size={14} color="#F97316" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 10, paddingVertical: 8, alignItems: 'center' }}
            onPress={() => setShowEarlyLeaveModal(false)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600' }}>Batal</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomDrawer>

      {/* Styled Custom Alert Notification Toast */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_MAIN,
  },
  userRole: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  userOrg: {
    fontSize: 11,
    color: TEAL,
    fontWeight: '600',
    marginTop: 1,
  },
  dateToggleBtn: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateToggleBtnActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  dateText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_MAIN,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    backgroundColor: WHITE,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: WHITE,
  },
  badgeText: {
    color: WHITE,
    fontSize: 8,
    fontWeight: 'bold',
  },
  attendanceCard: {
    backgroundColor: WHITE,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  attendanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  attendanceDateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4.5,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  clockItem: {
    flex: 1,
    alignItems: 'center',
  },
  clockIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  clockLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 4,
  },
  clockTime: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_MAIN,
    letterSpacing: -0.5,
  },
  clockDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#F1F5F9',
  },
  noDataWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 8,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: WHITE,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 16,
  },

  /* Center Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalDismissArea: {
    flex: 1,
  },
  centerModalContainer: {
    width: '92%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.15)',
  },
  drawerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeDrawerActionBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDrawerActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Executive Quick Action Hub Styles */
  actionHubContainer: {
    marginTop: 18,
    marginBottom: 8,
  },
  actionHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  actionHubTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  actionHubSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  actionHubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionHubBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hubCard: {
    width: '48.2%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  hubCardGradient: {
    padding: 14,
    flex: 1,
  },
  hubCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hubIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubPillTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hubPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  hubCardDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginBottom: 12,
  },
  hubCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.1)',
  },
  hubActionText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Full Width Bottom Sheet Styles */
  modalRootContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  animatedDrawerWrapper: {
    width: '100%',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    width: '100%',
    padding: 0,
    margin: 0,
  },
  bottomSheetDismissArea: {
    flex: 1,
    width: '100%',
  },
  formDrawerContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sheetDragBar: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  dragHandlePill: {
    width: 48,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  formDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  formHeaderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDrawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  formDrawerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  selectIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBoxText: {
    fontSize: 13,
  },
  dropdownListContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 13,
  },
  codeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drawerCardSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  drawerSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  drawerSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateInputBox: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  fieldMiniLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateInputField: {
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
  },
  presetDayBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  presetDayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.12)',
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  stepperValueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickSuggChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  textAreaBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 74,
    textAlignVertical: 'top',
  },
  phoneInputBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginTop: 6,
  },
  submitGradientWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#0A7973',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitGradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 18,
  },
  submitGradientBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  earlyLeaveDescText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    fontWeight: '500',
  },
  earlySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  earlySummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  earlySummaryValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  earlySummaryDivider: {
    height: 1,
    marginVertical: 6,
  },
  earlyLeaveActionWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  earlyLeaveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  earlyLeaveActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  historyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  historyActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  historyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  historyFilterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  historyFilterTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyCardItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  historyTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyTypeName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  historyStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyDaysBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  historyReasonBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  historyNotesBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  historyEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
});
