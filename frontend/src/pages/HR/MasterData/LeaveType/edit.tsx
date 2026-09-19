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

import { useParams } from 'react-router-dom';
export default function LeaveTypeEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    React.useEffect(() => {
        api.get(`/leave-types/${id}`).then(res => setFormData(res.data));
    }, [id]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ code: '', name: '', description: '', default_quota: 12, is_paid: true, requires_approval: true, allow_carry_over: false, max_carry_over_days: 0, min_advance_days: 0, max_consecutive_days: null, is_active: true, sort_order: 0, color: '#000000' });

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
            await api.post('/leave-types', formData);
            navigate('/hr/master-data/leavetype');
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
                        <h2 className="text-xl font-semibold">Edit Jenis Cuti</h2>
                        <p className="text-sm text-muted-foreground">Isi formulir di bawah ini untuk mengubah data ini.</p>
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
                                    <Input id="code" name="code" type="text" value={(formData as any).code} onChange={handleChange} required={true} placeholder="C01" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Cuti *</Label>
                                    <Input id="name" name="name" type="text" value={(formData as any).name} onChange={handleChange} required={true} placeholder="Cuti Tahunan" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea id="description" name="description" value={(formData as any).description} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default_quota">Kuota Default *</Label>
                                    <Input id="default_quota" name="default_quota" type="number" value={(formData as any).default_quota} onChange={handleChange} required={true} placeholder="12" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_carry_over_days">Maks. Akumulasi (Hari)</Label>
                                    <Input id="max_carry_over_days" name="max_carry_over_days" type="number" value={(formData as any).max_carry_over_days} onChange={handleChange} required={false} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="min_advance_days">Min. Pengajuan (Hari)</Label>
                                    <Input id="min_advance_days" name="min_advance_days" type="number" value={(formData as any).min_advance_days} onChange={handleChange} required={false} placeholder="0" />
                                </div>
                            </div>
                            
                            {/* Checkboxes Group */}
                            
                            <div className="flex flex-col gap-3 pt-4 border-t mt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_paid" checked={(formData as any).is_paid} onCheckedChange={(val) => handleCheckedChange('is_paid', !!val)} />
                                    <Label htmlFor="is_paid" className="font-normal cursor-pointer">Dibayar</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="requires_approval" checked={(formData as any).requires_approval} onCheckedChange={(val) => handleCheckedChange('requires_approval', !!val)} />
                                    <Label htmlFor="requires_approval" className="font-normal cursor-pointer">Wajib Approval</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="allow_carry_over" checked={(formData as any).allow_carry_over} onCheckedChange={(val) => handleCheckedChange('allow_carry_over', !!val)} />
                                    <Label htmlFor="allow_carry_over" className="font-normal cursor-pointer">Bisa Diakumulasi</Label>
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