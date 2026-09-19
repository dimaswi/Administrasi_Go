import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/api';

export default function PermissionCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        module: '',
        action: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/permissions', formData);
            navigate('/hr/access/permissions');
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
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/access/permissions')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Tambah Permission</h2>
                        <p className="text-sm text-muted-foreground">Isi formulir di bawah ini untuk menambahkan data baru.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Permission</CardTitle>
                            <CardDescription>Isi form permission yang akan ditambahkan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nama (Unique Code)</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Misal: hr.employee.create"
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Modul</Label>
                                        <Input
                                            value={formData.module}
                                            onChange={e => setFormData({ ...formData, module: e.target.value })}
                                            placeholder="Misal: Karyawan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Aksi</Label>
                                        <Input
                                            value={formData.action}
                                            onChange={e => setFormData({ ...formData, action: e.target.value })}
                                            placeholder="Misal: Tambah"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Deskripsi</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-auto sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => navigate('/hr/access/permissions')}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </HrLayout>
    );
}
