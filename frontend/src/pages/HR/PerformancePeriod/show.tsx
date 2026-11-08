import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { DetailCard } from '@/components/ui/form-card';

export default function PerformancePeriodShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeriod = async () => {
            try {
                const res = await api.get(`/performance-periods/${id}`);
                setData(res.data);
            } catch (error) {
                console.error('Error fetching period details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPeriod();
        }
    }, [id]);

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data periode penilaian...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data periode penilaian tidak ditemukan.
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <DetailCard
                title={`Periode: ${data.name}`}
                subtitle={`Siklus: ${data.type_label || data.type} • Status: ${data.status}`}
                icon={Calendar}
                onBack={() => navigate('/hr/performance-periods')}
                statusBadge={
                    <div className="flex items-center gap-1.5">
                        <Badge variant={data.status === 'active' ? 'default' : 'outline'} className="rounded-none uppercase text-xs">
                            {data.status || 'Draft'}
                        </Badge>
                        {data.is_current && (
                            <Badge variant="outline" className="rounded-none text-xs border-emerald-500 text-emerald-600 font-mono">
                                Berjalan (Current)
                            </Badge>
                        )}
                    </div>
                }
                actions={
                    <Button 
                        size="sm" 
                        onClick={() => navigate(`/hr/performance-periods/${id}/edit`)}
                        className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Periode
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            Informasi Siklus Evaluasi
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nama Periode</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{data.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Siklus Evaluasi</dt>
                                <dd className="text-sm font-medium capitalize text-neutral-900 dark:text-white">{data.type_label || data.type}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Status Periode</dt>
                                <dd className="text-sm font-medium capitalize text-neutral-900 dark:text-white">{data.status}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Tanggal Mulai</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.start_date ? data.start_date.substring(0, 10) : '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Tanggal Selesai</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.end_date ? data.end_date.substring(0, 10) : '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Siklus Berjalan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.is_current ? 'Ya (Periode Utama Saat Ini)' : 'Bukan Periode Aktif'}</dd>
                            </div>
                            {data.description && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deskripsi & Pedoman</dt>
                                    <dd className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none whitespace-pre-wrap">{data.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </DetailCard>
        </HrLayout>
    );
}
