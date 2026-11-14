import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import AdminLayout from '@/layouts/admin-layout';
// import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Copy, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Template {
    id: number;
    name: string;
    code: string;
    category: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    creator?: {
        id: number;
        name: string;
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Template Surat', href: '/arsip/document-templates' },
];

export default function DocumentTemplatesIndex() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { hasPermission } = useAuth();
    
    const [templates, setTemplates] = useState<{
        data: Template[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    }>({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });
    
    // Fallback categories for now
    const categories = ["Umum", "Kepegawaian", "Keuangan"];
    
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filterValues, setFilterValues] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        is_active: searchParams.get('is_active') || '',
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const query = new URLSearchParams(searchParams);
                const token = localStorage.getItem('token');
                const res = await fetch(getApiUrl(`/api/document-templates?${query.toString()}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setTemplates({
                        data: json.data,
                        current_page: json.pagination_meta.current_page,
                        last_page: json.pagination_meta.last_page,
                        per_page: json.pagination_meta.per_page,
                        total: json.pagination_meta.total,
                        from: (json.pagination_meta.current_page - 1) * json.pagination_meta.per_page + 1,
                        to: Math.min(json.pagination_meta.current_page * json.pagination_meta.per_page, json.pagination_meta.total),
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error("Gagal mengambil data template");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, [searchParams]);

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        const newParams = new URLSearchParams();
        Object.entries(filterValues).forEach(([k, v]) => {
            if (v) newParams.set(k, v);
        });
        if (searchParams.has('per_page')) {
            newParams.set('per_page', searchParams.get('per_page')!);
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '', category: '', is_active: '' });
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (page: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', page.toString());
        setSearchParams(newParams);
    };

    const handlePerPageChange = (perPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('per_page', perPage.toString());
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const [deleting, setDeleting] = useState(false);

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId === null) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/document-templates/${deleteId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Template berhasil dihapus');
                setSearchParams(new URLSearchParams(searchParams));
                setDeleteId(null);
            } else {
                toast.error('Gagal menghapus template');
            }
        } catch (err) {
            toast.error('Gagal menghapus template');
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleActive = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Find current template status
            const tmpl = templates.data.find(t => t.id === id);
            if (!tmpl) return;
            
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/document-templates/${id}`), {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...tmpl,
                    is_active: !tmpl.is_active
                })
            });
            if (res.ok) {
                toast.success('Status template berhasil diubah');
                setSearchParams(new URLSearchParams(searchParams));
            }
        } catch (err) {
            toast.error('Gagal mengubah status template');
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Template',
            render: (template: Template) => (
                <div className="max-w-[300px] md:max-w-[500px] lg:max-w-[700px] whitespace-normal text-wrap">
                    <Link 
                        to={`/arsip/document-templates/${template.id}`}
                        className="font-bold text-sm text-neutral-900 dark:text-neutral-100 hover:underline block truncate"
                    >
                        {template.name}
                    </Link>
                    {template.description && (
                        <div className="text-xs text-neutral-500 font-mono line-clamp-1 mt-0.5">
                            {template.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'code',
            label: 'Kode',
            render: (template: Template) => (
                <code className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded-none font-mono font-semibold">
                    {template.code}
                </code>
            ),
        },
        {
            key: 'category',
            label: 'Kategori',
            render: (template: Template) => (
                template.category ? (
                    <Badge variant="outline" className="rounded-none text-[10px] font-mono uppercase">{template.category}</Badge>
                ) : (
                    <span className="text-neutral-400 font-mono text-xs">-</span>
                )
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (template: Template) => (
                <Badge variant={template.is_active ? 'outline' : 'secondary'} className={`rounded-none text-[10px] font-mono uppercase ${template.is_active ? 'border-emerald-500 text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                    {template.is_active ? 'Aktif' : 'Non-aktif'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (template: Template) => (
                <div className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                    {new Date(template.created_at).toLocaleDateString('id-ID')}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Aksi',
            className: 'w-[140px] text-right',
            render: (template: Template) => (
                <div className="flex items-center justify-end gap-1">
                    <Link to={`/arsip/document-templates/${template.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50" title="Lihat">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    {hasPermission('document_template.edit') && (
                        <>
                            <Link to={`/arsip/document-templates/${template.id}/edit`}>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50" title="Edit">
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50"
                                title={template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                onClick={(e) => handleToggleActive(template.id, e)}
                            >
                                {template.is_active ? (
                                    <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                    <ToggleLeft className="h-3.5 w-3.5 text-neutral-400" />
                                )}
                            </Button>
                        </>
                    )}
                    {hasPermission('document_template.delete') && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                            title="Hapus"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template.id);
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const filterFields = [
        {
            key: 'category',
            label: 'Kategori',
            type: 'select' as const,
            placeholder: 'Semua Kategori',
            options: categories.map(cat => ({ value: cat, label: cat })),
        },
        {
            key: 'is_active',
            label: 'Status',
            type: 'select' as const,
            placeholder: 'Semua Status',
            options: [
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Non-aktif' },
            ],
        },
    ];

    return (
        <AdminLayout>
            <IndexPage
                title="Template Surat"
                description="Kelola template untuk surat keluar"
                actions={hasPermission('document_template.create') ? [
                    {
                        label: 'Buat Template',
                        href: '/arsip/document-templates/create',
                        icon: Plus,
                    },
                ] : undefined}
                data={templates.data}
                columns={columns}
                pagination={{
                    current_page: templates.current_page || 1,
                    last_page: templates.last_page || 1,
                    per_page: templates.per_page || 10,
                    total: templates.total || 0,
                    from: templates.from || 0,
                    to: templates.to || 0,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={filterFields}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                searchValue={filterValues.search}
                searchPlaceholder="Cari nama, kode template..."
                onSearchChange={(val) => handleFilterChange('search', val)}
                emptyMessage={isLoading ? "Memuat..." : "Belum ada template"}
                emptyIcon={FileText}
            />

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                title="Hapus Template"
                description="Hapus template ini? Template yang sudah digunakan tidak dapat dihapus."
                variant="destructive"
                confirmText="Hapus"
                loading={deleting}
                onConfirm={confirmDelete}
            />
        </AdminLayout>
    );
}
