import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, X, Check, ChevronsUpDown, Building2, Users, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function RosterPlanner() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);

    // Role & Unit state
    const [roles, setRoles] = useState<any[]>([]);
    const [orgUnits, setOrgUnits] = useState<any[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<number>(0);
    const [rawEmployees, setRawEmployees] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<any>(null);
    const [managedUnit, setManagedUnit] = useState<any>(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Auto Gen State
    const [isAutoGenOpen, setIsAutoGenOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [autoGenForm, setAutoGenForm] = useState({
        targetType: 'all_unit', // 'all_unit' | 'single'
        employeeId: '0',
        startDate: '',
        endDate: '',
        workDaysPattern: 'all',
        offDaysCount: '1',
        workScheduleIds: [] as string[],
        staffingMode: 'auto', // 'auto' (Bagi Rata) | 'custom' (Tentukan Jumlah)
        staffPerShift: '2'
    });
    const [conflictCount, setConflictCount] = useState(0);
    const [isKaryawanOpen, setIsKaryawanOpen] = useState(false);
    const [isPolaOpen, setIsPolaOpen] = useState(false);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [isUnitOpen, setIsUnitOpen] = useState(false);
    const [isModalKaryawanOpen, setIsModalKaryawanOpen] = useState(false);
    const [headedUnits, setHeadedUnits] = useState<any[]>([]);

    // Compute role access
    const roleId = user?.role_id;
    const roleName = (currentUserRole?.name || '').toLowerCase();
    const isAdmin = roleId === 1 || roleId === 7 || roleName === 'admin' || roleName === 'administrator';
    const isKepalaUnit = roleId === 3 || roleName === 'kepala_unit';
    const isKepalaBagian = roleId === 4 || roleName === 'kepala_bagian';

    const setThisWeek = () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() + 1); // Monday
        const end = new Date(today);
        end.setDate(today.getDate() - today.getDay() + 7); // Sunday

        setAutoGenForm(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
    };

    const setThisMonth = () => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();

        setAutoGenForm(prev => ({
            ...prev,
            startDate: `${year}-${month}-01`,
            endDate: `${year}-${month}-${lastDay}`
        }));
    };

    const handleAutoGenerate = async (overwrite: boolean) => {
        if (!selectedUnitId) {
            return toast.error("Unit kerja belum ditentukan!");
        }
        setLoading(true);
        try {
            const targetEmpId = autoGenForm.targetType === 'single'
                ? (parseInt(autoGenForm.employeeId) || parseInt(selectedUserId) || 0)
                : 0;

            const staffCount = autoGenForm.targetType === 'all_unit' && autoGenForm.staffingMode === 'custom'
                ? (parseInt(autoGenForm.staffPerShift) || 1)
                : 0;

            const payload = {
                employee_id: targetEmpId,
                unit_id: selectedUnitId,
                start_date: autoGenForm.startDate,
                end_date: autoGenForm.endDate,
                work_days_pattern: autoGenForm.workDaysPattern,
                off_days_count: parseInt(autoGenForm.offDaysCount) || 0,
                work_schedule_ids: autoGenForm.workScheduleIds.map(id => parseInt(id)),
                staff_per_shift: staffCount,
                overwrite: overwrite,
                check_only: false
            };
            await api.post('/roster-schedules/auto-generate', payload);
            toast.success(
                autoGenForm.targetType === 'all_unit'
                    ? "Jadwal seluruh anggota unit berhasil digenerate merata tanpa bentrok!"
                    : "Jadwal pegawai berhasil di-generate!"
            );
            setIsAutoGenOpen(false);
            setIsConfirmOpen(false);
            fetchInitialData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Gagal generate jadwal");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckConflicts = async () => {
        if (!autoGenForm.startDate || !autoGenForm.endDate || autoGenForm.workScheduleIds.length === 0) {
            return toast.error("Harap isi rentang waktu dan minimal 1 shift!");
        }

        setLoading(true);
        try {
            const targetEmpId = autoGenForm.targetType === 'single'
                ? (parseInt(autoGenForm.employeeId) || parseInt(selectedUserId) || 0)
                : 0;

            const staffCount = autoGenForm.targetType === 'all_unit' && autoGenForm.staffingMode === 'custom'
                ? (parseInt(autoGenForm.staffPerShift) || 1)
                : 0;

            const payload = {
                employee_id: targetEmpId,
                unit_id: selectedUnitId,
                start_date: autoGenForm.startDate,
                end_date: autoGenForm.endDate,
                work_days_pattern: autoGenForm.workDaysPattern,
                off_days_count: parseInt(autoGenForm.offDaysCount) || 0,
                work_schedule_ids: autoGenForm.workScheduleIds.map(id => parseInt(id)),
                staff_per_shift: staffCount,
                overwrite: false,
                check_only: true
            };
            const res = await api.post('/roster-schedules/auto-generate', payload);
            const conflicts = res.data?.conflicts || 0;

            if (conflicts > 0) {
                setConflictCount(conflicts);
                setIsConfirmOpen(true);
            } else {
                // No conflicts, generate immediately
                await handleAutoGenerate(false);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Gagal mengecek konflik");
        } finally {
            setLoading(false);
        }
    };

    const handleUnitChange = (newUnitId: number) => {
        if (!isAdmin) {
            const isAllowed = headedUnits.some((u: any) => u.id === newUnitId);
            if (!isAllowed && headedUnits.length > 0) {
                toast.error("Anda hanya dapat mengakses unit yang Anda kepalai.");
                return;
            }
        }
        setSelectedUnitId(newUnitId);
        const unitEmps = rawEmployees.filter((e: any) => !newUnitId || e.organization_unit_id === newUnitId);
        const userOpts = unitEmps.map((u: any) => ({
            id: u.id.toString(),
            value: u.id.toString(),
            name: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : ''),
            label: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : '')
        }));
        setUsers(userOpts);
        if (userOpts.length > 0) {
            setSelectedUserId(userOpts[0].id);
        } else {
            setSelectedUserId('');
        }

        const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        api.get(`/roster-schedules/unit/${newUnitId}/${yearMonth}`).then(res => {
            setRosters(res.data || []);
        });
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [shiftRes, unitRes, empRes, roleRes] = await Promise.all([
                api.get('/work-schedules'),
                api.get('/org-units?perPage=1000'),
                api.get('/employees?perPage=1000'),
                api.get('/roles')
            ]);

            const shiftList = shiftRes.data || [];
            setShifts(shiftList);

            if (autoGenForm.workScheduleIds.length === 0 && shiftList.length > 0) {
                setAutoGenForm(prev => ({
                    ...prev,
                    workScheduleIds: shiftList.map((s: any) => s.id.toString())
                }));
            }

            const unitList = unitRes.data?.data || [];
            setOrgUnits(unitList);

            const allEmployees = empRes.data?.data || [];
            setRawEmployees(allEmployees);

            const allRoles = roleRes.data?.data || [];
            setRoles(allRoles);

            let myRoleId = user?.role_id;
            if (!myRoleId) {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        myRoleId = payload.role_id;
                    } catch (_) {}
                }
            }

            const matchedRole = allRoles.find((r: any) => r.id === myRoleId);
            if (matchedRole) setCurrentUserRole(matchedRole);

            const isUserAdmin = myRoleId === 1 || myRoleId === 7 || matchedRole?.name?.toLowerCase() === 'admin' || matchedRole?.name?.toLowerCase() === 'administrator';

            // Find units headed by current user
            let myUnits = unitList.filter((u: any) => user && u.head_id === user.id);
            if (myUnits.length === 0 && user) {
                const myEmp = allEmployees.find((e: any) => e.user_id === user.id);
                if (myEmp) {
                    myUnits = unitList.filter((u: any) => u.head_id === myEmp.id || u.id === myEmp.organization_unit_id);
                }
            }
            setHeadedUnits(myUnits);

            let myUnit = myUnits.length > 0 ? myUnits[0] : null;
            if (!myUnit && user) {
                const myEmp = allEmployees.find((e: any) => e.user_id === user.id);
                if (myEmp && myEmp.organization_unit_id) {
                    myUnit = unitList.find((u: any) => u.id === myEmp.organization_unit_id);
                }
            }
            if (myUnit) setManagedUnit(myUnit);

            let activeUnitId = selectedUnitId;
            if (!isUserAdmin) {
                // Non-admin MUST be locked to their headed unit
                if (myUnits.length > 0) {
                    activeUnitId = myUnits[0].id;
                } else if (myUnit) {
                    activeUnitId = myUnit.id;
                } else if (unitList.length > 0) {
                    activeUnitId = unitList[0].id;
                }
            } else {
                if (!activeUnitId || activeUnitId === 0) {
                    if (myUnit) {
                        activeUnitId = myUnit.id;
                    } else if (unitList.length > 0) {
                        activeUnitId = unitList[0].id;
                    }
                }
            }
            setSelectedUnitId(activeUnitId);

            const unitEmps = allEmployees.filter((e: any) => !activeUnitId || e.organization_unit_id === activeUnitId);
            const userOpts = unitEmps.map((u: any) => ({
                id: u.id.toString(),
                value: u.id.toString(),
                name: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : ''),
                label: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : '')
            }));
            setUsers(userOpts);

            if (userOpts.length > 0) {
                setSelectedUserId(prev => (prev && userOpts.some((u: any) => u.id === prev)) ? prev : userOpts[0].id);
            }

            const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const rosterRes = await api.get(`/roster-schedules/unit/${activeUnitId}/${yearMonth}`);
            setRosters(rosterRes.data || []);

            try {
                const leavesRes = await api.get('/leaves?perPage=1000');
                const allLeaves = Array.isArray(leavesRes.data?.data) ? leavesRes.data.data : (Array.isArray(leavesRes.data) ? leavesRes.data : []);
                setLeaves(allLeaves.filter((l: any) => l.status === 'approved'));
            } catch (err) {
                console.error("Gagal memuat data cuti", err);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data roster");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [currentDate]);

    // Jika users sudah di-load tapi belum ada yang di-select, select yang pertama
    useEffect(() => {
        if (users.length > 0 && !selectedUserId) {
            setSelectedUserId(users[0].id.toString());
        }
    }, [users]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const days = getDaysInMonth(currentDate);
    const START_HOUR = 7;
    const hours = Array.from({ length: 24 }, (_, i) => (i + START_HOUR) % 24);

    const formatTime = (t: string) => {
        if (!t) return '-';
        const match = t.match(/T(\d{2}:\d{2})/);
        if (match) return match[1];
        return t.length >= 5 ? t.substring(0, 5) : t;
    };

    // Fungsi untuk mengubah string waktu (HH:mm) menjadi angka desimal (misal 07:30 -> 7.5)
    const timeToDecimal = (t: string) => {
        const str = formatTime(t);
        if (str === '-') return 0;
        const [h, m] = str.split(':').map(Number);
        return h + (m / 60);
    };

    // Helper: Cari apakah karyawan sedang cuti yang disetujui pada tanggal tertentu
    const getLeaveForDate = (dateObj: Date, employeeId: number) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;

        return leaves.find((l: any) => {
            if (Number(l.employee_id) !== employeeId) return false;
            const start = (l.start_date || '').substring(0, 10);
            const end = (l.end_date || '').substring(0, 10);
            return dateStr >= start && dateStr <= end;
        });
    };

    // Generate warna unik untuk shift
    const getShiftColor = (shiftId: number) => {
        const colors = [
            'bg-blue-500 border-blue-600 text-white',
            'bg-emerald-500 border-emerald-600 text-white',
            'bg-amber-500 border-amber-600 text-white',
            'bg-purple-500 border-purple-600 text-white',
            'bg-pink-500 border-pink-600 text-white',
            'bg-cyan-500 border-cyan-600 text-white',
            'bg-rose-500 border-rose-600 text-white',
            'bg-indigo-500 border-indigo-600 text-white',
        ];
        return colors[shiftId % colors.length];
    };

    // DND Handlers
    const handleDragStart = (e: React.DragEvent, shiftId: number) => {
        e.dataTransfer.setData('shiftId', shiftId.toString());
    };

    const handleDragOver = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        if (dragOverDate !== dateStr) setDragOverDate(dateStr);
    };

    const handleDragLeave = () => {
        setDragOverDate(null);
    };

    const handleDrop = async (e: React.DragEvent, dateObj: Date) => {
        e.preventDefault();
        setDragOverDate(null);
        if (!selectedUserId) return toast.error("Pilih karyawan terlebih dahulu!");

        const employeeId = parseInt(selectedUserId);
        const leaveOnDate = getLeaveForDate(dateObj, employeeId);
        if (leaveOnDate) {
            return toast.error(`Karyawan sedang ${leaveOnDate.leave_type_name || 'Cuti'} pada tanggal ini (${leaveOnDate.reason || 'Izin Cuti'})`);
        }

        const shiftIdStr = e.dataTransfer.getData('shiftId');
        if (!shiftIdStr) return;

        const shiftId = parseInt(shiftIdStr);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        await saveAssign(employeeId, dateStr, shiftId);
    };

    // Validasi anti-berpotongan (no overlap) di sisi frontend untuk respon instan
    const checkOverlapFrontend = (employeeId: number, targetDateStr: string, newShiftId: number) => {
        const newShift = shifts.find(s => s.id === newShiftId);
        if (!newShift) return null;

        const newIn = timeToDecimal(newShift.clock_in_time);
        const newOut = timeToDecimal(newShift.clock_out_time);
        const newDuration = newOut > newIn ? (newOut - newIn) : (newOut + 24 - newIn);

        const newStart = newIn;
        const newEnd = newIn + newDuration;

        const targetDate = new Date(targetDateStr + "T00:00:00");
        const offsets = [-1, 0, 1];

        for (const offset of offsets) {
            const checkD = new Date(targetDate);
            checkD.setDate(checkD.getDate() + offset);
            const dStr = `${checkD.getFullYear()}-${String(checkD.getMonth() + 1).padStart(2, '0')}-${String(checkD.getDate()).padStart(2, '0')}`;

            const dayRosters = rosters.filter(r => r.employee_id === employeeId && r.date.startsWith(dStr));
            for (const r of dayRosters) {
                if (offset === 0 && r.work_schedule_id === newShiftId) {
                    return `Shift ${newShift.name} sudah terdaftar pada tanggal ini.`;
                }
                const existShift = shifts.find(s => s.id === r.work_schedule_id);
                if (!existShift) continue;

                const existIn = timeToDecimal(existShift.clock_in_time);
                const existOut = timeToDecimal(existShift.clock_out_time);
                const existDur = existOut > existIn ? (existOut - existIn) : (existOut + 24 - existIn);

                const existStart = (offset * 24) + existIn;
                const existEnd = existStart + existDur;

                // Cek irisan waktu
                if (Math.max(newStart, existStart) < Math.min(newEnd, existEnd)) {
                    return `Jadwal bentrok! Shift ${newShift.name} (${formatTime(newShift.clock_in_time)} - ${formatTime(newShift.clock_out_time)}) berpotongan dengan ${existShift.name} (${formatTime(existShift.clock_in_time)} - ${formatTime(existShift.clock_out_time)}).`;
                }
            }
        }
        return null;
    };

    const saveAssign = async (employeeId: number, dateStr: string, shiftId: number, deleteShiftId?: number) => {
        // Cek bentrok jam shift baru
        if (shiftId > 0) {
            const conflictErr = checkOverlapFrontend(employeeId, dateStr, shiftId);
            if (conflictErr) {
                toast.error(conflictErr);
                return;
            }
        }

        // Optimistic Update
        const newRoster = { employee_id: employeeId, date: `${dateStr}T00:00:00Z`, work_schedule_id: shiftId };

        setRosters(prev => {
            if (shiftId === 0) {
                if (deleteShiftId) {
                    return prev.filter(r => !(r.employee_id === employeeId && r.date.startsWith(dateStr) && r.work_schedule_id === deleteShiftId));
                }
                return prev.filter(r => !(r.employee_id === employeeId && r.date.startsWith(dateStr)));
            }
            const exists = prev.some(r => r.employee_id === employeeId && r.date.startsWith(dateStr) && r.work_schedule_id === shiftId);
            if (exists) return prev;
            return [...prev, newRoster];
        });

        try {
            await api.post('/roster-schedules/assign', {
                employee_id: employeeId,
                work_schedule_id: shiftId,
                delete_shift_id: deleteShiftId,
                date: dateStr
            });
            if (shiftId === 0) {
                toast.success("Shift berhasil dihapus");
            } else {
                toast.success("Shift berhasil ditambahkan");
            }
            fetchInitialData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Gagal menyimpan shift");
            fetchInitialData();
        }
    };

    const handleDeleteShift = (dateObj: Date, shiftId?: number) => {
        if (!selectedUserId) return;
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        saveAssign(parseInt(selectedUserId), dateStr, 0, shiftId);
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // Menghitung blok shift untuk render (dengan offset START_HOUR dan multi-shift per hari)
    const getShiftBlocksForDate = (dateObj: Date) => {
        if (!selectedUserId) return [];
        const employeeId = parseInt(selectedUserId);
        const blocks: any[] = [];

        // W_start dan W_end dalam satuan jam sejak 00:00 hari ini
        const W_start = START_HOUR;
        const W_end = START_HOUR + 24;

        // Kita perlu mengecek shift dari H-1, Hari H, dan H+1
        const offsets = [-1, 0, 1];

        offsets.forEach(offset => {
            const checkDate = new Date(dateObj);
            checkDate.setDate(checkDate.getDate() + offset);
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

            // Ambil SEMUA shift pada tanggal tersebut (multi-shift per hari)
            const dayRosters = rosters.filter(r => r.employee_id === employeeId && r.date.startsWith(dateStr));
            dayRosters.forEach(roster => {
                const shift = shifts.find(s => s.id === roster.work_schedule_id);
                if (shift) {
                    const inDecimal = timeToDecimal(shift.clock_in_time);
                    const outDecimal = timeToDecimal(shift.clock_out_time);
                    const duration = outDecimal > inDecimal ? (outDecimal - inDecimal) : (outDecimal + 24 - inDecimal);

                    const baseHours = offset * 24; // -24 for yesterday, 0 for today, 24 for tomorrow
                    const shiftStartAbsolute = baseHours + inDecimal;
                    const shiftEndAbsolute = shiftStartAbsolute + duration;

                    // Hitung irisan (overlap) dengan window baris hari ini [W_start, W_end]
                    const overlapStart = Math.max(W_start, shiftStartAbsolute);
                    const overlapEnd = Math.min(W_end, shiftEndAbsolute);

                    if (overlapStart < overlapEnd) {
                        const gridStart = overlapStart - W_start;
                        const gridEnd = overlapEnd - W_start;

                        // Apakah ini potongan dari shift yang sudah dimulai sebelumnya?
                        const isContinuation = shiftStartAbsolute < W_start;

                        blocks.push({
                            shift,
                            rosterId: roster.id,
                            start: gridStart,
                            end: gridEnd,
                            isContinuation,
                            dateObj: checkDate
                        });
                    }
                }
            });
        });

        // Urutkan blok dari jam mulai paling awal
        blocks.sort((a, b) => a.start - b.start);

        return blocks;
    };

    return (
        <HrLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden">
                {/* Header & Controls */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold">Timeline Roster</h1>
                                {managedUnit && (isKepalaUnit || isKepalaBagian) && (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {managedUnit.name}
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            ({isKepalaBagian ? 'Kepala Bagian' : 'Kepala Unit'})
                                        </span>
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Mode Harian (Gantt Chart Jadwal Kerja)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Unit Selector: Searchable Combobox for Admin, Locked/Restricted for Non-Admin */}
                        {isAdmin ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" /> Unit:
                                </span>
                                <Popover open={isUnitOpen} onOpenChange={setIsUnitOpen}>
                                    <PopoverTrigger role="combobox" className="w-[230px] inline-flex items-center justify-between rounded-md border border-input bg-background h-9 px-3 text-xs font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <span className="truncate">
                                            {orgUnits.find(u => u.id === selectedUnitId)?.name || "Pilih Unit Organisasi..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari unit organisasi..." className="h-9 text-xs" />
                                            <CommandList>
                                                <CommandEmpty>Unit tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {orgUnits.map((u: any) => (
                                                        <CommandItem
                                                            key={u.id}
                                                            value={u.name}
                                                            onSelect={() => {
                                                                handleUnitChange(u.id);
                                                                setIsUnitOpen(false);
                                                            }}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedUnitId === u.id ? "opacity-100" : "opacity-0")} />
                                                            {u.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ) : headedUnits.length > 1 ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" /> Unit:
                                </span>
                                <Popover open={isUnitOpen} onOpenChange={setIsUnitOpen}>
                                    <PopoverTrigger role="combobox" className="w-[230px] inline-flex items-center justify-between rounded-md border border-input bg-background h-9 px-3 text-xs font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <span className="truncate">
                                            {headedUnits.find(u => u.id === selectedUnitId)?.name || "Pilih Unit Anda..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari unit Anda..." className="h-9 text-xs" />
                                            <CommandList>
                                                <CommandEmpty>Unit tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {headedUnits.map((u: any) => (
                                                        <CommandItem
                                                            key={u.id}
                                                            value={u.name}
                                                            onSelect={() => {
                                                                handleUnitChange(u.id);
                                                                setIsUnitOpen(false);
                                                            }}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedUnitId === u.id ? "opacity-100" : "opacity-0")} />
                                                            {u.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                                <Building2 className="h-3.5 w-3.5 text-primary" />
                                <span>Unit: <b>{headedUnits[0]?.name || managedUnit?.name || orgUnits.find(u => u.id === selectedUnitId)?.name || 'Unit Anda'}</b></span>
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium border border-primary/20 ml-1 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    {isKepalaBagian ? 'Kepala Bagian' : isKepalaUnit ? 'Kepala Unit' : 'Unit'}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> Pegawai:
                            </span>
                            <Popover open={isKaryawanOpen} onOpenChange={setIsKaryawanOpen}>
                                <PopoverTrigger role="combobox" className="w-[240px] inline-flex items-center justify-between rounded-md border border-input bg-background h-9 px-3 text-sm font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                    <span className="truncate">{selectedUserId ? users.find(u => u.id.toString() === selectedUserId)?.name || "Pilih..." : "Pilih Karyawan..."}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </PopoverTrigger>
                                <PopoverContent className="w-[240px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari karyawan..." />
                                        <CommandList>
                                            <CommandEmpty>Karyawan tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map(u => (
                                                    <CommandItem
                                                        key={u.id}
                                                        value={u.name}
                                                        onSelect={() => {
                                                            setSelectedUserId(u.id.toString());
                                                            setIsKaryawanOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedUserId === u.id.toString() ? "opacity-100" : "opacity-0")} />
                                                        {u.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-primary shadow-sm hover:bg-primary/90 flex items-center gap-1.5"
                                onClick={() => {
                                    setAutoGenForm(prev => ({
                                        ...prev,
                                        targetType: 'all_unit',
                                        employeeId: selectedUserId || '0'
                                    }));
                                    setIsAutoGenOpen(true);
                                }}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Buat Jadwal Otomatis
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={prevMonth}>&lt;</Button>
                            <span className="font-semibold text-sm w-[130px] text-center">{currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={nextMonth}>&gt;</Button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 flex-1 min-h-0 min-w-0">
                    {/* Sidebar Palette */}
                    <div className="w-56 bg-white border rounded-lg p-3 flex flex-col gap-3 shadow-sm shrink-0 overflow-y-auto custom-scrollbar">
                        <div className="sticky top-0 bg-white z-10 pb-2 border-b">
                            <h3 className="font-semibold text-sm">Palette Shift</h3>
                            <p className="text-[11px] text-muted-foreground leading-tight mt-1">Tarik (drag) ke baris tanggal di sebelah kanan.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            {shifts.map(shift => {
                                const colorClass = getShiftColor(shift.id);
                                return (
                                    <div
                                        key={shift.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, shift.id)}
                                        className={`p-2.5 rounded-md border cursor-grab active:cursor-grabbing hover:opacity-90 shadow-sm transition-opacity ${colorClass}`}
                                    >
                                        <div className="font-bold text-sm tracking-tight">{shift.name}</div>
                                        <div className="text-[11px] opacity-90 font-mono mt-0.5">
                                            {formatTime(shift.clock_in_time)} - {formatTime(shift.clock_out_time)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Gantt Timeline */}
                    <div className="flex-1 bg-white border rounded-lg shadow-sm flex flex-col min-w-0 overflow-hidden">
                        {!selectedUserId ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Pilih Karyawan terlebih dahulu.
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="overflow-auto flex-1 custom-scrollbar flex flex-col relative">
                                {/* Header Jam */}
                                <div className="sticky top-0 z-30 bg-slate-100 flex min-w-max border-b shadow-sm">
                                    <div className="w-24 shrink-0 border-r p-2 font-semibold text-xs text-center flex items-center justify-center bg-slate-100 sticky left-0 z-40">
                                        Tanggal
                                    </div>
                                    <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(24, minmax(45px, 1fr))' }}>
                                        {hours.map(h => (
                                            <div key={h} className="border-r p-1 text-center font-medium text-[10px] text-slate-500">
                                                {String(h).padStart(2, '0')}:00
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Body Rows */}
                                <div className="flex flex-col min-w-max">
                                    {days.map(d => {
                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                        const dateStr = d.toISOString();
                                        const blocks = getShiftBlocksForDate(d);
                                        const isDragOver = dragOverDate === dateStr;
                                        const currentEmpId = parseInt(selectedUserId) || 0;
                                        const leaveOnDate = getLeaveForDate(d, currentEmpId);

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`flex border-b min-h-[44px] transition-colors ${leaveOnDate ? 'bg-amber-50/40 dark:bg-amber-950/20' : isWeekend ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-50 ${isDragOver ? 'bg-indigo-50' : ''}`}
                                                onDragOver={(e) => handleDragOver(e, dateStr)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, d)}
                                            >
                                                {/* Kolom Tanggal Sticky */}
                                                <div className="w-24 shrink-0 border-r p-2 flex flex-col items-center justify-center bg-inherit sticky left-0 z-20">
                                                    <span className="font-bold text-sm leading-none">{d.getDate()}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{d.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                                                    {leaveOnDate && (
                                                        <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded mt-1 border border-amber-300 dark:border-amber-800 shadow-2xs">
                                                            CUTI
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Area Timeline 24 Jam */}
                                                <div className="flex-1 grid relative group" style={{ gridTemplateColumns: 'repeat(24, minmax(45px, 1fr))' }}>
                                                    {/* Garis Grid Background */}
                                                    {hours.map(h => (
                                                        <div key={h} className="border-r border-slate-100/50 h-full w-full pointer-events-none" />
                                                    ))}

                                                    {/* Render Cuti / Shift Blocks */}
                                                    {leaveOnDate ? (
                                                        <div className="absolute inset-y-1.5 left-2 right-2 rounded-lg shadow-xs border border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-100/95 via-amber-50 to-orange-50 dark:from-amber-950/70 dark:via-amber-900/40 dark:to-orange-950/30 text-amber-950 dark:text-amber-100 px-3 py-1 flex items-center justify-between z-20 overflow-hidden">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-600 text-white shadow-xs shrink-0 tracking-wider">
                                                                    CUTI
                                                                </span>
                                                                <span className="font-bold text-xs truncate">
                                                                    {leaveOnDate.leave_type_name || 'Cuti'}: {leaveOnDate.reason || 'Izin Cuti'}
                                                                </span>
                                                                {leaveOnDate.delegation_to_name && (
                                                                    <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 shrink-0 hidden md:inline font-medium">
                                                                        • Pengganti: <b>{leaveOnDate.delegation_to_name}</b>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                                                    Disetujui (ACC)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : blocks.length === 0 ? (
                                                        <div className="absolute inset-y-0 left-3 flex items-center gap-2 pointer-events-none text-xs font-semibold select-none z-10">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                                                LIBUR
                                                            </span>
                                                            <span className="text-slate-400 font-medium text-[11px]">Hari Libur / Off</span>
                                                        </div>
                                                    ) : (
                                                        blocks.map((block, idx) => {
                                                            // Rumus letak grid: (start + 1) karena CSS grid-column 1-indexed
                                                            // end bisa berupa desimal misal 14.5. CSS Grid tidak bisa fraction column!
                                                            // Solusi: Kita pakai absolute positioning berdasarkan persentase.
                                                            const startPercent = (block.start / 24) * 100;
                                                            const endPercent = (block.end / 24) * 100;
                                                            const widthPercent = endPercent - startPercent;

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`absolute top-1 bottom-1 rounded-md shadow-sm border px-2 py-1 flex items-center overflow-hidden group/block ${getShiftColor(block.shift.id)} ${block.isContinuation ? 'opacity-80 border-dashed rounded-l-none border-l-0' : ''}`}
                                                                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                                                    title={`${block.shift.name} (${formatTime(block.shift.clock_in_time)} - ${formatTime(block.shift.clock_out_time)})`}
                                                                >
                                                                    <span className="text-xs font-bold truncate">
                                                                        {block.isContinuation ? '-> Lanjutan' : block.shift.name}
                                                                    </span>

                                                                    {/* Tombol Hapus (Muncul saat hover blok) */}
                                                                    {!block.isContinuation && (
                                                                        <button
                                                                            onClick={() => handleDeleteShift(block.dateObj, block.shift.id)}
                                                                            className="ml-auto opacity-0 group-hover/block:opacity-100 hover:bg-black/20 p-0.5 rounded transition-opacity"
                                                                            title={`Hapus ${block.shift.name}`}
                                                                        >
                                                                            <X className="w-3 h-3 text-white" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        })
                                                    )}

                                                    {/* Visual Indicator saat Drag Over */}
                                                    {isDragOver && (
                                                        <div className="absolute inset-y-0 left-0 right-0 border-2 border-indigo-400 border-dashed bg-indigo-100/20 pointer-events-none" />
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Auto Generate */}
            <Dialog open={isAutoGenOpen} onOpenChange={setIsAutoGenOpen}>
                <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Buat Jadwal Otomatis {orgUnits.find(u => u.id === selectedUnitId) ? `(${orgUnits.find(u => u.id === selectedUnitId)?.name})` : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Generate jadwal shift secara otomatis dan merata tanpa bentrok antar anggota unit.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-3">
                        {/* Target Penjadwalan */}
                        <div className="bg-slate-50 p-3 rounded-lg border flex flex-col gap-2">
                            <Label className="text-xs font-semibold text-slate-700">Target Penjadwalan</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAutoGenForm(prev => ({ ...prev, targetType: 'all_unit' }))}
                                    className={`p-2.5 rounded-md border text-left flex flex-col transition-all ${
                                        autoGenForm.targetType === 'all_unit'
                                            ? 'bg-primary/10 border-primary text-primary font-medium ring-1 ring-primary'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                        <Users className="h-3.5 w-3.5" /> Seluruh Anggota Unit
                                    </div>
                                    <span className="text-[11px] text-muted-foreground mt-0.5">
                                        {users.length} Pegawai di unit ini
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAutoGenForm(prev => ({ ...prev, targetType: 'single', employeeId: selectedUserId || users[0]?.id || '0' }))}
                                    className={`p-2.5 rounded-md border text-left flex flex-col transition-all ${
                                        autoGenForm.targetType === 'single'
                                            ? 'bg-primary/10 border-primary text-primary font-medium ring-1 ring-primary'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                        <Check className="h-3.5 w-3.5" /> Pegawai Tertentu
                                    </div>
                                    <span className="text-[11px] text-muted-foreground mt-0.5">
                                        Pilih 1 orang saja
                                    </span>
                                </button>
                            </div>

                            {autoGenForm.targetType === 'all_unit' ? (
                                <p className="text-[11px] text-primary/80 bg-primary/5 p-2 rounded border border-primary/10 flex items-start gap-1.5 mt-1">
                                    <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                                    <span>
                                        Sistem akan mendistribusikan rotasi shift bergilir (Pagi, Siang, Malam, Libur) secara otomatis dan merata ke seluruh anggota agar tidak terjadi bentrok dan seluruh shift unit terisi. Pegawai yang sedang cuti resmi tidak akan diberi jadwal.
                                    </span>
                                </p>
                            ) : (
                                <div className="mt-2 flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Pilih Pegawai:</Label>
                                    <Popover open={isModalKaryawanOpen} onOpenChange={setIsModalKaryawanOpen}>
                                        <PopoverTrigger role="combobox" className="w-full flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                            <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                {users.find(u => u.id.toString() === (autoGenForm.employeeId || selectedUserId))?.name || "Pilih Pegawai..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[450px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari nama pegawai..." className="h-9 text-xs" />
                                                <CommandList>
                                                    <CommandEmpty>Pegawai tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {users.map(u => (
                                                            <CommandItem
                                                                key={u.id}
                                                                value={u.name}
                                                                onSelect={() => {
                                                                    setAutoGenForm(prev => ({ ...prev, employeeId: u.id.toString() }));
                                                                    setIsModalKaryawanOpen(false);
                                                                }}
                                                                className="text-xs cursor-pointer"
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", (autoGenForm.employeeId || selectedUserId) === u.id.toString() ? "opacity-100" : "opacity-0")} />
                                                                {u.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label className="text-right text-xs">Isi Cepat</Label>
                            <div className="col-span-3 flex gap-2">
                                <Button variant="outline" size="sm" className="text-xs h-8" onClick={setThisWeek}>1 Minggu Ini</Button>
                                <Button variant="outline" size="sm" className="text-xs h-8" onClick={setThisMonth}>1 Bulan Ini</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label className="text-right text-xs">Mulai</Label>
                            <Input
                                type="date"
                                className="col-span-3 h-9 text-xs"
                                value={autoGenForm.startDate}
                                onChange={(e) => setAutoGenForm(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label className="text-right text-xs">Selesai</Label>
                            <Input
                                type="date"
                                className="col-span-3 h-9 text-xs"
                                value={autoGenForm.endDate}
                                onChange={(e) => setAutoGenForm(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label className="text-right text-xs">Pola Hari</Label>
                            <div className="col-span-3">
                                <Popover open={isPolaOpen} onOpenChange={setIsPolaOpen}>
                                    <PopoverTrigger className="w-full flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <span className="truncate">
                                            {autoGenForm.workDaysPattern === 'all' ? 'Semua Hari (Shift Bergilir 24/7)' :
                                                autoGenForm.workDaysPattern === 'mon-fri' ? 'Senin - Jumat' :
                                                    autoGenForm.workDaysPattern === 'mon-sat' ? 'Senin - Sabtu' :
                                                        'Pilih pola...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari pola..." />
                                            <CommandList>
                                                <CommandEmpty>Pola tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {[
                                                        { value: 'all', label: 'Semua Hari (Shift Bergilir 24/7)' },
                                                        { value: 'mon-fri', label: 'Senin - Jumat' },
                                                        { value: 'mon-sat', label: 'Senin - Sabtu' }
                                                    ].map(p => (
                                                        <CommandItem
                                                            key={p.value}
                                                            value={p.label}
                                                            onSelect={() => {
                                                                setAutoGenForm(prev => ({ ...prev, workDaysPattern: p.value }));
                                                                setIsPolaOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", autoGenForm.workDaysPattern === p.value ? "opacity-100" : "opacity-0")} />
                                                            {p.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {autoGenForm.workDaysPattern === 'all' && (
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label className="text-right text-xs">Jml Libur</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={6}
                                        className="w-20 h-9 text-xs"
                                        value={autoGenForm.offDaysCount}
                                        onChange={(e) => setAutoGenForm(prev => ({ ...prev, offDaysCount: e.target.value }))}
                                    />
                                    <span className="text-xs text-muted-foreground">Hari Libur / Minggu per Anggota (Digilir)</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label className="text-right text-xs">Pilihan Shift</Label>
                            <div className="col-span-3">
                                <Popover open={isShiftOpen} onOpenChange={setIsShiftOpen}>
                                    <PopoverTrigger className="w-full flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <span className="truncate">
                                            {autoGenForm.workScheduleIds.length > 0
                                                ? `${autoGenForm.workScheduleIds.length} Shift Terpilih untuk Rotasi`
                                                : 'Pilih Shift...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <div className="p-2 border-b text-[11px] text-muted-foreground text-center">
                                            Centang shift yang diikutsertakan dalam rotasi
                                        </div>
                                        <Command>
                                            <CommandInput placeholder="Cari shift..." />
                                            <CommandList>
                                                <CommandEmpty>Shift tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {shifts.map(s => (
                                                        <CommandItem
                                                            key={s.id}
                                                            value={s.name}
                                                            onSelect={() => {
                                                                setAutoGenForm(prev => {
                                                                    const sid = s.id.toString();
                                                                    const isSelected = prev.workScheduleIds.includes(sid);
                                                                    const newIds = isSelected
                                                                        ? prev.workScheduleIds.filter(id => id !== sid)
                                                                        : [...prev.workScheduleIds, sid];
                                                                    return { ...prev, workScheduleIds: newIds };
                                                                });
                                                            }}
                                                        >
                                                            <Checkbox
                                                                checked={autoGenForm.workScheduleIds.includes(s.id.toString())}
                                                                className="mr-2"
                                                            />
                                                            {s.name} ({formatTime(s.clock_in_time)} - {formatTime(s.clock_out_time)})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-[11px] text-muted-foreground mt-1.5">
                                    Sistem akan merotasikan shift terpilih secara seimbang antar anggota unit.
                                </p>
                            </div>
                        </div>

                        {/* Petugas per Shift (Hanya untuk All Unit) */}
                        {autoGenForm.targetType === 'all_unit' && (
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label className="text-right text-xs">Petugas/Shift</Label>
                                <div className="col-span-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAutoGenForm(prev => ({ ...prev, staffingMode: 'auto' }))}
                                            className={`px-2.5 py-1 rounded text-xs border font-medium transition-all ${
                                                autoGenForm.staffingMode === 'auto'
                                                    ? 'bg-primary text-white border-primary shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            Bagi Rata Otomatis
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAutoGenForm(prev => ({ ...prev, staffingMode: 'custom' }))}
                                            className={`px-2.5 py-1 rounded text-xs border font-medium transition-all ${
                                                autoGenForm.staffingMode === 'custom'
                                                    ? 'bg-primary text-white border-primary shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            Tentukan Kuota
                                        </button>
                                    </div>
                                    {autoGenForm.staffingMode === 'custom' ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={50}
                                                className="w-20 h-9 text-xs"
                                                value={autoGenForm.staffPerShift}
                                                onChange={(e) => setAutoGenForm(prev => ({ ...prev, staffPerShift: e.target.value }))}
                                            />
                                            <span className="text-xs text-muted-foreground">orang per shift per hari (bisa &gt; 1 orang)</span>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">
                                            {autoGenForm.workScheduleIds.length <= 1
                                                ? `Seluruh anggota (${users.length} orang) akan ditugaskan bersamaan pada shift yang dipilih.`
                                                : `Setiap shift akan diisi oleh ${Math.max(1, Math.floor(users.length / Math.max(1, autoGenForm.workScheduleIds.length)))} - ${Math.ceil(users.length / Math.max(1, autoGenForm.workScheduleIds.length))} orang secara berimbang.`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAutoGenOpen(false)}>Batal</Button>
                        <Button onClick={handleCheckConflicts} disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Generate Jadwal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Confirmation */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konflik Jadwal Ditemukan</DialogTitle>
                        <DialogDescription>
                            Terdapat {conflictCount} hari yang sudah memiliki jadwal (shift) pada rentang waktu yang Anda pilih.
                            Apa yang ingin Anda lakukan?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button variant="destructive" onClick={() => handleAutoGenerate(true)} disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Timpa Semua Jadwal (Overwrite)
                        </Button>
                        <Button variant="outline" onClick={() => handleAutoGenerate(false)} disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Hanya Isi Hari Kosong (Skip)
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </HrLayout>
    );
}