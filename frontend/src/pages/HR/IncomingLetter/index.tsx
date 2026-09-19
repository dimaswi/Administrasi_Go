import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

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

    const [letters, setLetters] = useState<IncomingLetter[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const searchQuery = searchParams.get('search') || '';

    const fetchLetters = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/incoming-letters?page=${currentPage}&per_page=${perPage}&search=${searchQuery}`, {
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
    }, [currentPage, perPage, searchQuery]);

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
            render: (item: IncomingLetter) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/incoming-letters/${item.id}`)}>
                        <Eye className="size-4 mr-1" /> Detail / Disposisi
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
                actions={[
                    { 
                        label: 'Catat Surat Masuk', 
                        icon: Plus, 
                        onClick: () => navigate('/admin/incoming-letters/create') 
                    }
                ]}
                data={letters}
                columns={columns}
                pagination={{
                    current_page: currentPage,
                    per_page: perPage,
                    total: total,
                    last_page: Math.ceil(total / perPage) || 1
                }}
                onPageChange={handlePageChange}
                onSearchChange={handleSearch}
                searchValue={searchQuery}
                isLoading={loading}
                emptyMessage="Belum ada surat masuk."
            />
        </AdminLayout>
    );
}
