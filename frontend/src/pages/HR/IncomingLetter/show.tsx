import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Download, Plus, Clock, CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface IncomingLetter {
    id: number;
    incoming_number: string;
    original_number: string;
    original_date: string;
    received_date: string;
    sender: string;
    subject: string;
    category: string;
    classification: string;
    attachment_count: number;
    file_path?: string;
    status: string;
    notes?: string;
}

interface Disposition {
    id: number;
    instruction: string;
    notes?: string;
    priority: string;
    status: string;
    created_at: string;
    // in a real app, you'd fetch from_user and to_user details
}

export default function IncomingLetterShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission, user } = useAuth();
    const [letter, setLetter] = useState<IncomingLetter | null>(null);
    const [dispositions, setDispositions] = useState<Disposition[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [dispositionOpen, setDispositionOpen] = useState(false);
    const [submittingDisp, setSubmittingDisp] = useState(false);
    const [selectedToUser, setSelectedToUser] = useState<string>("");
    const [selectedPriority, setSelectedPriority] = useState<string>("normal");

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                
                // Fetch Letter
                const resLetter = await fetch(`http://localhost:8080/api/incoming-letters/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resLetter.ok) {
                    const data = await resLetter.json();
                    setLetter(data.data);
                }

                // Fetch Dispositions
                const resDisp = await fetch(`http://localhost:8080/api/incoming-letters/${id}/dispositions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resDisp.ok) {
                    const dispData = await resDisp.json();
                    setDispositions(dispData.data || []);
                }

                // Fetch Users for Disposition
                const resUsers = await fetch(`http://localhost:8080/api/users?limit=100`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resUsers.ok) {
                    const userData = await resUsers.json();
                    setUsers(userData.data || []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id]);

    const handleDispositionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmittingDisp(true);
        try {
            const formData = new FormData(e.currentTarget);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/dispositions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    incoming_letter_id: Number(id),
                    from_user_id: user?.id || 1, 
                    to_user_id: Number(formData.get('to_user_id')),
                    instruction: formData.get('instruction'),
                    notes: formData.get('notes'),
                    priority: formData.get('priority')
                })
            });

            if (res.ok) {
                toast.success('Disposisi berhasil dibuat');
                setDispositionOpen(false);
                // Refresh dispositions
                const resDisp = await fetch(`http://localhost:8080/api/incoming-letters/${id}/dispositions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resDisp.ok) {
                    const dispData = await resDisp.json();
                    setDispositions(dispData.data || []);
                }
            } else {
                const errData = await res.json();
                toast.error(errData.error || 'Gagal membuat disposisi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan jaringan');
        } finally {
            setSubmittingDisp(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-8 flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!letter) {
        return (
            <AdminLayout>
                <div className="p-8 text-center text-muted-foreground">Surat tidak ditemukan.</div>
            </AdminLayout>
        );
    }

    const statusMap: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        'new': { label: 'Baru', variant: 'destructive' },
        'disposed': { label: 'Didisposisikan', variant: 'outline' },
        'in_progress': { label: 'Diproses', variant: 'secondary' },
        'completed': { label: 'Selesai', variant: 'default' }
    };

    const currentStatus = statusMap[letter.status] || { label: letter.status, variant: 'outline' };

    return (
        <AdminLayout>
            <div className="w-full">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" onClick={() => navigate('/admin/incoming-letters')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">Detail Surat Masuk</h2>
                            <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{letter.incoming_number}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Surat</CardTitle>
                                <CardDescription>Data lengkap dari fisik surat yang diterima</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pengirim</p>
                                        <p className="font-medium text-foreground">{letter.sender}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Perihal</p>
                                        <p className="font-medium text-foreground">{letter.subject}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tanggal Surat Asli</p>
                                        <p>{new Date(letter.original_date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tanggal Diterima</p>
                                        <p>{new Date(letter.received_date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                                        <p>{letter.category || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Klasifikasi</p>
                                        <p>{letter.classification || '-'}</p>
                                    </div>
                                </div>

                                {letter.notes && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm font-medium text-muted-foreground">Catatan Tambahan</p>
                                        <p className="text-sm mt-1">{letter.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dispositions List */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle>Riwayat Disposisi</CardTitle>
                                    <CardDescription>Jejak alur disposisi surat ini</CardDescription>
                                </div>
                                {hasPermission('incoming_letter.edit') && (
                                    <Button size="sm" onClick={() => setDispositionOpen(true)}>
                                        <Plus className="size-4 mr-2" /> Disposisi Baru
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="pt-4">
                                {dispositions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                                        Belum ada disposisi untuk surat ini.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {dispositions.map((disp, i) => (
                                            <div key={disp.id} className="flex gap-4 p-4 rounded-lg border bg-slate-50/50">
                                                <div className="mt-1">
                                                    {disp.status === 'completed' ? (
                                                        <CheckCircle2 className="size-5 text-green-500" />
                                                    ) : (
                                                        <Clock className="size-5 text-amber-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-sm">Instruksi: {disp.instruction}</h4>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(disp.created_at).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm mt-1 text-muted-foreground">Prioritas: <Badge variant="outline" className="text-xs">{disp.priority}</Badge></p>
                                                    {disp.notes && <p className="text-sm mt-2 italic">"{disp.notes}"</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Files & Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lampiran Digital</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {letter.file_path ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="p-4 rounded-lg bg-blue-50 text-blue-700 flex items-center gap-3">
                                            <FileText className="size-8" />
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-medium text-sm truncate">Scan_Surat_{letter.incoming_number.replace(/\//g, '_')}.pdf</p>
                                                <p className="text-xs opacity-70">Dokumen Digital</p>
                                            </div>
                                        </div>
                                        {hasPermission('incoming_letter.edit') && (
                                            <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/admin/incoming-letters/${id}/edit`)}>
                                                Edit Surat
                                            </Button>
                                        )}
                                        <Button variant="outline" className="w-full" onClick={() => window.open(`http://localhost:8080${letter.file_path}`, '_blank')}>
                                            <Download className="size-4 mr-2" /> Unduh Dokumen
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                                        Tidak ada lampiran digital
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={dispositionOpen} onOpenChange={setDispositionOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleDispositionSubmit}>
                        <DialogHeader>
                            <DialogTitle>Buat Disposisi Baru</DialogTitle>
                            <DialogDescription>
                                Berikan instruksi disposisi surat masuk kepada staf atau bagian lain.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="to_user_id">Penerima</Label>
                                <input type="hidden" name="to_user_id" value={selectedToUser} required />
                                <SearchableSelect
                                    options={users.map(u => ({ value: String(u.id), label: u.name }))}
                                    value={selectedToUser}
                                    onChange={setSelectedToUser}
                                    placeholder="Pilih Penerima"
                                    className="w-full"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="instruction">Instruksi Utama</Label>
                                <Input id="instruction" name="instruction" required placeholder="Misal: Segera tindaklanjuti" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Prioritas</Label>
                                <input type="hidden" name="priority" value={selectedPriority} />
                                <SearchableSelect
                                    options={[
                                        { value: "low", label: "Rendah (Low)" },
                                        { value: "normal", label: "Normal" },
                                        { value: "high", label: "Tinggi (High)" },
                                        { value: "urgent", label: "Mendesak (Urgent)" }
                                    ]}
                                    value={selectedPriority}
                                    onChange={setSelectedPriority}
                                    placeholder="Pilih prioritas"
                                    className="w-full"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                <Textarea id="notes" name="notes" placeholder="Catatan untuk penerima disposisi" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDispositionOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={submittingDisp}>
                                {submittingDisp ? 'Menyimpan...' : 'Kirim Disposisi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
