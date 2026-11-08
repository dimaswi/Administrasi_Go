import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Loader2, GraduationCap } from 'lucide-react';
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
            <div className="w-full max-w-full space-y-4">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Card Header */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate('/hr/trainings')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <GraduationCap className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Tambah Program Training
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Buat program pelatihan baru untuk meningkatkan kompetensi karyawan
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="code" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Kode Program <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        required
                                        placeholder="Misal: TRN-BLS-01"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
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
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
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
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
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
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
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
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
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
                                    className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                />
                            </div>

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
                                    className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                />
                            </div>

                            <div className="flex items-center space-x-6 pt-2">
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
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/hr/trainings')}
                                className="h-9 px-4 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="h-9 px-5 rounded-none bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                            >
                                {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                Simpan Program
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HrLayout>
    );
}
