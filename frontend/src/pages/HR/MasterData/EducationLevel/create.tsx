import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function EducationLevelCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ level: 1, name: '', is_active: true });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            await api.post('/education-levels', formData);
            navigate('/hr/master-data/educationlevel');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Tingkat Pendidikan"
                subtitle="Definisikan jenjang pendidikan formal (contoh: SMA, D3, S1, S2)"
                icon={GraduationCap}
                onBack={() => navigate('/hr/master-data/educationlevel')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Jenjang"
                onCancel={() => navigate('/hr/master-data/educationlevel')}
            >
                <FormSection title="1. Informasi Jenjang" description="Urutan level hierarki dan nama tingkat pendidikan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="level" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Urutan Level (Angka) <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="level" 
                                name="level" 
                                type="number" 
                                value={formData.level} 
                                onChange={handleChange} 
                                required 
                                placeholder="1" 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Tingkat Pendidikan <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                type="text" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                placeholder="Contoh: SMA / SMK, D3, S1, Profesi" 
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