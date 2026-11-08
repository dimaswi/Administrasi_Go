import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Loader2, Award } from 'lucide-react';
import api from '@/lib/api';

const REVIEW_STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'self_review', label: 'Self Review (Menunggu Pegawai)' },
    { value: 'manager_review', label: 'Review Atasan (Manager Review)' },
    { value: 'calibration', label: 'Tahap Kalibrasi' },
    { value: 'completed', label: 'Selesai (Final)' },
];

export default function PerformanceReviewCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
    const [periods, setPeriods] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({
        employee_id: '',
        period_id: '',
        status: 'draft',
        self_score: '',
        manager_score: '',
        final_score: '',
        final_grade: '',
        employee_notes: '',
        manager_notes: '',
        strengths: '',
        improvements: '',
        development_plan: '',
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [empRes, periodRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/performance-periods'),
                ]);
                const empList = (empRes.data?.data || empRes.data || []).map((e: any) => ({
                    id: e.id,
                    name: `${e.first_name || ''} ${e.last_name || ''} (${e.employee_id || ''})`,
                }));
                const periodList = (Array.isArray(periodRes.data) ? periodRes.data : []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                }));
                setEmployees(empList);
                setPeriods(periodList);
                if (empList.length > 0) setFormData(prev => ({ ...prev, employee_id: String(empList[0].id) }));
                if (periodList.length > 0) setFormData(prev => ({ ...prev, period_id: String(periodList[0].id) }));
            } catch (error) {
                console.error('Error fetching options:', error);
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            employee_id: Number(formData.employee_id),
            period_id: Number(formData.period_id),
            status: formData.status,
            self_score: formData.self_score ? Number(formData.self_score) : null,
            manager_score: formData.manager_score ? Number(formData.manager_score) : null,
            final_score: formData.final_score ? Number(formData.final_score) : null,
            final_grade: formData.final_grade || null,
            employee_notes: formData.employee_notes || null,
            manager_notes: formData.manager_notes || null,
            strengths: formData.strengths || null,
            improvements: formData.improvements || null,
            development_plan: formData.development_plan || null,
        };

        try {
            await api.post('/performance-reviews', payload);
            navigate('/hr/performance-reviews');
        } catch (error) {
            console.error('Error creating review:', error);
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
                                onClick={() => navigate('/hr/performance-reviews')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Award className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Buat Sesi Penilaian Kinerja
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Inisiasi formulir evaluasi berkala pegawai pada periode yang dipilih
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="employee_id" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Pegawai <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={employees.map(e => ({ value: String(e.id), label: e.name }))}
                                        value={formData.employee_id}
                                        onChange={(val) => setFormData(prev => ({ ...prev, employee_id: val }))}
                                        placeholder="Pilih Pegawai"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="period_id" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Periode Penilaian <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={periods.map(p => ({ value: String(p.id), label: p.name }))}
                                        value={formData.period_id}
                                        onChange={(val) => setFormData(prev => ({ ...prev, period_id: val }))}
                                        placeholder="Pilih Periode"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="status" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tahapan Awal
                                    </label>
                                    <SearchableSelect
                                        options={REVIEW_STATUSES}
                                        value={formData.status}
                                        onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                        placeholder="Pilih Tahap"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="self_score" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Self Score
                                    </label>
                                    <Input
                                        id="self_score"
                                        name="self_score"
                                        type="number"
                                        step="any"
                                        value={formData.self_score}
                                        onChange={handleChange}
                                        placeholder="0-100"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="manager_score" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Manager Score
                                    </label>
                                    <Input
                                        id="manager_score"
                                        name="manager_score"
                                        type="number"
                                        step="any"
                                        value={formData.manager_score}
                                        onChange={handleChange}
                                        placeholder="0-100"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="final_score" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Skor Akhir
                                    </label>
                                    <Input
                                        id="final_score"
                                        name="final_score"
                                        type="number"
                                        step="any"
                                        value={formData.final_score}
                                        onChange={handleChange}
                                        placeholder="0-100"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="final_grade" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Grade / Predikat
                                    </label>
                                    <Input
                                        id="final_grade"
                                        name="final_grade"
                                        value={formData.final_grade}
                                        onChange={handleChange}
                                        placeholder="A / B / C / Sangat Baik"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="employee_notes" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Komentar / Catatan Pegawai
                                    </label>
                                    <Textarea
                                        id="employee_notes"
                                        name="employee_notes"
                                        value={formData.employee_notes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Refleksi atau tanggapan dari karyawan..."
                                        className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="manager_notes" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Evaluasi Atasan
                                    </label>
                                    <Textarea
                                        id="manager_notes"
                                        name="manager_notes"
                                        value={formData.manager_notes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Catatan penilaian dari penilai/atasan..."
                                        className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="strengths" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Kekuatan (Strengths)
                                    </label>
                                    <Textarea
                                        id="strengths"
                                        name="strengths"
                                        value={formData.strengths}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Poin-poin keunggulan..."
                                        className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="improvements" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Area Perbaikan (Improvements)
                                    </label>
                                    <Textarea
                                        id="improvements"
                                        name="improvements"
                                        value={formData.improvements}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Hal-hal yang perlu ditingkatkan..."
                                        className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="development_plan" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Rencana Pengembangan (IDP)
                                    </label>
                                    <Textarea
                                        id="development_plan"
                                        name="development_plan"
                                        value={formData.development_plan}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Pelatihan / program pengembangan..."
                                        className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/hr/performance-reviews')}
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
                                Simpan Sesi Penilaian
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HrLayout>
    );
}
