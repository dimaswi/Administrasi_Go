import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, FileText } from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import api from '@/lib/api';

interface LeaveType {
    id: number;
    code: any;
    name: any;
    default_quota: any;
    is_active: any;
}

export default function LeaveTypeIndex() {
    const navigate = useNavigate();
    const [data, setData] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<LeaveType | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leave-types');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/leave-types/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error(error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const columns = [
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama Cuti' },
        { key: 'default_quota', label: 'Kuota' },
        {
            key: 'is_active',
            label: 'Status',
            className: 'w-[200px]',
            render: (item: LeaveType) => (
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
            className: 'w-[100px] text-right',
            render: (item: LeaveType) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => navigate(`/hr/master-data/leavetype/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/master-data/leavetype/${item.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
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
                title="Jenis Cuti"
                description="Kelola data jenis cuti untuk sistem HR"
                actions={[
                    { label: 'Tambah Data', href: '/hr/master-data/leavetype/create', icon: Plus },
                ]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data"
                emptyIcon={FileText}
                isLoading={loading}
            />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Data</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" /> Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}