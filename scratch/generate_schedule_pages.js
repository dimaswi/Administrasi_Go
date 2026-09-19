const fs = require('fs');
const path = require('path');

const empDir = path.join(__dirname, '../frontend/src/pages/HR/EmployeeSchedule');
const rosDir = path.join(__dirname, '../frontend/src/pages/HR/RosterSchedule');

if (!fs.existsSync(empDir)) fs.mkdirSync(empDir, { recursive: true });
if (!fs.existsSync(rosDir)) fs.mkdirSync(rosDir, { recursive: true });

// --- Employee Schedule (Jadwal Mingguan) ---
const empIndex = `import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Plus, CalendarDays } from 'lucide-react';
import api from '@/lib/api';

export default function EmployeeScheduleIndex() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/employee-schedules');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'id', label: 'ID', render: (row: any) => row.id },
        { key: 'user_id', label: 'ID Pegawai', render: (row: any) => row.user_id },
        { key: 'start_date', label: 'Mulai Berlaku', render: (row: any) => row.start_date.substring(0, 10) },
        { key: 'end_date', label: 'Berakhir Pada', render: (row: any) => row.end_date ? row.end_date.substring(0, 10) : 'Selamanya' },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Jadwal Mingguan Pegawai"
                description="Kelola jadwal kerja reguler pegawai (Senin - Minggu)"
                actions={[{ label: 'Tetapkan Jadwal', href: '/hr/employee-schedules/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data jadwal mingguan"
                emptyIcon={CalendarDays}
                isLoading={loading}
            />
        </HrLayout>
    );
}`;

const empCreate = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, CalendarDays } from 'lucide-react';
import api from '@/lib/api';

export default function EmployeeScheduleCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState([]);
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
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
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
                                <Label>ID Karyawan</Label>
                                <Input name="user_id" type="number" required value={formData.user_id} onChange={handleChange} />
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
                                            <select 
                                                name={\`\${d}_shift_id\`} 
                                                value={formData[\`\${d}_shift_id\`]} 
                                                onChange={handleChange}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">-- Libur / Tidak ada shift --</option>
                                                {shifts.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.clock_in_time.substring(0,5)} - {s.clock_out_time.substring(0,5)})</option>)}
                                            </select>
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
}`;

// --- Roster Schedule (Jadwal Dinas / Roster) ---
const rosIndex = `import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Plus, CalendarRange } from 'lucide-react';
import api from '@/lib/api';

export default function RosterScheduleIndex() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/roster-schedules');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'date', label: 'Tanggal', render: (row: any) => row.date.substring(0, 10) },
        { key: 'user_id', label: 'ID Pegawai', render: (row: any) => row.user_id },
        { key: 'work_schedule_id', label: 'ID Shift', render: (row: any) => row.work_schedule_id },
        { key: 'notes', label: 'Keterangan', render: (row: any) => row.notes || '-' },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Jadwal Dinas (Roster)"
                description="Kelola shift khusus harian untuk perawat/dokter"
                actions={[{ label: 'Plot Roster Baru', href: '/hr/rosters/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data roster"
                emptyIcon={CalendarRange}
                isLoading={loading}
            />
        </HrLayout>
    );
}`;

const rosCreate = `import React, { useState, useEffect } from 'react';
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
}`;

fs.writeFileSync(path.join(empDir, 'index.tsx'), empIndex);
fs.writeFileSync(path.join(empDir, 'create.tsx'), empCreate);
fs.writeFileSync(path.join(rosDir, 'index.tsx'), rosIndex);
fs.writeFileSync(path.join(rosDir, 'create.tsx'), rosCreate);
console.log('Generated schedule UI files');
