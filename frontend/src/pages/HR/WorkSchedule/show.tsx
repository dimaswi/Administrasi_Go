import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function WorkScheduleShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.get(`/work-schedules/${id}`).then(res => setData(res.data));
    }, [id]);

    if (!data) return <HrLayout><div className="p-6">Loading...</div></HrLayout>;

    return (
        <HrLayout>
            <div className="w-full pb-24 relative">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold tracking-tight">Detail Jadwal Kerja</h2>
                        <p className="text-sm text-muted-foreground">Informasi lengkap jadwal</p>
                    </div>
                    <Button onClick={() => navigate(`/hr/work-schedules/${id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                </div>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Data Jadwal</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><dt className="text-sm font-medium text-muted-foreground">Karyawan</dt><dd className="mt-1 text-sm">{data.employee?.first_name} {data.employee?.last_name}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Tanggal</dt><dd className="mt-1 text-sm">{data.schedule_date?.substring(0, 10)}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Shift</dt><dd className="mt-1 text-sm">{data.shift_type}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Jam Mulai</dt><dd className="mt-1 text-sm">{data.start_time?.substring(0, 5)}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Jam Selesai</dt><dd className="mt-1 text-sm">{data.end_time?.substring(0, 5)}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Libur</dt><dd className="mt-1 text-sm">{data.is_day_off ? <Badge className="bg-red-50 text-red-700 border-red-200">Ya</Badge> : <Badge className="bg-green-50 text-green-700 border-green-200">Tidak</Badge>}</dd></div>
                                <div className="md:col-span-2 lg:col-span-3"><dt className="text-sm font-medium text-muted-foreground">Catatan</dt><dd className="mt-1 text-sm">{data.notes || '-'}</dd></div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HrLayout>
    );
}
