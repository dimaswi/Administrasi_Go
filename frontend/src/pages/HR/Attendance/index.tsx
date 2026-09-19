import { useEffect, useState } from 'react';
import HrLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { Clock, Plus } from 'lucide-react';
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

export default function AttendanceIndex() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    
    // Check-in state
    const [openModal, setOpenModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendances');
            setData(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleManualCheckin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            toast.error("Pilih pegawai terlebih dahulu");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/attendances/check-in', {
                user_id: parseInt(selectedUser),
                notes: notes || "Manual Check-in by HR"
            });
            toast.success("Check-in manual berhasil!");
            setOpenModal(false);
            setSelectedUser("");
            setNotes("");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Gagal melakukan check-in manual");
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const columns = [
        { key: 'user_name', label: 'Nama Pegawai', render: (row: any) => row.user_name || `User ID ${row.user_id}` },
        { key: 'date', label: 'Tanggal', render: (row: any) => row.date ? row.date.substring(0, 10) : '-' },
        { key: 'clock_in', label: 'Jam Masuk', render: (row: any) => formatTime(row.clock_in) },
        { key: 'clock_out', label: 'Jam Pulang', render: (row: any) => formatTime(row.clock_out) },
        { key: 'work_schedule_name', label: 'Shift', render: (row: any) => row.work_schedule_name || '-' },
        { key: 'status', label: 'Status', render: (row: any) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Hadir' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'}`}>
                {row.status}
            </span>
        ) },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Riwayat Absensi"
                description="Log check-in dan check-out harian pegawai"
                actions={[{ 
                    label: 'Input Manual', 
                    icon: Plus,
                    onClick: () => setOpenModal(true)
                }]}
                data={data}
                columns={columns}
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
                            <select 
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                required
                            >
                                <option value="" disabled>-- Pilih Pegawai --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Catatan Tambahan</Label>
                            <textarea 
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
        </HrLayout>
    );
}
