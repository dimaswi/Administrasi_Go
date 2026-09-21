import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface EmployeeEducationTabProps {
    employeeId: string | number;
}

export default function EmployeeEducationTab({ employeeId }: EmployeeEducationTabProps) {
    const [data, setData] = useState<any[]>([]);
    const [levels, setLevels] = useState<{value:string, label:string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    const [formData, setFormData] = useState({
        education_level_id: '',
        institution: '',
        major: '',
        start_year: '',
        end_year: '',
        gpa: '',
        is_highest: false
    });

    useEffect(() => {
        if (employeeId) {
            fetchEducations();
            fetchEducationLevels();
        }
    }, [employeeId]);

    const fetchEducationLevels = async () => {
        try {
            const res = await api.get('/education-levels');
            setLevels(res.data?.map((l:any) => ({ value: l.id.toString(), label: l.name })) || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEducations = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/employees/${employeeId}/educations`);
            setData(res.data || []);
        } catch (error) {
            toast.error('Gagal mengambil data pendidikan');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditItem(item);
            setFormData({
                education_level_id: item.education_level_id?.toString() || '',
                institution: item.institution || '',
                major: item.major || '',
                start_year: item.start_year?.toString() || '',
                end_year: item.end_year?.toString() || '',
                gpa: item.gpa || '',
                is_highest: item.is_highest || false
            });
        } else {
            setEditItem(null);
            setFormData({
                education_level_id: '',
                institution: '',
                major: '',
                start_year: '',
                end_year: '',
                gpa: '',
                is_highest: false
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                education_level_id: parseInt(formData.education_level_id),
                start_year: formData.start_year ? parseInt(formData.start_year) : null,
                end_year: formData.end_year ? parseInt(formData.end_year) : null,
            };

            if (editItem) {
                await api.put(`/employees/${employeeId}/educations/${editItem.id}`, payload);
                toast.success('Data pendidikan berhasil diupdate');
            } else {
                await api.post(`/employees/${employeeId}/educations`, payload);
                toast.success('Data pendidikan berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchEducations();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
        try {
            await api.delete(`/employees/${employeeId}/educations/${id}`);
            toast.success('Data pendidikan berhasil dihapus');
            fetchEducations();
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Riwayat Pendidikan</h3>
                <Button onClick={() => handleOpenModal()} size="sm"><Plus className="w-4 h-4 mr-2" /> Tambah Pendidikan</Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tingkat</TableHead>
                            <TableHead>Institusi</TableHead>
                            <TableHead>Jurusan</TableHead>
                            <TableHead>Tahun</TableHead>
                            <TableHead>IPK / Nilai</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Memuat data...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Belum ada riwayat pendidikan</TableCell></TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {item.education_level_name}
                                            {item.is_highest && <span title="Pendidikan Terakhir"><CheckCircle2 className="w-4 h-4 text-green-500" /></span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.institution}</TableCell>
                                    <TableCell>{item.major || '-'}</TableCell>
                                    <TableCell>{item.start_year && item.end_year ? `${item.start_year} - ${item.end_year}` : item.start_year || item.end_year || '-'}</TableCell>
                                    <TableCell>{item.gpa || '-'}</TableCell>
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
                        <DialogTitle className="text-xl">{editItem ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tingkat Pendidikan *</Label>
                                <SearchableSelect 
                                    options={levels}
                                    value={formData.education_level_id}
                                    onValueChange={val => setFormData({...formData, education_level_id: val})}
                                    placeholder="Pilih Tingkat"
                                />
                            </div>
                            <div className="space-y-2 flex items-end">
                                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_highest} onChange={e => setFormData({...formData, is_highest: e.target.checked})} className="rounded border-gray-300" />
                                    <span className="text-sm font-medium">Tandai sebagai Pendidikan Terakhir</span>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Institusi / Sekolah *</Label>
                            <Input value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Jurusan / Program Studi</Label>
                            <Input value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Tahun Masuk</Label>
                                <Input type="number" min="1950" max="2100" value={formData.start_year} onChange={e => setFormData({...formData, start_year: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tahun Lulus</Label>
                                <Input type="number" min="1950" max="2100" value={formData.end_year} onChange={e => setFormData({...formData, end_year: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>IPK / Nilai Akhir</Label>
                                <Input value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} placeholder="3.50" />
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting || !formData.education_level_id}>
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
