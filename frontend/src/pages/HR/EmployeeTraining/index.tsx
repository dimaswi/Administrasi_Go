import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface EmployeeTraining {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_nik: string;
    organization_unit: string | null;
    training_id: number;
    training_code: string;
    training_name: string;
    status: string;
    status_label: string;
    score: number | null;
    grade: string | null;
    certificate_number: string | null;
}

export default function EmployeeTrainingIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<EmployeeTraining[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<EmployeeTraining | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/employee-trainings');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching employee trainings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/employee-trainings/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting employee training:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.employee_nik?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.training_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.training_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
            registered: 'bg-blue-50 text-blue-700 border-blue-200',
            in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
            completed: 'bg-green-50 text-green-700 border-green-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
            cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
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
            render: (item: EmployeeTraining) => (
                <div>
                    <div className="font-medium text-foreground">{item.employee_name}</div>
                    <div className="text-xs text-muted-foreground">{item.employee_nik} • {item.organization_unit || '-'}</div>
                </div>
            )
        },
        {
            key: 'training_name',
            label: 'Program Pelatihan',
            render: (item: EmployeeTraining) => (
                <div>
                    <div className="font-medium text-foreground">{item.training_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{item.training_code}</div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: EmployeeTraining) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'score',
            label: 'Nilai / Grade',
            render: (item: EmployeeTraining) => (
                item.score !== null ? (
                    <span className="font-medium">{item.score} {item.grade ? `(${item.grade})` : ''}</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'certificate_number',
            label: 'No. Sertifikat',
            render: (item: EmployeeTraining) => (
                <span className="text-xs font-mono">{item.certificate_number || '-'}</span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (item: EmployeeTraining) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/employee-trainings/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/employee-trainings/${item.id}/edit`)}
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
                title="Peserta Training"
                description="Pantau progres keikutsertaan, kelulusan, dan sertifikasi pelatihan staf."
                actions={[
                    { label: 'Daftar Program', href: '/hr/trainings', variant: 'outline' },
                    { label: 'Daftarkan Peserta', href: '/hr/employee-trainings/create', icon: Plus },
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
                            Apakah Anda yakin ingin menghapus data keikutsertaan pelatihan untuk{' '}
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

