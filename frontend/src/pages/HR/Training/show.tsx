import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import { DetailCard } from '@/components/ui/form-card';

export default function TrainingShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTraining = async () => {
            try {
                const res = await api.get(`/trainings/${id}`);
                setData(res.data);
            } catch (error) {
                console.error('Error fetching training:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTraining();
        }
    }, [id]);

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data training...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data program training tidak ditemukan.
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <DetailCard
                title={`Program: ${data.name}`}
                subtitle={`Kode: ${data.code} • ${data.provider || 'Internal'}`}
                icon={GraduationCap}
                onBack={() => navigate('/hr/trainings')}
                statusBadge={
                    <div className="flex items-center gap-1.5">
                        <Badge variant={data.is_mandatory ? 'default' : 'secondary'} className="rounded-none text-xs">
                            {data.is_mandatory ? 'Wajib' : 'Opsional'}
                        </Badge>
                        <Badge variant={data.is_active ? 'outline' : 'destructive'} className="rounded-none text-xs">
                            {data.is_active ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                    </div>
                }
                actions={
                    <Button 
                        size="sm" 
                        onClick={() => navigate(`/hr/trainings/${id}/edit`)}
                        className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Program
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            Informasi Program Pelatihan
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kode Program</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{data.code}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nama Program</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{data.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Tipe Pelatihan</dt>
                                <dd className="text-sm font-medium capitalize text-neutral-900 dark:text-white">{data.type || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kategori Skill</dt>
                                <dd className="text-sm font-medium capitalize text-neutral-900 dark:text-white">{data.category || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Lembaga / Provider</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.provider || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Lokasi Pelaksanaan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.location || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Durasi Pelatihan</dt>
                                <dd className="text-sm font-bold text-neutral-900 dark:text-white">{data.duration_hours ? `${data.duration_hours} Jam` : '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Biaya per Orang</dt>
                                <dd className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {data.cost ? `Rp ${Number(data.cost).toLocaleString('id-ID')}` : 'Gratis / Rp 0'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Status Keaktifan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.is_active ? 'Aktif' : 'Non-Aktif'}</dd>
                            </div>
                            {data.description && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deskripsi Lengkap</dt>
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
