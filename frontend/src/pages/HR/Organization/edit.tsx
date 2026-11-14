import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FormCard } from '@/components/ui/form-card';
import api from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function OrganizationEdit() {
    const { id } = useParams();
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    React.useEffect(() => {
        if (id) {
            api.get(`/org-units/${id}`).then(res => {
                const d = res.data;
                setFormData({
                    code: d.code || '',
                    name: d.name || '',
                    description: d.description || '',
                    level: d.level?.toString() || '1',
                    parent_id: d.parent_id?.toString() || '',
                    head_id: d.head_id?.toString() || '',
                    is_active: d.is_active ? 'true' : 'false'
                });
            });
        }
    }, [id]);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [employees, setEmployees] = useState<{ value: string, label: string }[]>([]);
    const [orgUnits, setOrgUnits] = useState<{ value: string, label: string }[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [resEmp, resOrg] = await Promise.all([
                    api.get('/employees?perPage=1000'),
                    api.get('/org-units?perPage=100')
                ]);
                if (resEmp.data && resEmp.data.data) {
                    setEmployees(resEmp.data.data.map((e: any) => ({
                        value: e.id.toString(),
                        label: `${e.first_name} ${e.last_name || ''} - ${e.position || 'No Position'}`
                    })));
                }
                if (resOrg.data && resOrg.data.data) {
                    setOrgUnits(resOrg.data.data.map((o: any) => ({
                        value: o.id.toString(),
                        label: `${o.code} - ${o.name}`
                    })));
                }
            } catch (e) {
                console.error('Failed to fetch data', e);
            }
        };
        fetchData();
    }, []);

    // For a real app, you would fetch the list of existing units and users to populate parent_id and head_id
    // But for now we just use simple input or static options.

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        level: '1',
        parent_id: '',
        head_id: '',
        is_active: 'true',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                level: parseInt(formData.level),
                parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
                head_id: formData.head_id ? parseInt(formData.head_id) : null,
                is_active: formData.is_active === 'true',
            };

            await api.put(`/org-units/${id}`, payload);
            navigate('/hr/organizations');
        } catch (error) {
            console.error(error);
            setAlertMessage('Gagal menyimpan Unit Organisasi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title={`Edit Unit Organisasi: ${formData.name || 'Unit'}`}
                subtitle={`Kode: ${formData.code || '-'} • Perbarui data departemen atau divisi`}
                icon={Building2}
                onBack={() => navigate('/hr/organizations')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
                onCancel={() => navigate('/hr/organizations')}
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="code" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kode Unit <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="code" 
                                name="code" 
                                value={formData.code} 
                                onChange={handleChange} 
                                required 
                                placeholder="Contoh: DIR, HRD, IT" 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Unit <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                placeholder="Contoh: Divisi Keuangan" 
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Deskripsi
                        </Label>
                        <Textarea 
                            id="description" 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows={3} 
                            placeholder="Penjelasan singkat mengenai unit ini..." 
                            className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="level" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Tingkat Hierarki (Level)
                            </Label>
                            <SearchableSelect
                                value={formData.level}
                                onValueChange={(val) => handleSelectChange('level', val)}
                                placeholder="Pilih Level"
                                options={[
                                    { value: "1", label: "Level 1 (Direktorat / Tertinggi)" },
                                    { value: "2", label: "Level 2 (Divisi / Departemen)" },
                                    { value: "3", label: "Level 3 (Bagian / Seksi)" },
                                    { value: "4", label: "Level 4 (Unit Terkecil)" }
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="parent_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Induk Unit (Parent)
                            </Label>
                            <SearchableSelect
                                value={formData.parent_id}
                                onValueChange={(val) => handleSelectChange('parent_id', val)}
                                placeholder="Pilih Unit Induk (Opsional)"
                                options={[{ value: '', label: '-- Tidak Ada Induk (Root) --' }, ...orgUnits]}
                            />
                            <p className="text-[11px] text-neutral-500 font-mono mt-1">Pilih unit atasan jika merupakan sub-unit.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="head_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kepala Unit (Head)
                            </Label>
                            <SearchableSelect
                                value={formData.head_id}
                                onValueChange={(val) => handleSelectChange('head_id', val)}
                                placeholder="Pilih Kepala Unit"
                                options={[{ value: '', label: '-- Kosong --' }, ...employees]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="is_active" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Status Aktif
                            </Label>
                            <SearchableSelect
                                value={formData.is_active}
                                onValueChange={(val) => handleSelectChange('is_active', val)}
                                placeholder="Pilih Status"
                                options={[
                                    { value: "true", label: "Aktif" },
                                    { value: "false", label: "Nonaktif" }
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </FormCard>

            <ConfirmDialog
                open={alertMessage !== null}
                onOpenChange={(open) => { if (!open) setAlertMessage(null); }}
                title="Pemberitahuan"
                description={alertMessage || ''}
                hideCancel
            />
        </HrLayout>
    );
}
