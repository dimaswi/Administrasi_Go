import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import api from '@/lib/api';

interface OrganizationUnit {
    id: number;
    code: string;
    name: string;
    level: number;
    parent_id: number | null;
    parent?: OrganizationUnit;
    head_id: number | null;
    head?: {
        id: number;
        name: string;
    };
    is_active: boolean;
    children_count?: number;
    users_count?: number;
    created_at: string;
}

export default function OrganizationIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // State
    const [data, setData] = useState<OrganizationUnit[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    const [loading, setLoading] = useState(true);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<OrganizationUnit | null>(null);

    // Filters
    const [filterValues, setFilterValues] = useState({
        search: searchParams.get('search') || '',
        level: searchParams.get('level') || '',
    });

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const page = searchParams.get('page') || '1';
            const perPage = searchParams.get('perPage') || '10';
            const search = searchParams.get('search') || '';
            const level = searchParams.get('level') || '';

            const res = await api.get(`/org-units?page=${page}&perPage=${perPage}&search=${search}&level=${level}`);
            setData(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        const params = new URLSearchParams(searchParams);
        if (filterValues.search) params.set('search', filterValues.search);
        else params.delete('search');
        
        if (filterValues.level) params.set('level', filterValues.level);
        else params.delete('level');
        
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', level: '' });
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    const handlePerPageChange = (perPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('perPage', perPage.toString());
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleDeleteClick = (unit: OrganizationUnit) => {
        setUnitToDelete(unit);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (unitToDelete) {
            // Call API delete here...
            setDeleteDialogOpen(false);
            setUnitToDelete(null);
            fetchData();
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            className: 'w-[200px]',
            render: (unit: OrganizationUnit) => (
                <span className="font-mono text-sm">{unit.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nama Unit',
            className: 'w-[200px]',
            render: (unit: OrganizationUnit) => (
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{unit.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6">Level {unit.level}{unit.parent ? ` • ${unit.parent.name}` : ''}</div>
                </div>
            ),
        },
        {
            key: 'level',
            label: 'Level',
            className: 'w-[200px]',
            render: (unit: OrganizationUnit) => (
                <Badge variant="outline">Level {unit.level}</Badge>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            className: 'w-[200px]',
            render: (unit: OrganizationUnit) => (
                unit.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Nonaktif
                    </Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (unit: OrganizationUnit) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => navigate(`/hr/organizations/${unit.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/organizations/${unit.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(unit)}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'level',
            label: 'Level',
            className: 'w-[200px]',
            type: 'select' as const,
            placeholder: 'Semua Level',
            options: [1, 2, 3, 4, 5].map(lvl => ({ value: lvl.toString(), label: `Level ${lvl}` })),
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Unit Organisasi"
                description="Kelola struktur organisasi klinik"
                actions={[
                    {
                        label: 'Tambah Unit',
                        href: '/hr/organizations/create',
                        icon: Plus,
                    },
                ]}
                data={data}
                columns={columns}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={filterFields}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode, nama unit..."
                onSearchChange={(val: string) => handleFilterChange('search', val)}
                emptyMessage="Belum ada unit organisasi"
                emptyIcon={Building2}
                isLoading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Unit Organisasi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus unit organisasi ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {unitToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{unitToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">Kode: {unitToDelete.code}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setUnitToDelete(null);
                            }}
                        >
                            Batal
                        </Button>
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
