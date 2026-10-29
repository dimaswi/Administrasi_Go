import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Clock,
  Download,
  Printer,
  Users,
  Building2,
  AlertTriangle,
  LogOut,
  UserX,
  Briefcase,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Search,
  TrendingUp,
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_code?: string;
  employee_name?: string;
  unit_name?: string;
  position?: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  work_schedule_id?: number | null;
  work_schedule_name?: string;
  schedule_clock_in?: string;
  schedule_clock_out?: string;
  status: string;
  notes?: string | null;
  late_minutes: number;
}

interface EmployeeItem {
  id: number;
  employee_id: string;
  first_name: string;
  last_name?: string;
  position?: string;
  organization_unit_id?: number;
  unit_name?: string;
  status?: string;
  user_id?: number;
}

interface UnitItem {
  id: number;
  name: string;
  code?: string;
}

interface ShiftItem {
  id: number;
  name: string;
  clock_in_time: string;
  clock_out_time: string;
}

interface LeaveItem {
  id: number;
  employee_id: number;
  employee_name?: string;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
}

const REPORT_TYPES = [
  { id: 'daily', label: 'Rekap Harian' },
  { id: 'monthly', label: 'Rekap Bulanan' },
  { id: 'employee', label: 'Rekap Per Pegawai' },
  { id: 'unit', label: 'Rekap Per Unit' },
  { id: 'shift', label: 'Rekap Per Shift' },
  { id: 'late', label: 'Rekap Keterlambatan' },
  { id: 'early', label: 'Rekap Pulang Cepat' },
  { id: 'absence', label: 'Rekap Ketidakhadiran' },
  { id: 'overtime', label: 'Rekap Lembur' },
  { id: 'workhours', label: 'Rekap Jam Kerja' },
];

