import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function OrganizationShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.get(`/org-units/${id}`).then(res => setData(res.data));
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
                        <h2 className="text-2xl font-bold tracking-tight">Detail Unit Organisasi</h2>
                        <p className="text-sm text-muted-foreground">Informasi lengkap unit</p>
                    </div>
                    <Button onClick={() => navigate(`/hr/organizations/${id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                </div>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Data Unit</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><dt className="text-sm font-medium text-muted-foreground">Kode Unit</dt><dd className="mt-1 text-sm font-mono">{data.code}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Nama Unit</dt><dd className="mt-1 text-sm">{data.name}</dd></div>
                                <div className="md:col-span-2 lg:col-span-3"><dt className="text-sm font-medium text-muted-foreground">Deskripsi</dt><dd className="mt-1 text-sm">{data.description || '-'}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Tingkat Hierarki (Level)</dt><dd className="mt-1 text-sm"><Badge variant="outline">Level {data.level}</Badge></dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Induk Unit (Parent ID)</dt><dd className="mt-1 text-sm">{data.parent_id || '-'}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Kepala Unit (Head ID)</dt><dd className="mt-1 text-sm">{data.head_id || '-'}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Status Aktif</dt><dd className="mt-1 text-sm">{data.is_active ? <Badge className="bg-green-50 text-green-700 border-green-200">Aktif</Badge> : <Badge className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>}</dd></div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HrLayout>
    );
}
