import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, MessageSquareQuote } from 'lucide-react';
import { DetailCard } from '@/components/ui/form-card';
import api from '@/lib/api';

export default function Feedback360Show() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await api.get(`/feedback360/${id}`);
                setData(res.data);
            } catch (error) {
                console.error('Error fetching session details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSession();
        }
    }, [id]);

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data sesi 360 feedback...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data sesi 360 feedback tidak ditemukan.
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <DetailCard
                title={`Sesi 360: ${data.name}`}
                subtitle={`Periode: ${data.period_name || '-'}`}
                icon={MessageSquareQuote}
                onBack={() => navigate('/hr/feedback360')}
                badges={
                    <Badge variant="outline" className="rounded-none uppercase text-xs font-mono">
                        {data.status}
                    </Badge>
                }
                headerActions={
                    <Button
                        size="sm"
                        onClick={() => navigate(`/hr/feedback360/${id}/edit`)}
                        className="h-8 px-3 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold gap-1.5 shadow-none"
                    >
                        <Edit className="size-3.5" /> Edit Sesi
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    Informasi Sesi
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase text-neutral-500">Nama Sesi Feedback</div>
                                        <div className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">{data.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-mono uppercase text-neutral-500">Periode Terkait</div>
                                        <div className="text-sm font-medium mt-0.5">{data.period_name}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    Jadwal Pelaksanaan
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase text-neutral-500">Tanggal Mulai</div>
                                        <div className="text-sm font-medium mt-0.5 font-mono">{data.start_date ? data.start_date.substring(0, 10) : '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-mono uppercase text-neutral-500">Tanggal Selesai</div>
                                        <div className="text-sm font-medium mt-0.5 font-mono">{data.end_date ? data.end_date.substring(0, 10) : '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    Deskripsi & Petunjuk Teknis
                                </h3>
                                <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-900 p-3.5 border border-neutral-200 dark:border-neutral-800 min-h-[140px]">
                                    {data.description || 'Tidak ada deskripsi atau panduan teknis yang dilampirkan.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailCard>
        </HrLayout>
    );
}
