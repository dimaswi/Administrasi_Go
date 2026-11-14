import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { CalendarRange } from 'lucide-react';
import { FormCard } from '@/components/ui/form-card';
import api from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function RosterScheduleCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [shifts, setShifts] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        user_id: '',
        work_schedule_id: '',
        date: '',
        notes: ''
    });

    useEffect(() => {
        api.get('/work-schedules').then(res => setShifts(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { 
                ...formData,
                user_id: parseInt(formData.user_id),
                work_schedule_id: parseInt(formData.work_schedule_id)
            };
            await api.post('/roster-schedules', payload);
            navigate('/hr/rosters');
        } catch (error) {
            console.error(error);
            setAlertMessage('Gagal menyimpan roster.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Plot Roster Baru"
                subtitle="Tetapkan penugasan jadwal shift kerja harian untuk staf"
                icon={CalendarRange}
                onBack={() => navigate('/hr/rosters')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Roster"
                onCancel={() => navigate('/hr/rosters')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="user_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            ID Karyawan <span className="text-rose-500">*</span>
                        </Label>
                        <Input 
                            id="user_id"
                            name="user_id" 
                            type="number" 
                            required 
                            value={formData.user_id} 
                            onChange={handleChange} 
                            placeholder="Contoh: 101"
                            className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                        </Label>
                        <Input 
                            id="date"
                            name="date" 
                            type="date" 
                            required 
                            value={formData.date} 
                            onChange={handleChange} 
                            className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="work_schedule_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Pilih Shift <span className="text-rose-500">*</span>
                        </Label>
                        <SearchableSelect
                            value={formData.work_schedule_id}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, work_schedule_id: val }))}
                            placeholder="-- Pilih Shift --"
                            options={shifts.map((s: any) => ({ value: s.id.toString(), label: `${s.name} (${s.clock_in_time?.substring(0,5)} - ${s.clock_out_time?.substring(0,5)})` }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Keterangan Tambahan
                        </Label>
                        <Input 
                            id="notes"
                            name="notes" 
                            value={formData.notes} 
                            onChange={handleChange} 
                            placeholder="Misal: Ganti shift karena ada keperluan..." 
                            className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                        />
                    </div>
                </div>
            </FormCard>

            <ConfirmDialog
                open={alertMessage !== null}
                onOpenChange={(open) => { if (!open) setAlertMessage(null); }}
                title="Pemberitahuan"
                description={alertMessage || ''}
                hideCancel
            />
        </HrLayout>
    );
}
