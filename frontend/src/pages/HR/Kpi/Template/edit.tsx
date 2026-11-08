import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Loader2, Gauge } from 'lucide-react';
import api from '@/lib/api';

const MEASUREMENT_TYPES = [
    { value: 'numeric', label: 'Angka (Numeric)' },
    { value: 'percentage', label: 'Persentase (%)' },
    { value: 'currency', label: 'Mata Uang (Rp)' },
    { value: 'rating', label: 'Skala Rating (1-5)' },
    { value: 'boolean', label: 'Ya / Tidak (Boolean)' },
];

export default function KpiTemplateEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
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
        const fetchData = async () => {
            try {
                const [catRes, templateRes] = await Promise.all([
                    api.get('/kpi/categories'),
                    api.get(`/kpi/templates/${id}`),
                ]);

                setCategories(Array.isArray(catRes.data) ? catRes.data : []);
                const data = templateRes.data;

                setFormData({
                    category_id: String(data.category_id || ''),
                    code: data.code || '',
                    name: data.name || '',
                    description: data.description || '',
                    measurement_type: data.measurement_type || 'numeric',
                    unit: data.unit || '',
                    target_min: data.target_min !== null && data.target_min !== undefined ? String(data.target_min) : '',
                    target_max: data.target_max !== null && data.target_max !== undefined ? String(data.target_max) : '',
                    weight: data.weight || 1,
                    is_active: data.is_active ?? true,
                });
            } catch (error) {
                console.error('Error fetching template details:', error);
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

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
            await api.put(`/kpi/templates/${id}`, payload);
            navigate('/hr/kpi/templates');
        } catch (error) {
            console.error('Error updating KPI template:', error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data template KPI...
                </div>
            </HrLayout>
        );
    }

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
                                onClick={() => navigate('/hr/kpi/templates')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Gauge className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Template Indikator: {formData.code}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Perbarui nama, target capaian, satuan ukur, dan bobot metrik
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
                                    <label htmlFor="code" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Kode Indikator <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        id="code"
                                        name="code"
                                        type="text"
                                        value={formData.code}
                                        onChange={handleChange}
                                        required
                                        placeholder="Misal: IND-BOR, IND-WTR"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
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

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(c) => handleCheckedChange('is_active', !!c)}
                                />
                                <label htmlFor="is_active" className="text-xs sm:text-sm font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                                    Status Template Indikator Aktif
                                </label>
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/hr/kpi/templates')}
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
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HrLayout>
    );
}
