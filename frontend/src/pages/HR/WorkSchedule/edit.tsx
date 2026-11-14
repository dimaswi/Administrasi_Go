import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FormCard } from '@/components/ui/form-card';
import api from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function WorkScheduleEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [redirectAfterAlert, setRedirectAfterAlert] = useState(false);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '',
        clock_in_time: '08:00:00', clock_out_time: '16:00:00',
        late_tolerance: 15, early_leave_tolerance: 0,
        is_flexible: false, is_special: false, is_active: true
    });

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await api.get(`/work-schedules/${id}`);
                const data = res.data;
                const extractTime = (t: string) => {
                    if (!t) return '00:00';
                    const match = t.match(/T(\d{2}:\d{2})/);
                    if (match) return match[1];
                    return t.length >= 5 ? t.substring(0, 5) : t;
                };

                setFormData({
                    code: data.code || '',
                    name: data.name || '',
                    description: data.description || '',
                    clock_in_time: extractTime(data.clock_in_time),
                    clock_out_time: extractTime(data.clock_out_time),
                    late_tolerance: data.late_tolerance || 0,
                    early_leave_tolerance: data.early_leave_tolerance || 0,
                    is_flexible: data.is_flexible || false,
                    is_special: data.is_special || false,
                    is_active: data.is_active !== undefined ? data.is_active : true
                });
            } catch (error) {
                console.error(error);
                setRedirectAfterAlert(true);
                setAlertMessage('Gagal mengambil data shift.');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchSchedule();
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value) || 0 : value 
        }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/work-schedules/${id}`, formData);
            navigate('/hr/work-schedules');
        } catch (error) {
            console.error(error);
            setAlertMessage('Gagal memperbarui shift.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-8 text-center text-xs text-neutral-500 font-mono">
                    <Loader2 className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                    Memuat data shift...
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <FormCard
                title={`Edit Shift: ${formData.name || 'Shift'}`}
                subtitle={`Kode: ${formData.code || '-'} • Perbarui jam operasional dan toleransi presensi`}
                icon={CalendarClock}
                onBack={() => navigate('/hr/work-schedules')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
                onCancel={() => navigate('/hr/work-schedules')}
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="code" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kode Shift <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="code" 
                                name="code" 
                                value={formData.code} 
                                onChange={handleChange} 
                                required 
                                placeholder="SFT-PAGI" 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Shift <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                placeholder="Shift Pagi" 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="clock_in_time" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Jam Masuk <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="clock_in_time" 
                                name="clock_in_time" 
                                type="text" 
                                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$" 
                                placeholder="08:00" 
                                value={formData.clock_in_time} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                            <p className="text-[11px] text-neutral-500 font-mono">Format: HH:mm</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="clock_out_time" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Jam Pulang <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="clock_out_time" 
                                name="clock_out_time" 
                                type="text" 
                                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$" 
                                placeholder="16:00" 
                                value={formData.clock_out_time} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                            <p className="text-[11px] text-neutral-500 font-mono">Format: HH:mm</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="late_tolerance" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Toleransi Terlambat (Menit)
                            </Label>
                            <Input 
                                id="late_tolerance" 
                                name="late_tolerance" 
                                type="number" 
                                value={formData.late_tolerance} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="early_leave_tolerance" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Toleransi Pulang Cepat
                            </Label>
                            <Input 
                                id="early_leave_tolerance" 
                                name="early_leave_tolerance" 
                                type="number" 
                                value={formData.early_leave_tolerance} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Keterangan Shift
                        </Label>
                        <Textarea 
                            id="description" 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows={3} 
                            placeholder="Keterangan tambahan mengenai shift ini..."
                            className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                        />
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
                            Pengaturan &amp; Status Shift
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                                <Checkbox 
                                    id="is_special" 
                                    checked={formData.is_special} 
                                    onCheckedChange={(c) => handleCheckedChange('is_special', c as boolean)} 
                                    className="rounded-none"
                                />
                                <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Special Shift</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                                <Checkbox 
                                    id="is_flexible" 
                                    checked={formData.is_flexible} 
                                    onCheckedChange={(c) => handleCheckedChange('is_flexible', c as boolean)} 
                                    className="rounded-none"
                                />
                                <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Shift Fleksibel</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                                <Checkbox 
                                    id="is_active" 
                                    checked={formData.is_active} 
                                    onCheckedChange={(c) => handleCheckedChange('is_active', c as boolean)} 
                                    className="rounded-none"
                                />
                                <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Shift Aktif</span>
                            </label>
                        </div>
                    </div>
                </div>
            </FormCard>

            <ConfirmDialog
                open={alertMessage !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setAlertMessage(null);
                        if (redirectAfterAlert) {
                            navigate('/hr/work-schedules');
                        }
                    }
                }}
                title="Pemberitahuan"
                description={alertMessage || ''}
                hideCancel
            />
        </HrLayout>
    );
}
