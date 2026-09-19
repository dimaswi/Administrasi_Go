import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Key } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import api from '@/lib/api';

interface Permission {
    id: number;
    name: string;
    description: string;
    module: string;
    action: string;
}

export default function PermissionIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/permissions');
            setData(res.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Derived paginated data
    const filteredData = data.filter(item => 
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.module?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const total = filteredData.length;
    const lastPage = Math.ceil(total / perPage) || 1;
    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);
    
    const pagination = {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total: total,
        from: total === 0 ? 0 : (page - 1) * perPage + 1,
        to: Math.min(page * perPage, total)
    };

    const handleDelete = async (id: number) => {
        if (confirm('Yakin ingin menghapus permission ini?')) {
            try {
                await api.delete(`/permissions/${id}`);
                fetchData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Permission',
            className: 'w-[200px]',
            render: (row: Permission) => <div className="font-medium">{row.name}</div>,
        },
        {
            key: 'module',
            label: 'Modul',
            className: 'w-[200px]',
            render: (row: Permission) => row.module || '-',
        },
        {
            key: 'action',
            label: 'Aksi',
            className: 'w-[200px]',
            render: (row: Permission) => row.action || '-',
        },
        {
            key: 'description',
            label: 'Deskripsi',
            className: 'w-[200px]',
            render: (row: Permission) => row.description || '-',
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (row: Permission) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/access/permissions/${row.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(row.id)}
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
                title="Daftar Permission"
                description="Kelola hak akses spesifik sistem"
                actions={[
                    {
                        label: 'Tambah Permission',
                        href: '/hr/access/permissions/create',
                        icon: Plus,
                    },
                ]}
                data={paginatedData}
                columns={columns}
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={(p) => { setPerPage(p); setPage(1); }}
                searchValue={searchTerm}
                onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
                emptyMessage="Belum ada data permission"
                emptyIcon={Key}
                isLoading={loading}
            />
        </HrLayout>
    );
}
