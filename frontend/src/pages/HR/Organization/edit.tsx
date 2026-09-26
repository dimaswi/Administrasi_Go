import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Building2, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

export default function OrganizationEdit() {
    const { id } = useParams();

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
            alert('Gagal menyimpan Unit Organisasi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                {/* Header Component */}
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/organizations')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Edit Unit Organisasi</h2>
                        <p className="text-sm text-muted-foreground">Buat departemen, bagian, atau unit baru</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Informasi Unit
                            </CardTitle>
                            <CardDescription>Buat departemen, bagian, atau unit baru</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Unit <span className="text-destructive">*</span></Label>
                                    <Input id="code" name="code" value={formData.code} onChange={handleChange} required placeholder="Contoh: DIR, HRD, IT" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Unit <span className="text-destructive">*</span></Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Contoh: Divisi Keuangan" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="resize-none" rows={3} placeholder="Penjelasan singkat mengenai unit ini..." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6 mt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="level">Tingkat Hierarki (Level)</Label>
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
                                <div className="space-y-2">
                                    <Label htmlFor="parent_id">Induk Unit (Parent)</Label>
                                    <SearchableSelect
                                        value={formData.parent_id}
                                        onValueChange={(val) => handleSelectChange('parent_id', val)}
                                        placeholder="Pilih Unit Induk (Opsional)"
                                        options={[{ value: '', label: '-- Tidak Ada Induk (Root) --' }, ...orgUnits]}
                                    />
                                    <p className="text-[11px] text-muted-foreground mt-1">Isi dengan unit atasan (opsional).</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="head_id">Kepala Unit (Head)</Label>
                                    <SearchableSelect
                                        value={formData.head_id}
                                        onValueChange={(val) => handleSelectChange('head_id', val)}
                                        placeholder="Pilih Kepala Unit"
                                        options={[{ value: '', label: '-- Kosong --' }, ...employees]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is_active">Status Aktif</Label>
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
                        </CardContent>
                    </Card>

                    {/* Form Actions (Sticky Footer) */}
                    <div className="mt-auto sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate('/hr/organizations')} disabled={loading}>Batal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </HrLayout >
    );
}
