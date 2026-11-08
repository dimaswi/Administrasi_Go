import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Loader2, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/api';

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Aktif / Sesi Dimulai' },
    { value: 'completed', label: 'Selesai' },
];

export default function CalibrationEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [periods, setPeriods] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({
        period_id: '',
        name: '',
        description: '',
        date: '',
        status: 'draft',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [periodRes, sessionRes] = await Promise.all([
                    api.get('/performance-periods'),
                    api.get(`/calibration/${id}`),
                ]);

                setPeriods((Array.isArray(periodRes.data) ? periodRes.data : []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                })));

                const d = sessionRes.data;
                setFormData({
                    period_id: String(d.period_id || ''),
                    name: d.name || '',
                    description: d.description || '',
                    date: d.date ? d.date.substring(0, 10) : '',
                    status: d.status || 'draft',
                });
            } catch (error) {
                console.error('Error fetching calibration details:', error);
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

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
            date: formData.date,
            status: formData.status,
        };

        try {
            await api.put(`/calibration/${id}`, payload);
            navigate('/hr/calibration');
        } catch (error) {
            console.error('Error updating calibration session:', error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data sesi kalibrasi...
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
                                onClick={() => navigate('/hr/calibration')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <SlidersHorizontal className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Sesi Kalibrasi
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Perbarui data dan jadwal kalibrasi nilai performa
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
                                        Nama Sesi Kalibrasi <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Misal: Kalibrasi Penilaian Akhir Tahun 2026"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="date" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tanggal Sesi Kalibrasi <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={formData.date}
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

                            <div className="space-y-1.5">
                                <label htmlFor="description" className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                    Deskripsi / Catatan Komite
                                </label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Jelaskan ruang lingkup kalibrasi atau daftar panel penilai..."
                                    className="rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                />
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/hr/calibration')}
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
