import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface KpiCategory {
    id: number;
    name: string;
    code: string;
    description: string | null;
    weight: number;
    sort_order: number;
    is_active: boolean;
    templates_count: number;
}

export default function KpiCategoryIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<KpiCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<KpiCategory | null>(null);

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
            const res = await api.get('/kpi/categories');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching KPI categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/kpi/categories/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting KPI category:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama Kategori' },
        {
            key: 'weight',
            label: 'Bobot',
            render: (item: KpiCategory) => <span className="font-medium">{item.weight}%</span>,
        },
        {
            key: 'sort_order',
            label: 'Urutan',
            render: (item: KpiCategory) => <span>{item.sort_order}</span>,
        },
        {
            key: 'templates_count',
            label: 'Jml Template',
            render: (item: KpiCategory) => (
                <Badge variant="secondary">{item.templates_count || 0} item</Badge>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            className: 'w-[120px]',
            render: (item: KpiCategory) => (
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
            render: (item: KpiCategory) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/kpi/categories/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/kpi/categories/${item.id}/edit`)}
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
                title="Kategori KPI"
                description="Kelola kategori penilaian kinerja dan bobot masing-masing kategori."
                actions={[
                    { label: 'Template & Indikator', href: '/hr/kpi/templates', variant: 'outline' },
                    { label: 'Tambah Kategori', href: '/hr/kpi/categories/create', icon: Plus },
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
                            Apakah Anda yakin ingin menghapus kategori KPI{' '}
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
