import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DoorOpen, Loader2 } from 'lucide-react';
import { FormCard } from '@/components/ui/form-card';
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
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-8 text-center text-xs text-neutral-500 font-mono">
                    <Loader2 className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                    Memuat data ruangan...
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <FormCard
                title={`Edit Ruangan: ${formData.name || 'Ruangan'}`}
                subtitle={`Kode: ${formData.code || '-'} • Perbarui kapasitas, gedung, dan fasilitas`}
                icon={DoorOpen}
                onBack={() => navigate('/admin/rooms')}
                onSubmit={handleSubmit}
                loading={submitting}
                submitText="Simpan Perubahan"
                onCancel={() => navigate('/admin/rooms')}
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="code" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kode Ruangan <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="code" 
                                name="code" 
                                required 
                                value={formData.code} 
                                onChange={handleChange} 
                                placeholder="Contoh: R-01"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Ruangan <span className="text-rose-500">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                required 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="Contoh: Ruang Rapat Utama"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="building" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Gedung / Lokasi
                            </Label>
                            <Input 
                                id="building" 
                                name="building" 
                                value={formData.building} 
                                onChange={handleChange} 
                                placeholder="Contoh: Gedung A"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="floor" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Lantai
                            </Label>
                            <Input 
                                id="floor" 
                                name="floor" 
                                value={formData.floor} 
                                onChange={handleChange} 
                                placeholder="Contoh: Lantai 2"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="capacity" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kapasitas (Orang)
                            </Label>
                            <Input 
                                id="capacity" 
                                name="capacity" 
                                type="number"
                                value={formData.capacity} 
                                onChange={handleChange} 
                                placeholder="Contoh: 20"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="facilities" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Fasilitas
                        </Label>
                        <Textarea 
                            id="facilities" 
                            name="facilities" 
                            value={formData.facilities} 
                            onChange={handleChange} 
                            placeholder="Contoh: Proyektor, AC, Whiteboard, Sound System, TV Display"
                            rows={3}
                            className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                            Keterangan Tambahan
                        </Label>
                        <Textarea 
                            id="description" 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows={3}
                            placeholder="Catatan penggunaan ruangan..."
                            className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/40">
                        <div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide block">
                                Status Ruangan
                            </span>
                            <p className="text-xs text-neutral-500">
                                {formData.is_active ? 'Ruangan aktif dan dapat dipilih untuk peminjaman rapat' : 'Ruangan dinonaktifkan / dalam perawatan'}
                            </p>
                        </div>
                        <Switch 
                            id="is_active" 
                            checked={formData.is_active}
                            onCheckedChange={handleSwitchChange}
                        />
                    </div>
                </div>
            </FormCard>
        </AdminLayout>
    );
}
