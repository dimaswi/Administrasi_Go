import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface KpiTemplate {
    id: number;
    category_id: number;
    category_name: string;
    name: string;
    code: string;
    description: string | null;
    measurement_type: string;
    measurement_type_label: string;
    unit: string | null;
    target_min: number | null;
    target_max: number | null;
    target_range: string | null;
    weight: number;
    is_active: boolean;
}

export default function KpiTemplateIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<KpiTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<KpiTemplate | null>(null);

    // Pagination & Search state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/kpi/templates');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching KPI templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/kpi/templates/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting KPI template:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.category_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.measurement_type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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

    const getMeasurementTypeBadge = (type: string, label: string) => {
        const colors: Record<string, string> = {
            numeric: 'bg-blue-50 text-blue-700 border-blue-200',
            percentage: 'bg-purple-50 text-purple-700 border-purple-200',
            currency: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rating: 'bg-amber-50 text-amber-700 border-amber-200',
            boolean: 'bg-slate-50 text-slate-700 border-slate-200',
        };
        return (
            <Badge variant="outline" className={colors[type] || ''}>
                {label || type}
            </Badge>
        );
    };

    const columns = [
        { key: 'code', label: 'Kode' },
        { 
            key: 'name', 
            label: 'Indikator KPI',
            render: (item: KpiTemplate) => (
                <div>
                    <div className="font-medium text-foreground">{item.name}</div>
                    {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    )}
                </div>
            )
        },
        {
            key: 'category_name',
            label: 'Kategori',
            render: (item: KpiTemplate) => (
                <Badge variant="secondary">{item.category_name || '-'}</Badge>
            ),
        },
        {
            key: 'measurement_type',
            label: 'Tipe',
            render: (item: KpiTemplate) => getMeasurementTypeBadge(item.measurement_type, item.measurement_type_label),
        },
        {
            key: 'target_range',
            label: 'Target',
            render: (item: KpiTemplate) => (
                <span className="font-mono text-sm">
                    {item.target_range || '-'} {item.unit ? `(${item.unit})` : ''}
                </span>
            ),
        },
        {
            key: 'weight',
            label: 'Bobot',
            render: (item: KpiTemplate) => <span className="font-medium">{item.weight}</span>,
        },
        {
            key: 'is_active',
            label: 'Status',
            className: 'w-[120px]',
            render: (item: KpiTemplate) => (
                item.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (item: KpiTemplate) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/kpi/templates/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/kpi/templates/${item.id}/edit`)}
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
                title="Template Indikator KPI"
                description="Kelola template dan standar indikator penilaian kinerja karyawan."
                actions={[
                    { label: 'Kelola Kategori', href: '/hr/kpi/categories', variant: 'outline' },
                    { label: 'Tambah Template', href: '/hr/kpi/templates/create', icon: Plus },
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
                            Apakah Anda yakin ingin menghapus template KPI{' '}
                            <strong>{itemToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
