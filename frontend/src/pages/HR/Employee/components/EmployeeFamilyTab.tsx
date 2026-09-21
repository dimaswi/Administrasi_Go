import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface EmployeeFamilyTabProps {
    employeeId: string | number;
}

export default function EmployeeFamilyTab({ employeeId }: EmployeeFamilyTabProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        relation: 'Istri/Suami',
        gender: 'male',
        place_of_birth: '',
        date_of_birth: '',
        occupation: '',
        phone: '',
    });

    useEffect(() => {
        if (employeeId) fetchFamilies();
    }, [employeeId]);

    const fetchFamilies = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/employees/${employeeId}/families`);
            setData(res.data || []);
        } catch (error) {
            toast.error('Gagal mengambil data keluarga');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditItem(item);
            setFormData({
                name: item.name || '',
                relation: item.relation || 'Istri/Suami',
                gender: item.gender || 'male',
                place_of_birth: item.place_of_birth || '',
                date_of_birth: item.date_of_birth ? item.date_of_birth.substring(0, 10) : '',
                occupation: item.occupation || '',
                phone: item.phone || '',
            });
        } else {
            setEditItem(null);
            setFormData({
                name: '',
                relation: 'Istri/Suami',
                gender: 'male',
                place_of_birth: '',
                date_of_birth: '',
                occupation: '',
                phone: '',
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editItem) {
                await api.put(`/employees/${employeeId}/families/${editItem.id}`, formData);
                toast.success('Data keluarga berhasil diupdate');
            } else {
                await api.post(`/employees/${employeeId}/families`, formData);
                toast.success('Data keluarga berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchFamilies();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
        try {
            await api.delete(`/employees/${employeeId}/families/${id}`);
            toast.success('Data keluarga berhasil dihapus');
            fetchFamilies();
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Susunan Keluarga</h3>
                <Button onClick={() => handleOpenModal()} size="sm"><Plus className="w-4 h-4 mr-2" /> Tambah Keluarga</Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Relasi</TableHead>
                            <TableHead>Jenis Kelamin</TableHead>
                            <TableHead>Tgl Lahir</TableHead>
                            <TableHead>Pekerjaan</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Memuat data...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Belum ada data keluarga</TableCell></TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.relation}</TableCell>
                                    <TableCell>{item.gender === 'male' ? 'Laki-laki' : item.gender === 'female' ? 'Perempuan' : '-'}</TableCell>
                                    <TableCell>{item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString('id-ID') : '-'}</TableCell>
                                    <TableCell>{item.occupation || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                                                <Pencil className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{editItem ? 'Edit Data Keluarga' : 'Tambah Data Keluarga'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nama *</Label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Relasi *</Label>
                                <SearchableSelect 
                                    options={[
                                        {value: 'Suami/Istri', label: 'Suami/Istri'},
                                        {value: 'Anak', label: 'Anak'},
                                        {value: 'Ayah', label: 'Ayah'},
                                        {value: 'Ibu', label: 'Ibu'},
                                        {value: 'Saudara', label: 'Saudara'},
                                    ]}
                                    value={formData.relation}
                                    onValueChange={val => setFormData({...formData, relation: val})}
                                    placeholder="Pilih Relasi"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis Kelamin</Label>
                                <SearchableSelect 
                                    options={[
                                        {value: 'male', label: 'Laki-laki'},
                                        {value: 'female', label: 'Perempuan'},
                                    ]}
                                    value={formData.gender}
                                    onValueChange={val => setFormData({...formData, gender: val})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tempat Lahir</Label>
                                <Input value={formData.place_of_birth} onChange={e => setFormData({...formData, place_of_birth: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Lahir</Label>
                                <Input type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pekerjaan</Label>
                                <Input value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>No. Telepon</Label>
                                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
