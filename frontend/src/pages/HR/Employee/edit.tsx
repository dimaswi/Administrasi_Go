import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ArrowLeft, Save, Loader2, UserCheck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeFamilyTab from './components/EmployeeFamilyTab';
import EmployeeEducationTab from './components/EmployeeEducationTab';
import EmployeeWorkHistoryTab from './components/EmployeeWorkHistoryTab';

export default function EmployeeEdit() {
    const { id } = useParams();

    React.useEffect(() => {
        if (id) {
            api.get(`/employees/${id}`).then(res => {
                const d = res.data;
                setFormData({
                    ...d,
                    job_category_id: d.job_category_id?.toString() || '',
                    employment_status_id: d.employment_status_id?.toString() || '',
                    organization_unit_id: d.organization_unit_id?.toString() || '',
                    education_level_id: d.education_level_id?.toString() || '',
                    education_year: d.education_year?.toString() || '',
                    date_of_birth: d.date_of_birth ? d.date_of_birth.substring(0, 10) : '',
                    join_date: d.join_date ? d.join_date.substring(0, 10) : '',
                    contract_start_date: d.contract_start_date ? d.contract_start_date.substring(0, 10) : '',
                    contract_end_date: d.contract_end_date ? d.contract_end_date.substring(0, 10) : ''
                });
            });
        }
    }, [id]);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        first_name: '',
        last_name: '',
        nik: '',
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

    React.useEffect(() => {
        // Fetch Master Data from backend
        const fetchMasterData = async () => {
            try {
                const [resOrg, resJob, resEmp] = await Promise.all([
                    api.get('/org-units?perPage=100'),
                    api.get('/job-categories'),
                    api.get('/employment-statuses')
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
            } catch (err) {
                console.error("Gagal mengambil data master:", err);
            }
        };

        fetchMasterData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Konversi ID ke number jika diperlukan sebelum di-post
            const payload = {
                ...formData,
                job_category_id: formData.job_category_id ? parseInt(formData.job_category_id) : 1, // Defaulting for now
                employment_status_id: formData.employment_status_id ? parseInt(formData.employment_status_id) : 1,
                organization_unit_id: formData.organization_unit_id ? parseInt(formData.organization_unit_id) : null,
                education_level_id: formData.education_level_id ? parseInt(formData.education_level_id) : null,
                education_year: formData.education_year ? parseInt(formData.education_year) : null,
            };

            await api.put(`/employees/${id}`, payload);
            navigate('/hr/employees');
        } catch (err: any) {
            console.error(err);
            setError('Gagal menyimpan data pegawai. Periksa koneksi atau input Anda.');
        } finally {
            setLoading(false);
        }
    };

    const employeeDisplayName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Karyawan';

    return (
        <HrLayout>
            <div className="w-full max-w-full">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3 min-w-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/hr/employees')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <UserCheck className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-sm sm:text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                        Edit Karyawan: {employeeDisplayName}
                                    </h1>
                                    <p className="text-[11px] sm:text-xs text-neutral-500 font-mono truncate">
                                        NIP: {formData.employee_id || '-'} • Perbarui data profil, keluarga, dan pendidikan
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="m-4 bg-rose-50 text-rose-700 p-3 border border-rose-200 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <Tabs defaultValue="personal" className="w-full">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 pt-2">
                            <TabsList className="h-9 bg-transparent p-0 gap-1 rounded-none">
                                <TabsTrigger
                                    value="personal"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 data-[state=active]:shadow-none text-xs uppercase font-bold tracking-wider px-3.5 py-1.5"
                                >
                                    Data Kepegawaian
                                </TabsTrigger>
                                <TabsTrigger
                                    value="family"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 data-[state=active]:shadow-none text-xs uppercase font-bold tracking-wider px-3.5 py-1.5"
                                >
                                    Keluarga
                                </TabsTrigger>
                                <TabsTrigger
                                    value="education"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 data-[state=active]:shadow-none text-xs uppercase font-bold tracking-wider px-3.5 py-1.5"
                                >
                                    Pendidikan
                                </TabsTrigger>
                                <TabsTrigger
                                    value="work"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 data-[state=active]:shadow-none text-xs uppercase font-bold tracking-wider px-3.5 py-1.5"
                                >
                                    Riwayat Pekerjaan
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* TAB DATA KEPEGAWAIAN */}
                        <TabsContent value="personal" className="m-0 focus-visible:outline-none">
                            <form onSubmit={handleSubmit}>
                                <div className="p-4 sm:p-6 space-y-6">
                                    {/* 1. Data Pribadi */}
                                    <FormSection title="1. Data Pribadi & Identitas" description="Informasi identitas dasar karyawan">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="first_name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Nama Depan <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="John" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="last_name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Nama Belakang
                                                </Label>
                                                <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="employee_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    NIP Karyawan <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleChange} required placeholder="2026-X-XXX" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="nik" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    NIK KTP <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input id="nik" name="nik" value={formData.nik} onChange={handleChange} required maxLength={16} placeholder="3201234567890001" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="gender" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Jenis Kelamin <span className="text-rose-500">*</span>
                                                </Label>
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
                                            <div className="space-y-1.5">
                                                <Label htmlFor="place_of_birth" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Tempat Lahir
                                                </Label>
                                                <Input id="place_of_birth" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} placeholder="Jakarta" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="date_of_birth" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Tanggal Lahir
                                                </Label>
                                                <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="religion" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Agama
                                                </Label>
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
                                            <div className="space-y-1.5">
                                                <Label htmlFor="marital_status" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Status Perkawinan
                                                </Label>
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
                                            <div className="space-y-1.5">
                                                <Label htmlFor="blood_type" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Golongan Darah
                                                </Label>
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
                                    </FormSection>

                                    {/* 2. Data Kontak & Alamat */}
                                    <FormSection title="2. Data Kontak & Alamat" description="Alamat domisili dan nomor kontak karyawan">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="address" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                Alamat Domisili
                                            </Label>
                                            <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Jl. Contoh No. 123..." rows={3} className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="city" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Kota
                                                </Label>
                                                <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Jakarta" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="province" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Provinsi
                                                </Label>
                                                <Input id="province" name="province" value={formData.province} onChange={handleChange} placeholder="DKI Jakarta" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="postal_code" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Kode Pos
                                                </Label>
                                                <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="12345" maxLength={10} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="phone" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    No. HP Utama
                                                </Label>
                                                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="08123456789" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="phone_secondary" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    No. HP Lainnya
                                                </Label>
                                                <Input id="phone_secondary" name="phone_secondary" value={formData.phone_secondary} onChange={handleChange} placeholder="08198765432" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Email
                                                </Label>
                                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block mb-2">Kontak Darurat</span>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="emergency_contact_name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                        Nama Kontak
                                                    </Label>
                                                    <Input id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Nama kontak darurat" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="emergency_contact_phone" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                        No. HP Darurat
                                                    </Label>
                                                    <Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} placeholder="08123456789" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="emergency_contact_relation" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                        Hubungan
                                                    </Label>
                                                    <Input id="emergency_contact_relation" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleChange} placeholder="Istri/Suami/Orang Tua" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </FormSection>

                                    {/* 3. Data Kepegawaian & Penempatan */}
                                    <FormSection title="3. Data Kepegawaian & Penempatan" description="Unit kerja, kategori, dan kontrak">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="job_category_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Kategori Pekerjaan <span className="text-rose-500">*</span>
                                                </Label>
                                                <SearchableSelect
                                                    value={formData.job_category_id}
                                                    onValueChange={(val) => handleSelectChange('job_category_id', val)}
                                                    placeholder="Pilih kategori"
                                                    options={jobCategories}
                                                />
                                                <p className="text-[11px] text-neutral-500 font-mono">Kode kategori digunakan untuk format NIK</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="employment_status_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Status Kepegawaian <span className="text-rose-500">*</span>
                                                </Label>
                                                <SearchableSelect
                                                    value={formData.employment_status_id}
                                                    onValueChange={(val) => handleSelectChange('employment_status_id', val)}
                                                    placeholder="Pilih status"
                                                    options={employmentStatuses}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="organization_unit_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Unit Organisasi
                                                </Label>
                                                <SearchableSelect
                                                    value={formData.organization_unit_id}
                                                    onValueChange={(val) => handleSelectChange('organization_unit_id', val)}
                                                    placeholder="Pilih unit"
                                                    options={orgUnits.length > 0 ? orgUnits : [{ value: "", label: "Loading..." }]}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="position" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Jabatan
                                                </Label>
                                                <Input id="position" name="position" value={formData.position} onChange={handleChange} placeholder="Staff Perawat" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="join_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Tanggal Masuk <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input id="join_date" name="join_date" type="date" value={formData.join_date} onChange={handleChange} required className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                                <p className="text-[11px] text-neutral-500 font-mono">Tahun masuk digunakan untuk NIK</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="contract_start_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Mulai Kontrak
                                                </Label>
                                                <Input id="contract_start_date" name="contract_start_date" type="date" value={formData.contract_start_date} onChange={handleChange} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="contract_end_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    Akhir Kontrak
                                                </Label>
                                                <Input id="contract_end_date" name="contract_end_date" type="date" value={formData.contract_end_date} onChange={handleChange} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                            </div>
                                        </div>
                                    </FormSection>

                                    {/* 4. Dokumen Legalitas & Akun Bank */}
                                    <FormSection title="4. Dokumen Legalitas & Akun Bank" description="Nomor dokumen pajak, jaminan sosial, dan rekening penggajian">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="npwp_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    No. NPWP
                                                </Label>
                                                <Input id="npwp_number" name="npwp_number" value={formData.npwp_number} onChange={handleChange} placeholder="12.345.678.9-012.000" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="bpjs_kesehatan_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    No. BPJS Kesehatan
                                                </Label>
                                                <Input id="bpjs_kesehatan_number" name="bpjs_kesehatan_number" value={formData.bpjs_kesehatan_number} onChange={handleChange} placeholder="0001234567890" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="bpjs_ketenagakerjaan_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    No. BPJS Ketenagakerjaan
                                                </Label>
                                                <Input id="bpjs_ketenagakerjaan_number" name="bpjs_ketenagakerjaan_number" value={formData.bpjs_ketenagakerjaan_number} onChange={handleChange} placeholder="0001234567890" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block mb-2">Informasi Rekening Bank</span>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="bank_name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                        Nama Bank
                                                    </Label>
                                                    <Input id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="BCA" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="bank_account_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                        No. Rekening
                                                    </Label>
                                                    <Input id="bank_account_number" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="1234567890" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="bank_account_name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                        Nama Pemilik Rekening
                                                    </Label>
                                                    <Input id="bank_account_name" name="bank_account_name" value={formData.bank_account_name} onChange={handleChange} placeholder="John Doe" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 pt-2">
                                            <Label htmlFor="notes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                Catatan Tambahan
                                            </Label>
                                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Catatan tambahan..." rows={3} className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                                        </div>
                                    </FormSection>
                                </div>

                                <div className="px-4 py-3 sm:px-6 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between sm:justify-end gap-2.5">
                                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none" onClick={() => navigate('/hr/employees')} disabled={loading}>
                                        Batal
                                    </Button>
                                    <Button type="submit" size="sm" className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs px-3.5 gap-1.5 shadow-none" disabled={loading}>
                                        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                                        <span>Simpan Perubahan</span>
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="family" className="m-0 p-4 sm:p-6 focus-visible:outline-none">
                            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
                                {id && <EmployeeFamilyTab employeeId={id} />}
                            </div>
                        </TabsContent>

                        <TabsContent value="education" className="m-0 p-4 sm:p-6 focus-visible:outline-none">
                            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
                                {id && <EmployeeEducationTab employeeId={id} />}
                            </div>
                        </TabsContent>

                        <TabsContent value="work" className="m-0 p-4 sm:p-6 focus-visible:outline-none">
                            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
                                {id && <EmployeeWorkHistoryTab employeeId={id} />}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </HrLayout>
    );
}
