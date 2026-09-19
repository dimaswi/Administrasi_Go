import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Database } from 'lucide-react';
import api from '@/lib/api';

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
            <div className="w-full">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5 flex-1">
                        <h2 className="text-xl font-semibold">Detail Kategori Pekerjaan</h2>
                        <p className="text-sm text-muted-foreground">Informasi lengkap tentang data ini.</p>
                    </div>
                    <Button onClick={() => navigate(`/hr/master-data/jobcategory/${id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                </div>

                <div className="flex flex-col gap-4">

                <Card>
                    <CardHeader>
                            <div className="flex items-center gap-2">
                                
                                <div>
                                    <CardTitle>Data Master</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div><dt className="text-sm font-medium text-muted-foreground">Kode</dt><dd className="mt-1 text-sm">{data.code}</dd></div>
                            <div><dt className="text-sm font-medium text-muted-foreground">Nama Kategori</dt><dd className="mt-1 text-sm">{data.name}</dd></div>
                            <div><dt className="text-sm font-medium text-muted-foreground">Deskripsi</dt><dd className="mt-1 text-sm">{data.description}</dd></div>
                            <div><dt className="text-sm font-medium text-muted-foreground">Tenaga Medis</dt><dd className="mt-1 text-sm">{data.is_medical ? 'Ya' : 'Tidak'}</dd></div>
                            <div><dt className="text-sm font-medium text-muted-foreground">Wajib STR</dt><dd className="mt-1 text-sm">{data.requires_str ? 'Ya' : 'Tidak'}</dd></div>
                            <div><dt className="text-sm font-medium text-muted-foreground">Wajib SIP</dt><dd className="mt-1 text-sm">{data.requires_sip ? 'Ya' : 'Tidak'}</dd></div>
                            <div><dt className="text-sm font-medium text-muted-foreground">Aktif</dt><dd className="mt-1 text-sm">{data.is_active ? 'Ya' : 'Tidak'}</dd></div>
                        </dl>
                    </CardContent>
                </Card>
                </div>
            </div>
        </HrLayout>
    );
}