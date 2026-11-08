import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, Users } from 'lucide-react';
import api from '@/lib/api';
import { DetailCard } from '@/components/ui/form-card';

export default function EmployeeTrainingShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/employee-trainings/${id}`);
                setData(res.data);
            } catch (error) {
                console.error('Error fetching employee training details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data peserta pelatihan...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data peserta pelatihan tidak ditemukan.
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <DetailCard
                title={`Peserta: ${data.employee_name}`}
                subtitle={`${data.training_code} • ${data.training_title}`}
                icon={Users}
                onBack={() => navigate('/hr/employee-trainings')}
                statusBadge={
                    <Badge variant="outline" className="rounded-none uppercase text-xs">
                        {data.status || 'Registered'}
                    </Badge>
                }
                actions={
                    <Button 
                        size="sm" 
                        onClick={() => navigate(`/hr/employee-trainings/${id}/edit`)}
                        className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Peserta
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            Informasi Peserta & Pelatihan
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nama Karyawan</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{data.employee_name}</dd>
                                <dd className="text-xs text-neutral-500 font-mono mt-0.5">{data.employee_nik || '-'} {data.organization_unit ? `• ${data.organization_unit}` : ''}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Program Pelatihan</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{data.training_title}</dd>
                                <dd className="text-xs text-neutral-500 font-mono mt-0.5">Kode: {data.training_code}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Status Progres</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white uppercase">{data.status || '-'}</dd>
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
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nilai & Predikat</dt>
                                <dd className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {data.score !== null && data.score !== undefined ? data.score : '-'} {data.grade ? `(${data.grade})` : ''}
                                </dd>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nomor Sertifikat</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{data.certificate_number || '-'}</dd>
                            </div>
                            {data.notes && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Catatan Tambahan</dt>
                                    <dd className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none whitespace-pre-wrap">{data.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </DetailCard>
        </HrLayout>
    );
}
