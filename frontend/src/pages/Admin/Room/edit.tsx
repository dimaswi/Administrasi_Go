import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Save } from 'lucide-react';
import api from '@/lib/api';

export default function RoomEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        building: '',
        floor: '',
        capacity: '',
        facilities: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        fetchRoom();
    }, [id]);

    const fetchRoom = async () => {
        try {
            const res = await api.get(`/rooms/${id}`);
            const data = res.data;
            setFormData({
                code: data.code || '',
                name: data.name || '',
                building: data.building || '',
                floor: data.floor || '',
                capacity: data.capacity ? data.capacity.toString() : '',
                facilities: data.facilities || '',
                description: data.description || '',
                is_active: data.is_active
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_active: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
            };
            await api.put(`/rooms/${id}`, payload);
            navigate('/admin/rooms');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Memuat data...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex items-center gap-4 mb-6">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigate('/admin/rooms')}
                    className="shrink-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Ruangan</h1>
                    <p className="text-muted-foreground">Perbarui informasi ruangan rapat.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Ruangan <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="code" 
                                    name="code" 
                                    required 
                                    value={formData.code} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Ruangan <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="name" 
                                    name="name" 
                                    required 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="building">Gedung/Lokasi</Label>
                                <Input 
                                    id="building" 
                                    name="building" 
                                    value={formData.building} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="floor">Lantai</Label>
                                <Input 
                                    id="floor" 
                                    name="floor" 
                                    value={formData.floor} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Kapasitas (Orang)</Label>
                                <Input 
                                    id="capacity" 
                                    name="capacity" 
                                    type="number"
                                    value={formData.capacity} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="facilities">Fasilitas</Label>
                            <Textarea 
                                id="facilities" 
                                name="facilities" 
                                value={formData.facilities} 
                                onChange={handleChange} 
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Keterangan Tambahan</Label>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="is_active" 
                                checked={formData.is_active}
                                onCheckedChange={handleSwitchChange}
                            />
                            <Label htmlFor="is_active">Aktif (Dapat digunakan untuk rapat)</Label>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => navigate('/admin/rooms')}
                            disabled={submitting}
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={submitting}
                            className="bg-primary text-primary-foreground"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
