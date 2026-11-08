import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Calendar, Loader2, BookOpen, Clock } from 'lucide-react';
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

export default function PerformancePeriodEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        type: 'quarterly',
        start_date: '',
        end_date: '',
        status: 'draft',
        description: '',
        is_current: false,
    });

    useEffect(() => {
        const fetchPeriod = async () => {
            try {
                const res = await api.get(`/performance-periods/${id}`);
                const d = res.data;
                setFormData({
                    name: d.name || '',
                    type: d.type || 'quarterly',
                    start_date: d.start_date ? d.start_date.substring(0, 10) : '',
                    end_date: d.end_date ? d.end_date.substring(0, 10) : '',
                    status: d.status || 'draft',
                    description: d.description || '',
                    is_current: !!d.is_current,
                });
            } catch (error) {
                console.error('Error fetching period:', error);
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchPeriod();
        }
    }, [id]);

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
            await api.put(`/performance-periods/${id}`, payload);
            navigate('/hr/performance-periods');
        } catch (error) {
            console.error('Error updating performance period:', error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data periode penilaian...
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <FormCard
                title={`Edit Periode: ${formData.name}`}
                subtitle="Perbarui data tanggal dan status siklus evaluasi kerja"
                icon={Calendar}
                onBack={() => navigate('/hr/performance-periods')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
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
