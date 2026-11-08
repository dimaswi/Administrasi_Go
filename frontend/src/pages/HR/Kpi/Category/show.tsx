import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, Target } from 'lucide-react';
import { DetailCard } from '@/components/ui/form-card';
import api from '@/lib/api';

export default function KpiCategoryShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const res = await api.get(`/kpi/categories/${id}`);
                setData(res.data);
            } catch (error) {
                console.error('Error fetching KPI category:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCategory();
        }
    }, [id]);

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data kategori KPI...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data kategori KPI tidak ditemukan.
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <DetailCard
                title={`Kategori KPI: ${data.code}`}
                subtitle={`${data.name} • Bobot: ${data.weight}%`}
                icon={Target}
                onBack={() => navigate('/hr/kpi/categories')}
                badges={
                    <Badge variant={data.is_active ? 'outline' : 'destructive'} className="rounded-none text-xs font-mono uppercase">
                        {data.is_active ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                }
                headerActions={
                    <Button 
                        size="sm"
                        onClick={() => navigate(`/hr/kpi/categories/${id}/edit`)}
                        className="h-8 px-3 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold gap-1.5 shadow-none"
                    >
                        <Edit className="size-3.5" /> Edit Kategori
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    Informasi Kategori
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase text-neutral-500">Kode & Nama Kategori</div>
                                        <div className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">{data.code} - {data.name}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[11px] font-mono uppercase text-neutral-500">Bobot Persentase</div>
                                            <div className="text-sm font-bold mt-0.5">{data.weight}%</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-mono uppercase text-neutral-500">Urutan Tampilan</div>
                                            <div className="text-sm font-mono mt-0.5">{data.sort_order ?? 0}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    Deskripsi
                                </h3>
                                <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-900 p-3.5 border border-neutral-200 dark:border-neutral-800 min-h-[100px]">
                                    {data.description || 'Tidak ada deskripsi khusus.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailCard>
        </HrLayout>
    );
}
