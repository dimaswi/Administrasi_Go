import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, CalendarDays, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { SearchableSelect } from '@/components/SearchableSelect';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function EmployeeScheduleCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [openUserSelect, setOpenUserSelect] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        start_date: '',
        end_date: '',
        monday_shift_id: '',
        tuesday_shift_id: '',
        wednesday_shift_id: '',
        thursday_shift_id: '',
        friday_shift_id: '',
        saturday_shift_id: '',
        sunday_shift_id: ''
    });

    useEffect(() => {
        api.get('/work-schedules').then(res => setShifts(res.data)).catch(console.error);
        api.get('/users').then(res => {
            const usersList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setUsers(usersList);
        }).catch(console.error);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!formData.user_id) {
            alert('Silakan pilih karyawan terlebih dahulu.');
            setLoading(false);
            return;
        }
        try {
            const payload: Record<string, any> = { ...formData };
            Object.keys(payload).forEach(k => {
                if (k.includes('id') && payload[k] === '') payload[k] = null;
                if (payload[k] !== null && k.includes('id')) payload[k] = parseInt(payload[k]);
            });
            await api.post('/employee-schedules', payload);
            navigate('/hr/employee-schedules');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan jadwal mingguan.');
        } finally {
            setLoading(false);
        }
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        if (timeStr.includes('T')) return timeStr.split('T')[1].substring(0, 5);
        return timeStr.substring(0, 5);
    };

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/hr/employee-schedules')}><ArrowLeft className="h-4 w-4" /></Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Tetapkan Jadwal Mingguan</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Formulir Jadwal</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Karyawan</Label>
                                <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                                    <PopoverTrigger render={<Button variant="outline" role="combobox" className="w-full justify-between font-normal" />}>
                                        {formData.user_id ? users.find(u => u.id.toString() === formData.user_id)?.name || "Pilih..." : "Pilih Karyawan..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] md:w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari nama karyawan..." />
                                            <CommandList>
                                                <CommandEmpty>Karyawan tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {users.map(u => (
                                                        <CommandItem
                                                            key={u.id}
                                                            value={u.name}
                                                            onSelect={() => {
                                                                setFormData(prev => ({ ...prev, user_id: u.id.toString() }));
                                                                setOpenUserSelect(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", formData.user_id === u.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {u.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Mulai Berlaku (Tanggal)</Label>
                                <Input name="start_date" type="date" required value={formData.start_date} onChange={handleChange} />
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                                <h3 className="font-medium mb-4">Pilih Shift Per Hari</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {days.map((d, i) => (
                                        <div key={d} className="space-y-2">
                                            <Label>{dayNames[i]}</Label>
                                            <SearchableSelect
                                                value={(formData as any)[`${d}_shift_id`]}
                                                onValueChange={(val) => setFormData(prev => ({ ...prev, [`${d}_shift_id`]: val }))}
                                                placeholder="-- Libur / Tidak ada shift --"
                                                options={shifts.map((s: any) => ({ value: s.id.toString(), label: `${s.name} (${formatTime(s.clock_in_time)} - ${formatTime(s.clock_out_time)})` }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky bottom-0 z-40 mt-auto -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur border-t flex justify-end gap-3">
                        <Button type="submit" disabled={loading}><Save className="mr-2 h-4 w-4" /> {loading ? 'Menyimpan...' : 'Simpan Jadwal'}</Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}