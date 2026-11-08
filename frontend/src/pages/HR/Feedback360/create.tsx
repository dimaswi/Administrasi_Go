import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MessageSquareQuote, Calendar, FileText } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Aktif / Berjalan' },
    { value: 'completed', label: 'Selesai' },
];

export default function Feedback360Create() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [periods, setPeriods] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({
        period_id: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'draft',
    });

    useEffect(() => {
        const fetchPeriods = async () => {
            try {
                const res = await api.get('/performance-periods');
                const list = (Array.isArray(res.data) ? res.data : []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                }));
                setPeriods(list);
                if (list.length > 0) setFormData(prev => ({ ...prev, period_id: String(list[0].id) }));
            } catch (error) {
                console.error('Error fetching periods:', error);
            }
        };
        fetchPeriods();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            period_id: Number(formData.period_id),
            name: formData.name,
            description: formData.description || null,
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: formData.status,
        };

        try {
            await api.post('/feedback360', payload);
            navigate('/hr/feedback360');
        } catch (error) {
            console.error('Error creating 360 feedback session:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Buat Sesi 360 Feedback"
                subtitle="Inisiasi program survei umpan balik multi-penilai bagi pegawai"
                icon={MessageSquareQuote}
                onBack={() => navigate('/hr/feedback360')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Sesi"
                cancelText="Batal"
                onCancel={() => navigate('/hr/feedback360')}
            >
                <FormSection
                    title="Identitas & Jadwal Sesi"
                    description="Pilih periode penilaian kinerja, nama sesi, dan tentukan rentang tanggal aktif"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="period_id" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Periode Terkait <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={periods.map(p => ({ value: String(p.id), label: p.name }))}
                                value={formData.period_id}
                                onChange={(val) => setFormData(prev => ({ ...prev, period_id: val }))}
                                placeholder="Pilih Periode"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Nama Sesi Feedback <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Misal: 360 Evaluasi Kepemimpinan Q1 2026"
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                    </div>

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
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
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
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="status" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Status Sesi
                            </label>
                            <SearchableSelect
                                options={STATUS_OPTIONS}
                                value={formData.status}
                                onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                placeholder="Pilih Status"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Petunjuk & Panduan Pelaksanaan"
                    description="Berikan deskripsi atau instruksi pengerjaan survei bagi para responden dan penilai"
                >
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Deskripsi / Panduan Sesi
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Jelaskan tujuan dan tata cara pengisian form survei 360..."
                            className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
