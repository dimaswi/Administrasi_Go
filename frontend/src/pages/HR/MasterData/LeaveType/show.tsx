import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, CalendarHeart } from 'lucide-react';
import api from '@/lib/api';
import { DetailCard } from '@/components/ui/form-card';

export default function LeaveTypeShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.get(`/leave-types/${id}`).then(res => setData(res.data));
    }, [id]);

    if (!data) return <HrLayout><div className="p-6">Loading...</div></HrLayout>;

    return (
        <HrLayout>
            <DetailCard
                title={data.name}
                subtitle={`Kode: ${data.code}`}
                icon={CalendarHeart}
                onBack={() => navigate('/hr/master-data/leavetype')}
                statusBadge={
                    <Badge variant={data.is_active ? 'default' : 'secondary'} className="rounded-none text-xs">
                        {data.is_active ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                }
                actions={
                    <Button 
                        size="sm" 
                        onClick={() => navigate(`/hr/master-data/leavetype/${id}/edit`)}
                        className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Data
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            Informasi Skema Cuti
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kode</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{data.code}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nama Cuti</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{data.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kuota Default</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{data.default_quota} Hari</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Status Pembayaran</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.is_paid ? 'Dibayar (Paid Leave)' : 'Tanpa Gaji (Unpaid)'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Wajib Approval Atasan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.requires_approval ? 'Ya (Wajib Disetujui)' : 'Otomatis Disetujui'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Akumulasi Cuti</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.allow_carry_over ? `Ya (Maks ${data.max_carry_over_days} Hari)` : 'Tidak Dapat Diakumulasi'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Min. Hari Pengajuan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.min_advance_days ? `${data.min_advance_days} hari sebelumnya` : 'Bebas / Langsung'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Status Keaktifan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{data.is_active ? 'Aktif Digunakan' : 'Dinonaktifkan'}</dd>
                            </div>
                            {data.description && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deskripsi & Ketentuan</dt>
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