export default function AttendanceReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'daily';

  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: `${currentMonthStr}-01`,
    end: todayStr,
  });
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthlyViewMode, setMonthlyViewMode] = useState<'summary' | 'matrix'>('summary');

  // Master Data state
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);

  // Raw Attendance Data state
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [rosterMap, setRosterMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);

  // Sync tab with URL
  const setTab = (tabId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams);
  };

  // Fetch Master Data once
  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/employees?perPage=1000'),
        api.get('/org-units?perPage=1000'),
        api.get('/work-schedules'),
        api.get('/leaves?perPage=1000'),
      ]);

      let empData: any[] = [];
      let unitData: any[] = [];
      let shiftData: any[] = [];
      let leaveData: any[] = [];

      if (results[0].status === 'fulfilled') {
        const val = results[0].value.data;
        empData = Array.isArray(val) ? val : (val?.data || []);
      } else {
        console.error('Failed to load employees:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        const val = results[1].value.data;
        unitData = Array.isArray(val) ? val : (val?.data || []);
      } else {
        console.error('Failed to load org-units:', results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        const val = results[2].value.data;
        shiftData = Array.isArray(val) ? val : (val?.data || []);
      } else {
        console.error('Failed to load work-schedules:', results[2].reason);
      }

      if (results[3].status === 'fulfilled') {
        const val = results[3].value.data;
        leaveData = Array.isArray(val) ? val : (val?.data || []);
      } else {
        console.error('Failed to load leaves:', results[3].reason);
      }

      // Map unit names to employees
      const unitMap = new Map<number, string>();
      unitData.forEach((u: UnitItem) => unitMap.set(u.id, u.name));

      const processedEmployees = empData.map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        employee_id: e.employee_id || `EMP-${e.id}`,
        first_name: e.first_name,
        last_name: e.last_name || '',
        position: e.position || '-',
        organization_unit_id: e.organization_unit_id,
        unit_name: e.organization_unit_id ? unitMap.get(e.organization_unit_id) || '-' : '-',
        status: e.status || 'active',
      }));

      setEmployees(processedEmployees);
      setUnits(unitData);
      setShifts(shiftData);
      setLeaves(leaveData);

      if (processedEmployees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(String(processedEmployees[0].id));
      }

      // Fetch attendance right away with freshly loaded employee list
      fetchAttendanceData(processedEmployees, shiftData);
    } catch (err) {
      console.error('Failed to fetch report master data:', err);
    }
  };

  // Fetch attendance records based on current tab & date filters
  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendanceData();
    }
  }, [currentTab, selectedDate, selectedMonth, dateRange, selectedUnit]);

  const fetchAttendanceData = async (empList?: EmployeeItem[], shiftList?: ShiftItem[]) => {
    setLoading(true);
    const activeEmployees = empList || employees;
    const activeShifts = shiftList || shifts;
    try {
      let startDate = dateRange.start;
      let endDate = dateRange.end;

      if (currentTab === 'daily') {
        startDate = selectedDate;
        endDate = selectedDate;
      } else if (currentTab === 'monthly' || currentTab === 'unit') {
        startDate = `${selectedMonth}-01`;
        const [year, month] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      }

      let url = `/attendances?page=1&perPage=5000&start_date=${startDate}&end_date=${endDate}`;
      if (selectedUnit !== 'all') {
        url += `&unit_id=${selectedUnit}`;
      }

      let rosterUrl = `/roster-schedules?page=1&per_page=5000&start_date=${startDate}&end_date=${endDate}`;
      if (currentTab === 'daily') {
        rosterUrl = `/roster-schedules?page=1&per_page=5000&date=${selectedDate}`;
      }

      const [attRes, rosterRes] = await Promise.allSettled([
        api.get(url),
        api.get(rosterUrl),
      ]);

      const rawRecords: AttendanceRecord[] = attRes.status === 'fulfilled'
        ? (attRes.value.data?.data || attRes.value.data || [])
        : [];

      const rawRosters: any[] = rosterRes.status === 'fulfilled'
        ? (rosterRes.value.data?.data || rosterRes.value.data || [])
        : [];

      // Multi-key roster map for fast & bulletproof lookup
      const newRosterMap = new Map<string, any>();
      rawRosters.forEach((r: any) => {
        const dStr = r.date ? r.date.substring(0, 10) : '';
        if (dStr) {
          if (r.employee_id) {
            newRosterMap.set(`${r.employee_id}_${dStr}`, r);
          }
          // Correlate with activeEmployees by user_id or id
          const matchedEmp = activeEmployees.find(
            (e) => e.id === r.employee_id || (e.user_id && e.user_id === r.employee_id)
          );
          if (matchedEmp) {
            newRosterMap.set(`${matchedEmp.id}_${dStr}`, r);
            if (matchedEmp.user_id) {
              newRosterMap.set(`${matchedEmp.user_id}_${dStr}`, r);
            }
            const cleanName = `${matchedEmp.first_name} ${matchedEmp.last_name || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanName) {
              newRosterMap.set(`name_${cleanName}_${dStr}`, r);
            }
          }
          if (r.employee_name) {
            const cleanName = r.employee_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanName) {
              newRosterMap.set(`name_${cleanName}_${dStr}`, r);
            }
          }
        }
      });
      setRosterMap(newRosterMap);

      // Map employee unit and details if missing
      const empMap = new Map<number, EmployeeItem>();
      activeEmployees.forEach((e) => empMap.set(e.id, e));

      const shiftMap = new Map<number, string>();
      activeShifts.forEach((s) => shiftMap.set(s.id, s.name));

      const mapped = rawRecords.map((r) => {
        const emp = empMap.get(r.employee_id);
        const dStr = r.date ? r.date.substring(0, 10) : '';
        const roster = emp
          ? (newRosterMap.get(`${emp.id}_${dStr}`) || (emp.user_id ? newRosterMap.get(`${emp.user_id}_${dStr}`) : undefined))
          : newRosterMap.get(`${r.employee_id}_${dStr}`);

        const effectiveWorkScheduleId = r.work_schedule_id || roster?.work_schedule_id;
        let effectiveWorkScheduleName = (r.work_schedule_name && r.work_schedule_name !== 'Reguler')
          ? r.work_schedule_name
          : (roster?.work_schedule_name || (effectiveWorkScheduleId ? shiftMap.get(effectiveWorkScheduleId) : undefined) || '-');

        return {
          ...r,
          work_schedule_id: effectiveWorkScheduleId,
          work_schedule_name: effectiveWorkScheduleName,
          schedule_clock_in: r.schedule_clock_in || roster?.clock_in_time || '08:00',
          schedule_clock_out: r.schedule_clock_out || roster?.clock_out_time || '16:00',
          employee_code: r.employee_code || emp?.employee_id || `EMP-${r.employee_id}`,
          employee_name: r.employee_name || (emp ? `${emp.first_name} ${emp.last_name || ''}`.trim() : `Pegawai #${r.employee_id}`),
          unit_name: r.unit_name || emp?.unit_name || '-',
          position: r.position || emp?.position || '-',
        };
      });

      setAttendances(mapped);
    } catch (err) {
      console.error('Failed to fetch attendances for report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper calculations
  const formatClockTime = (timeStr?: string | null): string => {
    if (!timeStr) return '-';
    if (timeStr.includes('T')) {
      const parts = timeStr.split('T')[1];
      return parts.substring(0, 5);
    }
    return timeStr.substring(0, 5);
  };

  const calculateDurationMinutes = (startStr?: string | null, endStr?: string | null): number => {
    if (!startStr || !endStr) return 0;
    const [h1, m1] = formatClockTime(startStr).split(':').map(Number);
    const [h2, m2] = formatClockTime(endStr).split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
  };

  const formatMinutesToHours = (totalMinutes: number): string => {
    if (totalMinutes <= 0) return '0j 0m';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}j ${m}m`;
  };

  const calculateEarlyLeaveMinutes = (clockOut?: string | null, schedOut?: string | null): number => {
    if (!clockOut || !schedOut) return 0;
    const [h1, m1] = formatClockTime(clockOut).split(':').map(Number);
    const [h2, m2] = formatClockTime(schedOut).split(':').map(Number);
    const outMin = h1 * 60 + m1;
    const schedMin = h2 * 60 + m2;
    if (outMin < schedMin) {
      return schedMin - outMin;
    }
    return 0;
  };

  // Select dropdown options
  const unitOptions = useMemo(() => {
    return [
      { value: 'all', label: `Semua Unit Kerja (${units.length})` },
      ...units.map((u) => ({
        value: String(u.id),
        label: u.name,
      })),
    ];
  }, [units]);

  const shiftOptions = useMemo(() => {
    return [
      { value: 'all', label: `Semua Shift (${shifts.length})` },
      ...shifts.map((s) => ({
        value: String(s.id),
        label: `${s.name} (${formatClockTime(s.clock_in_time)} - ${formatClockTime(s.clock_out_time)})`,
      })),
    ];
  }, [shifts]);

  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: String(e.id),
      label: `${e.first_name} ${e.last_name || ''} (${e.employee_id})`,
    }));
  }, [employees]);

  // Filtered attendances based on search & shift
  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (att.employee_name || '').toLowerCase().includes(q);
        const matchCode = (att.employee_code || '').toLowerCase().includes(q);
        const matchUnit = (att.unit_name || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchUnit) return false;
      }
      if (selectedShift !== 'all') {
        const shiftId = Number(selectedShift);
        if (att.work_schedule_id !== shiftId) return false;
      }
      return true;
    });
  }, [attendances, searchQuery, selectedShift]);

  // Check if an employee is on approved leave for a specific date
  const getEmployeeLeaveForDate = (empId: number, date: string): LeaveItem | undefined => {
    return leaves.find((l) => {
      return l.employee_id === empId && l.status === 'approved' && date >= l.start_date && date <= l.end_date;
    });
  };

  // Check scheduled roster for an employee on a date
  const getEmployeeRosterForDate = (emp: EmployeeItem, dateStr: string) => {
    if (!emp) return undefined;
    const byId = rosterMap.get(`${emp.id}_${dateStr}`);
    if (byId) return byId;
    if (emp.user_id) {
      const byUser = rosterMap.get(`${emp.user_id}_${dateStr}`);
      if (byUser) return byUser;
    }
    const clean = `${emp.first_name} ${emp.last_name || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean) {
      const byName = rosterMap.get(`name_${clean}_${dateStr}`);
      if (byName) return byName;
    }
    return undefined;
  };

  // 1. Daily rows
  const dailyRows = useMemo(() => {
    const attendanceMap = new Map<number, AttendanceRecord>();
    filteredAttendances.forEach((a) => {
      if (a.date === selectedDate) {
        attendanceMap.set(a.employee_id, a);
      }
    });

    let targetEmployees = employees;
    if (selectedUnit !== 'all') {
      targetEmployees = targetEmployees.filter((e) => e.organization_unit_id === Number(selectedUnit));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      targetEmployees = targetEmployees.filter(
        (e) =>
          e.first_name.toLowerCase().includes(q) ||
          (e.last_name || '').toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q)
      );
    }
    if (selectedShift !== 'all') {
      const sId = Number(selectedShift);
      targetEmployees = targetEmployees.filter((e) => {
        const att = attendanceMap.get(e.id);
        const roster = getEmployeeRosterForDate(e, selectedDate);
        if (att && att.work_schedule_id === sId) return true;
        if (roster && (roster.work_schedule_id === sId || String(roster.work_schedule_id) === selectedShift)) return true;
        return false;
      });
    }

    return targetEmployees.map((emp) => {
      const att = attendanceMap.get(emp.id);
      const leave = getEmployeeLeaveForDate(emp.id, selectedDate);
      const roster = getEmployeeRosterForDate(emp, selectedDate);

      let status = 'Libur';
      let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      let clockIn = att?.clock_in || null;
      let clockOut = att?.clock_out || null;
      let lateMinutes = att?.late_minutes || 0;
      let earlyMinutes = 0;
      let workDuration = '-';

      // Pick accurate shift name: roster schedule first, then attendance record, else matching shift from master
      let shiftName = roster?.work_schedule_name || (att?.work_schedule_name && att.work_schedule_name !== 'Reguler' && att.work_schedule_name !== '-' ? att.work_schedule_name : '');
      if (!shiftName && roster?.work_schedule_id) {
        const s = shifts.find((sh) => sh.id === roster.work_schedule_id);
        if (s) shiftName = s.name;
      }
      if (!shiftName && att?.work_schedule_id) {
        const s = shifts.find((sh) => sh.id === att.work_schedule_id);
        if (s) shiftName = s.name;
      }
      if (!shiftName && selectedShift !== 'all') {
        const s = shifts.find((sh) => String(sh.id) === selectedShift);
        if (s) shiftName = s.name;
      }

      const schedOut = roster?.clock_out_time || att?.schedule_clock_out || null;

      if (clockIn && clockOut) {
        const diff = calculateDurationMinutes(clockIn, clockOut);
        workDuration = formatMinutesToHours(diff);
      }

      if (att) {
        if (schedOut && clockOut) {
          earlyMinutes = calculateEarlyLeaveMinutes(clockOut, schedOut);
        }
        if (lateMinutes > 0) {
          status = `Terlambat (${lateMinutes}m)`;
          badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (earlyMinutes > 0) {
          status = `Pulang Awal (-${earlyMinutes}m)`;
          badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
        } else {
          status = 'Hadir';
          badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (!shiftName) {
          shiftName = att.work_schedule_name || 'Shift';
        }
      } else if (leave) {
        status = leave.leave_type_name || 'Cuti / Izin';
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        if (!shiftName) {
          shiftName = leave.leave_type_name || 'Cuti';
        }
      } else if (roster) {
        // Pegawai punya jadwal shift tapi belum absen
        status = 'Belum Hadir';
        badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      } else {
        // Tidak ada jadwal shift hari ini => LIBUR
        shiftName = 'Libur';
        status = 'Libur';
        badgeClass = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      }

      return {
        id: emp.id,
        employee_code: emp.employee_id,
        employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
        unit_name: emp.unit_name || '-',
        position: emp.position || '-',
        shift_name: shiftName,
        clock_in: clockIn,
        clock_out: clockOut,
        late_minutes: lateMinutes,
        early_minutes: earlyMinutes,
        work_duration: workDuration,
        status,
        badgeClass,
        notes: att?.notes || leave?.reason || null,
      };
    });
  }, [employees, filteredAttendances, selectedDate, selectedUnit, searchQuery, selectedShift, leaves, rosterMap]);

  // Overall KPI stats
  const kpiStats = useMemo(() => {
    const totalStaff = currentTab === 'daily' ? dailyRows.length : employees.length;
    const presentRecords = filteredAttendances.filter((a) => a.clock_in);
    const lateRecords = filteredAttendances.filter((a) => a.late_minutes > 0 || a.status === 'late');
    const earlyRecords = filteredAttendances.filter((a) => {
      const earlyMin = calculateEarlyLeaveMinutes(a.clock_out, a.schedule_clock_out);
      return earlyMin > 0;
    });

    let totalWorkMinutes = 0;
    filteredAttendances.forEach((a) => {
      if (a.clock_in && a.clock_out) {
        totalWorkMinutes += calculateDurationMinutes(a.clock_in, a.clock_out);
      }
    });

    const activeLeaves = leaves.filter((l) => {
      if (l.status !== 'approved') return false;
      if (currentTab === 'daily') {
        return selectedDate >= l.start_date && selectedDate <= l.end_date;
      }
      return true;
    });

    const totalOff = currentTab === 'daily' ? dailyRows.filter(r => r.status === 'Libur').length : 0;
    const totalPending = currentTab === 'daily' ? dailyRows.filter(r => r.status === 'Belum Hadir').length : 0;

    return {
      totalStaff,
      totalPresent: presentRecords.length,
      totalLate: lateRecords.length,
      totalEarly: earlyRecords.length,
      totalLeaves: activeLeaves.length,
      totalOff,
      totalPending,
      totalWorkHours: formatMinutesToHours(totalWorkMinutes),
    };
  }, [employees, dailyRows, filteredAttendances, leaves, currentTab, selectedDate]);

  // 2. Monthly summaries
  const monthlySummaries = useMemo(() => {
    let targetEmployees = employees;
    if (selectedUnit !== 'all') {
      targetEmployees = targetEmployees.filter((e) => e.organization_unit_id === Number(selectedUnit));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      targetEmployees = targetEmployees.filter(
        (e) =>
          e.first_name.toLowerCase().includes(q) ||
          (e.last_name || '').toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q)
      );
    }

    return targetEmployees.map((emp) => {
      const empAttendances = attendances.filter((a) => a.employee_id === emp.id);
      const presentDays = empAttendances.filter((a) => a.clock_in).length;
      const lateDays = empAttendances.filter((a) => a.late_minutes > 0 || a.status === 'late').length;

      let totalMinutesWorked = 0;
      empAttendances.forEach((a) => {
        if (a.clock_in && a.clock_out) {
          totalMinutesWorked += calculateDurationMinutes(a.clock_in, a.clock_out);
        }
      });

      const empLeaves = leaves.filter((l) => l.employee_id === emp.id && l.status === 'approved');
      let leaveDays = 0;
      let sickDays = 0;
      let permitDays = 0;

      empLeaves.forEach((l) => {
        const typeName = (l.leave_type_name || '').toLowerCase();
        if (typeName.includes('sakit')) {
          sickDays += l.total_days || 1;
        } else if (typeName.includes('izin')) {
          permitDays += l.total_days || 1;
        } else {
          leaveDays += l.total_days || 1;
        }
      });

      const targetDays = 22;
      const absentDays = Math.max(0, targetDays - (presentDays + leaveDays + sickDays + permitDays));
      const attendanceRate = Math.min(100, Math.round((presentDays / targetDays) * 100));

      return {
        id: emp.id,
        employee_code: emp.employee_id,
        employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
        unit_name: emp.unit_name || '-',
        position: emp.position || '-',
        presentDays,
        lateDays,
        leaveDays,
        sickDays,
        permitDays,
        absentDays,
        totalMinutesWorked,
        totalHoursFormatted: formatMinutesToHours(totalMinutesWorked),
        attendanceRate,
      };
    });
  }, [employees, attendances, leaves, selectedUnit, searchQuery]);

  const daysInSelectedMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      return { dayNum, dateStr, isWeekend };
    });
  }, [selectedMonth]);

  // 3. Rekap Per Pegawai
  const employeeSpecificLogs = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return attendances
      .filter((a) => a.employee_id === Number(selectedEmployeeId))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendances, selectedEmployeeId]);

  const selectedEmployeeObj = useMemo(() => {
    return employees.find((e) => e.id === Number(selectedEmployeeId));
  }, [employees, selectedEmployeeId]);

  // 4. Rekap Per Unit (Matriks 1-31)
  const unitMatrixData = useMemo(() => {
    let targetUnits = units;
    if (selectedUnit !== 'all') {
      targetUnits = units.filter((u) => u.id === Number(selectedUnit));
    }

    const attMap = new Map<string, AttendanceRecord>();
    attendances.forEach((a) => {
      const dStr = a.date ? a.date.substring(0, 10) : '';
      if (dStr && a.employee_id) {
        attMap.set(`${a.employee_id}_${dStr}`, a);
      }
    });

    return targetUnits.map((unit) => {
      let staffInUnit = employees.filter((e) => e.organization_unit_id === unit.id);
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        staffInUnit = staffInUnit.filter(
          (e) =>
            e.first_name.toLowerCase().includes(q) ||
            (e.last_name || '').toLowerCase().includes(q) ||
            e.employee_id.toLowerCase().includes(q)
        );
      }

      const rows = staffInUnit.map((emp) => {
        let presentDays = 0;
        let lateDays = 0;
        let offDays = 0;
        let leaveDays = 0;
        let absentDays = 0;

        const dayCells = daysInSelectedMonth.map((d) => {
          const att = attMap.get(`${emp.id}_${d.dateStr}`);
          const leave = getEmployeeLeaveForDate(emp.id, d.dateStr);
          const roster = getEmployeeRosterForDate(emp, d.dateStr);

          let label = 'L';
          let title = `Libur (${d.dateStr})`;
          let cellClass = 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium';

          if (att) {
            if (att.late_minutes > 0 || att.status === 'late') {
              label = 'T';
              title = `Terlambat +${att.late_minutes}m (Masuk: ${formatClockTime(att.clock_in)})`;
              cellClass = 'bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-amber-950 font-bold';
              lateDays++;
              presentDays++;
            } else {
              label = 'H';
              title = `Hadir Tepat Waktu (Masuk: ${formatClockTime(att.clock_in)})`;
              cellClass = 'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white font-bold';
              presentDays++;
            }
          } else if (leave) {
            label = 'C';
            title = `${leave.leave_type_name || 'Cuti/Izin'}: ${leave.reason || '-'}`;
            cellClass = 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white font-bold';
            leaveDays++;
          } else if (roster) {
            label = 'A';
            title = `Shift: ${roster.work_schedule_name || '-'} (Belum Hadir)`;
            cellClass = 'bg-rose-500 text-white dark:bg-rose-600 dark:text-white font-bold';
            absentDays++;
          } else {
            label = 'L';
            title = `Libur (Tidak ada shift)`;
            cellClass = 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium';
            offDays++;
          }

          return {
            dayNum: d.dayNum,
            dateStr: d.dateStr,
            isWeekend: d.isWeekend,
            label,
            title,
            cellClass,
          };
        });

        return {
          id: emp.id,
          employee_code: emp.employee_id,
          employee_name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
          position: emp.position || '-',
          presentDays,
          lateDays,
          offDays,
          leaveDays,
          absentDays,
          dayCells,
        };
      });

      return {
        unit_id: unit.id,
        unit_name: unit.name,
        staffCount: staffInUnit.length,
        rows,
      };
    });
  }, [units, selectedUnit, employees, searchQuery, attendances, daysInSelectedMonth, leaves, rosterMap]);

  // 4. Rekap Per Unit (Kumulatif Ringkasan)
  const unitSummaries = useMemo(() => {
    return units.map((u) => {
      const staffInUnit = employees.filter((e) => e.organization_unit_id === u.id);
      const staffIds = new Set(staffInUnit.map((s) => s.id));
      const unitAttendances = attendances.filter((a) => staffIds.has(a.employee_id));

      const presentCount = unitAttendances.filter((a) => a.clock_in).length;
      const lateCount = unitAttendances.filter((a) => a.late_minutes > 0).length;
      const leaveCount = leaves.filter((l) => staffIds.has(l.employee_id) && l.status === 'approved').length;

      const totalExpected = Math.max(1, staffInUnit.length * 20);
      const rate = staffInUnit.length > 0 ? Math.min(100, Math.round((presentCount / totalExpected) * 100)) : 0;

      return {
        unit_id: u.id,
        unit_name: u.name,
        staffCount: staffInUnit.length,
        presentCount,
        lateCount,
        leaveCount,
        absentCount: Math.max(0, staffInUnit.length * 2 - (presentCount + leaveCount)),
        rate,
      };
    });
  }, [units, employees, attendances, leaves]);

  // 5. Rekap Per Shift
  const shiftSummaries = useMemo(() => {
    return shifts.map((s) => {
      const shiftAttendances = attendances.filter((a) => a.work_schedule_id === s.id);
      const onTimeCount = shiftAttendances.filter((a) => a.late_minutes === 0).length;
      const lateCount = shiftAttendances.filter((a) => a.late_minutes > 0).length;
      
      // Also count roster scheduled count for this period
      let rosterCount = 0;
      rosterMap.forEach((r) => {
        if (r.work_schedule_id === s.id) {
          rosterCount++;
        }
      });

      const total = shiftAttendances.length;
      const rate = total > 0 ? Math.round((onTimeCount / total) * 100) : 100;

      return {
        id: s.id,
        name: s.name,
        clock_in_time: formatClockTime(s.clock_in_time),
        clock_out_time: formatClockTime(s.clock_out_time),
        count: total > 0 ? total : rosterCount,
        onTimeCount,
        lateCount,
        rate,
      };
    });
  }, [shifts, attendances, rosterMap]);

  // 6. Rekap Keterlambatan
  const lateAudits = useMemo(() => {
    return filteredAttendances
      .filter((a) => a.late_minutes > 0 || a.status === 'late')
      .sort((a, b) => b.late_minutes - a.late_minutes);
  }, [filteredAttendances]);

  // 7. Rekap Pulang Cepat
  const earlyAudits = useMemo(() => {
    return filteredAttendances
      .map((a) => {
        const earlyMin = calculateEarlyLeaveMinutes(a.clock_out, a.schedule_clock_out);
        return {
          ...a,
          earlyMinutes: earlyMin,
        };
      })
      .filter((a) => a.earlyMinutes > 0)
      .sort((a, b) => b.earlyMinutes - a.earlyMinutes);
  }, [filteredAttendances]);

  // 8. Rekap Ketidakhadiran
  const absenceRows = useMemo(() => {
    const rows: any[] = [];
    leaves.forEach((l) => {
      if (l.status === 'approved') {
        const emp = employees.find((e) => e.id === l.employee_id);
        rows.push({
          id: `leave-${l.id}`,
          period: `${l.start_date} s/d ${l.end_date}`,
          employee_code: emp?.employee_id || '-',
          employee_name: emp ? `${emp.first_name} ${emp.last_name || ''}`.trim() : `Pegawai #${l.employee_id}`,
          unit_name: emp?.unit_name || '-',
          category: l.leave_type_name || 'Cuti / Izin',
          duration: l.total_days || 1,
          reason: l.reason || '-',
          status: 'Disetujui',
        });
      }
    });
    return rows;
  }, [leaves, employees]);

  // 9. Rekap Lembur
  const overtimeAudits = useMemo(() => {
    return filteredAttendances
      .map((a) => {
        if (!a.clock_in || !a.clock_out) return null;
        const totalMinutes = calculateDurationMinutes(a.clock_in, a.clock_out);
        const standardMinutes = 8 * 60;
        const overtimeMinutes = Math.max(0, totalMinutes - standardMinutes);
        if (overtimeMinutes <= 15) return null;

        return {
          ...a,
          workDuration: formatMinutesToHours(totalMinutes),
          overtimeMinutes,
          overtimeFormatted: formatMinutesToHours(overtimeMinutes),
        };
      })
      .filter(Boolean) as any[];
  }, [filteredAttendances]);

  // 10. Rekap Jam Kerja
  const workHourSummaries = useMemo(() => {
    return monthlySummaries.map((m) => {
      const avgMinutes = m.presentDays > 0 ? Math.round(m.totalMinutesWorked / m.presentDays) : 0;
      const targetMinutes = 160 * 60;
      const devMinutes = m.totalMinutesWorked - targetMinutes;
      const devFormatted = devMinutes >= 0 ? `+${formatMinutesToHours(devMinutes)}` : `-${formatMinutesToHours(Math.abs(devMinutes))}`;
      let workloadStatus = 'Ideal';
      if (m.totalMinutesWorked > targetMinutes + 10 * 60) workloadStatus = 'Lembur Tinggi';
      else if (m.totalMinutesWorked < targetMinutes - 20 * 60) workloadStatus = 'Di Bawah Target';

      return {
        ...m,
        totalWorkHoursFormatted: m.totalHoursFormatted,
        avgHoursPerDay: formatMinutesToHours(avgMinutes),
        deviationFormatted: devFormatted,
        workloadStatus,
      };
    });
  }, [monthlySummaries]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      let dataToExport: any[] = [];
      let filename = `Rekap_Absensi_${currentTab}_${selectedDate}.xlsx`;

      if (currentTab === 'daily') {
        dataToExport = dailyRows.map((r, idx) => ({
          No: idx + 1,
          NIP: r.employee_code,
          'Nama Pegawai': r.employee_name,
          'Unit Kerja': r.unit_name,
          Shift: r.shift_name,
          'Jam Masuk': r.clock_in ? r.clock_in.substring(0, 5) : '-',
          'Jam Pulang': r.clock_out ? r.clock_out.substring(0, 5) : '-',
          'Terlambat (m)': r.late_minutes,
          'Pulang Awal (m)': r.early_minutes,
          Durasi: r.work_duration,
          Status: r.status,
          Keterangan: r.notes || '-',
        }));
      } else if (currentTab === 'shift') {
        dataToExport = shiftSummaries.map((s, idx) => ({
          No: idx + 1,
          'Nama Shift': s.name,
          'Jadwal Jam Kerja': `${s.clock_in_time} - ${s.clock_out_time}`,
          'Total Presensi / Terjadwal': s.count,
          'Tepat Waktu': s.onTimeCount,
          Terlambat: s.lateCount,
          'Tingkat Kepatuhan': `${s.rate}%`,
        }));
      } else {
        dataToExport = filteredAttendances.map((a, idx) => ({
          No: idx + 1,
          NIP: a.employee_code || '-',
          'Nama Pegawai': a.employee_name || '-',
          'Unit Kerja': a.unit_name || '-',
          Tanggal: a.date,
          'Jam Masuk': a.clock_in ? a.clock_in.substring(0, 5) : '-',
          'Jam Pulang': a.clock_out ? a.clock_out.substring(0, 5) : '-',
          Shift: a.work_schedule_name || 'Reguler',
          Status: a.status,
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');
      XLSX.writeFile(workbook, filename);
      toast.success('Laporan berhasil diexport ke Excel (.xlsx)');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Gagal mengekspor data');
    }
  };

  return (
    <HrLayout>
      <div className="w-full space-y-4 print:m-0 print:p-0">
        {/* Standard Page Header */}
        <div className="flex items-start justify-between gap-4 print:hidden">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">Rekap Absensi</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Laporan rekapitulasi kehadiran, ketidakhadiran, jadwal shift, dan jam kerja pegawai
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => fetchAttendanceData()}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak / PDF
            </Button>
          </div>
        </div>

        {/* Printable Letterhead (Only visible when printing) */}
        <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">RUMAH SAKIT IBU DAN ANAK (RSIA)</h1>
              <h2 className="text-base font-semibold uppercase mt-0.5">
                LAPORAN {REPORT_TYPES.find((t) => t.id === currentTab)?.label.toUpperCase()}
              </h2>
              <p className="text-xs text-gray-600">
                Periode:{' '}
                {currentTab === 'daily'
                  ? selectedDate
                  : currentTab === 'monthly'
                  ? selectedMonth
                  : `${dateRange.start} s/d ${dateRange.end}`}{' '}
                | Unit: {selectedUnit === 'all' ? 'Semua Unit Kerja' : units.find((u) => u.id === Number(selectedUnit))?.name}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Dicetak: {new Date().toLocaleString('id-ID')}</p>
              <p>Modul Kepegawaian & HR</p>
            </div>
          </div>
        </div>

        {/* Report Selector Segmented Bar (Screen only) */}
        <div className="print:hidden border-b border-border pb-1 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {REPORT_TYPES.map((type) => {
              const isActive = currentTab === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setTab(type.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Filter Toolbar (Screen only) */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIP, nama..."
              className="h-8 pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Date Controls */}
          {currentTab === 'daily' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Tanggal:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          )}

          {currentTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Bulan:</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <div className="flex items-center rounded-md border border-input p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setMonthlyViewMode('summary')}
                  className={`px-2 py-1 text-[11px] rounded ${
                    monthlyViewMode === 'summary' ? 'bg-background font-semibold shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Tabel Kumulatif
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyViewMode('matrix')}
                  className={`px-2 py-1 text-[11px] rounded ${
                    monthlyViewMode === 'matrix' ? 'bg-background font-semibold shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Matriks (1-31)
                </button>
              </div>
            </div>
          )}

          {currentTab === 'employee' && (
            <div className="w-64">
              <SearchableSelect
                options={employeeOptions}
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                placeholder="-- Pilih Pegawai --"
                searchPlaceholder="Cari NIP / nama..."
                className="h-8 text-xs"
              />
            </div>
          )}

          {currentTab === 'unit' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Bulan:</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          )}

          {['shift', 'late', 'early', 'absence', 'overtime', 'workhours'].includes(currentTab) && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Periode:</span>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="h-8 text-xs w-32"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="h-8 text-xs w-32"
              />
            </div>
          )}

          {/* Unit Filter */}
          <div className="w-52">
            <SearchableSelect
              options={unitOptions}
              value={selectedUnit}
              onValueChange={setSelectedUnit}
              placeholder="Pilih Unit Kerja"
              searchPlaceholder="Cari unit kerja..."
              className="h-8 text-xs"
            />
          </div>

          {/* Shift Filter */}
          <div className="w-48">
            <SearchableSelect
              options={shiftOptions}
              value={selectedShift}
              onValueChange={setSelectedShift}
              placeholder="Pilih Shift"
              searchPlaceholder="Cari shift..."
              className="h-8 text-xs"
            />
          </div>

          {/* KPI Summary Chips */}
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/60 text-muted-foreground font-medium">
              Pegawai: <strong className="text-foreground">{kpiStats.totalStaff}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
              Hadir: <strong>{kpiStats.totalPresent}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
              Terlambat: <strong>{kpiStats.totalLate}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-medium">
              Pulang Awal: <strong>{kpiStats.totalEarly}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
              Cuti/Izin: <strong>{kpiStats.totalLeaves}</strong>
            </span>
            {currentTab === 'daily' && (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  Libur: <strong>{kpiStats.totalOff}</strong>
                </span>
                {kpiStats.totalPending > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                    Belum Hadir: <strong>{kpiStats.totalPending}</strong>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* --- MAIN REPORT TABLE --- */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* 1. REKAP HARIAN */}
          {currentTab === 'daily' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">NIP</TableHead>
                  <TableHead className="text-xs">Nama Pegawai</TableHead>
                  <TableHead className="text-xs">Unit Kerja</TableHead>
                  <TableHead className="text-xs">Shift</TableHead>
                  <TableHead className="text-xs">Jam Masuk</TableHead>
                  <TableHead className="text-xs">Jam Pulang</TableHead>
                  <TableHead className="text-xs">Terlambat</TableHead>
                  <TableHead className="text-xs">Pulang Awal</TableHead>
                  <TableHead className="text-xs">Durasi</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center text-xs text-muted-foreground">
                      Tidak ada data yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  dailyRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{row.employee_code}</TableCell>
                      <TableCell className="font-medium text-xs text-foreground">{row.employee_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.unit_name}</TableCell>
                      <TableCell className="text-xs">{row.shift_name}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-emerald-600">
                        {row.clock_in ? row.clock_in.substring(0, 5) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-blue-600">
                        {row.clock_out ? row.clock_out.substring(0, 5) : '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {row.late_minutes > 0 ? (
                          <span className="text-amber-600 font-semibold">+{row.late_minutes}m</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {row.early_minutes > 0 ? (
                          <span className="text-orange-600 font-semibold">-{row.early_minutes}m</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{row.work_duration}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={`text-[11px] py-0 px-2 font-normal ${row.badgeClass}`}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {row.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 2. REKAP BULANAN */}
          {currentTab === 'monthly' && (
            monthlyViewMode === 'summary' ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="text-xs">NIP</TableHead>
                    <TableHead className="text-xs">Nama Pegawai</TableHead>
                    <TableHead className="text-xs">Unit Kerja</TableHead>
                    <TableHead className="text-center text-xs text-emerald-600 font-semibold">Hadir (H)</TableHead>
                    <TableHead className="text-center text-xs text-amber-600 font-semibold">Terlambat (T)</TableHead>
                    <TableHead className="text-center text-xs text-purple-600 font-semibold">Cuti (C)</TableHead>
                    <TableHead className="text-center text-xs text-blue-600 font-semibold">Sakit (S)</TableHead>
                    <TableHead className="text-center text-xs text-cyan-600 font-semibold">Izin (I)</TableHead>
                    <TableHead className="text-center text-xs text-rose-600 font-semibold">Alpa (A)</TableHead>
                    <TableHead className="text-xs">Total Jam</TableHead>
                    <TableHead className="text-xs">% Hadir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-32 text-center text-xs text-muted-foreground">
                        Belum ada data absensi untuk bulan ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlySummaries.map((m, idx) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{m.employee_code}</TableCell>
                        <TableCell className="font-medium text-xs text-foreground">{m.employee_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.unit_name}</TableCell>
                        <TableCell className="text-center font-mono font-semibold text-emerald-600 text-xs">
                          {m.presentDays}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold text-amber-600 text-xs">
                          {m.lateDays}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">{m.leaveDays}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{m.sickDays}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{m.permitDays}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-rose-600 font-semibold">
                          {m.absentDays}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{m.totalHoursFormatted}</TableCell>
                        <TableCell className="text-xs font-mono font-bold">
                          <span className={m.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}>
                            {m.attendanceRate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="py-2.5 px-3 text-left sticky left-0 bg-muted/90 min-w-44 z-10 text-xs font-medium text-muted-foreground">
                        Nama Pegawai
                      </th>
                      {daysInSelectedMonth.map((d) => (
                        <th
                          key={d.dayNum}
                          className={`py-2 px-1 min-w-7 text-[11px] font-medium ${
                            d.isWeekend ? 'bg-rose-500/10 text-rose-600 font-bold' : 'text-muted-foreground'
                          }`}
                        >
                          {d.dayNum}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthlySummaries.map((emp) => {
                      const empAtts = attendances.filter((a) => a.employee_id === emp.id);
                      const attByDate = new Map<string, AttendanceRecord>();
                      empAtts.forEach((a) => attByDate.set(a.date, a));

                      return (
                        <tr key={emp.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 text-left font-medium sticky left-0 bg-card z-10 truncate max-w-48 border-r border-border text-xs">
                            {emp.employee_name}
                          </td>
                          {daysInSelectedMonth.map((d) => {
                            const att = attByDate.get(d.dateStr);
                            const leave = getEmployeeLeaveForDate(emp.id, d.dateStr);

                            let text = '-';
                            let cls = 'text-muted-foreground/30';

                            if (att) {
                              if (att.late_minutes > 0) {
                                text = 'T';
                                cls = 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold';
                              } else {
                                text = 'H';
                                cls = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold';
                              }
                            } else if (leave) {
                              text = 'C';
                              cls = 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold';
                            } else if (d.isWeekend) {
                              text = 'OFF';
                              cls = 'bg-muted/40 text-muted-foreground/50 text-[10px]';
                            }

                            return (
                              <td key={d.dayNum} className={`py-1.5 px-0.5 border-r border-border/40 text-[11px] ${cls}`}>
                                {text}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* 3. REKAP PER PEGAWAI */}
          {currentTab === 'employee' && (
            <div>
              {selectedEmployeeObj && (
                <div className="p-3 bg-muted/20 border-b border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground text-sm">
                      {selectedEmployeeObj.first_name} {selectedEmployeeObj.last_name || ''}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      (NIP: {selectedEmployeeObj.employee_id} | Unit: {selectedEmployeeObj.unit_name} | {selectedEmployeeObj.position})
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span>Total Presensi: <strong className="text-emerald-600">{employeeSpecificLogs.length} Hari</strong></span>
                    <span>Terlambat: <strong className="text-amber-600">{employeeSpecificLogs.filter(l => l.late_minutes > 0).length} Kali</strong></span>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="text-xs">Tanggal</TableHead>
                    <TableHead className="text-xs">Shift / Jadwal</TableHead>
                    <TableHead className="text-xs">Jam Masuk</TableHead>
                    <TableHead className="text-xs">Jam Pulang</TableHead>
                    <TableHead className="text-xs">Keterlambatan</TableHead>
                    <TableHead className="text-xs">Durasi Kerja</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeSpecificLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                        Belum ada riwayat absensi untuk pegawai ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeeSpecificLogs.map((log, idx) => {
                      const dur = calculateDurationMinutes(log.clock_in, log.clock_out);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{log.date}</TableCell>
                          <TableCell className="text-xs">{log.work_schedule_name || 'Reguler'}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-emerald-600">
                            {log.clock_in ? log.clock_in.substring(0, 5) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-blue-600">
                            {log.clock_out ? log.clock_out.substring(0, 5) : '-'}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.late_minutes > 0 ? (
                              <span className="text-amber-600 font-semibold">+{log.late_minutes}m</span>
                            ) : (
                              <span className="text-muted-foreground">Tepat Waktu</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{formatMinutesToHours(dur)}</TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant="outline"
                              className={log.late_minutes > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 4. REKAP PER UNIT (Matriks 1-31) */}
          {currentTab === 'unit' && (
            <div className="space-y-4">
              {/* Legend Bar */}
              <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-muted/40 border-b border-border text-xs">
                <span className="font-semibold text-foreground">Keterangan:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">H</span>
                  <span className="text-muted-foreground">Hadir Tepat Waktu (Hijau)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-[11px] shadow-xs">T</span>
                  <span className="text-muted-foreground">Terlambat (Kuning)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-semibold text-[11px] border border-border/50">L</span>
                  <span className="text-muted-foreground">Libur (Abu-abu)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">C</span>
                  <span className="text-muted-foreground">Cuti / Izin (Biru)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-rose-500 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">A</span>
                  <span className="text-muted-foreground">Jadwal Shift / Belum Hadir (Merah)</span>
                </span>
              </div>

              {unitMatrixData.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  Tidak ada data unit kerja.
                </div>
              ) : (
                unitMatrixData.map((unit) => (
                  <div key={unit.unit_id} className="border-b last:border-b-0 border-border">
                    {/* Unit Header */}
                    <div className="px-4 py-2.5 bg-muted/60 border-y border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-bold text-sm text-foreground">{unit.unit_name}</span>
                        <Badge variant="outline" className="text-[11px] font-normal bg-background">
                          {unit.staffCount} Pegawai
                        </Badge>
                      </div>
                    </div>

                    {unit.rows.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        Belum ada pegawai terdaftar di unit ini.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border">
                              <th className="py-2.5 px-3 text-left sticky left-0 bg-muted/95 min-w-56 z-10 text-xs font-semibold text-foreground border-r border-border">
                                Nama Pegawai
                              </th>
                              {daysInSelectedMonth.map((d) => (
                                <th
                                  key={d.dayNum}
                                  className={`py-2 px-1 min-w-7 text-[11px] font-semibold border-r border-border/40 ${
                                    d.isWeekend ? 'bg-rose-500/10 text-rose-600 font-bold' : 'text-muted-foreground'
                                  }`}
                                >
                                  {d.dayNum}
                                </th>
                              ))}
                              <th className="py-2 px-2 text-center text-xs font-semibold text-emerald-600 min-w-10">H</th>
                              <th className="py-2 px-2 text-center text-xs font-semibold text-amber-600 min-w-10">T</th>
                              <th className="py-2 px-2 text-center text-xs font-semibold text-slate-500 min-w-10">L</th>
                              <th className="py-2 px-2 text-center text-xs font-semibold text-blue-600 min-w-10">C</th>
                              <th className="py-2 px-2 text-center text-xs font-semibold text-rose-600 min-w-10">A</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {unit.rows.map((row) => (
                              <tr key={row.id} className="hover:bg-muted/10">
                                <td className="py-2 px-3 text-left sticky left-0 bg-card z-10 border-r border-border min-w-56">
                                  <div className="font-medium text-xs text-foreground truncate">{row.employee_name}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">{row.employee_code} • {row.position}</div>
                                </td>
                                {row.dayCells.map((cell) => (
                                  <td
                                    key={cell.dayNum}
                                    title={cell.title}
                                    className={`py-1 px-0.5 border-r border-border/40 text-[11px] cursor-default transition-colors ${cell.cellClass}`}
                                  >
                                    {cell.label}
                                  </td>
                                ))}
                                <td className="py-2 px-1 text-center font-mono font-bold text-emerald-600 text-xs border-r border-border/40">
                                  {row.presentDays}
                                </td>
                                <td className="py-2 px-1 text-center font-mono font-bold text-amber-600 text-xs border-r border-border/40">
                                  {row.lateDays}
                                </td>
                                <td className="py-2 px-1 text-center font-mono font-medium text-slate-500 text-xs border-r border-border/40">
                                  {row.offDays}
                                </td>
                                <td className="py-2 px-1 text-center font-mono font-bold text-blue-600 text-xs border-r border-border/40">
                                  {row.leaveDays}
                                </td>
                                <td className="py-2 px-1 text-center font-mono font-bold text-rose-600 text-xs">
                                  {row.absentDays}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. REKAP PER SHIFT */}
          {currentTab === 'shift' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Nama Shift</TableHead>
                  <TableHead className="text-xs">Jadwal Jam Kerja</TableHead>
                  <TableHead className="text-center text-xs">Total Presensi</TableHead>
                  <TableHead className="text-center text-xs text-emerald-600 font-semibold">Tepat Waktu</TableHead>
                  <TableHead className="text-center text-xs text-amber-600 font-semibold">Terlambat</TableHead>
                  <TableHead className="text-xs">Tingkat Kepatuhan (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftSummaries.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-xs text-foreground">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.clock_in_time} - {s.clock_out_time}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{s.count}</TableCell>
                    <TableCell className="text-center font-mono font-semibold text-emerald-600 text-xs">{s.onTimeCount}</TableCell>
                    <TableCell className="text-center font-mono font-semibold text-amber-600 text-xs">{s.lateCount}</TableCell>
                    <TableCell className="text-xs font-mono font-bold">
                      <span className={s.rate >= 90 ? 'text-emerald-600' : 'text-amber-600'}>{s.rate}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 6. REKAP KETERLAMBATAN */}
          {currentTab === 'late' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">NIP</TableHead>
                  <TableHead className="text-xs">Nama Pegawai</TableHead>
                  <TableHead className="text-xs">Unit Kerja</TableHead>
                  <TableHead className="text-xs">Shift</TableHead>
                  <TableHead className="text-xs">Jadwal Masuk</TableHead>
                  <TableHead className="text-xs">Aktual Masuk</TableHead>
                  <TableHead className="text-xs text-amber-600 font-semibold">Keterlambatan</TableHead>
                  <TableHead className="text-xs">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lateAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-xs text-emerald-600 font-medium">
                      Tidak ada data keterlambatan pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  lateAudits.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.date}</TableCell>
                      <TableCell className="font-mono text-xs">{item.employee_code}</TableCell>
                      <TableCell className="font-medium text-xs text-foreground">{item.employee_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.unit_name}</TableCell>
                      <TableCell className="text-xs">{item.work_schedule_name || 'Reguler'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.schedule_clock_in || '08:00'}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-amber-600">
                        {item.clock_in ? item.clock_in.substring(0, 5) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-amber-600">
                        +{item.late_minutes} Menit
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 7. REKAP PULANG CEPAT */}
          {currentTab === 'early' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">NIP</TableHead>
                  <TableHead className="text-xs">Nama Pegawai</TableHead>
                  <TableHead className="text-xs">Unit Kerja</TableHead>
                  <TableHead className="text-xs">Jadwal Pulang</TableHead>
                  <TableHead className="text-xs">Aktual Pulang</TableHead>
                  <TableHead className="text-xs text-orange-600 font-semibold">Selisih Pulang Awal</TableHead>
                  <TableHead className="text-xs">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earlyAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-xs text-emerald-600 font-medium">
                      Tidak ada catatan pegawai yang pulang lebih cepat dari jadwal.
                    </TableCell>
                  </TableRow>
                ) : (
                  earlyAudits.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.date}</TableCell>
                      <TableCell className="font-mono text-xs">{item.employee_code}</TableCell>
                      <TableCell className="font-medium text-xs text-foreground">{item.employee_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.unit_name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.schedule_clock_out || '16:00'}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-orange-600">
                        {item.clock_out ? item.clock_out.substring(0, 5) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-orange-600">
                        -{item.earlyMinutes} Menit
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 8. REKAP KETIDAKHADIRAN */}
          {currentTab === 'absence' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Periode</TableHead>
                  <TableHead className="text-xs">NIP</TableHead>
                  <TableHead className="text-xs">Nama Pegawai</TableHead>
                  <TableHead className="text-xs">Unit Kerja</TableHead>
                  <TableHead className="text-xs">Kategori</TableHead>
                  <TableHead className="text-center text-xs">Durasi</TableHead>
                  <TableHead className="text-xs">Alasan</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absenceRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                      Tidak ada riwayat ketidakhadiran pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  absenceRows.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.period}</TableCell>
                      <TableCell className="font-mono text-xs">{item.employee_code}</TableCell>
                      <TableCell className="font-medium text-xs text-foreground">{item.employee_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.unit_name}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-semibold">{item.duration} Hari</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.reason}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 9. REKAP LEMBUR */}
          {currentTab === 'overtime' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">NIP</TableHead>
                  <TableHead className="text-xs">Nama Pegawai</TableHead>
                  <TableHead className="text-xs">Unit Kerja</TableHead>
                  <TableHead className="text-xs">Shift</TableHead>
                  <TableHead className="text-xs">Jam Masuk</TableHead>
                  <TableHead className="text-xs">Jam Pulang</TableHead>
                  <TableHead className="text-xs">Total Jam Kerja</TableHead>
                  <TableHead className="text-xs text-emerald-600 font-semibold">Estimasi Lembur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overtimeAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                      Tidak ada catatan lembur yang melebihi batas jadwal pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  overtimeAudits.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.date}</TableCell>
                      <TableCell className="font-mono text-xs">{item.employee_code}</TableCell>
                      <TableCell className="font-medium text-xs text-foreground">{item.employee_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.unit_name}</TableCell>
                      <TableCell className="text-xs">{item.work_schedule_name || 'Reguler'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.clock_in ? item.clock_in.substring(0, 5) : '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.clock_out ? item.clock_out.substring(0, 5) : '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.workDuration}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-emerald-600">
                        +{item.overtimeFormatted}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 10. REKAP JAM KERJA */}
          {currentTab === 'workhours' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">NIP</TableHead>
                  <TableHead className="text-xs">Nama Pegawai</TableHead>
                  <TableHead className="text-xs">Unit Kerja</TableHead>
                  <TableHead className="text-center text-xs">Hari Hadir</TableHead>
                  <TableHead className="text-xs">Total Jam Kerja</TableHead>
                  <TableHead className="text-xs">Rata-rata / Hari</TableHead>
                  <TableHead className="text-xs">Target</TableHead>
                  <TableHead className="text-xs">Deviasi</TableHead>
                  <TableHead className="text-xs">Status Beban</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workHourSummaries.map((w, idx) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{w.employee_code}</TableCell>
                    <TableCell className="font-medium text-xs text-foreground">{w.employee_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{w.unit_name}</TableCell>
                    <TableCell className="text-center font-mono text-xs font-semibold">{w.presentDays}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{w.totalWorkHoursFormatted}</TableCell>
                    <TableCell className="font-mono text-xs">{w.avgHoursPerDay}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">160 Jam</TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className={w.deviationFormatted.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}>
                        {w.deviationFormatted}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={
                          w.workloadStatus === 'Ideal'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : w.workloadStatus.includes('Lembur')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }
                      >
                        {w.workloadStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Printable Signature Block */}
        <div className="hidden print:grid grid-cols-2 gap-12 mt-12 text-xs text-center">
          <div>
            <p className="font-semibold">Dibuat Oleh:</p>
            <p className="text-gray-500">Staf Administrasi & Absensi</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase">( ............................................ )</p>
          </div>
          <div>
            <p className="font-semibold">Mengetahui & Menyetujui:</p>
            <p className="text-gray-500">Kepala Bagian SDM / HRD RSIA</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase">DIMAS WISNU WIRAWAN, S.Kom</p>
          </div>
        </div>
      </div>
    </HrLayout>
  );
}
