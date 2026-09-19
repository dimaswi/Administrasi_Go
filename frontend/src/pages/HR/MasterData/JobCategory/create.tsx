import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, Database } from 'lucide-react';
import api from '@/lib/api';

export default function JobCategoryCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ code: '', name: '', description: '', is_medical: false, requires_str: false, requires_sip: false, is_active: true });

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
            await api.post('/job-categories', formData);
            navigate('/hr/master-data/jobcategory');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <div className="w-full flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Tambah Kategori Pekerjaan</h2>
                        <p className="text-sm text-muted-foreground">Isi formulir di bawah ini untuk menambahkan data baru.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                
                                <div>
                                    <CardTitle>Data Master</CardTitle>
                                    <CardDescription>Informasi detail data</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode *</Label>
                                    <Input id="code" name="code" type="text" value={(formData as any).code} onChange={handleChange} required={true} placeholder="K001" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Kategori *</Label>
                                    <Input id="name" name="name" type="text" value={(formData as any).name} onChange={handleChange} required={true} placeholder="Perawat" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea id="description" name="description" value={(formData as any).description} onChange={handleChange} />
                                </div>
                            </div>
                            
                            {/* Checkboxes Group */}
                            
                            <div className="flex flex-col gap-3 pt-4 border-t mt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_medical" checked={(formData as any).is_medical} onCheckedChange={(val) => handleCheckedChange('is_medical', !!val)} />
                                    <Label htmlFor="is_medical" className="font-normal cursor-pointer">Tenaga Medis</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="requires_str" checked={(formData as any).requires_str} onCheckedChange={(val) => handleCheckedChange('requires_str', !!val)} />
                                    <Label htmlFor="requires_str" className="font-normal cursor-pointer">Wajib STR</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="requires_sip" checked={(formData as any).requires_sip} onCheckedChange={(val) => handleCheckedChange('requires_sip', !!val)} />
                                    <Label htmlFor="requires_sip" className="font-normal cursor-pointer">Wajib SIP</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_active" checked={(formData as any).is_active} onCheckedChange={(val) => handleCheckedChange('is_active', !!val)} />
                                    <Label htmlFor="is_active" className="font-normal cursor-pointer">Aktif</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-auto sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>Batal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}