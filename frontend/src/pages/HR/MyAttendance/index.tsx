import React, { useEffect, useState, useRef } from 'react';
import HrLayout from '@/layouts/hr-layout';
import { useAuth } from '@/contexts/AuthContext';
import api, { getApiUrl } from '@/lib/api';
import { toast } from 'sonner';
import {
  Clock,
  MapPin,
  Camera,
  LogIn,
  LogOut,
  Zap,
  QrCode,
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Eye,
  User,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Info,
  Building,
  Check,
  XCircle,
  Briefcase,
  FileText,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import { QRScanner } from '@/components/attendance/QRScanner';
import { cn } from '@/lib/utils';

interface WorkLocation {
  id: number;
  name: string;
  latitude: float64;
  longitude: float64;
  radius: number;
}

type float64 = number;

const DAY_NAMES = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Real-time Live Clock Badge (Isolated component to prevent re-rendering the entire 2800-line portal every second)
const LiveClockBadge = React.memo(function LiveClockBadge() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="flex items-center justify-between sm:justify-end gap-2.5 px-3.5 py-2 rounded-xl border bg-card text-xs shadow-2xs font-mono w-full sm:w-auto">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-bold text-foreground text-sm tracking-wider">{formatClock(time)}</span>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">WIB</span>
      </div>
      <span className="text-muted-foreground font-sans text-xs border-l border-border/80 pl-2.5">
        {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
});

export default function MyAttendancePortal() {
  const { user } = useAuth();

  // Employee details
  const [employee, setEmployee] = useState<any>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);

  // Today's Attendance State
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [todayAttendances, setTodayAttendances] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [todayStatusInfo, setTodayStatusInfo] = useState<any>(null);
  const [isLoadingToday, setIsLoadingToday] = useState(true);

  // GPS & Geofence State
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Mencari lokasi GPS...');
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean | null>(null);
  const [closestDistance, setClosestDistance] = useState<number | null>(null);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isMockDetected, setIsMockDetected] = useState<boolean>(false);
  const [mockReason, setMockReason] = useState<string>('');
  const lastLocationRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);

  // History Tab & Filter State
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'profile'>('attendance');
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceTotal, setAttendanceTotal] = useState<number>(0);
  const [attendancePage, setAttendancePage] = useState<number>(1);
  const [attendancePerPage] = useState<number>(10);
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);

  // Jadwal Kerja & Skor Disiplin States
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date>(new Date());
  const [scheduleCenterDate, setScheduleCenterDate] = useState<Date>(new Date());
  const [disciplineMonthDate, setDisciplineMonthDate] = useState<Date>(new Date());
  const [allAttendances, setAllAttendances] = useState<any[]>([]);

  // Leave History & Form State
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState<boolean>(false);

  // Modals State
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [earlyLeaveModalOpen, setEarlyLeaveModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // Action Inputs
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [earlyReason, setEarlyReason] = useState<string>('');
  const [meetingToken, setMeetingToken] = useState<string>('');
  const [meetingMethod, setMeetingMethod] = useState<'scan' | 'manual'>('scan');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Leave Form Inputs
  const [leaveForm, setLeaveForm] = useState({
    leave_type_id: '',
    start_date: new Date().toISOString().substring(0, 10),
    end_date: new Date().toISOString().substring(0, 10),
    reason: '',
    emergency_phone: '',
    delegation_to: '',
  });

  // Haversine formula for client-side geofencing distance check
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Anti-Fake GPS Detection Engine (Clean & Accurate without False Positives)
  const analyzeMockLocation = (
    pos: GeolocationPosition
  ): { isMock: boolean; reason: string } => {
    const c = pos.coords as any;
    const accuracy = c.accuracy;

    // 1. Direct browser / OS mock flag (Android WebView / custom browser flag)
    if (
      c.isMock === true ||
      c.mocked === true ||
      (pos as any).isMock === true ||
      (pos as any).mocked === true
    ) {
      return { isMock: true, reason: 'Aplikasi Mock Location (Fake GPS) terdeteksi aktif pada perangkat.' };
    }

    // 2. Unrealistic zero or negative accuracy
    if (accuracy !== undefined && accuracy !== null && accuracy <= 0) {
      return { isMock: true, reason: 'Akurasi sinyal GPS 0m (injeksi koordinat tiruan).' };
    }

    return { isMock: false, reason: '' };
  };

  // Fetch Geolocation
  const refreshLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung Geolocation.');
      setLocationName('Geolocation tidak didukung browser');
      return;
    }

    // Clear any stale teleportation test data
    try {
      localStorage.removeItem('anti_fake_gps_last_pos');
    } catch {}

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        // Run Anti-Fake GPS Detection
        const mockResult = analyzeMockLocation(pos);
        setIsMockDetected(mockResult.isMock);
        setMockReason(mockResult.reason);

        setCoords({ latitude: userLat, longitude: userLon, accuracy });

        if (mockResult.isMock) {
          toast.error('⚠️ Fake GPS Terdeteksi!', {
            description: mockResult.reason,
          });
        }

        // Compare with work locations
        if (workLocations.length > 0) {
          let minDistance = Infinity;
          let inside = false;
          let nearestLoc = workLocations[0];

          for (const loc of workLocations) {
            const dist = calculateDistance(userLat, userLon, loc.latitude, loc.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearestLoc = loc;
            }
            if (dist <= loc.radius) {
              inside = true;
            }
          }

          setClosestDistance(Math.round(minDistance));
          setIsInsideGeofence(inside);
          if (inside) {
            setLocationName(`Di dalam area: ${nearestLoc.name} (${Math.round(minDistance)}m dari titik pusat)`);
          } else {
            setLocationName(`Di luar radius: ${Math.round(minDistance)}m dari ${nearestLoc.name} (Maks. ${nearestLoc.radius}m)`);
          }
        } else {
          setLocationName(`Koordinat: ${userLat.toFixed(5)}, ${userLon.toFixed(5)}`);
          setIsInsideGeofence(true);
        }

        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = 'Gagal mendeteksi lokasi GPS.';
        if (err.code === 1) msg = 'Izin akses lokasi (GPS) ditolak.';
        else if (err.code === 2) msg = 'Posisi lokasi tidak tersedia.';
        else if (err.code === 3) msg = 'Deteksi lokasi timeout.';
        toast.error(msg);
        setLocationName('Lokasi GPS belum terdeteksi (Izinkan akses lokasi)');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // Initial load: Fetch Employee, Work Locations, Leave Types, Colleagues
  useEffect(() => {
    const initData = async () => {
      if (!user?.id) return;
      setIsLoadingEmployee(true);

      try {
        // 1. Fetch Employee record
        const empRes = await api.get(`/employees/by-user/${user.id}`);
        const emp = empRes.data?.data || empRes.data;
        setEmployee(emp);

        // 2. Fetch Work Locations
        try {
          const locRes = await api.get('/work-locations');
          const locs = locRes.data?.data || locRes.data || [];
          setWorkLocations(Array.isArray(locs) ? locs.filter((l: any) => l.is_active) : []);
        } catch (e) { }

        // 3. Fetch Leave Types
        try {
          const ltRes = await api.get('/leave-types');
          setLeaveTypes(ltRes.data?.data || ltRes.data || []);
        } catch (e) { }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setIsLoadingEmployee(false);
      }
    };

    initData();
  }, [user]);

  // Lazy-fetch colleagues for leave delegation on-demand
  const fetchColleagues = async () => {
    if (colleagues.length > 0) return;
    try {
      const colRes = await api.get('/employees?perPage=100');
      setColleagues(colRes.data?.data || colRes.data || []);
    } catch (e) { }
  };

  // Once work locations are loaded, trigger GPS refresh
  useEffect(() => {
    refreshLocation();
  }, [workLocations]);

  // Fetch Today's Attendance & Shift
  const fetchTodayData = async () => {
    if (!employee?.id) return;
    setIsLoadingToday(true);

    try {
      const todayStr = new Date().toLocaleDateString('en-CA');

      // Check current day attendance
      const res = await api.get(`/attendances?employee_id=${employee.id}&page=1&perPage=50`);
      const allToday = (res.data?.data || []).filter((a: any) => a.date?.substring(0, 10) === todayStr);
      setTodayAttendances(allToday);

      const openSession = allToday.find((a: any) => a.clock_in && !a.clock_out);
      const latestSession = allToday[0] || null;
      setTodayAttendance(openSession || latestSession);

      // Check Roster / Work Schedule for today
      try {
        const rosterRes = await api.get(`/roster-schedules?employee_id=${employee.id}&date=${todayStr}`);
        const rosters = (rosterRes.data?.data || rosterRes.data || []).filter(
          (r: any) => (r.date || '').substring(0, 10) === todayStr
        );
        if (rosters.length > 0) {
          if (openSession?.work_schedule_id) {
            const matched = rosters.find((r: any) => r.work_schedule_id === openSession.work_schedule_id);
            setTodaySchedule(matched || rosters[0]);
          } else {
            const completedWSIds = allToday.filter((a: any) => a.clock_out).map((a: any) => a.work_schedule_id);
            const remaining = rosters.filter((r: any) => !completedWSIds.includes(r.work_schedule_id));
            setTodaySchedule(remaining.length > 0 ? remaining[0] : null);
          }
        } else {
          setTodaySchedule(null);
        }
      } catch (e) {
        setTodaySchedule(null);
      }

      // Check Today's Schedule & Attendance Status from backend
      try {
        const statusRes = await api.get(`/attendances/today-status?employee_id=${employee.id}&date=${todayStr}`);
        const sInfo = statusRes.data?.data || statusRes.data;
        if (sInfo) {
          setTodayStatusInfo(sInfo);
        }
      } catch (e) { }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingToday(false);
    }
  };

  // Fetch Attendance History
  const fetchAttendanceHistory = async () => {
    if (!employee?.id) return;
    setIsLoadingHistory(true);
    try {
      let url = `/attendances?employee_id=${employee.id}&page=${attendancePage}&perPage=${attendancePerPage}`;
      if (attendanceSearch) {
        url += `&search=${encodeURIComponent(attendanceSearch)}`;
      }

      const res = await api.get(url);
      let list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);

      // If allAttendances is empty, sync with list
      setAllAttendances((prev) => (prev.length === 0 && list.length > 0 ? list : prev));

      // Apply client-side filter for tabs if needed
      if (attendanceFilter === 'early_leave') {
        list = list.filter((item: any) => item.status === 'early_leave' || (item.notes && item.notes.includes('Pulang Cepat')));
      } else if (attendanceFilter === 'late') {
        list = list.filter((item: any) => item.status === 'late' || (item.late_minutes && item.late_minutes > 0));
      }

      setAttendanceHistory(list);
      setAttendanceTotal(res.data?.total || list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch Leave History
  const fetchLeaveHistory = async () => {
    if (!employee?.id) return;
    setIsLoadingLeaves(true);
    try {
      const res = await api.get(`/leaves?employee_id=${employee.id}&perPage=50`);
      setLeaveHistory(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeaves(false);
    }
  };

  // Fetch All Attendances for Calendar Strip & Discipline Score
  const fetchAllAttendances = async (empId?: number) => {
    const targetId = empId || employee?.id;
    if (!targetId) return;
    try {
      const res = await api.get(`/attendances?employee_id=${targetId}&page=1&perPage=200`);
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setAllAttendances(list);
    } catch (err) {
      console.error('Failed to load all attendances', err);
    }
  };

  useEffect(() => {
    if (employee?.id) {
      fetchTodayData();
      fetchAttendanceHistory();
      fetchLeaveHistory();
      fetchAllAttendances();
    }
  }, [employee, attendancePage, attendanceFilter]);

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------

  // 1. Handle Check-In Submission
  const handleCheckIn = async () => {
    if (isMockDetected) {
      toast.error('⚠️ Presensi Ditolak: Fake GPS Terdeteksi!', {
        description: mockReason || 'Harap matikan aplikasi Fake GPS / Mock Location terlebih dahulu.',
      });
      return;
    }

    if (!capturedPhoto) {
      toast.error('Harap ambil foto selfie wajah terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const dateStr = now.toLocaleDateString('en-CA');

      const payload: any = {
        employee_id: employee?.id,
        date: dateStr,
        clock_in_time: timeStr,
        photo: capturedPhoto,
        is_mocked: isMockDetected,
      };

      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      if (actionNotes) {
        payload.notes = actionNotes;
      }

      const res = await api.post('/attendances/check-in', payload);

      toast.success('🎉 Presensi Masuk (Check-In) Berhasil Dicatat!');
      setCheckinModalOpen(false);
      setCapturedPhoto('');
      setActionNotes('');
      fetchTodayData();
      fetchAttendanceHistory();
      fetchAllAttendances();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Gagal melakukan check-in.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Check-Out Submission
  const handleCheckOut = async () => {
    if (isMockDetected) {
      toast.error('⚠️ Presensi Ditolak: Fake GPS Terdeteksi!', {
        description: mockReason || 'Harap matikan aplikasi Fake GPS / Mock Location terlebih dahulu.',
      });
      return;
    }

    if (!capturedPhoto) {
      toast.error('Harap ambil foto selfie wajah terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const dateStr = now.toLocaleDateString('en-CA');

      const payload: any = {
        employee_id: employee?.id,
        date: dateStr,
        clock_out_time: timeStr,
        photo: capturedPhoto,
        is_mocked: isMockDetected,
      };

      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      if (actionNotes) {
        payload.notes = actionNotes;
      }

      await api.post('/attendances/check-out', payload);

      toast.success('🎉 Presensi Pulang (Check-Out) Berhasil!');
      setCheckoutModalOpen(false);
      setCapturedPhoto('');
      setActionNotes('');
      fetchTodayData();
      fetchAttendanceHistory();
      fetchAllAttendances();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Gagal melakukan check-out.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Early Leave (Pulang Cepat) Submission
  const handleEarlyLeave = async () => {
    if (isMockDetected) {
      toast.error('⚠️ Pengajuan Ditolak: Fake GPS Terdeteksi!', {
        description: mockReason || 'Harap matikan aplikasi Fake GPS / Mock Location terlebih dahulu.',
      });
      return;
    }

    if (!earlyReason.trim()) {
      toast.error('Alasan pulang cepat wajib diisi.');
      return;
    }
    if (!capturedPhoto) {
      toast.error('Harap ambil foto selfie wajah sebagai bukti kehadiran.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const dateStr = now.toLocaleDateString('en-CA');

      const payload: any = {
        employee_id: employee?.id,
        date: dateStr,
        clock_out_time: timeStr,
        status: 'early_leave',
        notes: `[Pulang Cepat - Menunggu ACC HR] ${earlyReason.trim()}`,
        photo: capturedPhoto,
        is_mocked: isMockDetected,
      };

      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }

      await api.post('/attendances/check-out', payload);

      toast.success('⚡ Pulang Cepat Berhasil Diajukan!', {
        description: 'Pengajuan telah dicatat dan sedang menunggu persetujuan (ACC) HR.',
      });
      setEarlyLeaveModalOpen(false);
      setCapturedPhoto('');
      setEarlyReason('');
      fetchTodayData();
      fetchAttendanceHistory();
      fetchAllAttendances();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Gagal mengajukan pulang cepat.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to extract clean token from URL or raw string
  const extractMeetingToken = (raw: string): string => {
    const text = raw.trim();
    try {
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const url = new URL(text);
        const queryToken = url.searchParams.get('token');
        if (queryToken) return queryToken.trim();
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) return segments[segments.length - 1].trim();
      }
    } catch (e) {
      // fallback
    }
    return text;
  };

  // 4. Handle Meeting Check-In by Token or QR Code
  const handleMeetingCheckin = async (e?: React.FormEvent, overrideToken?: string) => {
    if (e) e.preventDefault();
    const targetToken = (overrideToken || meetingToken || '').trim();
    if (!targetToken) {
      toast.error('Token rapat tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanToken = extractMeetingToken(targetToken);
      const res = await api.post(`/meetings/check-in-by-token?token=${encodeURIComponent(cleanToken)}`, {
        user_id: user?.id,
      });

      toast.success('🎉 Presensi Rapat Berhasil!', {
        description: `Kehadiran Anda pada rapat "${res.data.meeting_title || 'Agenda Rapat'}" telah dicatat.`,
      });
      setMeetingModalOpen(false);
      setMeetingToken('');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Token QR Code rapat tidak valid atau sudah kedaluwarsa.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Leave Request Submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.leave_type_id) {
      toast.error('Pilih jenis cuti/izin.');
      return;
    }
    if (!leaveForm.reason.trim()) {
      toast.error('Alasan cuti/izin wajib diisi.');
      return;
    }

    // Calculate total days
    const start = new Date(leaveForm.start_date);
    const end = new Date(leaveForm.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setIsSubmitting(true);
    try {
      await api.post('/leaves', {
        employee_id: employee?.id,
        leave_type_id: parseInt(leaveForm.leave_type_id),
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        total_days: totalDays > 0 ? totalDays : 1,
        reason: leaveForm.reason.trim(),
        emergency_phone: leaveForm.emergency_phone.trim() || null,
        delegation_to: leaveForm.delegation_to ? parseInt(leaveForm.delegation_to) : null,
        status: 'pending',
      });

      toast.success('Pengajuan Cuti / Izin Berhasil Dikirim!', {
        description: 'Menunggu peninjauan dan persetujuan dari pihak HR.',
      });
      setLeaveModalOpen(false);
      setLeaveForm({
        leave_type_id: '',
        start_date: new Date().toISOString().substring(0, 10),
        end_date: new Date().toISOString().substring(0, 10),
        reason: '',
        emergency_phone: '',
        delegation_to: '',
      });
      fetchLeaveHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal mengirim pengajuan cuti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Styling Configuration
  const statusConfig: Record<string, { label: string; className: string }> = {
    present: { label: 'Hadir', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    late: { label: 'Terlambat', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    early_leave: { label: 'Pulang Cepat', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    late_early_leave: { label: 'Terlambat & Pulang Awal', className: 'bg-rose-100 text-rose-800 border-rose-200' },
    sick: { label: 'Sakit', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    permit: { label: 'Izin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    leave: { label: 'Cuti', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    absent: { label: 'Absen', className: 'bg-red-100 text-red-800 border-red-200' },
  };

  // Helper date formatters
  const formatTime = (t: string | null) => (t ? (t.length >= 5 ? t.substring(0, 5) : t) : '-');
  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      : '-';

  const formatClock = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const hasActiveSession = !!todayAttendance && !!todayAttendance.clock_in && !todayAttendance.clock_out;

  return (
    <HrLayout>
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-5 pb-20">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Dashboard Presensi
              </h1>
              <Badge variant="outline" className="text-[11px] font-normal py-0">
                {employee?.position || 'Karyawan'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selamat datang, <span className="font-semibold text-foreground">{employee ? `${employee.first_name} ${employee.last_name || ''}` : user?.name || 'Pegawai'}</span> • NIK: {employee?.nik || employee?.employee_id || '-'}
            </p>
          </div>

          <LiveClockBadge />
        </div>

        {/* Quick Action Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <Button
            disabled={todayStatusInfo ? (!todayStatusInfo.can_check_in || todayStatusInfo.is_on_leave) : hasActiveSession}
            onClick={() => {
              setCapturedPhoto('');
              setActionNotes('');
              setCheckinModalOpen(true);
              refreshLocation();
            }}
            className={`h-11 text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2 text-white w-full px-2 sm:px-4 min-w-0 ${
              todayStatusInfo?.is_on_leave
                ? 'bg-amber-600/70 dark:bg-amber-800/60 cursor-not-allowed text-white hover:bg-amber-600/70'
                : todayStatusInfo?.is_day_off || todayStatusInfo?.all_completed
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed text-slate-100 hover:bg-slate-400'
                : hasActiveSession
                ? 'bg-emerald-600/60 cursor-not-allowed hover:bg-emerald-600/60'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {todayStatusInfo?.is_on_leave
                ? 'Sedang Cuti'
                : todayStatusInfo?.is_day_off
                ? 'Hari Libur'
                : todayStatusInfo?.all_completed
                ? 'Presensi Hari Ini Selesai'
                : hasActiveSession
                ? 'Sesi Berjalan'
                : todayStatusInfo?.completed_count > 0
                ? 'Masuk Shift Berikutnya'
                : 'Presensi Masuk'}
            </span>
          </Button>

          <Button
            disabled={!hasActiveSession}
            onClick={() => {
              setCapturedPhoto('');
              setActionNotes('');
              setCheckoutModalOpen(true);
              refreshLocation();
            }}
            className="h-11 text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2 bg-rose-600 hover:bg-rose-700 text-white w-full px-2 sm:px-4 min-w-0"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">Presensi Pulang</span>
          </Button>

          <Button
            variant="outline"
            disabled={!hasActiveSession}
            onClick={() => {
              setCapturedPhoto('');
              setEarlyReason('');
              setEarlyLeaveModalOpen(true);
            }}
            className="h-11 text-xs sm:text-sm font-medium gap-1.5 sm:gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 w-full px-2 sm:px-4 min-w-0"
          >
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Pulang Cepat</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setMeetingToken('');
              setMeetingModalOpen(true);
            }}
            className="h-11 text-xs sm:text-sm font-medium gap-1.5 sm:gap-2 w-full px-2 sm:px-4 min-w-0"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span className="truncate">Presensi Rapat</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              fetchColleagues();
              setLeaveModalOpen(true);
            }}
            className="h-11 text-xs sm:text-sm font-medium gap-1.5 sm:gap-2 w-full px-2 sm:px-4 min-w-0"
          >
            <CalendarPlus className="w-4 h-4 shrink-0" />
            <span className="truncate">Ajukan Cuti</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setActiveTab('leaves');
              setHistoryModalOpen(true);
            }}
            className="h-11 text-xs sm:text-sm font-medium gap-1.5 sm:gap-2 border-primary/40 text-primary hover:bg-primary/10 w-full px-2 sm:px-4 min-w-0 shadow-2xs"
          >
            <History className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Pantau Cuti</span>
            {leaveHistory.filter((l: any) => l.status === 'pending').length > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4 ml-0.5">
                {leaveHistory.filter((l: any) => l.status === 'pending').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* 4 Compact Status / KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Clock In */}
          <Card className="p-3 sm:p-3.5 rounded-xl border bg-card shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium truncate">
                <LogIn className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Masuk
              </span>
              {todayAttendance ? (
                <Badge
                  variant="outline"
                  className={statusConfig[todayAttendance.status]?.className || 'text-[10px] py-0 px-1.5'}
                >
                  {statusConfig[todayAttendance.status]?.label || todayAttendance.status}
                </Badge>
              ) : todayStatusInfo?.is_on_leave ? (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  Cuti
                </span>
              ) : todayStatusInfo?.is_day_off ? (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Libur
                </span>
              ) : todayStatusInfo?.all_completed ? (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Selesai
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
                  Belum
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatTime(todayAttendance?.clock_in)}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {todayAttendance?.late_minutes > 0 ? (
                <span className="text-rose-600 font-medium">Terlambat {todayAttendance.late_minutes} mnt</span>
              ) : todayStatusInfo?.is_on_leave ? (
                <span className="text-amber-700 dark:text-amber-300 font-medium font-sans">
                  Sedang Cuti: {todayStatusInfo?.leave_name || 'Cuti'}
                </span>
              ) : todayStatusInfo?.is_day_off ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">Hari ini libur (tidak ada jadwal)</span>
              ) : todayStatusInfo?.all_completed ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Semua shift selesai</span>
              ) : (
                `Shift: ${todayAttendance?.work_schedule_name || todayStatusInfo?.shift_name || todaySchedule?.work_schedule_name || todaySchedule?.name || 'Sesuai Jadwal'}`
              )}
            </div>
          </Card>

          {/* Card 2: Clock Out */}
          <Card className="p-3 sm:p-3.5 rounded-xl border bg-card shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium truncate">
                <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Pulang
              </span>
              {todayAttendance?.status === 'early_leave' && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Pulang Cepat
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatTime(todayAttendance?.clock_out)}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {todayAttendance?.clock_out ? 'Tercatat Selesai' : (todayAttendance?.clock_in ? 'Sedang Bekerja' : todayStatusInfo?.is_day_off ? 'Tidak Bekerja' : '-')}
            </div>
          </Card>

          {/* Card 3: Location / Geofence */}
          <Card className="p-3 sm:p-3.5 rounded-xl border bg-card shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium truncate">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Lokasi GPS
              </span>
              <button
                type="button"
                onClick={refreshLocation}
                disabled={isLocating}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Segarkan GPS"
              >
                <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isInsideGeofence === true ? 'bg-emerald-500' : isInsideGeofence === false ? 'bg-amber-500' : 'bg-slate-400'}`} />
              <span className={`text-xs sm:text-sm font-semibold truncate ${isInsideGeofence === true ? 'text-emerald-700 dark:text-emerald-400' : isInsideGeofence === false ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                {isLocating ? 'Mendeteksi...' : isInsideGeofence === true ? 'Dalam Radius' : isInsideGeofence === false ? 'Luar Radius' : 'Mencari...'}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate" title={locationName}>
              {locationName || 'Mencari sinyal GPS...'}
            </div>
          </Card>

          {/* Card 4: AI Face Status */}
          <Card className="p-3 sm:p-3.5 rounded-xl border bg-card shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Face AI
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${employee?.photo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {employee?.photo ? 'Aktif' : 'Daftar'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                {employee?.photo ? (
                  <img src={employee.photo.startsWith('http') || employee.photo.startsWith('data:') ? employee.photo : getApiUrl(employee.photo)} alt="Face" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <User className="w-3 h-3" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-semibold truncate text-foreground">
                {employee?.photo ? 'Wajah Terdaftar' : 'Siap Didaftarkan'}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {employee?.photo ? 'Model AI Terverifikasi' : 'Selfie untuk mendaftar'}
            </div>
          </Card>
        </div>

        {/* Features: Jadwal Kerja & Skor Disiplin (Sesuai Fitur Gambar 2, Desain Konsisten Dashboard) */}
        {(() => {
          // Robust date parser for DB strings like "YYYY-MM-DD..." or ISO format
          const getAttendanceDateParts = (dateInput: any) => {
            if (!dateInput) return null;
            const str = String(dateInput).substring(0, 10);
            const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) {
              return {
                year: parseInt(match[1], 10),
                month: parseInt(match[2], 10) - 1,
                day: parseInt(match[3], 10),
                key: str,
              };
            }
            const d = new Date(dateInput);
            if (!isNaN(d.getTime())) {
              return {
                year: d.getFullYear(),
                month: d.getMonth(),
                day: d.getDate(),
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
              };
            }
            return null;
          };

          // Combine all sources: allAttendances, attendanceHistory, todayAttendance
          const combinedList: any[] = Array.from(
            new Map(
              [
                ...(todayAttendance ? [todayAttendance] : []),
                ...(attendanceHistory || []),
                ...(allAttendances || []),
              ].map((item: any) => [item.id || item.date, item])
            ).values()
          );

          // Calculation for Jadwal Kerja
          const calendarDays = [-2, -1, 0, 1, 2].map((offset) => {
            const d = new Date(scheduleCenterDate);
            d.setDate(scheduleCenterDate.getDate() + offset);
            return d;
          });

          const selectedDateKey = `${selectedScheduleDate.getFullYear()}-${String(selectedScheduleDate.getMonth() + 1).padStart(2, '0')}-${String(selectedScheduleDate.getDate()).padStart(2, '0')}`;
          const selectedAtt = combinedList.find((a: any) => {
            const p = getAttendanceDateParts(a.date);
            return p && p.key === selectedDateKey;
          });
          const isSelectedDateToday = selectedScheduleDate.toDateString() === new Date().toDateString();

          const getLeaveForDay = (date: Date) => {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return leaveHistory.find((l: any) => {
              if (l.status !== 'approved') return false;
              const start = (l.start_date || '').substring(0, 10);
              const end = (l.end_date || '').substring(0, 10);
              return dateKey >= start && dateKey <= end;
            });
          };

          const selectedLeave = getLeaveForDay(selectedScheduleDate);

          const getDayStatusDot = (date: Date) => {
            const leaveOnDay = getLeaveForDay(date);
            if (leaveOnDay) return 'bg-amber-500';

            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const att = combinedList.find((a: any) => {
              const p = getAttendanceDateParts(a.date);
              return p && p.key === dateKey;
            });
            const isToday = date.toDateString() === new Date().toDateString();

            if (att) {
              if (att.late_minutes > 0 || att.status === 'late') return 'bg-amber-500';
              if (att.status === 'early_leave') return 'bg-orange-500';
              return 'bg-emerald-500';
            }
            if (isToday) {
              if (todayAttendance?.clock_in) return 'bg-emerald-500';
              return 'bg-primary';
            }
            return 'bg-slate-300 dark:bg-slate-700';
          };

          // Calculation for Skor Disiplin
          const targetYear = disciplineMonthDate.getFullYear();
          const targetMonth = disciplineMonthDate.getMonth();

          const monthAttendances = combinedList.filter((a: any) => {
            const p = getAttendanceDateParts(a.date);
            return p && p.year === targetYear && p.month === targetMonth;
          });

          const totalPresent = monthAttendances.length;
          const onTimeCount = monthAttendances.filter(
            (a: any) => (!a.late_minutes || a.late_minutes === 0) && a.status !== 'late'
          ).length;
          const lateCount = monthAttendances.filter(
            (a: any) => (a.late_minutes && a.late_minutes > 0) || a.status === 'late'
          ).length;
          const earlyLeaveCount = monthAttendances.filter(
            (a: any) => a.status === 'early_leave'
          ).length;

          const hasData = totalPresent > 0;
          const scoreValue = hasData
            ? ((onTimeCount / totalPresent) * 100).toFixed(2)
            : '0.00';

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              {/* Card 1: JADWAL KERJA */}
              <Card className="lg:col-span-7 p-4 sm:p-5 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-foreground">
                        Jadwal Kerja
                      </span>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const d = new Date(scheduleCenterDate);
                            d.setDate(d.getDate() - 5);
                            setScheduleCenterDate(d);
                          }}
                          title="5 Hari Sebelumnya"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const d = new Date(scheduleCenterDate);
                            d.setDate(d.getDate() + 5);
                            setScheduleCenterDate(d);
                          }}
                          title="5 Hari Berikutnya"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryModalOpen(true)}
                      className="h-7 sm:h-8 text-xs gap-1.5 px-3 rounded-lg border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                      Riwayat
                    </Button>
                  </div>

                  {/* Horizontal 5-Day Strip */}
                  <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-3">
                    {calendarDays.map((d) => {
                      const dayName = DAY_NAMES[d.getDay()];
                      const dayNum = String(d.getDate()).padStart(2, '0');
                      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      const isSelected = selectedScheduleDate.toDateString() === d.toDateString();
                      const dotColor = getDayStatusDot(d);

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedScheduleDate(d)}
                          className={cn(
                            'flex flex-col items-center justify-center py-2.5 px-1 sm:px-2 rounded-xl border transition-all text-center',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20'
                              : 'bg-muted/30 hover:bg-muted/60 text-foreground border-border/60 hover:border-border'
                          )}
                        >
                          <span
                            className={cn(
                              'text-[10px] sm:text-xs font-semibold tracking-wider uppercase',
                              isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            )}
                          >
                            {dayName}
                          </span>
                          <span
                            className={cn(
                              'text-base sm:text-xl font-bold leading-tight mt-0.5',
                              isSelected ? 'text-primary-foreground' : 'text-foreground'
                            )}
                          >
                            {dayNum}
                          </span>
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                              isSelected ? 'bg-primary-foreground' : dotColor
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Details Card */}
                <div className="p-3 sm:p-3.5 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {selectedScheduleDate.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {isSelectedDateToday ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0">
                        Hari Ini
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                        {selectedScheduleDate > new Date() ? 'Mendatang' : 'Riwayat'}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded-lg bg-card border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Jadwal / Shift</span>
                      <span className="font-semibold text-foreground truncate block mt-0.5">
                        {selectedLeave ? (
                          <span className="text-amber-700 dark:text-amber-300 font-medium">
                            Cuti: {selectedLeave.leave_type_name || 'Cuti Tahunan'} ({selectedLeave.reason || 'Izin Cuti'})
                          </span>
                        ) : isSelectedDateToday ? (
                          todayStatusInfo?.is_on_leave ? (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              Cuti: {todayStatusInfo?.leave_name || 'Cuti'}
                            </span>
                          ) : todayStatusInfo?.is_day_off ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Libur (Tidak Ada Jadwal)</span>
                          ) : (
                            todayAttendance?.work_schedule_name || todayStatusInfo?.shift_name || todaySchedule?.work_schedule_name || 'Shift Terjadwal'
                          )
                        ) : selectedAtt ? (
                          selectedAtt.work_schedule_name || 'Shift Terjadwal'
                        ) : (
                          <span className="text-muted-foreground">Tidak Ada Jadwal / Libur</span>
                        )}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-card border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Jam Masuk</span>
                      <span className="font-semibold text-foreground font-mono block mt-0.5">
                        {selectedLeave ? (
                          <span className="text-xs text-amber-600 font-sans">--:-- (Cuti)</span>
                        ) : selectedAtt?.clock_in
                          ? formatTime(selectedAtt.clock_in)
                          : isSelectedDateToday
                            ? todayAttendance?.clock_in
                              ? formatTime(todayAttendance.clock_in)
                              : todayStatusInfo?.is_on_leave
                                ? '--:-- (Cuti)'
                                : todayStatusInfo?.is_day_off
                                ? '--:--'
                                : todayStatusInfo?.clock_in_time
                                  ? formatTime(todayStatusInfo.clock_in_time)
                                  : '--:--'
                            : '--:--'}
                        {selectedAtt?.late_minutes > 0 && (
                          <span className="text-[10px] text-amber-600 font-sans block">
                            +{selectedAtt.late_minutes}m terlambat
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-card border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Jam Pulang</span>
                      <span className="font-semibold text-foreground font-mono block mt-0.5">
                        {selectedLeave ? (
                          <span className="text-xs text-amber-600 font-sans">--:-- (Cuti)</span>
                        ) : selectedAtt?.clock_out
                          ? formatTime(selectedAtt.clock_out)
                          : isSelectedDateToday
                            ? todayAttendance?.clock_out
                              ? formatTime(todayAttendance.clock_out)
                              : todayStatusInfo?.is_on_leave
                                ? '--:-- (Cuti)'
                                : todayStatusInfo?.is_day_off
                                ? '--:--'
                                : todayStatusInfo?.clock_out_time
                                  ? formatTime(todayStatusInfo.clock_out_time)
                                  : '--:--'
                            : '--:--'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 2: SKOR DISIPLIN */}
              <Card className="lg:col-span-5 p-4 sm:p-5 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-foreground">
                      Skor Disiplin
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const d = new Date(disciplineMonthDate);
                          d.setMonth(d.getMonth() - 1);
                          setDisciplineMonthDate(d);
                        }}
                        title="Bulan Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const d = new Date(disciplineMonthDate);
                          d.setMonth(d.getMonth() + 1);
                          setDisciplineMonthDate(d);
                        }}
                        title="Bulan Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Circular Indicator & Score */}
                  <div className="flex items-center gap-4 sm:gap-5 py-3">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted/30"
                          strokeWidth="3.2"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {hasData && parseFloat(scoreValue) > 0 && (
                          <path
                            className={cn(
                              "transition-all duration-700 ease-out",
                              parseFloat(scoreValue) >= 80
                                ? "text-emerald-500"
                                : parseFloat(scoreValue) >= 50
                                  ? "text-amber-500"
                                  : "text-rose-500"
                            )}
                            strokeDasharray={`${Math.min(100, Math.max(0, parseFloat(scoreValue)))}, 100`}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border",
                            !hasData
                              ? "bg-muted text-muted-foreground border-border"
                              : parseFloat(scoreValue) >= 80
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800/40"
                                : parseFloat(scoreValue) >= 50
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-800/40"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-800/40"
                          )}
                        >
                          {!hasData ? (
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          ) : parseFloat(scoreValue) >= 80 ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                        {hasData ? `${scoreValue}%` : '0.00%'}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {MONTH_NAMES[disciplineMonthDate.getMonth()]} {disciplineMonthDate.getFullYear()}
                      </div>
                      <div className="text-[11px] pt-0.5">
                        {!hasData ? (
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> Belum Ada Data Presensi
                          </span>
                        ) : parseFloat(scoreValue) >= 95 ? (
                          <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Sangat Disiplin
                          </span>
                        ) : parseFloat(scoreValue) >= 80 ? (
                          <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Disiplin Baik
                          </span>
                        ) : parseFloat(scoreValue) >= 50 ? (
                          <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Cukup Disiplin
                          </span>
                        ) : (
                          <span className="text-rose-600 font-medium inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Perlu Evaluasi Disiplin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Stats Breakdown */}
                <div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50 text-center">
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="text-[10px] text-muted-foreground font-medium">Hadir</div>
                      <div className="text-sm font-bold text-foreground mt-0.5">
                        {totalPresent} <span className="text-[10px] font-normal text-muted-foreground">hari</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="text-[10px] text-muted-foreground font-medium">Tepat Waktu</div>
                      <div className="text-sm font-bold text-emerald-600 mt-0.5">
                        {onTimeCount} <span className="text-[10px] font-normal text-muted-foreground">hari</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="text-[10px] text-muted-foreground font-medium">Terlambat</div>
                      <div className="text-sm font-bold text-amber-600 mt-0.5">
                        {lateCount} <span className="text-[10px] font-normal text-muted-foreground">kali</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center pt-2">
                    {hasData
                      ? `Perhitungan: (${onTimeCount} tepat waktu / ${totalPresent} total hadir) × 100%`
                      : `Belum ada riwayat kehadiran tercatat pada ${MONTH_NAMES[disciplineMonthDate.getMonth()]} ${disciplineMonthDate.getFullYear()}`}
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Modal Dialog: Aktivitas & Riwayat Pegawai (Riwayat Absensi, Cuti & Profil) */}
        <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border shadow-xl bg-card">
            {/* Header & Tabs */}
            <div className="border-b bg-muted/40 p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <History className="w-5 h-5 text-primary shrink-0" />
                    <span>Aktivitas & Riwayat Pegawai</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Catatan kehadiran harian, permohonan cuti, dan profil data kepegawaian Anda.
                  </DialogDescription>
                </div>

                {/* Modern Responsive Tabs Switcher */}
                <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab('attendance')}
                    className={cn(
                      'py-1.5 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
                      activeTab === 'attendance'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">Absensi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('leaves')}
                    className={cn(
                      'py-1.5 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
                      activeTab === 'leaves'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Cuti & Izin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={cn(
                      'py-1.5 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
                      activeTab === 'profile'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Profil</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar (Attendance Tab) */}
              {activeTab === 'attendance' && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-primary" /> Filter:
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('all')}
                      className={cn(
                        'text-xs px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer',
                        attendanceFilter === 'all'
                          ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('early_leave')}
                      className={cn(
                        'text-xs px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer',
                        attendanceFilter === 'early_leave'
                          ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-2xs'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      Pulang Cepat
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('late')}
                      className={cn(
                        'text-xs px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer',
                        attendanceFilter === 'late'
                          ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-2xs'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      Terlambat
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Cari catatan / tanggal..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchAttendanceHistory()}
                      className="h-8.5 text-xs pl-8 pr-3 rounded-xl bg-card border-border/70"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-0">
              {activeTab === 'attendance' && (
                <div>
                  {/* Loading State */}
                  {isLoadingHistory && (
                    <div className="py-14 text-center text-muted-foreground space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs">Memuat data riwayat absensi...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingHistory && attendanceHistory.length === 0 && (
                    <div className="py-14 text-center text-muted-foreground space-y-2">
                      <Calendar className="w-9 h-9 mx-auto text-muted-foreground/40" />
                      <p className="text-xs font-medium">Belum ada data absensi yang ditemukan.</p>
                      <p className="text-[11px] text-muted-foreground/80">Coba ubah kata kunci pencarian atau filter.</p>
                    </div>
                  )}

                  {/* MOBILE VIEW: Modern Cards (Visible on screens < 768px) */}
                  {!isLoadingHistory && attendanceHistory.length > 0 && (
                    <div className="block md:hidden p-3 space-y-2.5 bg-muted/20">
                      {attendanceHistory.map((row: any) => {
                        const isEarly =
                          row.status === 'early_leave' ||
                          (row.notes && row.notes.includes('Pulang Cepat'));
                        const isAcc = row.notes && row.notes.includes('Disetujui HR');

                        return (
                          <div
                            key={row.id}
                            className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2.5 transition-all hover:border-primary/40"
                          >
                            {/* Card Top: Date & Status Badge */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{formatDate(row.date)}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={statusConfig[row.status]?.className || 'text-[10px] py-0 px-1.5'}
                              >
                                {statusConfig[row.status]?.label || row.status}
                              </Badge>
                            </div>

                            {/* Card Middle: Clock In & Clock Out Times */}
                            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-xl text-xs">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <LogIn className="w-3 h-3 text-emerald-600 shrink-0" /> Masuk
                                </span>
                                <span className="font-mono font-bold text-foreground text-sm block">
                                  {formatTime(row.clock_in)}
                                </span>
                                {row.late_minutes > 0 && (
                                  <span className="text-[10px] text-rose-600 font-medium inline-block bg-rose-50 dark:bg-rose-950/40 px-1 rounded">
                                    +{row.late_minutes}m terlambat
                                  </span>
                                )}
                              </div>

                              <div className="space-y-0.5 border-l border-border/60 pl-2">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <LogOut className="w-3 h-3 text-rose-600 shrink-0" /> Pulang
                                </span>
                                <span className="font-mono font-bold text-foreground text-sm block">
                                  {formatTime(row.clock_out)}
                                </span>
                                {isEarly && (
                                  <span className="text-[10px] text-amber-700 font-medium inline-block bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                                    Pulang Cepat
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Bottom: Shift, Notes & Detail button */}
                            <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                              <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 max-w-[200px]">
                                <Briefcase className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                <span className="truncate">{row.work_schedule_name || 'Reguler'}</span>
                              </span>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDetail(row);
                                  setDetailModalOpen(true);
                                }}
                                className="h-7 text-xs px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </Button>
                            </div>

                            {/* Optional Notes Pill */}
                            {row.notes && (
                              <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40 space-y-1">
                                <p className="line-clamp-2">{row.notes}</p>
                                {isEarly && (
                                  <span
                                    className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                      isAcc
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                    }`}
                                  >
                                    {isAcc ? '✓ Disetujui HR' : '⏳ Menunggu ACC HR'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* DESKTOP VIEW: High-Density Table (Visible on screens >= 768px) */}
                  {!isLoadingHistory && attendanceHistory.length > 0 && (
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/40 text-muted-foreground font-semibold border-b">
                            <th className="py-3 px-4">Tanggal</th>
                            <th className="py-3 px-4">Shift / Jadwal</th>
                            <th className="py-3 px-4">Jam Masuk</th>
                            <th className="py-3 px-4">Jam Pulang</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Catatan & Keterangan</th>
                            <th className="py-3 px-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {attendanceHistory.map((row: any) => {
                            const isEarly =
                              row.status === 'early_leave' ||
                              (row.notes && row.notes.includes('Pulang Cepat'));
                            const isAcc = row.notes && row.notes.includes('Disetujui HR');

                            return (
                              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                                  {formatDate(row.date)}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">
                                  {row.work_schedule_name || '-'}
                                </td>
                                <td className="py-3 px-4 font-mono font-medium text-foreground">
                                  {formatTime(row.clock_in)}
                                  {row.late_minutes > 0 && (
                                    <span className="block text-[10px] text-amber-600 font-sans font-normal">
                                      +{row.late_minutes}m terlambat
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono font-medium text-foreground">
                                  {formatTime(row.clock_out)}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant="outline"
                                    className={statusConfig[row.status]?.className || 'bg-muted text-muted-foreground'}
                                  >
                                    {statusConfig[row.status]?.label || row.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                                  {row.notes ? (
                                    <div className="space-y-0.5">
                                      <span className="block truncate text-foreground">{row.notes}</span>
                                      {isEarly && (
                                        <span
                                          className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                            isAcc
                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                          }`}
                                        >
                                          {isAcc ? '✓ Disetujui HR' : '⏳ Menunggu ACC HR'}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDetail(row);
                                      setDetailModalOpen(true);
                                    }}
                                    className="h-7 text-xs px-2.5 rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1 text-muted-foreground" /> Detail
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Clean Responsive Pagination Bar */}
                  <div className="p-3 sm:px-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground">
                    <span className="text-[11px] sm:text-xs">
                      Menampilkan <strong className="text-foreground">{attendanceHistory.length}</strong> dari{' '}
                      <strong className="text-foreground">{attendanceTotal}</strong> data
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={attendancePage <= 1}
                        onClick={() => setAttendancePage((p) => Math.max(1, p - 1))}
                        className="h-7.5 text-xs px-2.5 rounded-lg"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Sebelumnya
                      </Button>
                      <span className="px-2.5 py-1 rounded-md bg-card border font-mono font-semibold text-foreground text-xs">
                        Hal {attendancePage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={attendanceHistory.length < attendancePerPage}
                        onClick={() => setAttendancePage((p) => p + 1)}
                        className="h-7.5 text-xs px-2.5 rounded-lg"
                      >
                        Berikutnya <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaves' && (
                <div>
                  {/* Loading State */}
                  {isLoadingLeaves && (
                    <div className="py-14 text-center text-muted-foreground space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs">Memuat data riwayat cuti...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingLeaves && leaveHistory.length === 0 && (
                    <div className="py-14 text-center text-muted-foreground space-y-2">
                      <CalendarPlus className="w-9 h-9 mx-auto text-muted-foreground/40" />
                      <p className="text-xs font-medium">Belum ada pengajuan cuti yang tercatat.</p>
                    </div>
                  )}

                  {/* MOBILE VIEW: Modern Cards for Leaves */}
                  {!isLoadingLeaves && leaveHistory.length > 0 && (
                    <div className="block md:hidden p-3 space-y-2.5 bg-muted/20">
                      {leaveHistory.map((leave: any) => (
                        <div
                          key={leave.id}
                          className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground text-xs">
                              {leave.leave_type_name || `Jenis Cuti #${leave.leave_type_id}`}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                leave.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] py-0'
                                  : leave.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] py-0'
                                  : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] py-0'
                              }
                            >
                              {leave.status === 'approved'
                                ? 'Disetujui'
                                : leave.status === 'rejected'
                                ? 'Ditolak'
                                : 'Menunggu Approval'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg">
                            <span className="text-muted-foreground text-[11px]">
                              {formatDate(leave.start_date)} s/d {formatDate(leave.end_date)}
                            </span>
                            <span className="font-bold text-foreground text-xs bg-card px-2 py-0.5 rounded border border-border/60">
                              {leave.total_days} Hari
                            </span>
                          </div>

                          {leave.reason && (
                            <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded border border-border/40">
                              Alasan: {leave.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DESKTOP VIEW: Leaves Table */}
                  {!isLoadingLeaves && leaveHistory.length > 0 && (
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/40 text-muted-foreground font-semibold border-b">
                            <th className="py-3 px-4">Jenis Cuti / Izin</th>
                            <th className="py-3 px-4">Mulai</th>
                            <th className="py-3 px-4">Selesai</th>
                            <th className="py-3 px-4 text-center">Total Hari</th>
                            <th className="py-3 px-4">Alasan</th>
                            <th className="py-3 px-4">Status Approval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {leaveHistory.map((leave: any) => (
                            <tr key={leave.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 font-semibold text-foreground">
                                {leave.leave_type_name || `Jenis Cuti #${leave.leave_type_id}`}
                              </td>
                              <td className="py-3 px-4 text-foreground whitespace-nowrap">
                                {formatDate(leave.start_date)}
                              </td>
                              <td className="py-3 px-4 text-foreground whitespace-nowrap">
                                {formatDate(leave.end_date)}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-foreground">
                                {leave.total_days} Hari
                              </td>
                              <td className="py-3 px-4 text-muted-foreground max-w-sm truncate">
                                {leave.reason || '-'}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={
                                    leave.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                      : leave.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                                      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                  }
                                >
                                  {leave.status === 'approved'
                                    ? 'Disetujui'
                                    : leave.status === 'rejected'
                                    ? 'Ditolak'
                                    : 'Menunggu Approval'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Data Pribadi */}
                    <div className="p-4 rounded-xl border bg-card space-y-3">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm pb-2 border-b">
                        <User className="w-4 h-4" /> Data Pribadi
                      </div>
                      <dl className="space-y-2.5 text-xs">
                        <div>
                          <dt className="text-muted-foreground font-medium">Nama Lengkap</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.first_name} {employee?.last_name || ''}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">NIK / NIP</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.nik || employee?.employee_id || user?.nip || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Jenis Kelamin</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.gender === 'M' ? 'Laki-laki' : (employee?.gender === 'F' ? 'Perempuan' : '-')}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Tempat, Tanggal Lahir</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.place_of_birth || '-'}, {employee?.date_of_birth ? employee.date_of_birth.substring(0, 10) : '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Agama</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.religion || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Status Perkawinan</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.marital_status || '-'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Data Pekerjaan */}
                    <div className="p-4 rounded-xl border bg-card space-y-3">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm pb-2 border-b">
                        <Briefcase className="w-4 h-4" /> Data Pekerjaan
                      </div>
                      <dl className="space-y-2.5 text-xs">
                        <div>
                          <dt className="text-muted-foreground font-medium">Jabatan</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.position || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Unit Organisasi</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.organization_unit?.name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Kategori Pekerjaan</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.job_category?.name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Status Kepegawaian</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.employment_status?.name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Shift / Jadwal Aktif</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{todaySchedule?.work_schedule_name || 'Reguler'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Tanggal Masuk</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.join_date ? employee.join_date.substring(0, 10) : '-'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Kontak & Dokumen */}
                    <div className="p-4 rounded-xl border bg-card space-y-3">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm pb-2 border-b">
                        <FileText className="w-4 h-4" /> Kontak & Dokumen
                      </div>
                      <dl className="space-y-2.5 text-xs">
                        <div>
                          <dt className="text-muted-foreground font-medium">Email</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.email || (user as any)?.email || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Nomor Telepon</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.phone || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Alamat</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.address || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">NPWP</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.npwp_number || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">BPJS Kesehatan</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.bpjs_kesehatan_number || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">BPJS Ketenagakerjaan</dt>
                          <dd className="font-semibold text-foreground mt-0.5">{employee?.bpjs_ketenagakerjaan_number || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ======================================================= */}
      {/* 1. MODAL PRESENSI MASUK (CHECK-IN) */}
      {/* ======================================================= */}
      <Dialog open={checkinModalOpen} onOpenChange={setCheckinModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-emerald-700">
              <LogIn className="w-5 h-5 text-emerald-600" /> Presensi Masuk (Check-In)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Posisikan wajah Anda pada kamera untuk verifikasi wajah dan validasi lokasi kantor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            {todayStatusInfo?.is_day_off && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Hari ini Anda tercatat <strong>Libur</strong> (tidak memiliki jadwal kerja). Presensi masuk tidak dapat diproses.</span>
              </div>
            )}
            {todayStatusInfo?.all_completed && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Semua sesi jadwal shift presensi Anda untuk hari ini sudah selesai tercatat.</span>
              </div>
            )}

            {/* Live Camera View */}
            <WebcamCapture
              onCapture={(b64) => setCapturedPhoto(b64)}
              onRetake={() => setCapturedPhoto('')}
              initialPhoto={capturedPhoto || null}
            />

            {/* GPS Feedback & Anti-Fake GPS Card */}
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className={`w-4 h-4 shrink-0 ${isInsideGeofence ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <span className="font-semibold text-slate-800 truncate">
                    {isInsideGeofence ? 'Lokasi Valid' : 'Lokasi Terdeteksi'}
                  </span>
                  {/* Anti Fake GPS Status Chip */}
                  {isMockDetected ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                      <ShieldAlert className="w-3 h-3 text-rose-600" /> Fake GPS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> GPS Valid
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshLocation}
                    disabled={isLocating}
                    className="h-7 px-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Segarkan Lokasi GPS"
                  >
                    <RefreshCw className={`w-3 h-3 text-slate-500 ${isLocating ? 'animate-spin text-teal-600' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Location Detail & Accuracy */}
              <div className="bg-white/80 p-2 rounded-lg border border-slate-200/70 text-[11px] text-slate-600 space-y-0.5">
                <div className="truncate font-medium text-slate-700" title={locationName}>
                  {locationName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Akurasi: {coords?.accuracy ? `±${coords.accuracy}m` : '-'}</span>
                  {coords && (
                    <span>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
                  )}
                </div>
              </div>

              {/* Fake GPS Warning Box if detected */}
              {isMockDetected && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-rose-900">Fake GPS / Mock Location Terdeteksi!</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      {mockReason || 'Sistem mendeteksi penggunaan aplikasi manipulasi GPS. Presensi diblokir.'}
                    </div>
                    <div className="text-[10px] text-rose-500 mt-1">
                      Harap matikan "Mock Location" / Fake GPS di Pengaturan Pengembang HP Anda.
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Catatan Masuk (Opsional)</Label>
              <Input
                type="text"
                placeholder="Contoh: Bekerja di unit administrasi..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCheckinModalOpen(false)}
              className="text-xs w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleCheckIn}
              disabled={!capturedPhoto || isSubmitting || isMockDetected || isLocating || todayStatusInfo?.is_day_off || todayStatusInfo?.all_completed}
              className={cn(
                "text-xs font-semibold px-5 w-full sm:w-auto",
                isMockDetected
                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-not-allowed opacity-90"
                  : todayStatusInfo?.is_day_off || todayStatusInfo?.all_completed
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {isMockDetected ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Fake GPS Terdeteksi
                </>
              ) : isLocating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Validasi GPS...
                </>
              ) : isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Memverifikasi...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Konfirmasi Masuk
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* 2. MODAL PRESENSI PULANG (CHECK-OUT) */}
      {/* ======================================================= */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-blue-700">
              <LogOut className="w-5 h-5 text-blue-600" /> Presensi Pulang (Check-Out)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ambil foto selfie untuk menyelesaikan jam kerja Anda hari ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <WebcamCapture
              onCapture={(b64) => setCapturedPhoto(b64)}
              onRetake={() => setCapturedPhoto('')}
              initialPhoto={capturedPhoto || null}
            />

            {/* GPS Feedback & Anti-Fake GPS Card */}
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">
                    {isInsideGeofence ? 'Lokasi Valid' : 'Lokasi Terdeteksi'}
                  </span>
                  {/* Anti Fake GPS Status Chip */}
                  {isMockDetected ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                      <ShieldAlert className="w-3 h-3 text-rose-600" /> Fake GPS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> GPS Valid
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshLocation}
                    disabled={isLocating}
                    className="h-7 px-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Segarkan Lokasi GPS"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Location Detail & Accuracy */}
              <div className="bg-white/80 p-2 rounded-lg border border-slate-200/70 text-[11px] text-slate-600 space-y-0.5">
                <div className="truncate font-medium text-slate-700" title={locationName}>
                  {locationName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Akurasi: {coords?.accuracy ? `±${coords.accuracy}m` : '-'}</span>
                  {coords && (
                    <span>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
                  )}
                </div>
              </div>

              {/* Fake GPS Warning Box if detected */}
              {isMockDetected && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-rose-900">Fake GPS / Mock Location Terdeteksi!</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      {mockReason || 'Sistem mendeteksi penggunaan aplikasi manipulasi GPS. Presensi diblokir.'}
                    </div>
                    <div className="text-[10px] text-rose-500 mt-1">
                      Harap matikan "Mock Location" / Fake GPS di Pengaturan Pengembang HP Anda.
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Catatan Pulang (Opsional)</Label>
              <Input
                type="text"
                placeholder="Pekerjaan hari ini telah selesai..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCheckoutModalOpen(false)}
              className="text-xs w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleCheckOut}
              disabled={!capturedPhoto || isSubmitting || isMockDetected || isLocating}
              className={cn(
                "text-xs font-semibold px-5 w-full sm:w-auto",
                isMockDetected
                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-not-allowed opacity-90"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {isMockDetected ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Fake GPS Terdeteksi
                </>
              ) : isLocating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Validasi GPS...
                </>
              ) : isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Memproses...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Konfirmasi Pulang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* 3. MODAL PULANG CEPAT (EARLY LEAVE) */}
      {/* ======================================================= */}
      <Dialog open={earlyLeaveModalOpen} onOpenChange={setEarlyLeaveModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-amber-700">
              <Zap className="w-5 h-5 text-amber-600" /> Pengajuan Pulang Cepat
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Jika Anda harus meninggalkan pekerjaan sebelum shift berakhir, mohon sertakan alasan yang jelas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700" /> Memerlukan Persetujuan (ACC) HR
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pengajuan pulang cepat akan masuk ke antrean verifikasi HR dan berstatus Menunggu ACC sampai disetujui.
              </p>
            </div>

            {/* Webcam Selfie */}
            <WebcamCapture
              onCapture={(b64) => setCapturedPhoto(b64)}
              onRetake={() => setCapturedPhoto('')}
              initialPhoto={capturedPhoto || null}
            />

            {/* Mandatory Reason */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-800">
                Alasan Pulang Cepat <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Jelaskan alasan mendesak pulang lebih awal (misal: sakit, urusan keluarga mendadak)..."
                value={earlyReason}
                onChange={(e) => setEarlyReason(e.target.value)}
                className="text-xs min-h-[70px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEarlyLeaveModalOpen(false)}
              className="text-xs w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleEarlyLeave}
              disabled={!capturedPhoto || !earlyReason.trim() || isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-5 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Mengirim...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Kirim Pengajuan Pulang Cepat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* 4. MODAL PRESENSI RAPAT (MEETING CHECK-IN) */}
      {/* ======================================================= */}
      <Dialog
        open={meetingModalOpen}
        onOpenChange={(open) => {
          setMeetingModalOpen(open);
          if (open) setMeetingMethod('scan');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-purple-700">
              <QrCode className="w-5 h-5 text-purple-600" /> Presensi Rapat (Check-In)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pindai QR Code di layar proyektor atau masukkan token rapat untuk konfirmasi kehadiran.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl my-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMeetingMethod('scan')}
              className={cn(
                'py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-medium cursor-pointer',
                meetingMethod === 'scan'
                  ? 'bg-white text-purple-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Camera className="w-3.5 h-3.5 text-purple-600" /> Pindai QR Kamera
            </button>
            <button
              type="button"
              onClick={() => setMeetingMethod('manual')}
              className={cn(
                'py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-medium cursor-pointer',
                meetingMethod === 'manual'
                  ? 'bg-white text-purple-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" /> Input Manual Kode
            </button>
          </div>

          {meetingMethod === 'scan' ? (
            <div className="space-y-3 pt-1">
              <QRScanner
                isProcessing={isSubmitting}
                onScan={(scanned) => {
                  const token = extractMeetingToken(scanned);
                  setMeetingToken(token);
                  handleMeetingCheckin(undefined, token);
                }}
              />
              <p className="text-[11px] text-center text-slate-500 leading-tight">
                Arahkan kamera ke QR Code rapat di monitor atau layar proyektor.
              </p>
              <DialogFooter className="pt-2 border-t flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-center">
                <button
                  type="button"
                  onClick={() => setMeetingMethod('manual')}
                  className="text-purple-600 hover:text-purple-800 text-[11px] font-medium underline underline-offset-2"
                >
                  Kamera bermasalah? Masukkan kode secara manual
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMeetingModalOpen(false)}
                  className="text-xs h-8 w-full sm:w-auto"
                >
                  Batal
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={(e) => handleMeetingCheckin(e)} className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Kode / Token Rapat <span className="text-rose-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Masukkan token UUID rapat..."
                    value={meetingToken}
                    onChange={(e) => setMeetingToken(e.target.value)}
                    className="text-xs h-9 font-mono flex-1"
                    required
                    autoFocus
                  />
                  {typeof navigator !== 'undefined' && navigator.clipboard && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setMeetingToken(extractMeetingToken(text));
                            toast.info('Tautan/token ditempel dari clipboard');
                          }
                        } catch (err) {
                          // ignore clipboard error
                        }
                      }}
                      className="h-9 text-xs px-2.5 shrink-0"
                      title="Tempel dari Clipboard"
                    >
                      Tempel
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Token bisa Anda dapatkan dari tampilan proyektor rapat atau link moderator.
                </p>
              </div>

              <DialogFooter className="pt-3 border-t mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMeetingModalOpen(false)}
                  className="text-xs w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!meetingToken.trim() || isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Konfirmasi Hadir Rapat
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* 5. MODAL PENGAJUAN CUTI / IZIN */}
      {/* ======================================================= */}
      <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-teal-700">
              <CalendarPlus className="w-5 h-5 text-teal-600" /> Formulir Permohonan Cuti / Izin
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ajukan cuti tahunan, sakit, atau izin dengan mengisi detail permohonan berikut.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLeaveSubmit} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium text-slate-700">Jenis Cuti / Izin *</Label>
                <SearchableSelect
                  options={leaveTypes.map((lt: any) => ({
                    value: lt.id.toString(),
                    label: lt.name + (lt.default_quota > 0 ? ` (Maks ${lt.default_quota} Hari)` : ''),
                  }))}
                  value={leaveForm.leave_type_id}
                  onValueChange={(val) => setLeaveForm({ ...leaveForm, leave_type_id: val || '' })}
                  placeholder="-- Pilih Jenis Cuti / Izin --"
                  searchPlaceholder="Cari jenis cuti atau izin..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Tanggal Selesai *</Label>
                <Input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium text-slate-700">Alasan Permohonan *</Label>
                <Textarea
                  placeholder="Tuliskan keterangan dan alasan keperluan cuti..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="text-xs min-h-[65px]"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Nomor Telepon Darurat</Label>
                <Input
                  type="text"
                  placeholder="08123456789"
                  value={leaveForm.emergency_phone}
                  onChange={(e) => setLeaveForm({ ...leaveForm, emergency_phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Delegasi Tugas (Rekan Kerja)</Label>
                <SearchableSelect
                  options={colleagues
                    .filter((c: any) => c.id !== employee?.id)
                    .map((c: any) => ({
                      value: c.id.toString(),
                      label: `${c.first_name} ${c.last_name || ''}`.trim(),
                    }))}
                  value={leaveForm.delegation_to}
                  onValueChange={(val) => setLeaveForm({ ...leaveForm, delegation_to: val || '' })}
                  placeholder="-- Pilih Rekan Kerja --"
                  searchPlaceholder="Cari rekan kerja..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLeaveModalOpen(false)}
                className="text-xs w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !leaveForm.leave_type_id || !leaveForm.reason.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-5 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Mengirim...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Kirim Pengajuan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* 6. MODAL DETAIL ABSENSI */}
      {/* ======================================================= */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800">
              <Info className="w-5 h-5 text-indigo-600" /> Detail Catatan Absensi
            </DialogTitle>
          </DialogHeader>

          {selectedDetail && (
            <div className="space-y-3 py-1 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-100">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Tanggal:</span>
                  <span className="font-semibold text-slate-800">{formatDate(selectedDetail.date)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Shift / Jadwal:</span>
                  <span className="font-semibold text-slate-800">{selectedDetail.work_schedule_name || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Jam Masuk (Clock In):</span>
                  <span className="font-mono font-bold text-slate-800">{formatTime(selectedDetail.clock_in)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Jam Pulang (Clock Out):</span>
                  <span className="font-mono font-bold text-slate-800">{formatTime(selectedDetail.clock_out)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2 items-center">
                  <span className="text-slate-500 font-medium">Status Kehadiran:</span>
                  <Badge
                    variant="outline"
                    className={statusConfig[selectedDetail.status]?.className || 'bg-slate-100 text-slate-800'}
                  >
                    {statusConfig[selectedDetail.status]?.label || selectedDetail.status}
                  </Badge>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 font-medium block mb-1">Catatan / Keterangan:</span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-mono text-[11px]">
                    {selectedDetail.notes || 'Tidak ada catatan.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t mt-4">
            <Button
              type="button"
              onClick={() => setDetailModalOpen(false)}
              className="w-full text-xs"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrLayout>
  );
}
