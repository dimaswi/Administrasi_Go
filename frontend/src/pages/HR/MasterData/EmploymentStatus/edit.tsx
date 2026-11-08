import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck } from 'lucide-react';
import api from '@/lib/api';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function EmploymentStatusEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', is_active: true });

    useEffect(() => {
        api.get(`/employment-statuses/${id}`).then(res => setFormData(res.data));
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckedChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/employment-statuses/${id}`, formData);
            navigate('/hr/master-data/employmentstatus');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Edit Status Kepegawaian"
                subtitle="Perbarui data nama status hubungan kerja dan status keaktifan"
                icon={UserCheck}
                onBack={() => navigate('/hr/master-data/employmentstatus')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
                onCancel={() => navigate('/hr/master-data/employmentstatus')}
            >
                <FormSection title="1. Informasi Status" description="Nama status hubungan kerja dan status keaktifan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Status Kepegawaian <span className="text-rose-500">*</span>
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
                    </div>

                    <div className="pt-4">
                        <label className="inline-flex items-center gap-2.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
                            <Checkbox 
                                id="is_active" 
                                checked={formData.is_active} 
                                onCheckedChange={(val) => handleCheckedChange('is_active', !!val)} 
                                className="rounded-none"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Status Aktif Digunakan</span>
                        </label>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}