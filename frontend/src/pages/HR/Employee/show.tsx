import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, User, Briefcase, FileText } from 'lucide-react';
import api from '@/lib/api';

export default function EmployeeShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.get(`/employees/${id}`).then(res => setData(res.data));
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
                        <h2 className="text-2xl font-bold tracking-tight">Detail Karyawan</h2>
                        <p className="text-sm text-muted-foreground">Informasi lengkap karyawan</p>
                    </div>
                    <Button onClick={() => navigate(`/hr/employees/${id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                </div>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Data Pribadi</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><dt className="text-sm font-medium text-muted-foreground">Nama Lengkap</dt><dd className="mt-1 text-sm">{data.first_name} {data.last_name}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">NIK</dt><dd className="mt-1 text-sm">{data.nik}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Jenis Kelamin</dt><dd className="mt-1 text-sm">{data.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Tempat, Tanggal Lahir</dt><dd className="mt-1 text-sm">{data.place_of_birth}, {data.date_of_birth?.substring(0, 10)}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Agama</dt><dd className="mt-1 text-sm">{data.religion}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Status Perkawinan</dt><dd className="mt-1 text-sm">{data.marital_status}</dd></div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Data Pekerjaan</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><dt className="text-sm font-medium text-muted-foreground">Kategori Pekerjaan</dt><dd className="mt-1 text-sm">{data.job_category?.name}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Status Kepegawaian</dt><dd className="mt-1 text-sm">{data.employment_status?.name}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Unit Organisasi</dt><dd className="mt-1 text-sm">{data.organization_unit?.name}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Jabatan</dt><dd className="mt-1 text-sm">{data.position}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Tanggal Masuk</dt><dd className="mt-1 text-sm">{data.join_date?.substring(0, 10)}</dd></div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Kontak & Dokumen</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><dt className="text-sm font-medium text-muted-foreground">Email</dt><dd className="mt-1 text-sm">{data.email}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">Telepon</dt><dd className="mt-1 text-sm">{data.phone}</dd></div>
                                <div className="md:col-span-2 lg:col-span-3"><dt className="text-sm font-medium text-muted-foreground">Alamat</dt><dd className="mt-1 text-sm">{data.address}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">NPWP</dt><dd className="mt-1 text-sm">{data.npwp_number || '-'}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">BPJS Kesehatan</dt><dd className="mt-1 text-sm">{data.bpjs_kesehatan_number || '-'}</dd></div>
                                <div><dt className="text-sm font-medium text-muted-foreground">BPJS Ketenagakerjaan</dt><dd className="mt-1 text-sm">{data.bpjs_ketenagakerjaan_number || '-'}</dd></div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HrLayout>
    );
}
