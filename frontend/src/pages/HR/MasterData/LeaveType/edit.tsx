import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarHeart } from 'lucide-react';
import api from '@/lib/api';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function LeaveTypeEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ code: '', name: '', description: '', default_quota: 12, is_paid: true, requires_approval: true, allow_carry_over: false, max_carry_over_days: 0, min_advance_days: 0, max_consecutive_days: null, is_active: true, sort_order: 0, color: '#000000' });

    useEffect(() => {
        api.get(`/leave-types/${id}`).then(res => setFormData(res.data));
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/leave-types/${id}`, formData);
            navigate('/hr/master-data/leavetype');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Edit Jenis Cuti"
                subtitle="Perbarui skema kuota cuti, ketentuan akumulasi, dan aturan pengajuan izin pegawai"
                icon={CalendarHeart}
                onBack={() => navigate('/hr/master-data/leavetype')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
                onCancel={() => navigate('/hr/master-data/leavetype')}
            >
                <FormSection title="1. Informasi Dasar Cuti" description="Kode unik, nama skema cuti, dan alokasi kuota tahunan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="code" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kode Cuti <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="code" 
                                name="code" 
                                type="text" 
                                value={formData.code} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Cuti <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                type="text" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Deskripsi Ketentuan
                            </Label>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows={2}
                                className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="default_quota" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kuota Default (Hari) <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="default_quota" 
                                name="default_quota" 
                                type="number" 
                                value={formData.default_quota} 
                                onChange={handleChange} 
                                required 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="min_advance_days" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Min. Pengajuan Awal (Hari Sebelumnya)
                            </Label>
                            <Input 
                                id="min_advance_days" 
                                name="min_advance_days" 
                                type="number" 
                                value={formData.min_advance_days} 
                                onChange={handleChange} 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="max_carry_over_days" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Maks. Akumulasi Cuti (Hari)
                            </Label>
                            <Input 
                                id="max_carry_over_days" 
                                name="max_carry_over_days" 
                                type="number" 
                                value={formData.max_carry_over_days} 
                                onChange={handleChange} 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="2. Kebijakan & Aturan Approval" description="Parameter pemotongan gaji, alur persetujuan, dan akumulasi">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="is_paid" 
                                checked={formData.is_paid} 
                                onCheckedChange={(val) => handleCheckedChange('is_paid', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Dibayar (Paid Leave)</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="requires_approval" 
                                checked={formData.requires_approval} 
                                onCheckedChange={(val) => handleCheckedChange('requires_approval', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Wajib Approval</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="allow_carry_over" 
                                checked={formData.allow_carry_over} 
                                onCheckedChange={(val) => handleCheckedChange('allow_carry_over', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Bisa Akumulasi</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="is_active" 
                                checked={formData.is_active} 
                                onCheckedChange={(val) => handleCheckedChange('is_active', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Status Aktif</span>
                        </label>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}