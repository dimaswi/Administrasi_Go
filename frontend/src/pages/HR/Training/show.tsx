import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Loader2, GraduationCap } from 'lucide-react';
import api from '@/lib/api';

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
            <div className="w-full max-w-full space-y-4">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Card Header */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate('/hr/trainings')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <GraduationCap className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Detail Program Training: {data.code}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        {data.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Action */}
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => navigate(`/hr/trainings/${id}/edit`)}
                                className="h-8 px-3 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Edit className="size-3.5" /> Edit Program
                            </Button>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Kode & Nama Program</div>
                                    <div className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">{data.code} - {data.name}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Tipe Pelatihan</div>
                                        <div className="text-sm font-semibold capitalize mt-0.5">{data.type || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Kategori Skill</div>
                                        <div className="text-sm font-semibold capitalize mt-0.5">{data.category || '-'}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Lembaga / Provider</div>
                                    <div className="text-sm font-medium mt-0.5">{data.provider || '-'}</div>
                                </div>

                                <div>
                                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Lokasi Pelaksanaan</div>
                                    <div className="text-sm font-medium mt-0.5">{data.location || '-'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Durasi</div>
                                        <div className="text-sm font-bold mt-0.5">{data.duration_hours ? `${data.duration_hours} Jam` : '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Biaya per Orang</div>
                                        <div className="text-sm font-bold mt-0.5">
                                            {data.cost ? `Rp ${Number(data.cost).toLocaleString('id-ID')}` : 'Gratis / Rp 0'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Kewajiban</div>
                                        <div className="mt-1">
                                            <Badge variant={data.is_mandatory ? 'default' : 'secondary'} className="rounded-none text-xs">
                                                {data.is_mandatory ? 'Wajib' : 'Pilihan / Opsional'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Status</div>
                                        <div className="mt-1">
                                            <Badge variant={data.is_active ? 'outline' : 'destructive'} className="rounded-none text-xs">
                                                {data.is_active ? 'Aktif' : 'Non-Aktif'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Deskripsi Lengkap</div>
                                    <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 mt-1 whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800">
                                        {data.description || 'Tidak ada deskripsi'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HrLayout>
    );
}
