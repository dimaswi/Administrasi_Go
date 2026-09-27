import { useEffect, useState } from 'react';
import HrLayout from '@/layouts/hr-layout';
import { User, Briefcase, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function HrDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/employees/by-user/${user.id}`);
        if (response.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch employee details", error);
      } finally {
        setLoading(false);
      }
    };


    fetchEmployee();
  }, [user]);

  if (loading) {
    return (
      <HrLayout>
        <div className="flex-1 p-8 pt-6">Loading...</div>
      </HrLayout>
    );
  }

  if (!data) {
    return (
      <HrLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2 mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-gray-800">Profil Karyawan</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Data detail karyawan Anda belum ditambahkan atau tidak ditemukan.</p>
            </CardContent>
          </Card>
        </div>
      </HrLayout>
    );
  }

  return (
    <HrLayout>
      <div className="flex-1 space-y-4 p-8 pt-6 pb-24">
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-800">Profil Saya</h2>
                <p className="text-sm text-muted-foreground mt-1">Informasi detail karyawan Anda</p>
            </div>
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
                        <div><dt className="text-sm font-medium text-muted-foreground">NIK</dt><dd className="mt-1 text-sm">{data.nik || data.employee_id}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Jenis Kelamin</dt><dd className="mt-1 text-sm">{data.gender === 'M' ? 'Laki-laki' : (data.gender === 'F' ? 'Perempuan' : '-')}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Tempat, Tanggal Lahir</dt><dd className="mt-1 text-sm">{data.place_of_birth || '-'}, {data.date_of_birth ? data.date_of_birth.substring(0, 10) : '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Agama</dt><dd className="mt-1 text-sm">{data.religion || '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Status Perkawinan</dt><dd className="mt-1 text-sm">{data.marital_status || '-'}</dd></div>
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
                        <div><dt className="text-sm font-medium text-muted-foreground">Kategori Pekerjaan</dt><dd className="mt-1 text-sm">{data.job_category?.name || '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Status Kepegawaian</dt><dd className="mt-1 text-sm">{data.employment_status?.name || '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Unit Organisasi</dt><dd className="mt-1 text-sm">{data.organization_unit?.name || '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Jabatan</dt><dd className="mt-1 text-sm">{data.position || '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Tanggal Masuk</dt><dd className="mt-1 text-sm">{data.join_date ? data.join_date.substring(0, 10) : '-'}</dd></div>
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
                        <div><dt className="text-sm font-medium text-muted-foreground">Email</dt><dd className="mt-1 text-sm">{data.email || '-'}</dd></div>
                        <div><dt className="text-sm font-medium text-muted-foreground">Telepon</dt><dd className="mt-1 text-sm">{data.phone || '-'}</dd></div>
                        <div className="md:col-span-2 lg:col-span-3"><dt className="text-sm font-medium text-muted-foreground">Alamat</dt><dd className="mt-1 text-sm">{data.address || '-'}</dd></div>
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
