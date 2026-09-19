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
export default function EducationLevelEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    React.useEffect(() => {
        api.get(`/education-levels/${id}`).then(res => setFormData(res.data));
    }, [id]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ level: 1, name: '', is_active: true });

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
            <div className="w-full">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Edit Tingkat Pendidikan</h2>
                        <p className="text-sm text-muted-foreground">Isi formulir di bawah ini untuk mengubah data ini.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                                    <Label htmlFor="level">Level *</Label>
                                    <Input id="level" name="level" type="number" value={(formData as any).level} onChange={handleChange} required={true} placeholder="1" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Tingkat *</Label>
                                    <Input id="name" name="name" type="text" value={(formData as any).name} onChange={handleChange} required={true} placeholder="S1" />
                                </div>
                            </div>
                            
                            {/* Checkboxes Group */}
                            
                            <div className="flex flex-col gap-3 pt-4 border-t mt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is_active" checked={(formData as any).is_active} onCheckedChange={(val) => handleCheckedChange('is_active', !!val)} />
                                    <Label htmlFor="is_active" className="font-normal cursor-pointer">Aktif</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate(-1)} disabled={loading}>Batal</Button>
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={loading}>
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