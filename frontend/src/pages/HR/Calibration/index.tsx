import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface CalibrationSession {
    id: number;
    period_id: number;
    period_name: string;
    name: string;
    description: string | null;
    date: string;
    status: string;
    status_label: string;
    reviews_count: number;
}

export default function CalibrationIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<CalibrationSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<CalibrationSession | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calibration');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching calibration sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/calibration/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting calibration session:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.period_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.status_label?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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

    const getStatusBadge = (status: string, label: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-slate-50 text-slate-700 border-slate-200',
            active: 'bg-green-50 text-green-700 border-green-200',
            completed: 'bg-blue-50 text-blue-700 border-blue-200',
        };
        return (
            <Badge variant="outline" className={colors[status] || ''}>
                {label || status}
            </Badge>
        );
    };

    const columns = [
        { 
            key: 'name', 
            label: 'Nama Sesi Kalibrasi',
            render: (item: CalibrationSession) => (
                <div>
                    <div className="font-semibold text-foreground">{item.name}</div>
                    {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    )}
                </div>
            )
        },
        {
            key: 'period_name',
            label: 'Periode',
            render: (item: CalibrationSession) => <Badge variant="secondary">{item.period_name}</Badge>,
        },
        {
            key: 'date',
            label: 'Tanggal Sesi',
            render: (item: CalibrationSession) => (
                <span className="text-sm font-mono">{item.date.substring(0, 10)}</span>
            ),
        },
        {
            key: 'reviews_count',
            label: 'Review Dikalibrasi',
            render: (item: CalibrationSession) => (
                <Badge variant="outline">{item.reviews_count || 0} review</Badge>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: CalibrationSession) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (item: CalibrationSession) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/calibration/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/calibration/${item.id}/edit`)}
                        title="Edit Data"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                            setItemToDelete(item);
                            setDeleteDialogOpen(true);
                        }}
                        title="Hapus Data"
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
                title="Sesi Kalibrasi Nilai Kinerja"
                description="Standarisasi dan kalibrasi kurva distribusi nilai performa antar divisi secara objektif."
                actions={[
                    { label: 'Buat Sesi Kalibrasi', href: '/hr/calibration/create', icon: Plus },
                ]}
                columns={columns}
                data={paginatedData}
                pagination={pagination}
                isLoading={loading}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onPageChange={setPage}
                onPerPageChange={(newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                }}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus sesi kalibrasi{' '}
                            <strong>{itemToDelete?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}

