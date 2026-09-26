import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface DispositionWithDetails {
    id: number;
    incoming_letter_id: number;
    from_user_id: number;
    to_user_id: number;
    instruction: string;
    priority: string;
    deadline?: string;
    status: string;
    created_at: string;
    from_user_name: string;
    incoming_number: string;
    incoming_subject: string;
    incoming_sender: string;
    incoming_received_date: string;
    incoming_classification: string;
}

export default function DispositionIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [dispositions, setDispositions] = useState<DispositionWithDetails[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const statusQuery = searchParams.get('status') || '';
    const priorityQuery = searchParams.get('priority') || '';
    const searchQuery = searchParams.get('search') || '';

    const fetchDispositions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                per_page: perPage.toString(),
                status: statusQuery,
                priority: priorityQuery,
                search: searchQuery,
            }).toString();

            const res = await fetch(`http://localhost:8080/api/dispositions?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setDispositions(data.data || []);
                setTotal(data.total || 0);
            } else {
                console.error("Failed to fetch dispositions:", data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDispositions();
    }, [currentPage, perPage, statusQuery, priorityQuery, searchQuery]);

    const handlePageChange = (page: number) => {
        setSearchParams(prev => {
            prev.set('page', page.toString());
            return prev;
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            if (value) prev.set(key, value);
            else prev.delete(key);
            prev.set('page', '1');
            return prev;
        });
    };

    const handlePerPageChange = (perPageVal: number) => {
        setSearchParams(prev => {
            prev.set('per_page', perPageVal.toString());
            prev.set('page', '1');
            return prev;
        });
    };

    const handleFilterReset = () => {
        setSearchParams(new URLSearchParams());
    };

    const markAsRead = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/dispositions/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'read' })
            });
            if (res.ok) {
                fetchDispositions();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        {
            label: 'Surat',
            key: 'incoming_number',
            render: (item: DispositionWithDetails) => (
                <div className="max-w-[200px]">
                    <div className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/admin/incoming-letters/${item.incoming_letter_id}`)}>
                        {item.incoming_number}
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={item.incoming_subject}>{item.incoming_subject}</div>
                    <div className="text-xs text-muted-foreground mt-1">Pengirim: {item.incoming_sender}</div>
                </div>
            )
        },
        {
            label: 'Dari',
            key: 'from_user_name',
            render: (item: DispositionWithDetails) => (
                <div>
                    <div className="font-medium">{item.from_user_name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                </div>
            )
        },
        { 
            label: 'Instruksi', 
            key: 'instruction',
            render: (item: DispositionWithDetails) => (
                <div className="max-w-[250px]">
                    <div className="text-sm font-medium">{item.instruction}</div>
                    {item.deadline && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            Batas: {new Date(item.deadline).toLocaleDateString('id-ID')}
                        </div>
                    )}
                </div>
            )
        },
        {
            label: 'Prioritas & Status',
            key: 'priority',
            render: (item: DispositionWithDetails) => {
                const statusMap: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
                    'pending': { label: 'Pending', variant: 'destructive' },
                    'read': { label: 'Dibaca', variant: 'secondary' },
                    'in_progress': { label: 'Diproses', variant: 'outline' },
                    'completed': { label: 'Selesai', variant: 'default' }
                };
                const mappedStatus = statusMap[item.status] || { label: item.status, variant: 'outline' };
                
                const priorityMap: Record<string, string> = {
                    'low': 'bg-slate-100 text-slate-700',
                    'normal': 'bg-blue-100 text-blue-700',
                    'high': 'bg-orange-100 text-orange-700',
                    'urgent': 'bg-red-100 text-red-700'
                };
                const pClass = priorityMap[item.priority] || priorityMap['normal'];

                return (
                    <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant={mappedStatus.variant}>{mappedStatus.label}</Badge>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pClass}`}>
                            {item.priority.toUpperCase()}
                        </span>
                    </div>
                );
            }
        },
        {
            label: 'Aksi',
            key: 'id',
            className: 'w-[120px] text-right',
            render: (item: DispositionWithDetails) => (
                <div className="flex items-center justify-end gap-2">
                    {item.status === 'pending' && (
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => markAsRead(item.id)}
                            title="Tandai Dibaca"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/admin/incoming-letters/${item.incoming_letter_id}`)}
                        title="Buka Surat"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AdminLayout>
            <IndexPage
                title="Kotak Disposisi"
                description="Daftar disposisi surat yang ditugaskan kepada Anda."
                data={dispositions}
                columns={columns}
                pagination={{
                    current_page: currentPage,
                    per_page: perPage,
                    total: total,
                    last_page: Math.ceil(total / perPage) || 1,
                    from: total === 0 ? 0 : (currentPage - 1) * perPage + 1,
                    to: Math.min(currentPage * perPage, total)
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchValue={searchQuery}
                onSearchChange={(v) => handleFilterChange('search', v)}
                isLoading={loading}
                emptyMessage="Tidak ada disposisi untuk Anda."
                filterFields={[
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'select',
                        placeholder: 'Semua Status',
                        options: [
                            { value: 'pending', label: 'Pending' },
                            { value: 'read', label: 'Dibaca' },
                            { value: 'in_progress', label: 'Dalam Proses' },
                            { value: 'completed', label: 'Selesai' }
                        ]
                    },
                    {
                        key: 'priority',
                        label: 'Prioritas',
                        type: 'select',
                        placeholder: 'Semua Prioritas',
                        options: [
                            { value: 'low', label: 'Low' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'high', label: 'High' },
                            { value: 'urgent', label: 'Urgent' }
                        ]
                    }
                ]}
                filterValues={{
                    status: statusQuery,
                    priority: priorityQuery,
                }}
                onFilterChange={handleFilterChange}
                onFilterReset={handleFilterReset}
            />
        </AdminLayout>
    );
}
