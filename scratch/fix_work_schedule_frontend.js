const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../frontend/src/pages/HR/WorkSchedule');

const indexCode = `import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CalendarClock } from 'lucide-react';
import api from '@/lib/api';

interface WorkSchedule {
    id: number;
    code: string;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
    is_flexible: boolean;
    is_special: boolean;
    is_active: boolean;
}

export default function WorkScheduleIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<WorkSchedule | null>(null);

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(\`/work-schedules\`);
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (schedule: WorkSchedule) => {
        setScheduleToDelete(schedule);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (scheduleToDelete) {
            try {
                await api.delete(\`/work-schedules/\${scheduleToDelete.id}\`);
                fetchData();
            } catch (error) {
                console.error(error);
            } finally {
                setDeleteDialogOpen(false);
                setScheduleToDelete(null);
            }
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode Shift',
            className: 'w-[150px]',
            render: (sch: WorkSchedule) => <span className="font-mono text-sm">{sch.code}</span>,
        },
        {
            key: 'name',
            label: 'Nama Shift',
            className: 'w-[200px]',
            render: (sch: WorkSchedule) => <div className="font-medium text-sm">{sch.name}</div>,
        },
        {
            key: 'time',
            label: 'Jam Kerja',
            className: 'w-[150px]',
            render: (sch: WorkSchedule) => (
                <div className="text-sm">
                    {sch.clock_in_time.substring(0,5)} - {sch.clock_out_time.substring(0,5)}
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Kategori',
            className: 'w-[200px]',
            render: (sch: WorkSchedule) => (
                <div className="flex gap-1">
                    {sch.is_flexible ? (
                         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Fleksibel</Badge>
                    ) : (
                         <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Tetap</Badge>
                    )}
                    {sch.is_special && (
                         <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Special</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[150px]',
            render: (sch: WorkSchedule) => (
                sch.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (sch: WorkSchedule) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(\`/hr/work-schedules/\${sch.id}/edit\`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(sch)}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Master Shift"
                description="Kelola referensi jam kerja / shift"
                actions={[{ label: 'Tambah Shift', href: '/hr/work-schedules/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data shift"
                emptyIcon={CalendarClock}
                isLoading={loading}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Shift</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus shift ini?
                        </DialogDescription>
                    </DialogHeader>
                    {scheduleToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{scheduleToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">Kode: {scheduleToDelete.code}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}`;

const createCode = `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, CalendarClock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';

export default function WorkScheduleCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '',
        clock_in_time: '08:00:00', clock_out_time: '16:00:00',
        late_tolerance: 15, early_leave_tolerance: 0,
        is_flexible: false, is_special: false, is_active: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value) : value 
        }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/work-schedules', formData);
            navigate('/hr/work-schedules');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan shift.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/work-schedules')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Tambah Shift Baru</h2>
                        <p className="text-sm text-muted-foreground">Buat master data shift</p>
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
                                <Label htmlFor="clock_in_time">Jam Masuk <span className="text-destructive">*</span></Label>
                                <Input id="clock_in_time" name="clock_in_time" type="time" step="1" value={formData.clock_in_time} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clock_out_time">Jam Pulang <span className="text-destructive">*</span></Label>
                                <Input id="clock_out_time" name="clock_out_time" type="time" step="1" value={formData.clock_out_time} onChange={handleChange} required />
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
}`;

fs.writeFileSync(path.join(dir, 'index.tsx'), indexCode);
fs.writeFileSync(path.join(dir, 'create.tsx'), createCode);
fs.writeFileSync(path.join(dir, 'edit.tsx'), createCode.replace(/Tambah Shift Baru/g, 'Edit Shift').replace(/Buat master data shift/g, 'Ubah master data shift').replace(/WorkScheduleCreate/g, 'WorkScheduleEdit'));
console.log('Fixed WorkSchedule frontend');
