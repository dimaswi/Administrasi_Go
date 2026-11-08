import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FormCard } from '@/components/ui/form-card';
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
            <FormCard
                title="Tetapkan Jadwal Mingguan"
                subtitle="Tetapkan pola rotasi shift kerja mingguan untuk karyawan"
                icon={CalendarDays}
                onBack={() => navigate('/hr/employee-schedules')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Jadwal"
                onCancel={() => navigate('/hr/employee-schedules')}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Karyawan <span className="text-rose-500">*</span>
                            </Label>
                            <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                                <PopoverTrigger render={<Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />}>
                                    {formData.user_id ? users.find(u => u.id.toString() === formData.user_id)?.name || "Pilih..." : "Pilih Karyawan..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] md:w-[400px] p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari nama karyawan..." className="rounded-none h-9 text-sm" />
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
                        <div className="space-y-1.5">
                            <Label htmlFor="start_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Mulai Berlaku (Tanggal) <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="start_date"
                                name="start_date" 
                                type="date" 
                                required 
                                value={formData.start_date} 
                                onChange={handleChange} 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                    </div>
                    
                    <div className="border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 block">
                                Konfigurasi Shift Harian (Senin - Minggu)
                            </span>
                            <p className="text-[11px] text-neutral-500">Pilih jam kerja untuk setiap hari kerja atau kosongkan jika libur.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {days.map((d, i) => (
                                <div key={d} className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                        Hari {dayNames[i]}
                                    </Label>
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
                </div>
            </FormCard>
        </HrLayout>
    );
}
