import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';

const PERIOD_TYPES = [
    { value: 'monthly', label: 'Bulanan' },
    { value: 'quarterly', label: 'Triwulan' },
    { value: 'semester', label: 'Semester' },
    { value: 'yearly', label: 'Tahunan' },
];

const PERIOD_STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Aktif' },
    { value: 'closed', label: 'Selesai' },
];

export default function PerformancePeriodCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'quarterly',
        start_date: '',
        end_date: '',
        status: 'draft',
        description: '',
        is_current: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            description: formData.description || null,
        };

        try {
            await api.post('/performance-periods', payload);
            navigate('/hr/performance-periods');
        } catch (error) {
            console.error('Error creating performance period:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Buat Periode Penilaian"
                subtitle="Tentukan rentang tanggal evaluasi kinerja untuk seluruh pegawai"
                icon={Calendar}
                onBack={() => navigate('/hr/performance-periods')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Periode"
                cancelText="Batal"
                onCancel={() => navigate('/hr/performance-periods')}
            >
                <FormSection
                    title="Identitas Periode"
                    description="Nama siklus dan rentang tanggal berlakunya evaluasi kinerja"
                    icon={BookOpen}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Nama Periode <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Misal: Semester 1 - 2026 / Q1 2026"
                                className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="type" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Siklus Periode <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={PERIOD_TYPES}
                                value={formData.type}
                                onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                placeholder="Pilih Siklus"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Jadwal & Status Siklus"
                    description="Rentang tanggal mulai-selesai dan status keaktifan periode"
                    icon={Clock}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="start_date" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Tanggal Mulai <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                                className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="end_date" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Tanggal Selesai <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                                className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="status" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Status Periode
                            </label>
                            <SearchableSelect
                                options={PERIOD_STATUSES}
                                value={formData.status}
                                onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                placeholder="Pilih Status"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label htmlFor="description" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Deskripsi Periode
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Keterangan atau pedoman umum pelaksanaan penilaian..."
                            className="rounded-none border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="is_current"
                            checked={formData.is_current}
                            onCheckedChange={(c) => handleCheckedChange('is_current', !!c)}
                        />
                        <label htmlFor="is_current" className="text-xs sm:text-sm font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                            Tetapkan sebagai periode berjalan saat ini (Active Cycle)
                        </label>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
