import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { FormCard } from '@/components/ui/form-card';
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

    const [, setCurrentUserId] = useState<number | null>(null);

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
                const rosters = rosRes.data?.data || rosRes.data || [];
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
        if (!formData.target_employee_id || formData.exchange_type === 'cover') {
            setTargetRosters([]);
            setFormData(prev => ({ ...prev, target_roster_id: '' }));
            return;
        }

        const fetchTargetRosters = async () => {
            try {
                const rosRes = await api.get(`/roster-schedules?employee_id=${formData.target_employee_id}`);
                const rosters = rosRes.data?.data || rosRes.data || [];
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
    }, [formData.target_employee_id, formData.exchange_type]);

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
            <FormCard
                title="Ajukan Tukar Shift"
                subtitle="Buat pengajuan pertukaran jadwal shift dengan karyawan lain"
                icon={ArrowLeftRight}
                onBack={() => navigate('/hr/shift-exchanges')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Ajukan Sekarang"
                onCancel={() => navigate('/hr/shift-exchanges')}
            >
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Jenis Pengajuan <span className="text-rose-500">*</span>
                        </Label>
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
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Karyawan Pengaju (Requesting Employee) <span className="text-rose-500">*</span>
                            </Label>
                            <SearchableSelect
                                options={employees}
                                value={formData.requesting_employee_id}
                                onValueChange={(val) => handleSelectChange('requesting_employee_id', val)}
                                placeholder="Pilih karyawan yang mengajukan..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Jadwal Pengaju (Original Roster) <span className="text-rose-500">*</span>
                            </Label>
                            <SearchableSelect
                                options={myRosters}
                                value={formData.original_roster_id}
                                onValueChange={(val) => handleSelectChange('original_roster_id', val)}
                                placeholder="Pilih jadwal yang akan ditukar..."
                                disabled={!formData.requesting_employee_id}
                            />
                            <p className="text-[11px] text-neutral-500 font-mono">Pilih jadwal dari kalender pengaju.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Karyawan Tujuan (Target Employee) <span className="text-rose-500">*</span>
                            </Label>
                            <SearchableSelect
                                options={employees.filter(e => e.value !== formData.requesting_employee_id)}
                                value={formData.target_employee_id}
                                onValueChange={(val) => handleSelectChange('target_employee_id', val)}
                                placeholder="Pilih karyawan pengganti..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Jadwal Tujuan (Target Roster) {formData.exchange_type === 'swap' && <span className="text-rose-500">*</span>}
                            </Label>
                            <SearchableSelect
                                options={targetRosters}
                                value={formData.target_roster_id}
                                onValueChange={(val) => handleSelectChange('target_roster_id', val)}
                                placeholder="Pilih jadwal dari karyawan tujuan..."
                                disabled={formData.exchange_type === 'cover' || !formData.target_employee_id}
                            />
                            <p className="text-[11px] text-neutral-500 font-mono">
                                {formData.exchange_type === 'cover' 
                                    ? 'Tidak perlu memilih jadwal untuk jenis Limpah Shift.'
                                    : 'Pilih jadwal yang akan Anda ambil alih.'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Alasan Penukaran <span className="text-rose-500">*</span>
                        </Label>
                        <Input 
                            placeholder="Tuliskan alasan mengapa Anda ingin menukar shift..." 
                            value={formData.reason}
                            onChange={(e) => handleSelectChange('reason', e.target.value)}
                            required
                            className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                        />
                    </div>
                </div>
            </FormCard>
        </HrLayout>
    );
}
