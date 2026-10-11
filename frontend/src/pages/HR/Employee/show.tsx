import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  User,
  Briefcase,
  Phone,
  MapPin,
  Clock,
  CalendarDays,
  AlertCircle,
  Users2,
  Printer,
  CreditCard,
  History,
  Timer,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// Helper to format date in Indonesian (e.g. 11 Januari 2001)
function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const cleanDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (!year || !month || !day) return cleanDate;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Attendance Status translation & badge style
function getAttendanceStatusMeta(statusRaw?: string) {
  const s = String(statusRaw || '').toLowerCase().trim();
  if (['present', 'hadir', 'on_time', 'tepat_waktu'].includes(s)) {
    return {
      label: 'Tepat Waktu',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400',
    };
  }
  if (['late', 'terlambat'].includes(s)) {
    return {
      label: 'Terlambat',
      color: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400',
    };
  }
  if (['early_leave', 'early_departure', 'pulang_cepat', 'pulang cepat'].includes(s)) {
    return {
      label: 'Pulang Cepat',
      color: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/50 dark:text-orange-400',
    };
  }
  if (['absent', 'alpha', 'mangkir', 'alpa'].includes(s)) {
    return {
      label: 'Alpha',
      color: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400',
    };
  }
  if (['sick', 'sakit'].includes(s)) {
    return {
      label: 'Sakit',
      color: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400',
    };
  }
  if (['leave', 'cuti', 'permit', 'izin'].includes(s)) {
    return {
      label: 'Cuti / Izin',
      color: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-400',
    };
  }
  const formatted = s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Hadir';
  return {
    label: formatted,
    color: 'bg-muted text-muted-foreground border-border',
  };
}

// Leave Status translation & badge style
function getLeaveStatusMeta(statusRaw?: string) {
  const s = String(statusRaw || '').toLowerCase().trim();
  if (['approved', 'disetujui'].includes(s)) {
    return {
      label: 'Disetujui',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400',
    };
  }
  if (['pending', 'menunggu', 'waiting'].includes(s)) {
    return {
      label: 'Menunggu',
      color: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400',
    };
  }
  if (['rejected', 'ditolak'].includes(s)) {
    return {
      label: 'Ditolak',
      color: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400',
    };
  }
  if (['cancelled', 'dibatalkan'].includes(s)) {
    return {
      label: 'Dibatalkan',
      color: 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400',
    };
  }
  const formatted = s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Menunggu';
  return {
    label: formatted,
    color: 'bg-muted text-muted-foreground border-border',
  };
}

