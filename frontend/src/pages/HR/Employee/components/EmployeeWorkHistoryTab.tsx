import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface EmployeeWorkHistoryTabProps {
    employeeId: string | number;
}

export default function EmployeeWorkHistoryTab({ employeeId }: EmployeeWorkHistoryTabProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    const [formData, setFormData] = useState({
        company_name: '',
        position: '',
        start_date: '',
        end_date: '',
        job_description: '',
        leaving_reason: '',
        reference_contact: '',
        reference_phone: ''
    });

    useEffect(() => {
        if (employeeId) {
            fetchWorkHistories();
        }
    }, [employeeId]);

    const fetchWorkHistories = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/employees/${employeeId}/work-histories`);
            setData(res.data || []);
        } catch (error) {
            toast.error('Gagal mengambil data riwayat pekerjaan');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditItem(item);
            setFormData({
                company_name: item.company_name || '',
                position: item.position || '',
                start_date: item.start_date ? item.start_date.substring(0, 10) : '',
                end_date: item.end_date ? item.end_date.substring(0, 10) : '',
                job_description: item.job_description || '',
                leaving_reason: item.leaving_reason || '',
                reference_contact: item.reference_contact || '',
                reference_phone: item.reference_phone || ''
            });
        } else {
            setEditItem(null);
            setFormData({
                company_name: '',
                position: '',
                start_date: '',
                end_date: '',
                job_description: '',
                leaving_reason: '',
                reference_contact: '',
                reference_phone: ''
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editItem) {
                await api.put(`/employees/${employeeId}/work-histories/${editItem.id}`, formData);
                toast.success('Riwayat pekerjaan berhasil diupdate');
            } else {
                await api.post(`/employees/${employeeId}/work-histories`, formData);
                toast.success('Riwayat pekerjaan berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchWorkHistories();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
        try {
            await api.delete(`/employees/${employeeId}/work-histories/${id}`);
            toast.success('Riwayat pekerjaan berhasil dihapus');
            fetchWorkHistories();
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Pengalaman Kerja Sebelumnya</h3>
                <Button onClick={() => handleOpenModal()} size="sm"><Plus className="w-4 h-4 mr-2" /> Tambah Pengalaman</Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Perusahaan</TableHead>
                            <TableHead>Posisi / Jabatan</TableHead>
                            <TableHead>Masa Kerja</TableHead>
                            <TableHead>Alasan Resign</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Memuat data...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada riwayat pekerjaan</TableCell></TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.company_name}</TableCell>
                                    <TableCell>{item.position}</TableCell>
                                    <TableCell>
                                        <span className="whitespace-nowrap">
                                            {item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID', {month:'short', year:'numeric'}) : '-'} 
                                            {" - "} 
                                            {item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID', {month:'short', year:'numeric'}) : 'Sekarang'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{item.leaving_reason || '-'}</TableCell>
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
                        <DialogTitle className="text-xl">{editItem ? 'Edit Riwayat Pekerjaan' : 'Tambah Riwayat Pekerjaan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nama Perusahaan / Instansi *</Label>
                            <Input value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Posisi / Jabatan *</Label>
                            <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal Mulai *</Label>
                                <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Berakhir</Label>
                                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                                <p className="text-[10px] text-muted-foreground">Kosongkan jika masih bekerja</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi Pekerjaan</Label>
                            <Textarea value={formData.job_description} onChange={e => setFormData({...formData, job_description: e.target.value})} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>Alasan Resign / Keluar</Label>
                            <Input value={formData.leaving_reason} onChange={e => setFormData({...formData, leaving_reason: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kontak Referensi (Nama)</Label>
                                <Input value={formData.reference_contact} onChange={e => setFormData({...formData, reference_contact: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telepon Referensi</Label>
                                <Input value={formData.reference_phone} onChange={e => setFormData({...formData, reference_phone: e.target.value})} />
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
