import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Pencil } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OutgoingLetter {
    id: number;
    letter_number: string;
    subject: string;
    letter_date: string;
    status: string;
    template_name: string;
    creator_name: string;
}

export default function OutgoingLetterIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [letters, setLetters] = useState<OutgoingLetter[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const searchQuery = searchParams.get('search') || '';

    const fetchLetters = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/outgoing-letters?page=${currentPage}&per_page=${perPage}&search=${searchQuery}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setLetters(data.data || []);
                setTotal(data.pagination_meta?.total || 0);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="secondary">Draft</Badge>;
            case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
            case 'partially_signed': return <Badge className="bg-blue-500 hover:bg-blue-600">Partially Signed</Badge>;
            case 'fully_signed': return <Badge className="bg-green-500 hover:bg-green-600">Fully Signed</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            case 'revision_requested': return <Badge className="bg-orange-500 hover:bg-orange-600">Revision</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const columns = [
        {
            label: 'No Surat',
            key: 'letter_number',
            render: (item: OutgoingLetter) => (
                <div className="font-medium text-blue-600">{item.letter_number || '-'}</div>
            )
        },
        {
            label: 'Tanggal Surat',
            key: 'letter_date',
            render: (item: OutgoingLetter) => (
                <div>{new Date(item.letter_date).toLocaleDateString('id-ID')}</div>
            )
        },
        {
            label: 'Perihal',
            key: 'subject',
            render: (item: OutgoingLetter) => (
                <div className="max-w-[300px] truncate" title={item.subject}>
                    {item.subject}
                </div>
            )
        },
        { label: 'Template', key: 'template_name' },
        { label: 'Dibuat Oleh', key: 'creator_name' },
        {
            label: 'Status',
            key: 'status',
            render: (item: OutgoingLetter) => getStatusBadge(item.status)
        },
        {
            label: 'Aksi',
            key: 'actions',
            render: (item: OutgoingLetter) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/outgoing-letters/${item.id}`)}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    {['draft', 'pending', 'revision_requested'].includes(item.status) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => navigate(`/admin/outgoing-letters/${item.id}/edit`)}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <AdminLayout>
            <IndexPage
                title="Surat Keluar"
                description="Manajemen pembuatan dan persetujuan surat keluar"
                actions={[
                    {
                        label: 'Buat Surat',
                        icon: Plus,
                        onClick: () => navigate('/admin/outgoing-letters/create')
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
                onPerPageChange={(perPage) => setSearchParams(prev => { prev.set('per_page', perPage.toString()); prev.set('page', '1'); return prev; })}
                onSearchChange={handleSearch}
                searchValue={searchQuery}
                isLoading={loading}
                emptyMessage="Belum ada surat keluar."
            />
        </AdminLayout>
    );
}
