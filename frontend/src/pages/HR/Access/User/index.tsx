import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Role {
    id: number;
    name: string;
    display_name: string;
}

interface User {
    id: number;
    name: string;
    role_id?: number;
}

export default function UserIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
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
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles')
            ]);
            setData(usersRes.data.data || []);
            setRoles(rolesRes.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Derived paginated data
    const filteredData = data.filter(item => 
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
        if (confirm('Yakin ingin menghapus user ini?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleRoleChange = async (userId: number, newRoleId: string) => {
        const userToUpdate = data.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        try {
            await api.put(`/users/${userId}`, {
                ...userToUpdate,
                role_id: parseInt(newRoleId)
            });
            toast.success('Role berhasil diperbarui');
            
            // Update local state to avoid full refetch
            setData(prev => prev.map(u => u.id === userId ? { ...u, role_id: parseInt(newRoleId) } : u));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal memperbarui role');
            console.error(error);
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Lengkap',
            className: 'w-[300px]',
            render: (row: User) => <div className="font-medium">{row.name}</div>,
        },
        {
            key: 'role',
            label: 'Role',
            className: 'w-[200px]',
            render: (row: User) => (
                <Select
                    value={row.role_id?.toString() || ""}
                    onValueChange={(val) => handleRoleChange(row.id, val)}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue placeholder="Pilih Role">
                            {row.role_id ? roles.find(r => r.id === row.role_id)?.display_name || roles.find(r => r.id === row.role_id)?.name : "Pilih Role"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map(r => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                                {r.display_name || r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (row: User) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/access/users/${row.id}/edit`)}
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
                title="Daftar User"
                description="Kelola pengguna aplikasi administrasi HR"
                actions={[
                    {
                        label: 'Tambah User',
                        href: '/hr/access/users/create',
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
                emptyMessage="Belum ada data user"
                emptyIcon={Users}
                isLoading={loading}
            />
        </HrLayout>
    );
}
