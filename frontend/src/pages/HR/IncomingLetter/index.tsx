import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { useAuth } from '@/contexts/AuthContext';

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    original_date: string;
    received_date: string;
    sender: string;
    subject: string;
    status: string;
}

export default function IncomingLetterIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [letters, setLetters] = useState<IncomingLetter[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const searchQuery = searchParams.get('search') || '';
    const statusQuery = searchParams.get('status') || '';
    const categoryQuery = searchParams.get('category') || '';
    const classificationQuery = searchParams.get('classification') || '';
    const dateFromQuery = searchParams.get('date_from') || '';
    const dateToQuery = searchParams.get('date_to') || '';

    const fetchLetters = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                per_page: perPage.toString(),
                search: searchQuery,
                status: statusQuery,
                category: categoryQuery,
                classification: classificationQuery,
                date_from: dateFromQuery,
                date_to: dateToQuery,
            }).toString();

            const res = await fetch(`http://localhost:8080/api/incoming-letters?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setLetters(data.data || []);
                setTotal(data.total || 0);
            } else {
                console.error("Failed to fetch letters:", data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLetters();
    }, [currentPage, perPage, searchQuery, statusQuery, categoryQuery, classificationQuery, dateFromQuery, dateToQuery]);

    const handleSearch = (value: string) => {
        setSearchParams(prev => {
            if (value) prev.set('search', value);
            else prev.delete('search');
            prev.set('page', '1');
            return prev;
        });
    };

    const handlePageChange = (page: number) => {
        setSearchParams(prev => {
            prev.set('page', page.toString());
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

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            if (value) prev.set(key, value);
            else prev.delete(key);
            prev.set('page', '1');
            return prev;
        });
    };

    const handleFilterReset = () => {
        setSearchParams(new URLSearchParams());
    };

    const columns = [
        {
            label: 'No Surat',
            key: 'incoming_number',
            render: (item: IncomingLetter) => (
                <div>
                    <div className="font-medium text-blue-600">{item.incoming_number}</div>
                    <div className="text-xs text-muted-foreground">Asli: {item.original_number}</div>
                </div>
            )
        },
        {
            label: 'Tgl Diterima',
            key: 'received_date',
            render: (item: IncomingLetter) => (
                <div>
                    <div>{new Date(item.received_date).toLocaleDateString('id-ID')}</div>
                    <div className="text-xs text-muted-foreground">Tgl Surat: {new Date(item.original_date).toLocaleDateString('id-ID')}</div>
                </div>
            )
        },
        { label: 'Pengirim', key: 'sender' },
        { 
            label: 'Perihal', 
            key: 'subject',
            render: (item: IncomingLetter) => (
                <div className="max-w-[200px] truncate" title={item.subject}>{item.subject}</div>
            )
        },
        {
            label: 'Status',
            key: 'status',
            render: (item: IncomingLetter) => {
                const statusMap: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
                    'new': { label: 'Baru', variant: 'destructive' },
                    'disposed': { label: 'Didisposisikan', variant: 'outline' },
                    'in_progress': { label: 'Diproses', variant: 'secondary' },
                    'completed': { label: 'Selesai', variant: 'default' }
                };
                const mapped = statusMap[item.status] || { label: item.status, variant: 'outline' };
                return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
            }
        },
        {
            label: 'Aksi',
            key: 'id',
            className: 'w-[100px] text-right',
            render: (item: IncomingLetter) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/admin/incoming-letters/${item.id}`)}
                        title="Detail / Disposisi"
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
                title="Surat Masuk"
                description="Kelola dan catat surat masuk beserta alur disposisinya."
                actions={hasPermission('incoming_letter.create') ? [
                    { 
                        label: 'Catat Surat Masuk', 
                        icon: Plus, 
                        onClick: () => navigate('/admin/incoming-letters/create') 
                    }
                ] : undefined}
                data={letters}
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
                onSearchChange={handleSearch}
                searchValue={searchQuery}
                isLoading={loading}
                emptyMessage="Belum ada surat masuk."
                filterFields={[
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'select',
                        placeholder: 'Semua Status',
                        options: [
                            { value: 'new', label: 'Baru' },
                            { value: 'disposed', label: 'Sudah Disposisi' },
                            { value: 'in_progress', label: 'Dalam Proses' },
                            { value: 'completed', label: 'Selesai' },
                            { value: 'archived', label: 'Diarsipkan' },
                        ]
                    },
                    {
                        key: 'classification',
                        label: 'Klasifikasi',
                        type: 'select',
                        placeholder: 'Semua Klasifikasi',
                        options: [
                            { value: 'biasa', label: 'Biasa' },
                            { value: 'penting', label: 'Penting' },
                            { value: 'segera', label: 'Segera' },
                            { value: 'rahasia', label: 'Rahasia' },
                        ]
                    },
                    {
                        key: 'category',
                        label: 'Kategori',
                        type: 'select',
                        placeholder: 'Semua Kategori',
                        options: [
                            { value: 'Undangan', label: 'Undangan' },
                            { value: 'Permohonan', label: 'Permohonan' },
                            { value: 'Pemberitahuan', label: 'Pemberitahuan' },
                            { value: 'Surat Tugas', label: 'Surat Tugas' },
                            { value: 'Surat Keputusan', label: 'Surat Keputusan' },
                            { value: 'Surat Edaran', label: 'Surat Edaran' },
                            { value: 'Nota Dinas', label: 'Nota Dinas' },
                            { value: 'Lainnya', label: 'Lainnya' },
                        ]
                    },
                    { key: 'date_from', label: 'Tanggal Mulai', type: 'date' },
                    { key: 'date_to', label: 'Tanggal Akhir', type: 'date' }
                ]}
                filterValues={{
                    status: statusQuery,
                    category: categoryQuery,
                    classification: classificationQuery,
                    date_from: dateFromQuery,
                    date_to: dateToQuery
                }}
                onFilterChange={handleFilterChange}
                onFilterReset={handleFilterReset}
            />
        </AdminLayout>
    );
}
