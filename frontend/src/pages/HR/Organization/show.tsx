import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailCard } from '@/components/ui/form-card';
import { Edit, Building2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function OrganizationShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/org-units/${id}`)
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-8 text-center text-xs text-neutral-500 font-mono">
                    <Loader2 className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                    Memuat data unit organisasi...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-8 text-center">
                    <p className="text-sm font-semibold">Unit organisasi tidak ditemukan</p>
                    <Button onClick={() => navigate('/hr/organizations')} className="mt-4 rounded-none h-8 text-xs">
                        Kembali ke Daftar Unit
                    </Button>
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <DetailCard
                title={data.name}
                subtitle={`Kode: ${data.code} • Tingkat Hierarki Level ${data.level}`}
                icon={Building2}
                onBack={() => navigate('/hr/organizations')}
                badges={
                    data.is_active ? (
                        <span className="font-mono text-xs px-1.5 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700">
                            AKTIF
                        </span>
                    ) : (
                        <span className="font-mono text-xs px-1.5 py-0.5 border border-rose-200 bg-rose-50 text-rose-700">
                            NONAKTIF
                        </span>
                    )
                }
                headerActions={
                    <Button 
                        size="sm"
                        onClick={() => navigate(`/hr/organizations/${id}/edit`)}
                        className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs px-3 gap-1.5 shadow-none"
                    >
                        <Edit className="size-3.5" />
                        <span>Edit Unit</span>
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Kode Unit</span>
                        <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white mt-1 block">{data.code}</span>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Nama Unit</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white mt-1 block">{data.name}</span>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Tingkat Hierarki</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white mt-1 block">Level {data.level}</span>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Induk Unit (Parent ID)</span>
                        <span className="text-sm font-mono text-neutral-800 dark:text-neutral-200 mt-1 block">{data.parent_id || '-'}</span>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Kepala Unit (Head ID)</span>
                        <span className="text-sm font-mono text-neutral-800 dark:text-neutral-200 mt-1 block">{data.head_id || '-'}</span>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Status</span>
                        <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1 block">{data.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Deskripsi</span>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 leading-relaxed">{data.description || 'Tidak ada deskripsi'}</p>
                    </div>
                </div>
            </DetailCard>
        </HrLayout>
    );
}
