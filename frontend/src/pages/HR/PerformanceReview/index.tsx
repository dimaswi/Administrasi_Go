import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface PerformanceReview {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_nik: string;
    organization_unit: string | null;
    period_id: number;
    period_name: string;
    reviewer_name: string | null;
    status: string;
    status_label: string;
    final_score: number | null;
    final_grade: string | null;
}

export default function PerformanceReviewIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<PerformanceReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<PerformanceReview | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/performance-reviews');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching performance reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/performance-reviews/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting review:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.employee_nik?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
            self_review: 'bg-blue-50 text-blue-700 border-blue-200',
            manager_review: 'bg-amber-50 text-amber-700 border-amber-200',
            calibration: 'bg-purple-50 text-purple-700 border-purple-200',
            completed: 'bg-green-50 text-green-700 border-green-200',
        };
        return (
            <Badge variant="outline" className={colors[status] || ''}>
                {label || status}
            </Badge>
        );
    };

    const columns = [
        { 
            key: 'employee_name', 
            label: 'Karyawan',
            render: (item: PerformanceReview) => (
                <div>
                    <div className="font-semibold text-foreground">{item.employee_name}</div>
                    <div className="text-xs text-muted-foreground">{item.employee_nik} • {item.organization_unit || '-'}</div>
                </div>
            )
        },
        {
            key: 'period_name',
            label: 'Periode',
            render: (item: PerformanceReview) => <Badge variant="secondary">{item.period_name}</Badge>,
        },
        {
            key: 'reviewer_name',
            label: 'Penilai / Atasan',
            render: (item: PerformanceReview) => (
                <span className="text-sm">{item.reviewer_name || '-'}</span>
            ),
        },
        {
            key: 'status',
            label: 'Tahap Penilaian',
            render: (item: PerformanceReview) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'final_score',
            label: 'Skor Akhir',
            render: (item: PerformanceReview) => (
                item.final_score !== null ? (
                    <span className="font-bold text-foreground">
                        {item.final_score} {item.final_grade ? `(Grade ${item.final_grade})` : ''}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (item: PerformanceReview) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/performance-reviews/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/performance-reviews/${item.id}/edit`)}
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
                title="Penilaian Kinerja Pegawai"
                description="Evaluasi performa berkala karyawan berdasarkan indikator KPI dan arahan kompetensi."
                actions={[
                    { label: 'Periode Penilaian', href: '/hr/performance-periods', variant: 'outline' },
                    { label: 'Buat Penilaian', href: '/hr/performance-reviews/create', icon: Plus },
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
                            Apakah Anda yakin ingin menghapus data penilaian untuk{' '}
                            <strong>{itemToDelete?.employee_name}</strong>?
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

