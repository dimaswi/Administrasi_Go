import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, CalendarRange } from 'lucide-react';
import api from '@/lib/api';

export default function RosterScheduleCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState([]);
    const [formData, setFormData] = useState({
        user_id: '',
        work_schedule_id: '',
        date: '',
        notes: ''
    });

    useEffect(() => {
        api.get('/work-schedules').then(res => setShifts(res.data)).catch(console.error);
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
            alert('Gagal menyimpan roster.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/hr/rosters')}><ArrowLeft className="h-4 w-4" /></Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Plot Roster Baru</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5" /> Detail Roster Harian</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>ID Karyawan</Label>
                                <Input name="user_id" type="number" required value={formData.user_id} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal</Label>
                                <Input name="date" type="date" required value={formData.date} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Pilih Shift</Label>
                                <select 
                                    name="work_schedule_id" 
                                    required
                                    value={formData.work_schedule_id} 
                                    onChange={handleChange}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">-- Pilih Shift --</option>
                                    {shifts.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.clock_in_time.substring(0,5)} - {s.clock_out_time.substring(0,5)})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Keterangan Tambahan</Label>
                                <Input name="notes" value={formData.notes} onChange={handleChange} placeholder="Misal: Ganti shift..." />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky bottom-0 z-40 mt-auto -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur border-t flex justify-end gap-3">
                        <Button type="submit" disabled={loading}><Save className="mr-2 h-4 w-4" /> {loading ? 'Menyimpan...' : 'Simpan Roster'}</Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}