import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CalendarClock } from 'lucide-react';
import api from '@/lib/api';

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
    is_flexible: boolean;
    is_special: boolean;
    is_active: boolean;
}

export default function WorkScheduleIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<WorkSchedule | null>(null);

    // Pagination & Search state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/work-schedules`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (schedule: WorkSchedule) => {
        setScheduleToDelete(schedule);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (scheduleToDelete) {
            try {
                await api.delete(`/work-schedules/${scheduleToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error(error);
            } finally {
                setDeleteDialogOpen(false);
                setScheduleToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const total = filteredData.length;
    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

    const pagination = {
        current_page: page,
        last_page: Math.ceil(total / perPage) || 1,
        per_page: perPage,
        total: total,
        from: total === 0 ? 0 : (page - 1) * perPage + 1,
        to: Math.min(page * perPage, total)
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode Shift',
            className: 'w-[150px]',
            render: (sch: WorkSchedule) => <span className="font-mono text-sm">{sch.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Shift',
            className: 'w-[200px]',
            render: (sch: WorkSchedule) => <div className="font-medium text-sm">{sch.name}</div>,
        },
        {
            key: 'time',
            label: 'Jam Kerja',
            className: 'w-[150px]',
            render: (sch: WorkSchedule) => {
                // Extract HH:mm from "0000-01-01T08:00:00Z" or "08:00:00"
                const formatTime = (t: string) => {
                    if (!t) return '-';
                    const match = t.match(/T(\d{2}:\d{2})/);
                    if (match) return match[1];
                    return t.length >= 5 ? t.substring(0, 5) : t;
                };
                return (
                    <div className="text-sm">
                        {formatTime(sch.clock_in_time)} - {formatTime(sch.clock_out_time)}
                    </div>
                );
            },
        },
        {
            key: 'type',
            label: 'Kategori',
            className: 'w-[200px]',
            render: (sch: WorkSchedule) => (
                <div className="flex gap-1">
                    {sch.is_flexible ? (
                         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Fleksibel</Badge>
                    ) : (
                         <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Tetap</Badge>
                    )}
                    {sch.is_special && (
                         <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Special</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[150px]',
            render: (sch: WorkSchedule) => (
                sch.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (sch: WorkSchedule) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/work-schedules/${sch.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(sch)}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Master Shift"
                description="Kelola referensi jam kerja / shift"
                actions={[{ label: 'Tambah Shift', href: '/hr/work-schedules/create', icon: Plus }]}
                data={paginatedData}
                columns={columns}
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={(p) => { setPerPage(p); setPage(1); }}
                searchValue={searchTerm}
                onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
                emptyMessage="Belum ada data shift"
                emptyIcon={CalendarClock}
                isLoading={loading}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Shift</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus shift ini?
                        </DialogDescription>
                    </DialogHeader>
                    {scheduleToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{scheduleToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">Kode: {scheduleToDelete.code}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}