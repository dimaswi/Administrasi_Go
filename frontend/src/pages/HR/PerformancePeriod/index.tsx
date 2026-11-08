import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface PerformancePeriod {
    id: number;
    name: string;
    type: string;
    type_label: string;
    start_date: string;
    end_date: string;
    status: string;
    status_label: string;
    is_current: boolean;
    reviews_count: number;
}

export default function PerformancePeriodIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<PerformancePeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<PerformancePeriod | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/performance-periods');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching performance periods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/performance-periods/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting performance period:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.type_label?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
            closed: 'bg-blue-50 text-blue-700 border-blue-200',
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
            label: 'Nama Periode',
            render: (item: PerformancePeriod) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    {item.is_current && (
                        <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5">Sedang Berjalan</Badge>
                    )}
                </div>
            )
        },
        {
            key: 'type_label',
            label: 'Siklus',
            render: (item: PerformancePeriod) => <Badge variant="secondary">{item.type_label || item.type}</Badge>,
        },
        {
            key: 'date_range',
            label: 'Rentang Waktu',
            render: (item: PerformancePeriod) => (
                <span className="text-sm font-mono">
                    {item.start_date.substring(0, 10)} s/d {item.end_date.substring(0, 10)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: PerformancePeriod) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'reviews_count',
            label: 'Total Penilaian',
            render: (item: PerformancePeriod) => (
                <Badge variant="outline">{item.reviews_count || 0} evaluasi</Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (item: PerformancePeriod) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/performance-periods/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/performance-periods/${item.id}/edit`)}
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
                title="Periode Penilaian Kinerja"
                description="Kelola siklus penilaian kinerja bulanan, triwulan, semester, maupun tahunan."
                actions={[
                    { label: 'Buat Periode Baru', href: '/hr/performance-periods/create', icon: Plus },
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
                            Apakah Anda yakin ingin menghapus periode{' '}
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

