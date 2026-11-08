import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Briefcase } from 'lucide-react';
import api from '@/lib/api';
import { DetailCard } from '@/components/ui/form-card';

export default function JobCategoryShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.get(`/job-categories/${id}`).then(res => setData(res.data));
    }, [id]);

    if (!data) return <HrLayout><div className="p-6">Loading...</div></HrLayout>;

    return (
        <HrLayout>
            <DetailCard
                title={data.name}
                subtitle={`Kode: ${data.code}`}
                icon={Briefcase}
                onBack={() => navigate('/hr/master-data/jobcategory')}
                statusBadge={
                    <Badge variant={data.is_active ? 'default' : 'secondary'} className="rounded-none text-xs">
                        {data.is_active ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                }
                actions={
                    <Button 
                        size="sm" 
                        onClick={() => navigate(`/hr/master-data/jobcategory/${id}/edit`)}
                        className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Data
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            Informasi Kategori Pekerjaan
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kode</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{data.code}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nama Kategori</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{data.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Tenaga Medis</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.is_medical ? 'Ya (Medis)' : 'Bukan Medis'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Wajib STR</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.requires_str ? 'Ya' : 'Tidak'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Wajib SIP</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.requires_sip ? 'Ya' : 'Tidak'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Status Keaktifan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.is_active ? 'Aktif Digunakan' : 'Dinonaktifkan'}</dd>
                            </div>
                            {data.description && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deskripsi</dt>
                                    <dd className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none">{data.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </DetailCard>
        </HrLayout>
    );
}