import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Clock, Plus, LogOut, Pencil, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function AttendanceIndex() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    const [employees, setEmployees] = useState<any[]>([]);

    // Check-in state
    const [openModal, setOpenModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [checkinStatus, setCheckinStatus] = useState("present");
    const [checkinDate, setCheckinDate] = useState(new Date().toISOString().substring(0, 10));
    const [checkinTime, setCheckinTime] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Check-out state
    const [checkoutModal, setCheckoutModal] = useState(false);
    const [checkoutEmployeeId, setCheckoutEmployeeId] = useState<number | null>(null);
    const [checkoutEmployeeName, setCheckoutEmployeeName] = useState("");
    const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().substring(0, 10));
    const [checkoutTime, setCheckoutTime] = useState("");

    // Edit state
    const [editModal, setEditModal] = useState(false);
    const [editRow, setEditRow] = useState<any>(null);
    const [editClockIn, setEditClockIn] = useState("");
    const [editClockOut, setEditClockOut] = useState("");
    const [editStatus, setEditStatus] = useState("present");
    const [editNotes, setEditNotes] = useState("");

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const page = searchParams.get('page') || '1';
            const perPage = searchParams.get('perPage') || '10';
            const search = searchParams.get('search') || '';

            const res = await api.get(`/attendances?page=${page}&perPage=${perPage}&search=${search}`);
            setData(res.data?.data || []);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to,
            });
        } catch (error) {
            console.error("Failed to fetch attendances", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            const list = res.data?.data ?? res.data;
            setEmployees(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleManualCheckin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) { toast.error("Pilih pegawai terlebih dahulu"); return; }

        setSubmitting(true);
        try {
            await api.post('/attendances/check-in', {
                employee_id: parseInt(selectedUser),
                date: checkinDate,
                status: checkinStatus,
                clock_in_time: checkinTime || undefined,
                notes: notes || undefined
            });
            toast.success("Check-in manual berhasil!");
            setOpenModal(false);
            setSelectedUser("");
            setCheckinStatus("present");
            setCheckinDate(new Date().toISOString().substring(0, 10));
            setCheckinTime("");
            setNotes("");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Gagal melakukan check-in manual");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckoutClick = (row: any) => {
        const cur = new Date();
        setCheckoutDate(row.date?.substring(0, 10) || cur.toISOString().substring(0, 10));
        setCheckoutTime(`${String(cur.getHours()).padStart(2, '0')}:${String(cur.getMinutes()).padStart(2, '0')}`);
        setCheckoutEmployeeId(row.employee_id);
        setCheckoutEmployeeName(row.employee_name || `Pegawai #${row.employee_id}`);
        setCheckoutModal(true);
    };

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutEmployeeId) return;
        try {
            await api.post('/attendances/check-out', {
                employee_id: checkoutEmployeeId,
                date: checkoutDate,
                clock_out_time: checkoutTime + ':00'
            });
            toast.success('Check-out berhasil!');
            setCheckoutModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal melakukan check-out');
        }
    };

    const handleEditClick = (row: any) => {
        setEditRow(row);
        setEditClockIn(row.clock_in?.substring(0, 5) || '');
        setEditClockOut(row.clock_out?.substring(0, 5) || '');
        setEditStatus(row.status || 'present');
        setEditNotes(row.notes || '');
        setEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editRow) return;
        try {
            await api.put(`/attendances/${editRow.id}`, {
                clock_in: editClockIn || null,
                clock_out: editClockOut || null,
                status: editStatus,
                notes: editNotes || null,
            });
            toast.success('Absensi berhasil diupdate!');
            setEditModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal update absensi');
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        // DB returns HH:mm:ss format directly
        return timeStr.length >= 5 ? timeStr.substring(0, 5) : timeStr;
    };

    const statusOptions = [
        { value: 'present', label: 'Hadir' },
        { value: 'late', label: 'Terlambat' },
        { value: 'absent', label: 'Absen' },
        { value: 'sick', label: 'Sakit' },
        { value: 'permit', label: 'Izin' },
        { value: 'leave', label: 'Cuti' },
        { value: 'holiday', label: 'Libur' },
        { value: 'early_leave', label: 'Pulang Awal' },
        { value: 'late_early_leave', label: 'Terlambat & Pulang Awal' },
    ];

    const [activeTab, setActiveTab] = useState<'all' | 'early_leave'>('all');

    const handleAccEarlyLeave = async (row: any) => {
        try {
            const existingNotes = row.notes || '';
            const updatedNotes = existingNotes.includes('Menunggu ACC')
                ? existingNotes.replace('Menunggu ACC HR', 'Disetujui HR').replace('Menunggu ACC', 'Disetujui HR')
                : (existingNotes ? `${existingNotes} [Disetujui HR]` : '[Pulang Cepat - Disetujui HR]');

            await api.put(`/attendances/${row.id}`, {
                clock_in: row.clock_in,
                clock_out: row.clock_out,
                status: 'early_leave',
                notes: updatedNotes,
            });
            toast.success(`Pulang Cepat untuk ${row.employee_name || 'pegawai'} berhasil di-ACC (disetujui)!`);
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error('Gagal menyetujui pulang cepat');
        }
    };

    const statusConfig: Record<string, { label: string; className: string }> = {
        present: { label: 'Hadir', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        late: { label: 'Terlambat', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
        absent: { label: 'Absen', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
        sick: { label: 'Sakit', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
        permit: { label: 'Izin', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
        permission: { label: 'Izin', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
        leave: { label: 'Cuti', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
        holiday: { label: 'Libur', className: 'bg-neutral-100 text-neutral-600 border border-neutral-200' },
        early_leave: { label: 'Pulang Awal', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
        late_early_leave: { label: 'Terlambat & Pulang Awal', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
    };

    const pendingEarlyCount = data.filter((r: any) =>
        (r.status?.toLowerCase() === 'early_leave' || (r.notes && r.notes.includes('Pulang Cepat'))) &&
        !r.notes?.includes('[Disetujui')
    ).length;

    const displayedData = activeTab === 'early_leave'
        ? data.filter((r: any) => r.status?.toLowerCase() === 'early_leave' || (r.notes && r.notes.includes('Pulang Cepat')))
        : data;

    const columns = [
        { 
            key: 'employee_name', 
            label: 'Nama Pegawai',
            className: 'min-w-[130px] max-w-[180px]',
            render: (row: any) => (
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate block text-xs" title={row.employee_name}>
                    {row.employee_name || `Pegawai ID ${row.employee_id}`}
                </span>
            )
        },
        { 
            key: 'date', 
            label: 'Tanggal',
            className: 'w-24 whitespace-nowrap',
            render: (row: any) => <span className="font-mono text-xs">{formatDate(row.date)}</span>
        },
        { 
            key: 'clock_in', 
            label: 'Masuk',
            className: 'w-16 text-center whitespace-nowrap',
            render: (row: any) => <span className="font-mono text-xs">{formatTime(row.clock_in)}</span> 
        },
        { 
            key: 'clock_out', 
            label: 'Pulang',
            className: 'w-16 text-center whitespace-nowrap',
            render: (row: any) => <span className="font-mono text-xs">{formatTime(row.clock_out)}</span> 
        },
        { 
            key: 'work_schedule_name', 
            label: 'Shift',
            className: 'w-20 whitespace-nowrap',
            render: (row: any) => <span className="text-xs text-neutral-600">{row.work_schedule_name || '-'}</span> 
        },
        {
            key: 'notes',
            label: 'Catatan / Alasan',
            className: 'min-w-[120px] max-w-[190px]',
            render: (row: any) => {
                if (!row.notes) return <span className="text-neutral-400 text-xs italic">-</span>;
                const cleanText = row.notes
                    .replace(/\[Pulang Cepat - Menunggu ACC HR\]/gi, '')
                    .replace(/\[Pulang Cepat - Disetujui HR\]/gi, '')
                    .replace(/\[Disetujui HR[^\]]*\]/gi, '')
                    .replace(/\[Pulang Cepat[^\]]*\]/gi, '')
                    .trim();

                let reason = cleanText;
                if (cleanText.includes('• Pengganti:')) {
                    reason = cleanText.split('• Pengganti:')[0].trim();
                } else if (cleanText.includes('Pengganti:')) {
                    reason = cleanText.split('Pengganti:')[0].replace(/•/g, '').trim();
                }

                if (!reason) return <span className="text-neutral-400 text-xs italic">-</span>;
                return (
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate block" title={reason}>
                        {reason}
                    </span>
                );
            },
        },
        {
            key: 'delegation',
            label: 'Pengganti',
            className: 'w-28',
            render: (row: any) => {
                if (!row.notes) return <span className="text-neutral-400 text-xs italic">-</span>;
                let colleague = '';
                if (row.notes.includes('• Pengganti:')) {
                    colleague = row.notes.split('• Pengganti:')[1].trim();
                } else if (row.notes.includes('Pengganti:')) {
                    colleague = row.notes.split('Pengganti:')[1].trim();
                }

                if (colleague) {
                    return (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 truncate max-w-[110px]" title={colleague}>
                            👤 {colleague}
                        </span>
                    );
                }
                return <span className="text-neutral-400 text-xs italic">-</span>;
            },
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-28 text-center whitespace-nowrap',
            render: (row: any) => {
                const isEarly = row.status?.toLowerCase() === 'early_leave';
                const isLateEarly = row.status?.toLowerCase() === 'late_early_leave';
                const isApproved = row.notes?.includes('[Disetujui');

                if (isEarly || isLateEarly) {
                    if (isApproved) {
                        return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                                <CheckCircle className="size-3 text-emerald-600" />
                                Pulang Awal (ACC)
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap">
                            <Clock className="size-3 text-amber-600" />
                            Pulang Awal (Menunggu)
                        </span>
                    );
                }
                const cfg = statusConfig[row.status?.toLowerCase()] || { label: row.status, className: 'bg-neutral-100 text-neutral-700 border border-neutral-200' };
                return <span className={cn("inline-block px-2 py-0.5 rounded-none text-[10px] font-semibold whitespace-nowrap", cfg.className)}>{cfg.label}</span>;
            }
        },
        {
            key: 'actions',
            label: 'Aksi',
            className: 'w-20 text-right whitespace-nowrap',
            render: (row: any) => {
                const isEarly = row.status?.toLowerCase() === 'early_leave' || (row.notes && row.notes.includes('Pulang Cepat'));
                const isApproved = row.notes?.includes('[Disetujui');
                const needsAcc = isEarly && !isApproved;

                return (
                    <div className="flex items-center justify-end gap-1">
                        {needsAcc && (
                            <Button
                                size="sm"
                                className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold rounded-none shadow-none"
                                title="ACC / Setujui Pulang Cepat Pegawai"
                                onClick={() => handleAccEarlyLeave(row)}
                            >
                                <CheckCircle className="size-3" />
                                ACC
                            </Button>
                        )}
                        <Button size="icon" variant="outline" className="h-6 w-6 rounded-none border-neutral-200 text-neutral-600 hover:text-neutral-900" title="Edit" onClick={() => handleEditClick(row)}>
                            <Pencil className="size-3" />
                        </Button>
                        {!row.clock_out && (
                            <Button size="icon" variant="outline" className="h-6 w-6 rounded-none border-neutral-200 text-neutral-600 hover:text-neutral-900" title="Check-out" onClick={() => handleCheckoutClick(row)}>
                                <LogOut className="size-3" />
                            </Button>
                        )}
                    </div>
                );
            }
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Riwayat Absensi & Pulang Cepat"
                description="Monitor absensi harian dan persetujuan (ACC) pulang cepat pegawai"
                headerExtra={
                    <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-100/60 dark:bg-neutral-900 p-0.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "h-7 px-2.5 text-xs font-semibold rounded-none transition-colors",
                                activeTab === 'all' 
                                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-none border border-neutral-200 dark:border-neutral-700" 
                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                            )}
                        >
                            Semua ({data.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('early_leave')}
                            className={cn(
                                "h-7 px-2.5 text-xs font-semibold rounded-none transition-colors flex items-center gap-1",
                                activeTab === 'early_leave' 
                                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-none border border-neutral-200 dark:border-neutral-700" 
                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                            )}
                        >
                            <span>Pulang Cepat</span>
                            {pendingEarlyCount > 0 && (
                                <span className="px-1 py-0.2 rounded-none bg-rose-600 text-white font-mono font-bold text-[10px]">
                                    {pendingEarlyCount}
                                </span>
                            )}
                        </button>
                    </div>
                }
                actions={[
                    {
                        label: 'Portal Presensi Mandiri',
                        icon: Sparkles,
                        onClick: () => navigate('/hr/my-attendance')
                    },
                    {
                        label: 'Input Manual',
                        icon: Plus,
                        onClick: () => setOpenModal(true)
                    }
                ]}
                data={displayedData}
                columns={columns}
                pagination={pagination}
                onPageChange={(page) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', page.toString());
                    setSearchParams(params);
                }}
                onPerPageChange={(perPage) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('perPage', perPage.toString());
                    params.set('page', '1');
                    setSearchParams(params);
                }}
                searchValue={searchParams.get('search') || ''}
                onSearchChange={(search) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (search) {
                        params.set('search', search);
                    } else {
                        params.delete('search');
                    }
                    params.set('page', '1');
                    setSearchParams(params);
                }}
                emptyMessage="Belum ada data absensi"
                emptyIcon={Clock}
                isLoading={loading}
            />

            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Input Check-in Manual</DialogTitle>
                        <DialogDescription>
                            Gunakan jalur ini hanya jika diperlukan (misal: pegawai lupa absen atau aplikasi error).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleManualCheckin} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Pegawai</Label>
                            <SearchableSelect
                                options={employees.map(e => ({ value: String(e.id), label: `${e.first_name} ${e.last_name || ''}`.trim() }))}
                                value={selectedUser}
                                onValueChange={setSelectedUser}
                                placeholder="-- Pilih Pegawai --"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal</Label>
                                <input
                                    type="date"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={checkinDate}
                                    onChange={(e) => setCheckinDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Masuk <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                                <input
                                    type="time"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={checkinTime}
                                    onChange={(e) => setCheckinTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status Kehadiran</Label>
                            <SearchableSelect
                                options={statusOptions}
                                value={checkinStatus}
                                onValueChange={setCheckinStatus}
                                placeholder="-- Pilih Status --"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Catatan Tambahan</Label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Alasan check-in manual..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <DialogClose render={<Button type="button" variant="outline">Batal</Button>} />
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Menyimpan..." : "Simpan Check-in"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={checkoutModal} onOpenChange={setCheckoutModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Check-out Manual</DialogTitle>
                        <DialogDescription>
                            Input jam keluar untuk <strong>{checkoutEmployeeName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCheckoutSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal</Label>
                                <input
                                    type="date"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={checkoutDate}
                                    onChange={(e) => setCheckoutDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Check-out</Label>
                                <input
                                    type="time"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={checkoutTime}
                                    onChange={(e) => setCheckoutTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <DialogClose render={<Button type="button" variant="outline">Batal</Button>} />
                            <Button type="submit">
                                <LogOut className="h-4 w-4 mr-1.5" /> Simpan Check-out
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Absensi</DialogTitle>
                        <DialogDescription>
                            Edit data absensi untuk <strong>{editRow?.employee_name}</strong> &mdash; {editRow?.date ? new Date(editRow.date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Jam Masuk</Label>
                                <input type="time" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={editClockIn} onChange={(e) => setEditClockIn(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Pulang</Label>
                                <input type="time" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={editClockOut} onChange={(e) => setEditClockOut(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <SearchableSelect
                                options={statusOptions}
                                value={editStatus}
                                onValueChange={setEditStatus}
                                placeholder="-- Pilih Status --"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan</Label>
                            <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                        </div>
                        <DialogFooter className="pt-2">
                            <DialogClose render={<Button type="button" variant="outline">Batal</Button>} />
                            <Button type="submit"><Pencil className="h-4 w-4 mr-1.5" /> Simpan Perubahan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}
