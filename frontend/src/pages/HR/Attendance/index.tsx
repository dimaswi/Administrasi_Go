import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Clock, Plus, LogOut, Pencil, CheckCircle } from 'lucide-react';
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
        present: { label: 'Hadir', className: 'bg-green-100 text-green-700' },
        late: { label: 'Terlambat', className: 'bg-amber-100 text-amber-700' },
        absent: { label: 'Absen', className: 'bg-red-100 text-red-700' },
        sick: { label: 'Sakit', className: 'bg-blue-100 text-blue-700' },
        permit: { label: 'Izin', className: 'bg-purple-100 text-purple-700' },
        permission: { label: 'Izin', className: 'bg-purple-100 text-purple-700' },
        leave: { label: 'Cuti', className: 'bg-indigo-100 text-indigo-700' },
        holiday: { label: 'Libur', className: 'bg-gray-100 text-gray-600' },
        early_leave: { label: 'Pulang Awal', className: 'bg-orange-100 text-orange-700' },
        late_early_leave: { label: 'Terlambat & Pulang Awal', className: 'bg-rose-100 text-rose-700' },
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
            render: (row: any) => <span className="font-semibold text-foreground">{row.employee_name || `Pegawai ID ${row.employee_id}`}</span> 
        },
        { 
            key: 'date', 
            label: 'Tanggal', 
            render: (row: any) => formatDate(row.date) 
        },
        { 
            key: 'clock_in', 
            label: 'Jam Masuk', 
            render: (row: any) => formatTime(row.clock_in) 
        },
        { 
            key: 'clock_out', 
            label: 'Jam Pulang', 
            render: (row: any) => formatTime(row.clock_out) 
        },
        { 
            key: 'work_schedule_name', 
            label: 'Shift', 
            render: (row: any) => row.work_schedule_name || '-' 
        },
        {
            key: 'notes',
            label: 'Catatan / Alasan',
            render: (row: any) => {
                if (!row.notes) return <span className="text-muted-foreground text-xs italic">-</span>;
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

                if (!reason) return <span className="text-muted-foreground text-xs italic">-</span>;
                return (
                    <span className="text-xs text-foreground font-medium" title={reason}>
                        {reason}
                    </span>
                );
            },
        },
        {
            key: 'delegation',
            label: 'Karyawan Pengganti',
            render: (row: any) => {
                if (!row.notes) return <span className="text-muted-foreground text-xs italic">-</span>;
                let colleague = '';
                if (row.notes.includes('• Pengganti:')) {
                    colleague = row.notes.split('• Pengganti:')[1].trim();
                } else if (row.notes.includes('Pengganti:')) {
                    colleague = row.notes.split('Pengganti:')[1].trim();
                }

                if (colleague) {
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                            👤 {colleague}
                        </span>
                    );
                }
                return <span className="text-muted-foreground text-xs italic">-</span>;
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => {
                const isEarly = row.status?.toLowerCase() === 'early_leave';
                const isLateEarly = row.status?.toLowerCase() === 'late_early_leave';
                const isApproved = row.notes?.includes('[Disetujui');

                if (isEarly || isLateEarly) {
                    if (isApproved) {
                        return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                                <CheckCircle className="h-3 w-3 text-emerald-600" />
                                Pulang Awal (Disetujui)
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Pulang Awal (Menunggu ACC)
                        </span>
                    );
                }
                const cfg = statusConfig[row.status?.toLowerCase()] || { label: row.status, className: 'bg-gray-100 text-gray-700' };
                return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.className}`}>{cfg.label}</span>;
            }
        },
        {
            key: 'actions',
            label: 'Aksi',
            className: 'w-[120px] text-right',
            render: (row: any) => {
                const isEarly = row.status?.toLowerCase() === 'early_leave' || (row.notes && row.notes.includes('Pulang Cepat'));
                const isApproved = row.notes?.includes('[Disetujui');
                const needsAcc = isEarly && !isApproved;

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        {needsAcc && (
                            <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold shadow-sm"
                                title="ACC / Setujui Pulang Cepat Pegawai"
                                onClick={() => handleAccEarlyLeave(row)}
                            >
                                <CheckCircle className="h-3.5 w-3.5" />
                                ACC
                            </Button>
                        )}
                        <Button size="icon" variant="outline" className="h-7 w-7 text-indigo-500 border-indigo-200 hover:bg-indigo-50" title="Edit" onClick={() => handleEditClick(row)}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!row.clock_out && (
                            <Button size="icon" variant="outline" className="h-7 w-7 text-blue-500 border-blue-200 hover:bg-blue-50" title="Check-out" onClick={() => handleCheckoutClick(row)}>
                                <LogOut className="h-3.5 w-3.5" />
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
                    <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border text-xs">
                        <Button
                            variant={activeTab === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs font-medium"
                            onClick={() => setActiveTab('all')}
                        >
                            Semua ({data.length})
                        </Button>
                        <Button
                            variant={activeTab === 'early_leave' ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-7 text-xs gap-1.5 font-medium ${activeTab === 'early_leave' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'text-orange-600 dark:text-orange-400'}`}
                            onClick={() => setActiveTab('early_leave')}
                        >
                            Pulang Cepat
                            {pendingEarlyCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold text-[10px]">
                                    {pendingEarlyCount}
                                </span>
                            )}
                        </Button>
                    </div>
                }
                actions={[{
                    label: 'Input Manual',
                    icon: Plus,
                    onClick: () => setOpenModal(true)
                }]}
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
