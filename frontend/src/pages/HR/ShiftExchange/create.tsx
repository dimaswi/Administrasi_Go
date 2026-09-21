import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function ShiftExchangeCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // States for dropdown options
    const [employees, setEmployees] = useState<{value: string, label: string}[]>([]);
    const [myRosters, setMyRosters] = useState<{value: string, label: string}[]>([]);
    const [targetRosters, setTargetRosters] = useState<{value: string, label: string}[]>([]);
    
    // Form Data
    const [formData, setFormData] = useState({
        exchange_type: 'swap', // 'swap' | 'cover'
        requesting_employee_id: '',
        original_roster_id: '',
        target_employee_id: '',
        target_roster_id: '',
        reason: ''
    });

    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Initial fetch for all employees
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Get current user ID from JWT token
                const token = localStorage.getItem('token');
                let myId = null;
                if (token) {
                    const payload = parseJwt(token);
                    if (payload) {
                        myId = payload.user_id;
                        setCurrentUserId(myId);
                    }
                }

                // Fetch Employees
                const empRes = await api.get('/employees?perPage=1000'); 
                const emps = empRes.data?.data || [];
                const empOptions = emps.map((u: any) => ({
                    value: u.id.toString(),
                    label: (u.first_name || '') + (u.last_name ? ` ${u.last_name}` : '')
                }));
                setEmployees(empOptions);
            } catch (err) {
                console.error(err);
                toast.error('Gagal mengambil data referensi');
            }
        };
        fetchInitialData();
    }, []);

    // When requesting user changes, fetch their rosters
    useEffect(() => {
        if (!formData.requesting_employee_id) {
            setMyRosters([]);
            setFormData(prev => ({ ...prev, original_roster_id: '' }));
            return;
        }

        const fetchRequestingRosters = async () => {
            try {
                const rosRes = await api.get(`/roster-schedules?employee_id=${formData.requesting_employee_id}`);
                const rosters = rosRes.data || [];
                const rosOptions = rosters.map((r: any) => ({
                    value: r.id.toString(),
                    label: new Date(r.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                }));
                setMyRosters(rosOptions);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRequestingRosters();
    }, [formData.requesting_employee_id]);

    // When target user changes, fetch their rosters
    useEffect(() => {
        if (!formData.target_employee_id) {
            setTargetRosters([]);
            setFormData(prev => ({ ...prev, target_roster_id: '' }));
            return;
        }

        const fetchTargetRosters = async () => {
            try {
                const rosRes = await api.get(`/roster-schedules?employee_id=${formData.target_employee_id}`);
                const rosters = rosRes.data || [];
                const rosOptions = rosters.map((r: any) => ({
                    value: r.id.toString(),
                    label: new Date(r.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                }));
                setTargetRosters(rosOptions);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTargetRosters();
    }, [formData.target_employee_id]);

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const payload = {
                requesting_employee_id: parseInt(formData.requesting_employee_id),
                target_employee_id: parseInt(formData.target_employee_id),
                original_roster_id: parseInt(formData.original_roster_id),
                target_roster_id: formData.exchange_type === 'swap' ? parseInt(formData.target_roster_id) : null,
                reason: formData.reason
            };
            
            await api.post('/shift-exchanges', payload);
            toast.success('Pengajuan berhasil dibuat!');
            navigate('/hr/shift-exchanges');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Gagal menyimpan pengajuan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                {/* Header Component */}
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/shift-exchanges')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Ajukan Tukar Shift</h2>
                        <p className="text-sm text-muted-foreground">Buat pengajuan pertukaran jadwal shift dengan karyawan lain</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Formulir Pengajuan</CardTitle>
                                <CardDescription>Pilih jadwal Anda dan jadwal pengganti yang diinginkan</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Jenis Pengajuan <span className="text-destructive">*</span></Label>
                                <SearchableSelect
                                    options={[
                                        {value: 'swap', label: 'Tukar Shift (Swap) - Tukar jadwal Anda dengan orang lain'},
                                        {value: 'cover', label: 'Limpah Shift (Cover) - Berikan jadwal Anda tanpa mengambil jadwal pengganti'}
                                    ]}
                                    value={formData.exchange_type}
                                    onValueChange={(val) => handleSelectChange('exchange_type', val)}
                                    placeholder="Pilih Jenis Pengajuan"
                                />
                            </div>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Karyawan Pengaju (Requesting Employee) <span className="text-destructive">*</span></Label>
                                    <SearchableSelect
                                        options={employees}
                                        value={formData.requesting_employee_id}
                                        onValueChange={(val) => handleSelectChange('requesting_employee_id', val)}
                                        placeholder="Pilih karyawan yang mengajukan..."
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Jadwal Pengaju (Original Roster) <span className="text-destructive">*</span></Label>
                                    <SearchableSelect
                                        options={myRosters}
                                        value={formData.original_roster_id}
                                        onValueChange={(val) => handleSelectChange('original_roster_id', val)}
                                        placeholder="Pilih jadwal yang akan ditukar..."
                                        disabled={!formData.requesting_employee_id}
                                    />
                                    <p className="text-xs text-muted-foreground">Pilih jadwal dari kalender pengaju.</p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Karyawan Tujuan (Target Employee) <span className="text-destructive">*</span></Label>
                                    <SearchableSelect
                                        options={employees.filter(e => e.value !== formData.requesting_employee_id)}
                                        value={formData.target_employee_id}
                                        onValueChange={(val) => handleSelectChange('target_employee_id', val)}
                                        placeholder="Pilih karyawan pengganti..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Jadwal Tujuan (Target Roster) {formData.exchange_type === 'swap' && <span className="text-destructive">*</span>}</Label>
                                    <SearchableSelect
                                        options={targetRosters}
                                        value={formData.target_roster_id}
                                        onValueChange={(val) => handleSelectChange('target_roster_id', val)}
                                        placeholder="Pilih jadwal dari karyawan tujuan..."
                                        disabled={formData.exchange_type === 'cover' || !formData.target_employee_id}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {formData.exchange_type === 'cover' 
                                            ? 'Tidak perlu memilih jadwal untuk jenis Limpah Shift.'
                                            : 'Pilih jadwal yang akan Anda ambil alih.'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Alasan Penukaran <span className="text-destructive">*</span></Label>
                                <Input 
                                    placeholder="Tuliskan alasan mengapa Anda ingin menukar shift..." 
                                    value={formData.reason}
                                    onChange={(e) => handleSelectChange('reason', e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="mt-auto sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate('/hr/shift-exchanges')} disabled={loading}>Batal</Button>
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {loading ? 'Mengajukan...' : 'Ajukan Sekarang'}
                        </Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}
