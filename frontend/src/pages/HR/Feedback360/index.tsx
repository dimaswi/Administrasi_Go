import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Feedback360Session {
    id: number;
    period_id: number;
    period_name: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    status: string;
    status_label: string;
    participants_count: number;
}

export default function Feedback360Index() {
    const navigate = useNavigate();
    const [data, setData] = useState<Feedback360Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Feedback360Session | null>(null);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/feedback360');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching 360 feedback sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/feedback360/${itemToDelete.id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting 360 feedback session:', error);
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
            active: 'bg-green-50 text-green-700 border-green-200',
            completed: 'bg-blue-50 text-blue-700 border-blue-200',
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
            label: 'Nama Sesi 360 Feedback',
            render: (item: Feedback360Session) => (
                <div>
                    <div className="font-semibold text-foreground">{item.name}</div>
                    {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    )}
                </div>
            )
        },
        {
            key: 'period_name',
            label: 'Periode',
            render: (item: Feedback360Session) => <Badge variant="secondary">{item.period_name}</Badge>,
        },
        {
            key: 'date_range',
            label: 'Jadwal Survei',
            render: (item: Feedback360Session) => (
                <span className="text-sm font-mono">
                    {item.start_date.substring(0, 10)} s/d {item.end_date.substring(0, 10)}
                </span>
            ),
        },
        {
            key: 'participants_count',
            label: 'Peserta / Responden',
            render: (item: Feedback360Session) => (
                <Badge variant="outline">{item.participants_count || 0} orang</Badge>
            ),
        },
        {
            key: 'status',
            label: 'Status Sesi',
            render: (item: Feedback360Session) => getStatusBadge(item.status, item.status_label),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (item: Feedback360Session) => (
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/hr/feedback360/${item.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/feedback360/${item.id}/edit`)}
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
                title="360 Degree Feedback"
                description="Kelola survei evaluasi multi-arah dari rekan kerja, atasan, dan bawahan."
                actions={[
                    { label: 'Buat Sesi Feedback', href: '/hr/feedback360/create', icon: Plus },
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
                            Apakah Anda yakin ingin menghapus sesi feedback{' '}
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

