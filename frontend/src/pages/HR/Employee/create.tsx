import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

export default function EmployeeCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        employee_id: '',
        first_name: '',
        last_name: '',
        nik: '',
        user_id: '',
        gender: 'M',
        place_of_birth: '',
        date_of_birth: '',
        religion: '',
        marital_status: '',
        blood_type: '',

        address: '',
        city: '',
        province: '',
        postal_code: '',
        phone: '',
        phone_secondary: '',
        email: '',

        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',

        job_category_id: '',
        employment_status_id: '',
        organization_unit_id: '',
        position: '',
        join_date: '',
        contract_start_date: '',
        contract_end_date: '',

        education_level_id: '',
        education_institution: '',
        education_major: '',
        education_year: '',

        npwp_number: '',
        bpjs_kesehatan_number: '',
        bpjs_ketenagakerjaan_number: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',

        status: 'active',
        notes: ''
    });

    const [orgUnits, setOrgUnits] = useState<{ value: string, label: string }[]>([]);
    const [jobCategories, setJobCategories] = useState<{ value: string, label: string }[]>([]);
    const [employmentStatuses, setEmploymentStatuses] = useState<{ value: string, label: string }[]>([]);
    const [systemUsers, setSystemUsers] = useState<{ value: string, label: string }[]>([]);

    React.useEffect(() => {
        // Fetch Master Data from backend
        const fetchMasterData = async () => {
            try {
                const [resOrg, resJob, resEmp, resUsers] = await Promise.all([
                    api.get('/org-units?perPage=100'),
                    api.get('/job-categories'),
                    api.get('/employment-statuses'),
                    api.get('/users?perPage=1000')
                ]);

                if (resOrg.data && resOrg.data.data) {
                    const options = resOrg.data.data.map((unit: any) => ({
                        value: unit.id.toString(),
                        label: unit.name
                    }));
                    setOrgUnits(options);
                }

                if (resJob.data) {
                    const options = resJob.data.map((cat: any) => ({
                        value: cat.id.toString(),
                        label: cat.name
                    }));
                    setJobCategories(options);
                }

                if (resEmp.data) {
                    const options = resEmp.data.map((status: any) => ({
                        value: status.id.toString(),
                        label: status.name
                    }));
                    setEmploymentStatuses(options);
                }

                if (resUsers.data && resUsers.data.data) {
                    const options = resUsers.data.data.map((u: any) => ({
                        value: u.id.toString(),
                        label: `${u.name} ${u.nip ? `(${u.nip})` : ''}`
                    }));
                    // Tambahkan opsi kosong
                    setSystemUsers([{ value: '', label: '-- Tanpa Akun User --' }, ...options]);
                }
            } catch (err) {
                console.error("Gagal mengambil data master:", err);
            }
        };

        fetchMasterData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Konversi ID ke number jika diperlukan sebelum di-post
            const payload = {
                ...formData,
                user_id: formData.user_id ? parseInt(formData.user_id) : null,
                job_category_id: formData.job_category_id ? parseInt(formData.job_category_id) : 1, // Defaulting for now
                employment_status_id: formData.employment_status_id ? parseInt(formData.employment_status_id) : 1,
                organization_unit_id: formData.organization_unit_id ? parseInt(formData.organization_unit_id) : null,
                education_level_id: formData.education_level_id ? parseInt(formData.education_level_id) : null,
                education_year: formData.education_year ? parseInt(formData.education_year) : null,
            };

            await api.post('/employees', payload);
            navigate('/hr/employees');
        } catch (err: any) {
            console.error(err);
            setError('Gagal menyimpan data pegawai. Periksa koneksi atau input Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <div className="w-full">
                {/* Header Component (like FormPage) */}
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/employees')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Tambah Karyawan Baru</h2>
                        <p className="text-sm text-muted-foreground">Silakan lengkapi data karyawan baru</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-100 flex items-center gap-2">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-6">

                        {/* Data Pribadi */}
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Data Pribadi</CardTitle>
                                    <CardDescription>Informasi identitas karyawan</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">Nama Depan *</Label>
                                        <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Nama Belakang</Label>
                                        <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="employee_id">NIP Karyawan *</Label>
                                        <Input id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleChange} required placeholder="2026-X-XXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nik">NIK KTP *</Label>
                                        <Input id="nik" name="nik" value={formData.nik} onChange={handleChange} required maxLength={16} placeholder="3201234567890001" />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="user_id">Akun Login (User)</Label>
                                        <SearchableSelect
                                            options={systemUsers}
                                            value={formData.user_id}
                                            onValueChange={(val) => handleSelectChange('user_id', val === '' ? '' : val)}
                                            placeholder="Pilih Akun User untuk karyawan ini..."
                                        />
                                        <p className="text-xs text-muted-foreground">Pilih akun pengguna jika Karyawan ini akan diberi akses login ke sistem.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Jenis Kelamin *</Label>
                                        <SearchableSelect
                                            value={formData.gender}
                                            onValueChange={(val) => handleSelectChange('gender', val)}
                                            placeholder="Pilih jenis kelamin"
                                            options={[
                                                { value: "male", label: "Laki-laki" },
                                                { value: "female", label: "Perempuan" }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="place_of_birth">Tempat Lahir</Label>
                                        <Input id="place_of_birth" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} placeholder="Jakarta" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                                        <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="religion">Agama</Label>
                                        <SearchableSelect
                                            value={formData.religion}
                                            onValueChange={(val) => handleSelectChange('religion', val)}
                                            placeholder="Pilih agama"
                                            options={[
                                                { value: "Islam", label: "Islam" },
                                                { value: "Kristen", label: "Kristen" },
                                                { value: "Katolik", label: "Katolik" },
                                                { value: "Hindu", label: "Hindu" },
                                                { value: "Buddha", label: "Buddha" },
                                                { value: "Konghucu", label: "Konghucu" }
                                            ]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="marital_status">Status Perkawinan</Label>
                                        <SearchableSelect
                                            value={formData.marital_status}
                                            onValueChange={(val) => handleSelectChange('marital_status', val)}
                                            placeholder="Pilih status"
                                            options={[
                                                { value: "single", label: "Belum Menikah" },
                                                { value: "married", label: "Menikah" },
                                                { value: "divorced", label: "Cerai" },
                                                { value: "widowed", label: "Duda/Janda" }
                                            ]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="blood_type">Golongan Darah</Label>
                                        <SearchableSelect
                                            value={formData.blood_type}
                                            onValueChange={(val) => handleSelectChange('blood_type', val)}
                                            placeholder="Pilih"
                                            options={[
                                                { value: "A", label: "A" },
                                                { value: "B", label: "B" },
                                                { value: "AB", label: "AB" },
                                                { value: "O", label: "O" }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Kontak */}
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Data Kontak</CardTitle>
                                    <CardDescription>Alamat dan informasi kontak</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat</Label>
                                    <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Jl. Contoh No. 123..." rows={3} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Kota</Label>
                                        <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Jakarta" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="province">Provinsi</Label>
                                        <Input id="province" name="province" value={formData.province} onChange={handleChange} placeholder="DKI Jakarta" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postal_code">Kode Pos</Label>
                                        <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="12345" maxLength={10} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">No. HP Utama</Label>
                                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="08123456789" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone_secondary">No. HP Lainnya</Label>
                                        <Input id="phone_secondary" name="phone_secondary" value={formData.phone_secondary} onChange={handleChange} placeholder="08198765432" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="mb-4 font-medium">Kontak Darurat</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_name">Nama</Label>
                                            <Input id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Nama kontak darurat" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_phone">No. HP</Label>
                                            <Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} placeholder="08123456789" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_relation">Hubungan</Label>
                                            <Input id="emergency_contact_relation" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleChange} placeholder="Istri/Suami/Orang Tua" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Kepegawaian */}
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Data Kepegawaian</CardTitle>
                                    <CardDescription>Informasi pekerjaan dan kontrak</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="job_category_id">Kategori Pekerjaan *</Label>
                                        <SearchableSelect
                                            value={formData.job_category_id}
                                            onValueChange={(val) => handleSelectChange('job_category_id', val)}
                                            placeholder="Pilih kategori"
                                            options={jobCategories}
                                        />
                                        <p className="text-xs text-muted-foreground">Kode kategori digunakan untuk NIK</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="employment_status_id">Status Kepegawaian *</Label>
                                        <SearchableSelect
                                            value={formData.employment_status_id}
                                            onValueChange={(val) => handleSelectChange('employment_status_id', val)}
                                            placeholder="Pilih status"
                                            options={employmentStatuses}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="organization_unit_id">Unit Organisasi</Label>
                                        <SearchableSelect
                                            value={formData.organization_unit_id}
                                            onValueChange={(val) => handleSelectChange('organization_unit_id', val)}
                                            placeholder="Pilih unit"
                                            options={orgUnits.length > 0 ? orgUnits : [{ value: "", label: "Loading..." }]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="position">Jabatan</Label>
                                        <Input id="position" name="position" value={formData.position} onChange={handleChange} placeholder="Staff Perawat" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="join_date">Tanggal Masuk *</Label>
                                        <Input id="join_date" name="join_date" type="date" value={formData.join_date} onChange={handleChange} required />
                                        <p className="text-xs text-muted-foreground">Tahun masuk digunakan untuk NIK</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract_start_date">Mulai Kontrak</Label>
                                        <Input id="contract_start_date" name="contract_start_date" type="date" value={formData.contract_start_date} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract_end_date">Akhir Kontrak</Label>
                                        <Input id="contract_end_date" name="contract_end_date" type="date" value={formData.contract_end_date} onChange={handleChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dokumen & Akun Bank */}
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Dokumen & Akun Bank</CardTitle>
                                    <CardDescription>Nomor dokumen dan informasi bank</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="npwp_number">No. NPWP</Label>
                                        <Input id="npwp_number" name="npwp_number" value={formData.npwp_number} onChange={handleChange} placeholder="12.345.678.9-012.000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bpjs_kesehatan_number">No. BPJS Kesehatan</Label>
                                        <Input id="bpjs_kesehatan_number" name="bpjs_kesehatan_number" value={formData.bpjs_kesehatan_number} onChange={handleChange} placeholder="0001234567890" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bpjs_ketenagakerjaan_number">No. BPJS Ketenagakerjaan</Label>
                                        <Input id="bpjs_ketenagakerjaan_number" name="bpjs_ketenagakerjaan_number" value={formData.bpjs_ketenagakerjaan_number} onChange={handleChange} placeholder="0001234567890" />
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="mb-4 font-medium">Informasi Bank</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_name">Nama Bank</Label>
                                            <Input id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="BCA" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_account_number">No. Rekening</Label>
                                            <Input id="bank_account_number" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="1234567890" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_account_name">Nama Pemilik Rekening</Label>
                                            <Input id="bank_account_name" name="bank_account_name" value={formData.bank_account_name} onChange={handleChange} placeholder="John Doe" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Catatan</Label>
                                        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Catatan tambahan..." rows={3} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Form Actions */}
                    <div className="sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate('/hr/employees')} disabled={loading}>Batal</Button>
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}
