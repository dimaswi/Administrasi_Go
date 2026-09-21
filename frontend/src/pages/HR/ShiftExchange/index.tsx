import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import api from '@/lib/api';

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function ShiftExchangeIndex() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [usersMap, setUsersMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = parseJwt(token);
            if (payload) {
                setCurrentUserId(payload.user_id);
            }
        }
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [exchangesRes, usersRes, schedulesRes] = await Promise.all([
                api.get('/shift-exchanges'),
                api.get('/employees?perPage=1000'),
                api.get('/roster-schedules')
            ]);
            
            const users = usersRes.data?.data || [];
            const umap: Record<string, string> = {};
            users.forEach((u: any) => {
                if (u.id) {
                    umap[u.id.toString()] = (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : '');
                }
            });
            setUsersMap(umap);
            
            setData(exchangesRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil data pengajuan shift');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.put(`/shift-exchanges/${id}/status`, {
                status,
                approved_by: currentUserId
            });
            toast.success(`Pengajuan berhasil di-${status}`);
            fetchData();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || `Gagal me-${status} pengajuan`);
        }
    };

    const columns = [
        { key: 'requesting_employee_id', label: 'Pengaju', className: 'w-[220px]', render: (row: any) => <span className="font-medium truncate block max-w-[200px]">{usersMap[row.requesting_employee_id] || `#${row.requesting_employee_id}`}</span> },
        { key: 'target_employee_id', label: 'Ditujukan ke', className: 'w-[220px]', render: (row: any) => <span className="truncate block max-w-[200px]">{usersMap[row.target_employee_id] || (row.target_employee_id ? `#${row.target_employee_id}` : '-')}</span> },
        { key: 'reason', label: 'Alasan', render: (row: any) => <span className="text-muted-foreground text-sm">{row.reason}</span> },
        { 
            key: 'status', 
            label: 'Status', 
            className: 'w-[120px]',
            render: (row: any) => (
                <Badge variant="outline" className={row.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : row.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                    {row.status}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (row: any) => {
                if (row.status !== 'pending') return null;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleUpdateStatus(row.id, 'approved')} title="Approve">
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleUpdateStatus(row.id, 'rejected')} title="Reject">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Tukar Shift"
                description="Kelola pengajuan pertukaran jadwal dinas antar perawat/dokter"
                actions={[{ label: 'Ajukan Tukar Shift', href: '/hr/shift-exchanges/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data pengajuan tukar shift"
                emptyIcon={ArrowRightLeft}
                isLoading={loading}
            />
        </HrLayout>
    );
}