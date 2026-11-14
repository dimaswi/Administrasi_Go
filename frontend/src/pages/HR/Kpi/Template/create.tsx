import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Gauge } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';

const MEASUREMENT_TYPES = [
    { value: 'numeric', label: 'Angka (Numeric)' },
    { value: 'percentage', label: 'Persentase (%)' },
    { value: 'currency', label: 'Mata Uang (Rp)' },
    { value: 'rating', label: 'Skala Rating (1-5)' },
    { value: 'boolean', label: 'Ya / Tidak (Boolean)' },
];

export default function KpiTemplateCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({
        category_id: '',
        code: '',
        name: '',
        description: '',
        measurement_type: 'numeric',
        unit: '',
        target_min: '',
        target_max: '',
        weight: 1,
        is_active: true,
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/kpi/categories');
                const catList = Array.isArray(res.data) ? res.data : [];
                setCategories(catList);
                if (catList.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: String(catList[0].id) }));
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            category_id: Number(formData.category_id),
            code: formData.code,
            name: formData.name,
            description: formData.description,
            measurement_type: formData.measurement_type,
            unit: formData.unit || null,
            target_min: formData.target_min !== '' ? Number(formData.target_min) : null,
            target_max: formData.target_max !== '' ? Number(formData.target_max) : null,
            weight: Number(formData.weight),
            is_active: formData.is_active,
        };

        try {
            await api.post('/kpi/templates', payload);
            navigate('/hr/kpi/templates');
        } catch (error) {
            console.error('Error creating KPI template:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Template Indikator KPI"
                subtitle="Definisikan parameter metrik dan target pengukuran standar"
                icon={Gauge}
                onBack={() => navigate('/hr/kpi/templates')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Template"
                cancelText="Batal"
                onCancel={() => navigate('/hr/kpi/templates')}
            >
                <FormSection
                    title="Informasi Dasar Indikator"
                    description="Pilih kategori kelompok KPI dan nama indikator kerja (kode dibuat otomatis)"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="category_id" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Kategori KPI <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                                value={formData.category_id}
                                onChange={(val) => setFormData(prev => ({ ...prev, category_id: val }))}
                                placeholder="Pilih Kategori"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Nama Indikator KPI <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Misal: Waktu Tanggap Pelayanan Pasien IGD"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Parameter & Target Pengukuran"
                    description="Atur jenis data metrik, satuan nilai, rentang batas target, dan bobot poin"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="measurement_type" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Tipe Pengukuran <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={MEASUREMENT_TYPES}
                                value={formData.measurement_type}
                                onChange={(val) => setFormData(prev => ({ ...prev, measurement_type: val }))}
                                placeholder="Pilih Tipe Pengukuran"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="unit" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Satuan Ukur
                            </label>
                            <Input
                                id="unit"
                                name="unit"
                                type="text"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="Menit / Pasien / % / Skor"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="target_min" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Target Minimum
                            </label>
                            <Input
                                id="target_min"
                                name="target_min"
                                type="number"
                                step="any"
                                value={formData.target_min}
                                onChange={handleChange}
                                placeholder="0"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="target_max" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Target Maksimum
                            </label>
                            <Input
                                id="target_max"
                                name="target_max"
                                type="number"
                                step="any"
                                value={formData.target_max}
                                onChange={handleChange}
                                placeholder="100"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="weight" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Bobot Poin <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="weight"
                                name="weight"
                                type="number"
                                min="1"
                                value={formData.weight}
                                onChange={handleChange}
                                required
                                placeholder="1"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Deskripsi & Petunjuk Perhitungan"
                    description="Rumus teknis, metode verifikasi pencapaian, dan aktivasi template"
                >
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Deskripsi & Petunjuk Perhitungan
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Rumus perhitungan atau penjelasan teknis pencapaian target..."
                            className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                        <Checkbox
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(c) => handleCheckedChange('is_active', !!c)}
                        />
                        <label htmlFor="is_active" className="text-xs sm:text-sm font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                            Status Template Indikator Aktif
                        </label>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
