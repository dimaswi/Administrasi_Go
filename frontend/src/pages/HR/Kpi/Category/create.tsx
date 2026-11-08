import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, Target } from 'lucide-react';
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
                                onClick={() => navigate('/hr/kpi/categories')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Target className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Tambah Kategori KPI
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Kelompokkan indikator kinerja utama dan atur bobot persentase
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

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(c) => handleCheckedChange('is_active', !!c)}
                                />
                                <label htmlFor="is_active" className="text-xs sm:text-sm font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                                    Status Kategori Aktif
                                </label>
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/hr/kpi/categories')}
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
                                Simpan Kategori
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HrLayout>
    );
}
