import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Pencil, CheckSquare, FileText } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

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
    const { hasPermission, user } = useAuth();
    const isAdmin = user?.role_id === 1 || user?.role_id === 7;

    const [letters, setLetters] = useState<OutgoingLetter[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const searchQuery = searchParams.get('search') || '';
    const activeTab = searchParams.get('tab') || 'my_letters';

    const handleTabChange = (val: string) => {
        setSearchParams(prev => {
            prev.set('tab', val);
            prev.set('page', '1');
            return prev;
        });
    };

    const fetchLetters = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/outgoing-letters?page=${currentPage}&per_page=${perPage}&search=${searchQuery}&type=${activeTab}`), {
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
    }, [currentPage, perPage, searchQuery, activeTab]);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="secondary">Draf</Badge>;
            case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Menunggu</Badge>;
            case 'partially_signed': return <Badge className="bg-blue-500 hover:bg-blue-600">TTD Sebagian</Badge>;
            case 'fully_signed': return <Badge className="bg-green-500 hover:bg-green-600">TTD Lengkap</Badge>;
            case 'approved': return <Badge className="bg-green-500 hover:bg-green-600">Disetujui</Badge>;
            case 'rejected': return <Badge variant="destructive">Ditolak</Badge>;
            case 'revision_requested': return <Badge className="bg-orange-500 hover:bg-orange-600">Revisi</Badge>;
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
            className: 'w-[120px] text-right',
            render: (item: OutgoingLetter) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/admin/outgoing-letters/${item.id}`)}
                        title="Lihat"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    {['draft', 'pending', 'revision_requested'].includes(item.status) && hasPermission('outgoing_letter.edit') && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => navigate(`/admin/outgoing-letters/${item.id}/edit`)}
                            title="Edit"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    const tabs = [
        { id: 'my_letters', label: isAdmin ? "Semua Surat" : "Surat Saya", icon: FileText },
        { id: 'need_approval', label: "Tanda Tangan", icon: CheckSquare }
    ];

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <IndexPage
                    headerExtra={
                        <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`
                                            inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all
                                            ${isActive 
                                                ? 'bg-background text-foreground shadow-sm border border-border/50' 
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }
                                        `}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    }
                    title={activeTab === 'my_letters' ? (isAdmin ? "Semua Surat Keluar" : "Surat Keluar") : "Tanda Tangan"}
                    description={activeTab === 'my_letters' ? (isAdmin ? "Daftar seluruh surat keluar di sistem." : "Daftar surat keluar yang Anda buat.") : "Daftar surat keluar yang menunggu tanda tangan Anda."}
                    actions={hasPermission('outgoing_letter.create') ? [
                        { label: 'Buat Surat', icon: Plus, onClick: () => navigate('/admin/outgoing-letters/create') }
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
                            onPerPageChange={(perPage) => setSearchParams(prev => { prev.set('per_page', perPage.toString()); prev.set('page', '1'); return prev; })}
                            onSearchChange={handleSearch}
                searchValue={searchQuery}
                isLoading={loading}
                emptyMessage={activeTab === 'my_letters' ? "Belum ada surat keluar." : "Belum ada surat yang menunggu tanda tangan."}
            />
            </div>
        </AdminLayout>
    );
}
