import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/api';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function UserEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [orgUnits, setOrgUnits] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        nip: '',
        password: '',
        role_id: 0,
        organization_unit_id: 0,
        position: '',
        phone: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roleRes, orgRes, userRes] = await Promise.all([
                    api.get('/roles'),
                    api.get('/org-units'),
                    api.get(`/users/${id}`)
                ]);
                setRoles(roleRes.data.data || []);
                setOrgUnits(orgRes.data.data || []);

                const user = userRes.data.data;
                setFormData({
                    name: user.name || '',
                    nip: user.nip || '',
                    password: '', // Don't show existing password
                    role_id: user.role_id || 0,
                    organization_unit_id: user.organization_unit_id || 0,
                    position: user.position || '',
                    phone: user.phone || ''
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/users/${id}`, formData);
            navigate('/hr/access/users');
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
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/hr/access/users')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Edit User</h2>
                        <p className="text-sm text-muted-foreground">Perbarui informasi data ini.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi User</CardTitle>
                            <CardDescription>Isi form dibawah ini untuk memperbarui data user</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>NIP / NIK</Label>
                                    <Input
                                        required
                                        value={formData.nip}
                                        onChange={e => setFormData({ ...formData, nip: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password (Kosongkan jika tidak ingin mengubah)</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <SearchableSelect
                                        options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                                        value={formData.role_id ? String(formData.role_id) : ""}
                                        onValueChange={(val) => setFormData({ ...formData, role_id: Number(val) })}
                                        placeholder="-- Pilih Role --"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit Organisasi</Label>
                                    <SearchableSelect
                                        options={orgUnits.map(o => ({ value: String(o.id), label: o.name }))}
                                        value={formData.organization_unit_id ? String(formData.organization_unit_id) : ""}
                                        onValueChange={(val) => setFormData({ ...formData, organization_unit_id: Number(val) })}
                                        placeholder="-- Pilih Unit --"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Jabatan</Label>
                                    <Input
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>No HP / Telepon</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-auto sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => navigate('/hr/access/users')}>
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
