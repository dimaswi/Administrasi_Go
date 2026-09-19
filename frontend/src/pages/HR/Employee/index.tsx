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
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import api from '@/lib/api';

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name?: string;
    gender: string;
    status: string;
    email?: string;
    phone?: string;
}

export default function EmployeeIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // State
    const [data, setData] = useState<Employee[]>([]);
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
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    // Filters
    const [filterValues, setFilterValues] = useState({
        search: searchParams.get('search') || '',
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

            const res = await api.get(`/employees?page=${page}&perPage=${perPage}&search=${search}`);
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
        
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
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

    const handleDeleteClick = (emp: Employee) => {
        setEmployeeToDelete(emp);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (employeeToDelete) {
            // Call API delete here...
            setDeleteDialogOpen(false);
            setEmployeeToDelete(null);
            fetchData();
        }
    };

    const columns = [
        {
            key: 'employee_id',
            label: 'NIP',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                <span className="font-mono text-sm">{emp.employee_id}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nama Pegawai',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                        {emp.first_name.charAt(0)}{emp.last_name ? emp.last_name.charAt(0) : ''}
                    </div>
                    <div className="ml-3">
                        <div className="font-medium text-sm">{emp.first_name} {emp.last_name || ''}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'Kontak',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                <div>
                    <div className="text-sm">{emp.email || '-'}</div>
                    <div className="text-xs text-muted-foreground">{emp.phone || '-'}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                emp.status === 'active' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {emp.status}
                    </Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (emp: Employee) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => navigate(`/hr/employees/${emp.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(emp)}
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
                title="Pegawai"
                description="Kelola data pegawai"
                actions={[
                    {
                        label: 'Tambah Pegawai',
                        href: '/hr/employees/create',
                        icon: Plus,
                    },
                ]}
                data={data}
                columns={columns}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchValue={filterValues.search}
                searchPlaceholder="Cari NIP, nama..."
                onSearchChange={(val: string) => handleFilterChange('search', val)}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                emptyMessage="Belum ada data pegawai"
                emptyIcon={Users}
                isLoading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Pegawai</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data pegawai ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {employeeToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{employeeToDelete.first_name} {employeeToDelete.last_name}</p>
                                <p className="text-sm text-muted-foreground">NIP: {employeeToDelete.employee_id}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setEmployeeToDelete(null);
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
