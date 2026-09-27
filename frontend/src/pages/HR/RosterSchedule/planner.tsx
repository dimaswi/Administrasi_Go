import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, X, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RosterPlanner() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Auto Gen State
    const [isAutoGenOpen, setIsAutoGenOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [autoGenForm, setAutoGenForm] = useState({
        userId: '0', // 0 = Semua, else specific ID
        startDate: '',
        endDate: '',
        workDaysPattern: 'mon-fri',
        offDaysCount: '2',
        workScheduleIds: [] as string[]
    });
    const [conflictCount, setConflictCount] = useState(0);
    const [isKaryawanOpen, setIsKaryawanOpen] = useState(false);
    const [isPolaOpen, setIsPolaOpen] = useState(false);
    const [isShiftOpen, setIsShiftOpen] = useState(false);

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
        setLoading(true);
        try {
            const payload = {
                employee_id: parseInt(selectedUserId) || 0,
                unit_id: unitId,
                start_date: autoGenForm.startDate,
                end_date: autoGenForm.endDate,
                work_days_pattern: autoGenForm.workDaysPattern,
                off_days_count: parseInt(autoGenForm.offDaysCount) || 0,
                work_schedule_ids: autoGenForm.workScheduleIds.map(id => parseInt(id)),
                overwrite: overwrite,
                check_only: false
            };
            await api.post('/roster-schedules/auto-generate', payload);
            toast.success("Jadwal berhasil di-generate!");
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
            const payload = {
                employee_id: parseInt(selectedUserId) || 0,
                unit_id: unitId,
                start_date: autoGenForm.startDate,
                end_date: autoGenForm.endDate,
                work_days_pattern: autoGenForm.workDaysPattern,
                off_days_count: parseInt(autoGenForm.offDaysCount) || 0,
                work_schedule_ids: autoGenForm.workScheduleIds.map(id => parseInt(id)),
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
            toast.error(error.response?.data?.error || "Gagal ngecek konflik");
        } finally {
            setLoading(false);
        }
    };

    const unitId = 1; // Dummy unit ID

    useEffect(() => {
        fetchInitialData();
    }, [currentDate]);

    // Jika users sudah di-load tapi belum ada yang di-select, select yang pertama
    useEffect(() => {
        if (users.length > 0 && !selectedUserId) {
            setSelectedUserId(users[0].id.toString());
        }
    }, [users]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const shiftRes = await api.get('/work-schedules');
            setShifts(shiftRes.data || []);

            const usersRes = await api.get('/employees?perPage=1000');
            const usersList = usersRes.data?.data || [];
            const userOpts = usersList.map((u: any) => ({
                id: u.id.toString(),
                value: u.id.toString(),
                name: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : ''),
                label: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : '')
            }));
            setUsers(userOpts);

            const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const rosterRes = await api.get(`/roster-schedules/unit/${unitId}/${yearMonth}`);
            setRosters(rosterRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data roster");
        } finally {
            setLoading(false);
        }
    };

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

        const shiftIdStr = e.dataTransfer.getData('shiftId');
        if (!shiftIdStr) return;

        const shiftId = parseInt(shiftIdStr);
        const employeeId = parseInt(selectedUserId);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        await saveAssign(employeeId, dateStr, shiftId);
    };

    const saveAssign = async (employeeId: number, dateStr: string, shiftId: number) => {
        // Optimistic Update
        const newRoster = { employee_id: employeeId, date: `${dateStr}T00:00:00Z`, work_schedule_id: shiftId };

        setRosters(prev => {
            const filtered = prev.filter(r => !(r.employee_id === employeeId && r.date.startsWith(dateStr)));
            if (shiftId === 0) return filtered;
            return [...filtered, newRoster];
        });

        try {
            await api.post('/roster-schedules/assign', {
                employee_id: employeeId,
                work_schedule_id: shiftId,
                date: dateStr
            });
            toast.success("Shift berhasil disimpan");
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan shift");
            fetchInitialData();
        }
    };

    const handleDeleteShift = (dateObj: Date) => {
        if (!selectedUserId) return;
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        saveAssign(parseInt(selectedUserId), dateStr, 0);
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // Menghitung blok shift untuk render (dengan offset START_HOUR)
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

            const roster = rosters.find(r => r.employee_id === employeeId && r.date.startsWith(dateStr));
            if (roster) {
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
                            start: gridStart,
                            end: gridEnd,
                            isContinuation,
                            dateObj: checkDate
                        });
                    }
                }
            }
        });

        return blocks;
    };

    return (
        <HrLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden">
                {/* Header & Controls */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-bold">Timeline Roster</h1>
                            <p className="text-sm text-muted-foreground">Mode Harian (Gantt Chart)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Karyawan:</span>
                            <Popover open={isKaryawanOpen} onOpenChange={setIsKaryawanOpen}>
                                {/* @ts-ignore */}
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-[260px] justify-between h-9 px-3 font-normal">
                                        <span className="truncate">{selectedUserId ? users.find(u => u.id.toString() === selectedUserId)?.name || "Pilih..." : "Pilih Karyawan..."}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0" align="start">
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
                            <Button variant="outline" size="sm" onClick={() => setIsAutoGenOpen(true)}>
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

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`flex border-b min-h-[44px] transition-colors ${isWeekend ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-50 ${isDragOver ? 'bg-indigo-50' : ''}`}
                                                onDragOver={(e) => handleDragOver(e, dateStr)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, d)}
                                            >
                                                {/* Kolom Tanggal Sticky */}
                                                <div className="w-24 shrink-0 border-r p-2 flex flex-col items-center justify-center bg-inherit sticky left-0 z-20">
                                                    <span className="font-bold text-sm leading-none">{d.getDate()}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{d.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                                                </div>

                                                {/* Area Timeline 24 Jam */}
                                                <div className="flex-1 grid relative group" style={{ gridTemplateColumns: 'repeat(24, minmax(45px, 1fr))' }}>
                                                    {/* Garis Grid Background */}
                                                    {hours.map(h => (
                                                        <div key={h} className="border-r border-slate-100/50 h-full w-full pointer-events-none" />
                                                    ))}

                                                    {/* Render Shift Blocks */}
                                                    {blocks.length === 0 ? (
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
                                                                            onClick={() => handleDeleteShift(block.dateObj)}
                                                                            className="ml-auto opacity-0 group-hover/block:opacity-100 hover:bg-black/20 p-0.5 rounded transition-opacity"
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Buat Jadwal Otomatis</DialogTitle>
                        <DialogDescription>
                            Generate jadwal shift secara massal berdasarkan pola kerja.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Isi Cepat</Label>
                            <div className="col-span-3 flex gap-2">
                                <Button variant="outline" size="sm" onClick={setThisWeek}>1 Minggu Ini</Button>
                                <Button variant="outline" size="sm" onClick={setThisMonth}>1 Bulan Ini</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Mulai</Label>
                            <Input
                                type="date"
                                className="col-span-3"
                                value={autoGenForm.startDate}
                                onChange={(e) => setAutoGenForm(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Selesai</Label>
                            <Input
                                type="date"
                                className="col-span-3"
                                value={autoGenForm.endDate}
                                onChange={(e) => setAutoGenForm(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Pola Hari</Label>
                            <div className="col-span-3">
                                <Popover open={isPolaOpen} onOpenChange={setIsPolaOpen}>
                                    <PopoverTrigger className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <span className="truncate">
                                            {autoGenForm.workDaysPattern === 'mon-fri' ? 'Senin - Jumat' :
                                                autoGenForm.workDaysPattern === 'mon-sat' ? 'Senin - Sabtu' :
                                                    autoGenForm.workDaysPattern === 'all' ? 'Semua Hari' :
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
                                                        { value: 'mon-fri', label: 'Senin - Jumat' },
                                                        { value: 'mon-sat', label: 'Senin - Sabtu' },
                                                        { value: 'all', label: 'Semua Hari' }
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
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Jml Libur</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={6}
                                        className="w-24"
                                        value={autoGenForm.offDaysCount}
                                        onChange={(e) => setAutoGenForm(prev => ({ ...prev, offDaysCount: e.target.value }))}
                                    />
                                    <span className="text-sm text-muted-foreground">Hari / Minggu</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Acak Shift Dari</Label>
                            <div className="col-span-3">
                                <Popover open={isShiftOpen} onOpenChange={setIsShiftOpen}>
                                    <PopoverTrigger className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-normal ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <span className="truncate">
                                            {autoGenForm.workScheduleIds.length > 0
                                                ? `${autoGenForm.workScheduleIds.length} Shift Terpilih`
                                                : 'Pilih Shift...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0" align="start">
                                        <div className="p-2 border-b text-xs text-muted-foreground text-center">
                                            Pilih beberapa shift untuk diacak
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
                                <p className="text-xs text-muted-foreground mt-2">
                                    Jika Anda memilih lebih dari 1 shift, sistem akan menugaskan shift secara acak pada hari kerja.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAutoGenOpen(false)}>Batal</Button>
                        <Button onClick={handleCheckConflicts} disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Generate
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