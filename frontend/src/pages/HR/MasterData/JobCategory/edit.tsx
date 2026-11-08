import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase } from 'lucide-react';
import api from '@/lib/api';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function JobCategoryEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ code: '', name: '', description: '', is_medical: false, requires_str: false, requires_sip: false, is_active: true });

    useEffect(() => {
        api.get(`/job-categories/${id}`).then(res => setFormData(res.data));
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
            await api.put(`/job-categories/${id}`, formData);
            navigate('/hr/master-data/jobcategory');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Edit Kategori Pekerjaan"
                subtitle="Perbarui klasifikasi profesi, persyaratan STR/SIP, dan parameter medis"
                icon={Briefcase}
                onBack={() => navigate('/hr/master-data/jobcategory')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
                onCancel={() => navigate('/hr/master-data/jobcategory')}
            >
                <FormSection title="1. Informasi Kategori" description="Kode unik dan deskripsi klasifikasi pekerjaan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="code" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kode Kategori <span className="text-rose-500">*</span>
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
                                Nama Kategori <span className="text-rose-500">*</span>
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
                                Deskripsi
                            </Label>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows={3}
                                className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="2. Persyaratan & Atribut" description="Ketentuan izin legalitas profesi dan status aktif">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="is_medical" 
                                checked={formData.is_medical} 
                                onCheckedChange={(val) => handleCheckedChange('is_medical', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Tenaga Medis</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="requires_str" 
                                checked={formData.requires_str} 
                                onCheckedChange={(val) => handleCheckedChange('requires_str', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Wajib STR</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="requires_sip" 
                                checked={formData.requires_sip} 
                                onCheckedChange={(val) => handleCheckedChange('requires_sip', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Wajib SIP</span>
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