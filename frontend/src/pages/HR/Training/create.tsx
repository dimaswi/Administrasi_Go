import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { GraduationCap, BookOpen, Clock, MapPin } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';

const TRAINING_TYPES = [
    { value: 'internal', label: 'Internal Training' },
    { value: 'external', label: 'External Training' },
    { value: 'online', label: 'Online Course' },
    { value: 'certification', label: 'Sertifikasi' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
];

const TRAINING_CATEGORIES = [
    { value: 'technical', label: 'Technical Skill' },
    { value: 'soft_skill', label: 'Soft Skill' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'safety', label: 'Safety & Health' },
    { value: 'product', label: 'Product Knowledge' },
    { value: 'other', label: 'Lainnya' },
];

export default function TrainingCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'internal',
        category: 'technical',
        provider: '',
        duration_hours: '',
        cost: '',
        location: '',
        is_mandatory: false,
        is_active: true,
        objectives: '',
        prerequisites: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? Number(value) : '') : value
        }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            duration_hours: formData.duration_hours ? Number(formData.duration_hours) : null,
            cost: formData.cost ? Number(formData.cost) : null,
            provider: formData.provider || null,
            location: formData.location || null,
            description: formData.description || null,
            objectives: formData.objectives || null,
            prerequisites: formData.prerequisites || null,
        };

        try {
            await api.post('/trainings', payload);
            navigate('/hr/trainings');
        } catch (error) {
            console.error('Error creating training:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Program Training"
                subtitle="Buat program pelatihan baru untuk meningkatkan kompetensi karyawan"
                icon={GraduationCap}
                onBack={() => navigate('/hr/trainings')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Program"
                cancelText="Batal"
                onCancel={() => navigate('/hr/trainings')}
            >
                <FormSection
                    title="Informasi Dasar Program"
                    description="Identitas dan klasifikasi modul pelatihan yang akan diselenggarakan (kode dibuat otomatis)"
                    icon={BookOpen}
                >
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Nama Program Training <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Misal: Basic Life Support (BLS) & Resusitasi"
                            className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="type" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Tipe Pelatihan <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={TRAINING_TYPES}
                                value={formData.type}
                                onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                placeholder="Pilih Tipe Pelatihan"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="category" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Kategori Skill <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={TRAINING_CATEGORIES}
                                value={formData.category}
                                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                                placeholder="Pilih Kategori"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Penyelenggara & Lokasi"
                    description="Spesifikasi penyelenggara, durasi pelatihan, biaya, dan lokasi pertemuan"
                    icon={Clock}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="provider" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Lembaga / Provider
                            </label>
                            <Input
                                id="provider"
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                placeholder="Misal: Diklat Internal RS / Vendor"
                                className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="duration_hours" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Durasi (Jam)
                            </label>
                            <Input
                                id="duration_hours"
                                name="duration_hours"
                                type="number"
                                value={formData.duration_hours}
                                onChange={handleChange}
                                placeholder="8"
                                className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="cost" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Biaya per Orang (Rp)
                            </label>
                            <Input
                                id="cost"
                                name="cost"
                                type="number"
                                value={formData.cost}
                                onChange={handleChange}
                                placeholder="0"
                                className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="location" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Lokasi Pelaksanaan
                        </label>
                        <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Misal: Ruang Pertemuan Lt. 2 / Zoom Meeting"
                            className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>
                </FormSection>

                <FormSection
                    title="Deskripsi & Ketentuan"
                    description="Rincian materi pelatihan serta pengaturan kewajiban kepesertaan"
                    icon={MapPin}
                >
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Deskripsi Lengkap
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Ringkasan materi pelatihan..."
                            className="rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_mandatory"
                                checked={formData.is_mandatory}
                                onCheckedChange={(c) => handleCheckedChange('is_mandatory', !!c)}
                            />
                            <label htmlFor="is_mandatory" className="text-xs sm:text-sm font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                                Wajib Diikuti Karyawan Terkait
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(c) => handleCheckedChange('is_active', !!c)}
                            />
                            <label htmlFor="is_active" className="text-xs sm:text-sm font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                                Status Program Aktif
                            </label>
                        </div>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
