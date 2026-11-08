import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Target } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';

export default function KpiCategoryCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        weight: 100,
        sort_order: 0,
        is_active: true,
    });

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
        try {
            await api.post('/kpi/categories', formData);
            navigate('/hr/kpi/categories');
        } catch (error) {
            console.error('Error creating KPI category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Kategori KPI"
                subtitle="Kelompokkan indikator kinerja utama dan atur bobot persentase"
                icon={Target}
                onBack={() => navigate('/hr/kpi/categories')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Kategori"
                cancelText="Batal"
                onCancel={() => navigate('/hr/kpi/categories')}
            >
                <FormSection
                    title="Informasi Kategori"
                    description="Tentukan kode pengenal, nama kategori KPI, dan bobot evaluasi"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="code" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Kode Kategori <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                placeholder="Misal: KPI-MED, KPI-ADM"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Nama Kategori <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Misal: Pelayanan Medis / Operasional"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="weight" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Bobot Persentase (%) <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="weight"
                                name="weight"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.weight}
                                onChange={handleChange}
                                required
                                placeholder="100"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="sort_order" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Urutan Tampilan
                            </label>
                            <Input
                                id="sort_order"
                                name="sort_order"
                                type="number"
                                value={formData.sort_order}
                                onChange={handleChange}
                                placeholder="0"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="description" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Deskripsi Kategori
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Jelaskan ruang lingkup pengukuran kategori ini..."
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
                            Status Kategori Aktif
                        </label>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
