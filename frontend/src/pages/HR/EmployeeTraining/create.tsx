import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Loader2, Users } from 'lucide-react';
import api from '@/lib/api';

const STATUS_OPTIONS = [
    { value: 'registered', label: 'Terdaftar' },
    { value: 'in_progress', label: 'Sedang Berjalan' },
    { value: 'completed', label: 'Selesai' },
    { value: 'failed', label: 'Tidak Lulus' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export default function EmployeeTrainingCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
    const [trainings, setTrainings] = useState<{ id: number; name: string; code: string }[]>([]);
    const [formData, setFormData] = useState({
        employee_id: '',
        training_id: '',
        status: 'registered',
        start_date: '',
        end_date: '',
        completion_date: '',
        score: '',
        grade: '',
        certificate_number: '',
        notes: '',
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [empRes, trnRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/trainings'),
                ]);
                const empList = (empRes.data?.data || empRes.data || []).map((e: any) => ({
                    id: e.id,
                    name: `${e.first_name || ''} ${e.last_name || ''} (${e.employee_id || ''})`,
                }));
                const trnList = (Array.isArray(trnRes.data) ? trnRes.data : []).map((t: any) => ({
                    id: t.id,
                    name: `${t.code} - ${t.name}`,
                    code: t.code,
                }));
                setEmployees(empList);
                setTrainings(trnList);
                if (empList.length > 0) setFormData(prev => ({ ...prev, employee_id: String(empList[0].id) }));
                if (trnList.length > 0) setFormData(prev => ({ ...prev, training_id: String(trnList[0].id) }));
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
            training_id: Number(formData.training_id),
            status: formData.status,
            start_date: formData.start_date ? formData.start_date : null,
            end_date: formData.end_date ? formData.end_date : null,
            completion_date: formData.completion_date ? formData.completion_date : null,
            score: formData.score ? Number(formData.score) : null,
            grade: formData.grade || null,
            certificate_number: formData.certificate_number || null,
            notes: formData.notes || null,
        };

        try {
            await api.post('/employee-trainings', payload);
            navigate('/hr/employee-trainings');
        } catch (error) {
            console.error('Error assigning training:', error);
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
                                onClick={() => navigate('/hr/employee-trainings')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Daftarkan Peserta Pelatihan
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Tugaskan staf untuk mengikuti program pelatihan atau sertifikasi
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
                                    <label htmlFor="employee_id" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Karyawan <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={employees.map(e => ({ value: String(e.id), label: e.name }))}
                                        value={formData.employee_id}
                                        onChange={(val) => setFormData(prev => ({ ...prev, employee_id: val }))}
                                        placeholder="Pilih Karyawan"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="training_id" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Program Pelatihan <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={trainings.map(t => ({ value: String(t.id), label: t.name }))}
                                        value={formData.training_id}
                                        onChange={(val) => setFormData(prev => ({ ...prev, training_id: val }))}
                                        placeholder="Pilih Program Pelatihan"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="status" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Status Progres
                                    </label>
                                    <SearchableSelect
                                        options={STATUS_OPTIONS}
                                        value={formData.status}
                                        onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                        placeholder="Pilih Status"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="start_date" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tanggal Mulai
                                    </label>
                                    <Input
                                        id="start_date"
                                        name="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="end_date" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tanggal Selesai
                                    </label>
                                    <Input
                                        id="end_date"
                                        name="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="score" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Nilai Evaluasi
                                    </label>
                                    <Input
                                        id="score"
                                        name="score"
                                        type="number"
                                        step="any"
                                        value={formData.score}
                                        onChange={handleChange}
                                        placeholder="Misal: 85.5"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="grade" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Predikat / Grade
                                    </label>
                                    <Input
                                        id="grade"
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        placeholder="Misal: A / Lulus Bersyarat"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="certificate_number" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        No. Sertifikat
                                    </label>
                                    <Input
                                        id="certificate_number"
                                        name="certificate_number"
                                        value={formData.certificate_number}
                                        onChange={handleChange}
                                        placeholder="Misal: CERT/2026/088"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                    Catatan Tambahan
                                </label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Catatan dari atasan atau panitia pelatihan..."
                                    className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                />
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/hr/employee-trainings')}
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
                                Daftarkan Peserta
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HrLayout>
    );
}