// Reusable Table Pagination Component
function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 px-1 text-xs text-muted-foreground border-t border-border">
      <div className="flex items-center gap-2">
        <span>
          Menampilkan <strong className="font-semibold text-foreground">{from}</strong> -{' '}
          <strong className="font-semibold text-foreground">{to}</strong> dari{' '}
          <strong className="font-semibold text-foreground">{totalItems}</strong> data
        </span>
        <div className="flex items-center gap-1 ml-2">
          <span>Baris:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-6 text-[11px] px-1 bg-background border border-border rounded-none text-foreground cursor-pointer focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-2 text-[11px]">
          Halaman <strong className="font-semibold text-foreground">{currentPage}</strong> dari{' '}
          <strong className="font-semibold text-foreground">{totalPages}</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="h-6 w-6 p-0 rounded-none border-border"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-6 w-6 p-0 rounded-none border-border"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-6 w-6 p-0 rounded-none border-border"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="h-6 w-6 p-0 rounded-none border-border"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function EmployeeShow() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leave' | 'roster' | 'history'>('profile');

  // Master data dictionaries
  const [orgUnits, setOrgUnits] = useState<Map<number, string>>(new Map());
  const [jobCategories, setJobCategories] = useState<Map<number, string>>(new Map());
  const [employmentStatuses, setEmploymentStatuses] = useState<Map<number, string>>(new Map());
  const [educationLevels, setEducationLevels] = useState<Map<number, string>>(new Map());

  // Additional detail relations
  const [families, setFamilies] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [workHistories, setWorkHistories] = useState<any[]>([]);

  // Attendance, Leaves & Roster records
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);

  // Filter & Pagination for Attendance Tab
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'late' | 'early_leave' | 'absent' | 'sick' | 'leave'>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(10);

  // Filter & Pagination for Leave Tab
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leavePage, setLeavePage] = useState(1);
  const [leavePageSize, setLeavePageSize] = useState(10);

  // Filter & Pagination for Roster Tab
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(10);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.allSettled([
      api.get(`/employees/${id}`),
      api.get('/org-units?perPage=1000'),
      api.get('/job-categories?perPage=1000'),
      api.get('/employment-statuses?perPage=1000'),
      api.get('/education-levels?perPage=1000'),
      api.get(`/employees/${id}/families`),
      api.get(`/employees/${id}/educations`),
      api.get(`/employees/${id}/work-histories`),
      api.get(`/attendances?employee_id=${id}&perPage=100`),
      api.get(`/leaves?employee_id=${id}&perPage=100`),
      api.get(`/roster-schedules?employee_id=${id}&perPage=100`),
    ]).then(([
      empRes,
      unitsRes,
      jobsRes,
      statusesRes,
      edusRes,
      famsRes,
      edusHistRes,
      workHistRes,
      attRes,
      leavesRes,
      rostersRes,
    ]) => {
      // 1. Employee Data
      if (empRes.status === 'fulfilled') {
        setData(empRes.value.data);
      }

      // 2. Units Map
      if (unitsRes.status === 'fulfilled') {
        const raw = unitsRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const map = new Map<number, string>();
        list.forEach((u: any) => map.set(Number(u.id), u.name));
        setOrgUnits(map);
      }

      // 3. Job Categories Map
      if (jobsRes.status === 'fulfilled') {
        const raw = jobsRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const map = new Map<number, string>();
        list.forEach((j: any) => map.set(Number(j.id), j.name));
        setJobCategories(map);
      }

      // 4. Employment Statuses Map
      if (statusesRes.status === 'fulfilled') {
        const raw = statusesRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const map = new Map<number, string>();
        list.forEach((s: any) => map.set(Number(s.id), s.name));
        setEmploymentStatuses(map);
      }

      // 5. Education Levels Map
      if (edusRes.status === 'fulfilled') {
        const raw = edusRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        const map = new Map<number, string>();
        list.forEach((e: any) => map.set(Number(e.id), e.name));
        setEducationLevels(map);
      }

      // 6. Relations
      if (famsRes.status === 'fulfilled') {
        setFamilies(Array.isArray(famsRes.value.data) ? famsRes.value.data : []);
      }
      if (edusHistRes.status === 'fulfilled') {
        setEducations(Array.isArray(edusHistRes.value.data) ? edusHistRes.value.data : []);
      }
      if (workHistRes.status === 'fulfilled') {
        setWorkHistories(Array.isArray(workHistRes.value.data) ? workHistRes.value.data : []);
      }

      // 7. Attendances
      if (attRes.status === 'fulfilled') {
        const raw = attRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        setAttendances(list);
      }

      // 8. Leaves
      if (leavesRes.status === 'fulfilled') {
        const raw = leavesRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        setLeaves(list);
      }

      // 9. Rosters
      if (rostersRes.status === 'fulfilled') {
        const raw = rostersRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || []);
        setRosters(list);
      }

      setLoading(false);
    });
  }, [id]);

  // Accurate Gender label
  const genderLabel = useMemo(() => {
    if (!data?.gender) return '-';
    const g = String(data.gender).toLowerCase().trim();
    if (['m', 'l', 'male', 'pria', 'laki-laki'].includes(g)) return 'Laki-laki';
    if (['f', 'p', 'female', 'wanita', 'perempuan'].includes(g)) return 'Perempuan';
    return data.gender;
  }, [data?.gender]);

  // Calculate age helper
  const age = useMemo(() => {
    if (!data?.date_of_birth) return null;
    const dob = new Date(data.date_of_birth);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }, [data?.date_of_birth]);

  // Calculate tenure helper
  const tenure = useMemo(() => {
    if (!data?.join_date) return null;
    const join = new Date(data.join_date);
    if (isNaN(join.getTime())) return null;
    const now = new Date();
    const totalMonths = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (totalMonths <= 0) return 'Kurang dari 1 bulan';
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) return `${months} bulan`;
    if (months === 0) return `${years} tahun`;
    return `${years} tahun ${months} bulan`;
  }, [data?.join_date]);

  // Attendance statistics
  const attendanceStats = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;
    let totalLateMinutes = 0;
    let absentCount = 0;
    let permitCount = 0;
    let sickCount = 0;

    attendances.forEach((att: any) => {
      const s = (att.status || '').toLowerCase().trim();
      if (['present', 'hadir', 'on_time'].includes(s)) {
        presentCount++;
      } else if (['late', 'terlambat'].includes(s)) {
        lateCount++;
        totalLateMinutes += Number(att.late_minutes) || 0;
      } else if (['early_leave', 'early_departure', 'pulang_cepat'].includes(s)) {
        earlyLeaveCount++;
      } else if (['absent', 'alpha', 'mangkir'].includes(s)) {
        absentCount++;
      } else if (['sick', 'sakit'].includes(s)) {
        sickCount++;
      } else if (['leave', 'permit', 'izin', 'cuti'].includes(s)) {
        permitCount++;
      }
    });

    const totalRecords = attendances.length;
    const totalPresent = presentCount + lateCount + earlyLeaveCount;
    const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 100;

    return {
      total: totalRecords,
      present: presentCount,
      late: lateCount,
      earlyLeave: earlyLeaveCount,
      totalLateMinutes,
      absent: absentCount,
      sick: sickCount,
      permit: permitCount,
      rate: attendanceRate,
    };
  }, [attendances]);

  // Leave quota statistics
  const leaveStats = useMemo(() => {
    const annualQuota = 12;
    let usedDays = 0;
    let pendingCount = 0;

    leaves.forEach((l: any) => {
      const s = (l.status || '').toLowerCase().trim();
      if (s === 'approved' || s === 'disetujui') {
        usedDays += Number(l.total_days) || 0;
      } else if (s === 'pending' || s === 'menunggu') {
        pendingCount++;
      }
    });

    const remainingQuota = Math.max(0, annualQuota - usedDays);

    return {
      annualQuota,
      usedDays,
      remainingQuota,
      pendingCount,
      totalRequests: leaves.length,
    };
  }, [leaves]);

  // Filtered & Paginated Attendance list
  const filteredAttendances = useMemo(() => {
    let list = attendances;
    if (attendanceFilter !== 'all') {
      list = list.filter((att: any) => {
        const s = (att.status || '').toLowerCase().trim();
        if (attendanceFilter === 'present') return ['present', 'hadir', 'on_time'].includes(s);
        if (attendanceFilter === 'late') return ['late', 'terlambat'].includes(s);
        if (attendanceFilter === 'early_leave') return ['early_leave', 'early_departure', 'pulang_cepat'].includes(s);
        if (attendanceFilter === 'absent') return ['absent', 'alpha', 'mangkir'].includes(s);
        if (attendanceFilter === 'sick') return ['sick', 'sakit'].includes(s);
        if (attendanceFilter === 'leave') return ['leave', 'cuti', 'izin', 'permit'].includes(s);
        return true;
      });
    }
    if (attendanceSearch.trim()) {
      const q = attendanceSearch.toLowerCase().trim();
      list = list.filter((att: any) => {
        const dateStr = formatIndonesianDate(att.date).toLowerCase();
        const sched = (att.work_schedule_name || '').toLowerCase();
        const notes = (att.notes || '').toLowerCase();
        const meta = getAttendanceStatusMeta(att.status);
        return dateStr.includes(q) || sched.includes(q) || notes.includes(q) || meta.label.toLowerCase().includes(q);
      });
    }
    return list;
  }, [attendances, attendanceFilter, attendanceSearch]);

  const totalAttendancePages = Math.max(1, Math.ceil(filteredAttendances.length / attendancePageSize));
  const paginatedAttendances = useMemo(() => {
    const start = (attendancePage - 1) * attendancePageSize;
    return filteredAttendances.slice(start, start + attendancePageSize);
  }, [filteredAttendances, attendancePage, attendancePageSize]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceFilter, attendanceSearch, attendancePageSize]);

  // Filtered & Paginated Leaves list
  const filteredLeaves = useMemo(() => {
    let list = leaves;
    if (leaveStatusFilter !== 'all') {
      list = list.filter((l: any) => {
        const s = (l.status || '').toLowerCase().trim();
        if (leaveStatusFilter === 'approved') return ['approved', 'disetujui'].includes(s);
        if (leaveStatusFilter === 'pending') return ['pending', 'menunggu'].includes(s);
        if (leaveStatusFilter === 'rejected') return ['rejected', 'ditolak'].includes(s);
        return true;
      });
    }
    if (leaveSearch.trim()) {
      const q = leaveSearch.toLowerCase().trim();
      list = list.filter((l: any) => {
        const typeName = (l.leave_type_name || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        const deleg = (l.delegation_to_name || '').toLowerCase();
        const meta = getLeaveStatusMeta(l.status);
        return typeName.includes(q) || reason.includes(q) || deleg.includes(q) || meta.label.toLowerCase().includes(q);
      });
    }
    return list;
  }, [leaves, leaveStatusFilter, leaveSearch]);

  const totalLeavePages = Math.max(1, Math.ceil(filteredLeaves.length / leavePageSize));
  const paginatedLeaves = useMemo(() => {
    const start = (leavePage - 1) * leavePageSize;
    return filteredLeaves.slice(start, start + leavePageSize);
  }, [filteredLeaves, leavePage, leavePageSize]);

  useEffect(() => {
    setLeavePage(1);
  }, [leaveStatusFilter, leaveSearch, leavePageSize]);

  // Filtered & Paginated Rosters list
  const filteredRosters = useMemo(() => {
    let list = rosters;
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      list = list.filter((r: any) => {
        const dateStr = formatIndonesianDate(r.date).toLowerCase();
        const sched = (r.work_schedule_name || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        return dateStr.includes(q) || sched.includes(q) || notes.includes(q);
      });
    }
    return list;
  }, [rosters, rosterSearch]);

  const totalRosterPages = Math.max(1, Math.ceil(filteredRosters.length / rosterPageSize));
  const paginatedRosters = useMemo(() => {
    const start = (rosterPage - 1) * rosterPageSize;
    return filteredRosters.slice(start, start + rosterPageSize);
  }, [filteredRosters, rosterPage, rosterPageSize]);

  useEffect(() => {
    setRosterPage(1);
  }, [rosterSearch, rosterPageSize]);

  if (loading) {
    return (
      <HrLayout>
        <div className="w-full flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="h-7 w-7 animate-spin border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Memuat data lengkap profil karyawan...</p>
        </div>
      </HrLayout>
    );
  }

  if (!data) {
    return (
      <HrLayout>
        <div className="w-full py-12 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 bg-destructive/10 text-destructive flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Karyawan Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Data karyawan dengan ID #{id} tidak ada atau telah dihapus.
          </p>
          <Button className="rounded-none h-8 text-xs" onClick={() => navigate('/hr/employees')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Kembali ke Daftar Karyawan
          </Button>
        </div>
      </HrLayout>
    );
  }

  const fullName = `${data.first_name} ${data.last_name || ''}`.trim();
  const unitIdNum = Number(data.organization_unit_id);
  const unitName = orgUnits.get(unitIdNum) || data.organization_unit?.name || (unitIdNum ? `Unit #${unitIdNum}` : '-');
  const jobCatIdNum = Number(data.job_category_id);
  const categoryName = jobCategories.get(jobCatIdNum) || data.job_category?.name || (jobCatIdNum ? `Kategori #${jobCatIdNum}` : '-');
  const empStatIdNum = Number(data.employment_status_id);
  const statusEmpName = employmentStatuses.get(empStatIdNum) || data.employment_status?.name || (empStatIdNum ? `Status #${empStatIdNum}` : 'Karyawan Tetap');
  const eduLevelIdNum = Number(data.education_level_id);
  const educationName = educationLevels.get(eduLevelIdNum) || data.education_level?.name || '-';

  // Family relationships
  const ayah = families.find((f: any) => /ayah|bapak|father/i.test(f.relationship));
  const ibu = families.find((f: any) => /ibu|mama|mother/i.test(f.relationship));
  const pasangan = families.find((f: any) => /istri|suami|pasangan|spouse/i.test(f.relationship));

  // Actual clean address (no hardcoded fallback)
  const fullAddress = [data.address, data.city, data.province]
    .filter(Boolean)
    .join(', ');

  return (
    <HrLayout>
      <div className="w-full space-y-2 pb-16 print:p-0 print:m-0 font-sans">
        {/* =========================================================
            COMPACT HEADER: Proporsional & Rapi
        ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden border-b border-border/80 pb-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Profil &amp; Data Karyawan
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs rounded-none border-border px-2.5"
              onClick={() => navigate('/hr/employees')}
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Kembali</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs rounded-none border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 px-2.5"
              onClick={() => navigate(`/hr/employees/${id}/edit`)}
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs rounded-none bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 px-2.5"
              onClick={() => window.print()}
            >
              <Printer className="h-3 w-3" />
              <span>Cetak / PDF</span>
            </Button>
          </div>
        </div>

        {/* =========================================================
            MAIN GRID: Kolom Kiri & Kolom Kanan
        ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* -------------------------------------------------------
              KOLOM KIRI: Identitas Profil (Kompak, Proporsional)
          ------------------------------------------------------- */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="border border-border bg-card px-3 py-2.5 space-y-2.5">
              {/* Status Badge & Foto */}
              <div className="relative">
                <div className="flex justify-end">
                  <Badge className="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0 rounded-none uppercase tracking-wide">
                    {data.status ? String(data.status).toUpperCase() : 'ACTIVE'}
                  </Badge>
                </div>

                <div className="flex flex-col items-center text-center mt-0.5">
                  <div className="h-20 w-20 overflow-hidden border border-border bg-muted/40 flex items-center justify-center rounded-none shadow-2xs">
                    {data.photo ? (
                      <img
                        src={data.photo}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>

                  <h2 className="text-sm font-extrabold uppercase tracking-tight text-foreground mt-2 leading-tight">
                    {fullName || 'KARYAWAN'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {data.employee_id || `EMP-${data.id}`}
                    {data.nik ? ` • ${data.nik}` : ''}
                  </p>
                  <div className="mt-1">
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 border border-border bg-muted/30 text-foreground inline-block">
                      {data.position || 'STAF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* List Informasi Identitas */}
              <div className="border-t border-border pt-2 space-y-2 text-xs">
                {/* Gender / Umur */}
                <div className="flex items-start gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                      GENDER / UMUR
                    </p>
                    <p className="font-semibold text-foreground text-xs mt-0.5">
                      {genderLabel}
                      {age !== null ? ` • ${age} tahun` : ''}
                    </p>
                  </div>
                </div>

                {/* Kontak */}
                <div className="flex items-start gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                      KONTAK
                    </p>
                    <p className="font-semibold text-foreground text-xs mt-0.5 truncate">
                      {data.phone || '-'}
                      {data.email ? ` • ${data.email}` : ''}
                    </p>
                  </div>
                </div>

                {/* Domisili (Data Asli dari Database) */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                      DOMISILI
                    </p>
                    <p className="font-semibold text-foreground text-xs mt-0.5 leading-snug">
                      {fullAddress || data.address || '-'}
                    </p>
                  </div>
                </div>

                {/* Unit Kerja / Jabatan */}
                <div className="flex items-start gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                      UNIT / JABATAN
                    </p>
                    <p className="font-semibold text-foreground text-xs mt-0.5 truncate">
                      {data.position || 'STAF'} • {unitName !== '-' ? unitName : 'Administrasi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Peringatan Kepegawaian */}
              <div className="space-y-1 pt-0.5">
                <p className="text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 tracking-wider">
                  <span>♥</span> STATUS KEPEGAWAIAN
                </p>

                <div className="p-2 border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-1 rounded-none">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400">
                      STATUS &amp; KATEGORI
                    </p>
                    <p className="font-medium text-foreground text-[11px]">
                      {statusEmpName} • {categoryName}
                    </p>
                  </div>

                  <div className="border-t border-rose-200/60 dark:border-rose-900/60 pt-1">
                    <p className="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400">
                      MASA KERJA
                    </p>
                    <p className="font-medium text-foreground text-[11px]">
                      {tenure || '-'} (Masuk: {formatIndonesianDate(data.join_date)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Cetak Label */}
              <div className="pt-0.5">
                <Button
                  variant="outline"
                  className="w-full h-7 text-xs gap-1.5 rounded-none border-border"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3 w-3" />
                  <span>Cetak Label Pegawai</span>
                </Button>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------
              KOLOM KANAN: TABULASI & SATU CARD TUNGGAL LENGKAP
          ------------------------------------------------------- */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-2">
            {/* Tab Navigation: Bersih & Rapi tanpa scrollbar */}
            <div className="flex flex-wrap items-center gap-0 border-b border-border bg-transparent">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-none",
                  activeTab === 'profile'
                    ? "border-primary text-primary font-bold -mb-px bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span>Detail Profil</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-none",
                  activeTab === 'attendance'
                    ? "border-primary text-primary font-bold -mb-px bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Rekap Absensi</span>
                {attendanceStats.total > 0 && (
                  <span className="text-[10px] px-1 py-0 bg-muted text-muted-foreground font-mono">
                    {attendanceStats.total}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('leave')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-none",
                  activeTab === 'leave'
                    ? "border-primary text-primary font-bold -mb-px bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Cuti &amp; Izin</span>
                {leaves.length > 0 && (
                  <span className="text-[10px] px-1 py-0 bg-muted text-muted-foreground font-mono">
                    {leaves.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-none",
                  activeTab === 'roster'
                    ? "border-primary text-primary font-bold -mb-px bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Timer className="h-3.5 w-3.5" />
                <span>Jadwal &amp; Shift</span>
                {rosters.length > 0 && (
                  <span className="text-[10px] px-1 py-0 bg-muted text-muted-foreground font-mono">
                    {rosters.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-none",
                  activeTab === 'history'
                    ? "border-primary text-primary font-bold -mb-px bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <History className="h-3.5 w-3.5" />
                <span>Riwayat &amp; Keluarga</span>
              </button>
            </div>

            {/* ===================================================
                TAB 1: DETAIL PROFIL (SATU CARD TUNGGAL RINGKAS)
                Padding atas disetel ketat & tanpa celah ganda
            =================================================== */}
            {activeTab === 'profile' && (
              <div className="border border-border bg-card px-3.5 py-2.5 space-y-2.5 divide-y divide-border">
                {/* 1. IDENTITAS LENGKAP */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      IDENTITAS LENGKAP
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        TEMPAT LAHIR
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.place_of_birth || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        TANGGAL LAHIR
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {formatIndonesianDate(data.date_of_birth)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        GOLONGAN DARAH
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.blood_type ? `${data.blood_type}` : '- (-)'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        AGAMA
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.religion || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        STATUS KAWIN
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.marital_status || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        PENDIDIKAN TERAKHIR
                      </p>
                      <p className="font-semibold text-foreground mt-0.5 truncate">
                        {educationName}
                        {data.education_major ? ` (${data.education_major})` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. INFORMASI ALAMAT (Data Asli Database, No Fake Text & Tanpa Box Bertumpuk) */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      INFORMASI ALAMAT
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                    <div className="sm:col-span-2">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        ALAMAT LENGKAP (KTP &amp; DOMISILI)
                      </p>
                      <p className="font-semibold text-foreground mt-0.5 leading-snug">
                        {data.address || fullAddress || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        KOTA / KABUPATEN
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.city || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        PROVINSI
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.province || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        KODE POS
                      </p>
                      <p className="font-semibold font-mono text-foreground mt-0.5">
                        {data.postal_code || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. KELUARGA & PENANGGUNG JAWAB */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Users2 className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      KELUARGA &amp; PENANGGUNG JAWAB
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NAMA AYAH
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {ayah?.name || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NAMA IBU
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {ibu?.name || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NAMA PASANGAN
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {pasangan?.name || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NAMA PENANGGUNG JAWAB (PJ)
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.emergency_contact_name || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        HUBUNGAN PJ
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.emergency_contact_relation || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NO. TELP PJ
                      </p>
                      <p className="font-semibold font-mono text-foreground mt-0.5">
                        {data.emergency_contact_phone || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. LEGALITAS, BPJS & REKENING BANK */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      LEGALITAS, BPJS &amp; REKENING BANK
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NOMOR NPWP
                      </p>
                      <p className="font-semibold font-mono text-foreground mt-0.5">
                        {data.npwp_number || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        BPJS KESEHATAN
                      </p>
                      <p className="font-semibold font-mono text-foreground mt-0.5">
                        {data.bpjs_kesehatan_number || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        BPJS KETENAGAKERJAAN
                      </p>
                      <p className="font-semibold font-mono text-foreground mt-0.5">
                        {data.bpjs_ketenagakerjaan_number || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NAMA BANK
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.bank_name || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        NOMOR REKENING
                      </p>
                      <p className="font-semibold font-mono text-foreground mt-0.5">
                        {data.bank_account_number || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        ATAS NAMA REKENING
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {data.bank_account_name || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================
                TAB 2: REKAP ABSENSI (DENGAN DATATABLE LENGKAP)
            =================================================== */}
            {activeTab === 'attendance' && (
              <div className="border border-border bg-card px-3.5 py-2.5 space-y-2.5">
                {/* Statistik KPI Absensi Ringkas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 border border-border bg-card rounded-none space-y-0.5">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Tingkat Hadir</p>
                    <p className="text-base font-extrabold text-foreground">{attendanceStats.rate}%</p>
                    <p className="text-[9px] text-muted-foreground">
                      {attendanceStats.present + attendanceStats.late + attendanceStats.earlyLeave} dari {attendanceStats.total} log
                    </p>
                  </div>

                  <div className="p-2 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-none space-y-0.5">
                    <p className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider">Tepat Waktu</p>
                    <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">{attendanceStats.present}</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500">Hadir tepat waktu</p>
                  </div>

                  <div className="p-2 border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 rounded-none space-y-0.5">
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider">Terlambat</p>
                    <p className="text-base font-extrabold text-amber-700 dark:text-amber-400">{attendanceStats.late}</p>
                    <p className="text-[9px] text-amber-600 dark:text-amber-500">Total {attendanceStats.totalLateMinutes} mnt</p>
                  </div>

                  <div className="p-2 border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 rounded-none space-y-0.5">
                    <p className="text-[9px] text-rose-700 dark:text-rose-400 uppercase font-bold tracking-wider">Alpha / Izin</p>
                    <p className="text-base font-extrabold text-rose-700 dark:text-rose-400">
                      {attendanceStats.absent + attendanceStats.sick + attendanceStats.permit}
                    </p>
                    <p className="text-[9px] text-rose-600 dark:text-rose-500">
                      Alpha: {attendanceStats.absent} | Izin: {attendanceStats.permit}
                    </p>
                  </div>
                </div>

                {/* Toolbar Data Table: Search & Filter Tabs */}
                <div className="pt-1 flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-border">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari tanggal, shift, catatan..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="w-full h-7 pl-7 pr-7 text-xs bg-background border border-border rounded-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    {attendanceSearch && (
                      <button
                        type="button"
                        onClick={() => setAttendanceSearch('')}
                        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Status Group */}
                  <div className="flex items-center overflow-x-auto border border-border divide-x divide-border">
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('all')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        attendanceFilter === 'all'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Semua ({attendances.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('present')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        attendanceFilter === 'present'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Tepat Waktu
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('late')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        attendanceFilter === 'late'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Terlambat
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('early_leave')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        attendanceFilter === 'early_leave'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Pulang Cepat
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('absent')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        attendanceFilter === 'absent'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Alpha
                    </button>
                  </div>
                </div>

                {/* Tabel Rekap Absensi */}
                {paginatedAttendances.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border">
                    {attendanceSearch || attendanceFilter !== 'all'
                      ? 'Tidak ada data absensi yang sesuai dengan kriteria pencarian / filter.'
                      : 'Belum ada riwayat absensi yang tercatat.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-3 py-1.5">Tanggal</th>
                          <th className="px-3 py-1.5">Jadwal Shift</th>
                          <th className="px-3 py-1.5">Jam Masuk</th>
                          <th className="px-3 py-1.5">Jam Pulang</th>
                          <th className="px-3 py-1.5">Keterlambatan</th>
                          <th className="px-3 py-1.5">Status</th>
                          <th className="px-3 py-1.5">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedAttendances.map((att: any) => {
                          const s = (att.status || '').toLowerCase().trim();
                          const meta = getAttendanceStatusMeta(att.status);

                          return (
                            <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                                {formatIndonesianDate(att.date)}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                                {att.work_schedule_name || 'Reguler'}
                              </td>
                              <td className="px-3 py-1.5 font-mono">
                                {att.clock_in ? (
                                  <span className={s === 'late' ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                                    {att.clock_in.substring(0, 5)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 font-mono">
                                {att.clock_out ? (
                                  <span>{att.clock_out.substring(0, 5)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                {att.late_minutes && att.late_minutes > 0 ? (
                                  <span className="text-amber-600 font-semibold">
                                    +{att.late_minutes} mnt
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <Badge variant="outline" className={cn("text-[9px] font-semibold px-1.5 py-0 rounded-none", meta.color)}>
                                  {meta.label}
                                </Badge>
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground max-w-[200px] truncate">
                                {att.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                <TablePagination
                  currentPage={attendancePage}
                  totalPages={totalAttendancePages}
                  totalItems={filteredAttendances.length}
                  pageSize={attendancePageSize}
                  onPageChange={setAttendancePage}
                  onPageSizeChange={setAttendancePageSize}
                />
              </div>
            )}

            {/* ===================================================
                TAB 3: REKAP CUTI & IZIN (DENGAN DATATABLE LENGKAP)
            =================================================== */}
            {activeTab === 'leave' && (
              <div className="border border-border bg-card px-3.5 py-2.5 space-y-2.5">
                {/* Statistik Kuota Cuti Ringkas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 border border-border bg-card rounded-none space-y-0.5">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Hak Cuti</p>
                    <p className="text-base font-extrabold text-foreground">{leaveStats.annualQuota} Hari</p>
                    <p className="text-[9px] text-muted-foreground">Kuota per tahun</p>
                  </div>

                  <div className="p-2 border border-primary/40 bg-primary/5 rounded-none space-y-0.5">
                    <p className="text-[9px] text-primary uppercase font-bold tracking-wider">Cuti Terpakai</p>
                    <p className="text-base font-extrabold text-primary">{leaveStats.usedDays} Hari</p>
                    <p className="text-[9px] text-primary/80">Disetujui HR</p>
                  </div>

                  <div className="p-2 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-none space-y-0.5">
                    <p className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider">Sisa Cuti</p>
                    <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">{leaveStats.remainingQuota} Hari</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500">Dapat diajukan</p>
                  </div>

                  <div className="p-2 border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 rounded-none space-y-0.5">
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider">Menunggu</p>
                    <p className="text-base font-extrabold text-amber-700 dark:text-amber-400">{leaveStats.pendingCount}</p>
                    <p className="text-[9px] text-amber-600 dark:text-amber-500">Dalam proses</p>
                  </div>
                </div>

                {/* Toolbar Data Table: Search & Filter Tabs */}
                <div className="pt-1 flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-border">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari jenis cuti, alasan, delegasi..."
                      value={leaveSearch}
                      onChange={(e) => setLeaveSearch(e.target.value)}
                      className="w-full h-7 pl-7 pr-7 text-xs bg-background border border-border rounded-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    {leaveSearch && (
                      <button
                        type="button"
                        onClick={() => setLeaveSearch('')}
                        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Status Group */}
                  <div className="flex items-center overflow-x-auto border border-border divide-x divide-border">
                    <button
                      type="button"
                      onClick={() => setLeaveStatusFilter('all')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        leaveStatusFilter === 'all'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Semua ({leaves.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveStatusFilter('approved')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        leaveStatusFilter === 'approved'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Disetujui
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveStatusFilter('pending')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        leaveStatusFilter === 'pending'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Menunggu
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveStatusFilter('rejected')}
                      className={cn(
                        'px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer rounded-none whitespace-nowrap',
                        leaveStatusFilter === 'rejected'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Ditolak
                    </button>
                  </div>
                </div>

                {paginatedLeaves.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border">
                    {leaveSearch || leaveStatusFilter !== 'all'
                      ? 'Tidak ada permohonan cuti yang sesuai dengan filter / pencarian.'
                      : 'Belum ada riwayat permohonan cuti atau izin.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-3 py-1.5">Jenis Cuti</th>
                          <th className="px-3 py-1.5">Periode</th>
                          <th className="px-3 py-1.5">Durasi</th>
                          <th className="px-3 py-1.5">Alasan</th>
                          <th className="px-3 py-1.5">Delegasi Ke</th>
                          <th className="px-3 py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedLeaves.map((l: any) => {
                          const meta = getLeaveStatusMeta(l.status);

                          return (
                            <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-1.5 font-semibold text-foreground whitespace-nowrap">
                                {l.leave_type_name || 'Cuti Tahunan'}
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap font-mono text-muted-foreground">
                                {formatIndonesianDate(l.start_date)} s/d {formatIndonesianDate(l.end_date)}
                              </td>
                              <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                                {l.total_days || 1} Hari
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground max-w-[180px] truncate">
                                {l.reason || '-'}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                                {l.delegation_to_name || '-'}
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <Badge variant="outline" className={cn("text-[9px] font-semibold px-1.5 py-0 rounded-none", meta.color)}>
                                  {meta.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                <TablePagination
                  currentPage={leavePage}
                  totalPages={totalLeavePages}
                  totalItems={filteredLeaves.length}
                  pageSize={leavePageSize}
                  onPageChange={setLeavePage}
                  onPageSizeChange={setLeavePageSize}
                />
              </div>
            )}

            {/* ===================================================
                TAB 4: JADWAL & SHIFT (DENGAN DATATABLE LENGKAP)
            =================================================== */}
            {activeTab === 'roster' && (
              <div className="border border-border bg-card px-3.5 py-2.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    JADWAL SHIFT &amp; ROSTER PEGAWAI
                  </h3>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari tanggal, shift, catatan..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="w-full h-7 pl-7 pr-7 text-xs bg-background border border-border rounded-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    {rosterSearch && (
                      <button
                        type="button"
                        onClick={() => setRosterSearch('')}
                        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {paginatedRosters.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border">
                    {rosterSearch
                      ? 'Tidak ada jadwal shift yang sesuai dengan pencarian.'
                      : 'Belum ada jadwal roster yang ditugaskan khusus untuk karyawan ini.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-3 py-1.5">Tanggal</th>
                          <th className="px-3 py-1.5">Nama Shift</th>
                          <th className="px-3 py-1.5">Jam Kerja</th>
                          <th className="px-3 py-1.5">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedRosters.map((r: any) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                              {formatIndonesianDate(r.date)}
                            </td>
                            <td className="px-3 py-1.5 font-semibold text-foreground whitespace-nowrap">
                              {r.work_schedule_name || 'Shift Reguler'}
                            </td>
                            <td className="px-3 py-1.5 font-mono whitespace-nowrap text-muted-foreground">
                              {r.clock_in_time ? r.clock_in_time.substring(0, 5) : '08:00'} -{' '}
                              {r.clock_out_time ? r.clock_out_time.substring(0, 5) : '16:00'}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {r.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                <TablePagination
                  currentPage={rosterPage}
                  totalPages={totalRosterPages}
                  totalItems={filteredRosters.length}
                  pageSize={rosterPageSize}
                  onPageChange={setRosterPage}
                  onPageSizeChange={setRosterPageSize}
                />
              </div>
            )}

            {/* ===================================================
                TAB 5: KELUARGA & RIWAYAT (SATU CARD RINGKAS)
            =================================================== */}
            {activeTab === 'history' && (
              <div className="border border-border bg-card px-3.5 py-2.5 space-y-2.5 divide-y divide-border">
                {/* 1. Keluarga */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    DATA SUSUNAN KELUARGA
                  </h3>

                  {families.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Belum ada data keluarga yang tercatat.</p>
                  ) : (
                    <div className="overflow-x-auto border border-border">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="px-3 py-1.5">Nama</th>
                            <th className="px-3 py-1.5">Hubungan</th>
                            <th className="px-3 py-1.5">NIK</th>
                            <th className="px-3 py-1.5">Tanggal Lahir</th>
                            <th className="px-3 py-1.5">Pekerjaan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {families.map((fam: any) => (
                            <tr key={fam.id} className="hover:bg-muted/30">
                              <td className="px-3 py-1.5 font-medium">{fam.name}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{fam.relationship}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{fam.nik || '-'}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{formatIndonesianDate(fam.date_of_birth)}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{fam.job || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Pendidikan */}
                <div className="pt-2 space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    RIWAYAT PENDIDIKAN FORMAL
                  </h3>

                  {educations.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Belum ada riwayat pendidikan yang tercatat.</p>
                  ) : (
                    <div className="overflow-x-auto border border-border">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="px-3 py-1.5">Institusi</th>
                            <th className="px-3 py-1.5">Jenjang</th>
                            <th className="px-3 py-1.5">Jurusan</th>
                            <th className="px-3 py-1.5">Tahun Lulus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {educations.map((edu: any) => (
                            <tr key={edu.id} className="hover:bg-muted/30">
                              <td className="px-3 py-1.5 font-medium">{edu.institution_name}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{edu.education_level?.name || edu.level || '-'}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{edu.major || '-'}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{edu.graduation_year || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Pengalaman Kerja */}
                <div className="pt-2 space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    PENGALAMAN KERJA SEBELUMNYA
                  </h3>

                  {workHistories.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Belum ada pengalaman kerja terdahulu.</p>
                  ) : (
                    <div className="overflow-x-auto border border-border">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="px-3 py-1.5">Perusahaan</th>
                            <th className="px-3 py-1.5">Posisi / Jabatan</th>
                            <th className="px-3 py-1.5">Periode</th>
                            <th className="px-3 py-1.5">Deskripsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {workHistories.map((work: any) => (
                            <tr key={work.id} className="hover:bg-muted/30">
                              <td className="px-3 py-1.5 font-medium">{work.company_name}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{work.position}</td>
                              <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap font-mono">
                                {work.start_date?.substring(0, 7)} s/d {work.end_date?.substring(0, 7) || 'Sekarang'}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground max-w-[180px] truncate">{work.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </HrLayout>
  );
}
