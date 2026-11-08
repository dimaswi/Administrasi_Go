import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Download, Plus, Clock, CheckCircle2, Edit, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DetailCard } from '@/components/ui/form-card';
import { getApiUrl } from '@/lib/api';

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
}

export default function IncomingLetterShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
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
                const resLetter = await fetch(getApiUrl(`/api/incoming-letters/${id}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resLetter.ok) {
                    const data = await resLetter.json();
                    setLetter(data.data);
                }

                // Fetch Dispositions
                const resDisp = await fetch(getApiUrl(`/api/incoming-letters/${id}/dispositions`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resDisp.ok) {
                    const dispData = await resDisp.json();
                    setDispositions(dispData.data || []);
                }

                // Fetch Users for Disposition
                const resUsers = await fetch(getApiUrl(`/api/users?limit=100`), {
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
            const res = await fetch(getApiUrl(`/api/dispositions`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    incoming_letter_id: Number(id),
                    to_user_id: Number(selectedToUser),
                    instruction: formData.get('instruction'),
                    priority: selectedPriority,
                    notes: formData.get('notes'),
                })
            });

            if (res.ok) {
                toast.success('Disposisi berhasil dibuat');
                setDispositionOpen(false);
                const resDisp = await fetch(getApiUrl(`/api/incoming-letters/${id}/dispositions`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resDisp.ok) {
                    const dispData = await resDisp.json();
                    setDispositions(dispData.data || []);
                }
            } else {
                toast.error('Gagal membuat disposisi');
            }
        } catch (err) {
            console.error(err);
            toast.error('Terjadi kesalahan jaringan');
        } finally {
            setSubmittingDisp(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data surat masuk...
                </div>
            </AdminLayout>
        );
    }

    if (!letter) {
        return (
            <AdminLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data surat masuk tidak ditemukan.
                </div>
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
            <DetailCard
                title={`Surat Masuk: ${letter.incoming_number}`}
                subtitle={`Dari: ${letter.sender} • Perihal: ${letter.subject}`}
                icon={Mail}
                onBack={() => navigate('/admin/incoming-letters')}
                statusBadge={
                    <Badge variant={currentStatus.variant} className="rounded-none uppercase text-xs">
                        {currentStatus.label}
                    </Badge>
                }
                actions={
                    <div className="flex items-center gap-2">
                        {hasPermission('incoming_letter.edit') && (
                            <Button 
                                size="sm" 
                                onClick={() => navigate(`/admin/incoming-letters/${id}/edit`)}
                                className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold"
                            >
                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Surat
                            </Button>
                        )}
                        {hasPermission('incoming_letter.edit') && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setDispositionOpen(true)}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none font-semibold"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" /> Disposisi Baru
                            </Button>
                        )}
                    </div>
                }
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            Informasi Fisik & Agenda Surat
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nomor Agenda (Masuk)</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{letter.incoming_number}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Nomor Surat Asli</dt>
                                <dd className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">{letter.original_number}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Tanggal Surat Asli</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{new Date(letter.original_date).toLocaleDateString('id-ID')}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Tanggal Diterima</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{new Date(letter.received_date).toLocaleDateString('id-ID')}</dd>
                            </div>

                            <div className="md:col-span-2">
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Pengirim Surat</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{letter.sender}</dd>
                            </div>
                            <div className="md:col-span-2">
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Perihal / Hal</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{letter.subject}</dd>
                            </div>

                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kategori</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{letter.category || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Klasifikasi</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{letter.classification || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Jumlah Lampiran</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">{letter.attachment_count || 0} berkas</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Berkas Scan</dt>
                                <dd className="text-sm font-medium text-neutral-900 dark:text-white">
                                    {letter.file_path ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(getApiUrl(letter.file_path || ''), '_blank')}
                                            className="h-7 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none px-2.5 font-medium"
                                        >
                                            <Download className="size-3 mr-1" /> Unduh File
                                        </Button>
                                    ) : (
                                        <span className="text-neutral-400 text-xs">Tidak ada file</span>
                                    )}
                                </dd>
                            </div>

                            {letter.notes && (
                                <div className="md:col-span-2 lg:col-span-4">
                                    <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Catatan Tambahan</dt>
                                    <dd className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none whitespace-pre-wrap">{letter.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                Riwayat Alur Disposisi
                            </h3>
                            <span className="text-xs text-neutral-500 font-mono">{dispositions.length} Catatan</span>
                        </div>
                        {dispositions.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/30 font-mono">
                                Belum ada riwayat disposisi untuk surat ini.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dispositions.map((disp) => (
                                    <div key={disp.id} className="flex gap-3 p-3.5 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <div className="mt-0.5">
                                            {disp.status === 'completed' ? (
                                                <CheckCircle2 className="size-4 text-emerald-600" />
                                            ) : (
                                                <Clock className="size-4 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">Instruksi: {disp.instruction}</h4>
                                                <span className="text-[11px] text-neutral-500 font-mono shrink-0">
                                                    {new Date(disp.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-neutral-500">Prioritas:</span>
                                                <Badge variant="outline" className="rounded-none text-[10px] uppercase font-mono">{disp.priority}</Badge>
                                            </div>
                                            {disp.notes && (
                                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 italic bg-neutral-50 dark:bg-neutral-950 p-2 border border-neutral-100 dark:border-neutral-800">
                                                    "{disp.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DetailCard>

            <Dialog open={dispositionOpen} onOpenChange={setDispositionOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-none border-neutral-200 dark:border-neutral-800 shadow-none">
                    <form onSubmit={handleDispositionSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold uppercase tracking-tight">Buat Disposisi Baru</DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500 font-mono">
                                Berikan instruksi disposisi surat masuk kepada staf atau bagian lain.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="to_user_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Penerima Disposisi</Label>
                                <input type="hidden" name="to_user_id" value={selectedToUser} required />
                                <SearchableSelect
                                    options={users.map(u => ({ value: String(u.id), label: u.name }))}
                                    value={selectedToUser}
                                    onChange={setSelectedToUser}
                                    placeholder="Pilih Penerima"
                                    className="w-full"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="instruction" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Instruksi Utama</Label>
                                <Input id="instruction" name="instruction" required placeholder="Misal: Segera tindaklanjuti" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 text-sm shadow-none" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="priority" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Prioritas</Label>
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
                            <div className="grid gap-1.5">
                                <Label htmlFor="notes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Catatan Tambahan (Opsional)</Label>
                                <Textarea id="notes" name="notes" placeholder="Catatan untuk penerima disposisi..." className="rounded-none border-neutral-200 dark:border-neutral-800 text-sm shadow-none" rows={3} />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setDispositionOpen(false)} className="rounded-none text-xs h-8 border-neutral-200 dark:border-neutral-800 shadow-none">
                                Batal
                            </Button>
                            <Button type="submit" disabled={submittingDisp} className="rounded-none text-xs h-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-none font-semibold">
                                {submittingDisp ? 'Menyimpan...' : 'Kirim Disposisi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
