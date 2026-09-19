import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, CalendarClock, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';

export default function WorkScheduleEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
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
                // Parse time strings in case they contain full ISO dates
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
                alert('Gagal mengambil data shift.');
                navigate('/hr/work-schedules');
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
            alert('Gagal menyimpan shift.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <HrLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </HrLayout>
        );
    }

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/work-schedules')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Edit Shift</h2>
                        <p className="text-sm text-muted-foreground">Ubah master data shift</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-primary" />
                                Informasi Shift
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Shift <span className="text-destructive">*</span></Label>
                                <Input id="code" name="code" value={formData.code} onChange={handleChange} required placeholder="SFT-PAGI" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Shift <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Shift Pagi" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clock_in_time">Jam Masuk (24 Jam) <span className="text-destructive">*</span></Label>
                                <Input id="clock_in_time" name="clock_in_time" type="text" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$" placeholder="08:00" value={formData.clock_in_time} onChange={handleChange} required />
                                <p className="text-xs text-muted-foreground">Format: HH:mm (contoh: 08:00 atau 14:30)</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clock_out_time">Jam Pulang (24 Jam) <span className="text-destructive">*</span></Label>
                                <Input id="clock_out_time" name="clock_out_time" type="text" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$" placeholder="16:00" value={formData.clock_out_time} onChange={handleChange} required />
                                <p className="text-xs text-muted-foreground">Format: HH:mm (contoh: 08:00 atau 14:30)</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="late_tolerance">Toleransi Terlambat (Menit)</Label>
                                <Input id="late_tolerance" name="late_tolerance" type="number" value={formData.late_tolerance} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="early_leave_tolerance">Toleransi Pulang Cepat (Menit)</Label>
                                <Input id="early_leave_tolerance" name="early_leave_tolerance" type="number" value={formData.early_leave_tolerance} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Keterangan</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
                            </div>
                            <div className="flex flex-col gap-3 md:col-span-2 mt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_special" checked={formData.is_special} onCheckedChange={(c) => handleCheckedChange('is_special', c as boolean)} />
                                    <Label htmlFor="is_special" className="font-normal cursor-pointer">Tandai sebagai Special Shift (jam kerja lebih panjang/spesifik)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_flexible" checked={formData.is_flexible} onCheckedChange={(c) => handleCheckedChange('is_flexible', c as boolean)} />
                                    <Label htmlFor="is_flexible" className="font-normal cursor-pointer">Shift Fleksibel</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(c) => handleCheckedChange('is_active', c as boolean)} />
                                    <Label htmlFor="is_active" className="font-normal cursor-pointer">Aktif</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky bottom-0 z-40 mt-auto -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate('/hr/work-schedules')}>Batal</Button>
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={loading}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? 'Menyimpan...' : 'Simpan Shift'}
                        </Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}