import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ZoomIn, ZoomOut, CheckCircle, Clock, XCircle, PenTool } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { useAuth } from '@/contexts/AuthContext';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function OutgoingLetterShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [letter, setLetter] = useState<any>(null);
    const [template, setTemplate] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [previewScale, setPreviewScale] = useState(1.0);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [signDialogOpen, setSignDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        setCurrentUser({ id: payload.user_id, role_id: payload.role_id, nip: payload.nip });
                    } catch (e) { }
                }

                // Fetch Letter
                const resLetter = await fetch(`http://localhost:8080/api/outgoing-letters/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resLetter.ok) {
                    const data = await resLetter.json();
                    setLetter(data.data);

                    // Fetch Template based on letter.template_id
                    if (data.data && data.data.template_id) {
                        const resTpl = await fetch(`http://localhost:8080/api/document-templates/${data.data.template_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (resTpl.ok) {
                            const tplData = await resTpl.json();
                            const tpl = tplData.data;

                            const parseJson = (str: any, defaultVal: any) => {
                                try { return typeof str === 'string' ? JSON.parse(str) : (str || defaultVal); }
                                catch (e) { return defaultVal; }
                            };

                            tpl.parsedVars = parseJson(tpl.variables, []);
                            tpl.parsedSig = parseJson(tpl.signature_settings, { slots: [] });
                            tpl.parsedHeader = parseJson(tpl.header_settings, { enabled: false, text_lines: [], logo: {} });
                            tpl.parsedPage = parseJson(tpl.page_settings, { paper_size: 'A4', orientation: 'portrait', default_font: { family: 'Arial', size: 12 } });
                            tpl.parsedContent = parseJson(tpl.content_blocks, []);
                            tpl.parsedFooter = parseJson(tpl.footer_settings, { enabled: false, text: '' });
                            setTemplate(tpl);
                        }
                    }
                }

                // Fetch Users for Signatories mapping
                const resUsers = await fetch(`http://localhost:8080/api/users?perPage=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resUsers.ok) {
                    const dataUsers = await resUsers.json();
                    setUsers(dataUsers.data || []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="outline" className="bg-slate-100 text-slate-700">Draf</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Menunggu</Badge>;
            case 'approved': return <Badge className="bg-green-500 hover:bg-green-600">Disetujui</Badge>;
            case 'partially_signed': return <Badge className="bg-blue-500 hover:bg-blue-600">TTD Sebagian</Badge>;
            case 'fully_signed': return <Badge className="bg-green-500 hover:bg-green-600">TTD Lengkap</Badge>;
            case 'rejected': return <Badge variant="destructive">Ditolak</Badge>;
            case 'revision_requested': return <Badge className="bg-orange-500 hover:bg-orange-600">Revisi</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full min-h-[50vh]">
                    <div className="text-muted-foreground animate-pulse">Memuat data...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!letter) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                    <h2 className="text-xl font-semibold mb-2">Surat Tidak Ditemukan</h2>
                    <Button variant="outline" onClick={() => navigate('/admin/outgoing-letters')}>Kembali</Button>
                </div>
            </AdminLayout>
        );
    }

    // Parse variable values
    const varValues = letter.variable_values ? (typeof letter.variable_values === 'string' ? JSON.parse(letter.variable_values) : letter.variable_values) : {};

    const previewVariableValues = { ...varValues };
    if (template?.parsedVars) {
        template.parsedVars.forEach((v: any) => {
            if (v.source && v.source !== 'manual') {
                const key = v.key || v.name;
                const isPlaceholder = !previewVariableValues[key] || previewVariableValues[key].toString().includes('[Diisi Otomatis');

                if (v.source === 'auto_number') {
                    previewVariableValues[key] = letter.letter_number || (isPlaceholder ? '[Diisi Otomatis oleh Sistem]' : previewVariableValues[key]);
                }
                else if (v.source === 'auto_date') {
                    if (letter.letter_date) {
                        previewVariableValues[key] = new Date(letter.letter_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                    } else if (isPlaceholder) {
                        previewVariableValues[key] = '-';
                    }
                }
                else if (isPlaceholder) {
                    if (v.source === 'auto_user') previewVariableValues[key] = '[Nama Pengguna]';
                    else if (v.source === 'auto_unit') previewVariableValues[key] = '[Unit Kerja]';
                    else previewVariableValues[key] = '[Diisi Otomatis]';
                }
            }
        });
    }

    const handleSubmitDraft = async () => {
        if (!confirm('Apakah Anda yakin ingin mengajukan surat ini? Setelah diajukan, surat tidak dapat diedit lagi.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/outgoing-letters/${id}/submit`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Reload data
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal mengajukan surat');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan');
        }
    };

    const handleSign = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/outgoing-letters/${id}/sign`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menandatangani surat');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan');
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/outgoing-letters/${id}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rejection_reason: rejectReason })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menolak surat');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan');
            setProcessing(false);
        }
    };

    const userSignatory = letter?.signatories?.find((s: any) => s.user_id === currentUser?.id);
    const canSign = userSignatory && userSignatory.status === 'pending' && ['pending', 'partially_signed'].includes(letter.status);

    return (
        <AdminLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-none h-10 w-10 shrink-0" type="button" onClick={() => navigate('/admin/outgoing-letters')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-semibold">Detail Surat Keluar</h2>
                            <p className="text-sm text-muted-foreground">Informasi detail dan pratinjau dokumen.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canSign && hasPermission('outgoing_letter.sign') && (
                            <>
                                <Button variant="outline" className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialogOpen(true)}>
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                    Tolak
                                </Button>
                                <Button className="rounded-none" onClick={() => setSignDialogOpen(true)}>
                                    <PenTool className="h-4 w-4 mr-1.5" />
                                    Tandatangani
                                </Button>
                            </>
                        )}
                        {letter.status === 'draft' && hasPermission('outgoing_letter.submit') && (
                            <Button className="rounded-none bg-blue-600 hover:bg-blue-700" onClick={handleSubmitDraft}>
                                Ajukan Surat
                            </Button>
                        )}
                        <Button variant="outline" className="rounded-none" disabled={processing} onClick={async () => {
                            const token = localStorage.getItem('token');
                            setProcessing(true);
                            const toastId = toast.loading("Membuat PDF dari server...");
                            try {
                                const response = await fetch(`http://localhost:8080/api/outgoing-letters/${letter.id}/pdf`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!response.ok) throw new Error('Gagal mencetak PDF');
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Surat_${letter.letter_number || letter.id}.pdf`.replace(/\//g, '_');
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                toast.success("PDF berhasil diunduh!", { id: toastId });
                            } catch (error) {
                                console.error(error);
                                toast.error("Terjadi kesalahan saat membuat PDF.", { id: toastId });
                            } finally {
                                setProcessing(false);
                            }
                        }}>
                            <FileText className="h-4 w-4 mr-1.5" />
                            {processing ? "Memproses..." : "Cetak"}
                        </Button>
                        {['draft', 'pending', 'revision_requested'].includes(letter.status) && hasPermission('outgoing_letter.edit') && (
                            <Button className="rounded-none" onClick={() => navigate(`/admin/outgoing-letters/${letter.id}/edit`)}>
                                Edit Surat
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Info */}
                    <div className="lg:col-span-5 relative pb-32 min-w-0">
                        <div className="flex flex-col gap-6">

                            <div className="bg-white border p-6 min-w-0">
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Informasi Utama</h3>

                                <div className="space-y-4">
                                    <div className="min-w-0">
                                        <div className="text-sm text-muted-foreground mb-1">Nomor Surat</div>
                                        <div className="font-medium break-words min-w-0">{letter.letter_number || '-'}</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-muted-foreground mb-1">Perihal</div>
                                        <div className="font-medium break-words min-w-0">{letter.subject}</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm text-muted-foreground mb-1">Tanggal Surat</div>
                                        <div className="font-medium">{new Date(letter.letter_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                                        <div>{getStatusBadge(letter.status)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Template Dokumen</div>
                                        <div className="font-medium break-words min-w-0">{letter.template_name || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border p-6 min-w-0">
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Data Variabel</h3>

                                <div className="space-y-3">
                                    {Object.keys(previewVariableValues).length > 0 ? (
                                        Object.keys(previewVariableValues).map(key => (
                                            <div key={key} className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2 min-w-0">
                                                <div className="text-sm text-muted-foreground col-span-1 break-words min-w-0">{key}</div>
                                                <div className="font-medium text-sm col-span-2 break-words min-w-0 whitespace-pre-wrap">{previewVariableValues[key] || '-'}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">Tidak ada variabel khusus.</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border p-6 min-w-0">
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Penandatangan</h3>

                                <div className="space-y-3">
                                    {letter.signatories && letter.signatories.length > 0 ? (
                                        letter.signatories.map((sig: any, index: number) => {
                                            const user = users.find(u => u.id?.toString() === sig.user_id?.toString());
                                            return (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 border min-w-0">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm break-words min-w-0">{user ? user.name : 'Unknown User'}</div>
                                                        <div className="text-xs text-muted-foreground">{user?.nip || '-'}</div>
                                                    </div>
                                                    <div>
                                                        {(sig.status === 'approved' || sig.status === 'signed') ? (
                                                            <Badge className="bg-green-100 text-green-700 border-green-200">Sudah TTD</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-slate-500">Menunggu</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">Tidak ada penandatangan.</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-7 min-w-0">
                        <div className="h-[calc(100vh-120px)] sticky top-6 overflow-hidden bg-slate-100 flex flex-col border-t border-l border-r">
                            <div className="bg-white border-b py-2 px-4 shrink-0 flex items-center justify-between">
                                <div className="text-sm font-medium text-slate-700">Pratinjau Dokumen</div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <button type="button" onClick={() => setPreviewScale(Math.max(0.2, previewScale - 0.1))} className="p-1 hover:bg-slate-100">
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-medium w-8 text-center">{Math.round(previewScale * 100)}%</span>
                                    <button type="button" onClick={() => setPreviewScale(Math.min(2.0, previewScale + 0.1))} className="p-1 hover:bg-slate-100">
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-8 flex justify-center custom-scrollbar bg-slate-200">
                                {template ? (
                                    <TemplatePreview
                                        pageSettings={template.parsedPage}
                                        headerSettings={template.parsedHeader}
                                        contentBlocks={template.parsedContent}
                                        signatureSettings={template.parsedSig}
                                        footerSettings={template.parsedFooter || null}
                                        variableValues={previewVariableValues}
                                        signatoriesData={(letter.signatories || []).map((s: any) => ({
                                            slot_id: s.slot_id,
                                            name: users.find(u => u.id?.toString() === s.user_id?.toString())?.name || users.find(u => u.id?.toString() === s.user_id?.toString())?.first_name || '(Nama Penandatangan)',
                                            nip: users.find(u => u.id?.toString() === s.user_id?.toString())?.nip || '',
                                            signed: s.status === 'approved' || s.status === 'signed',
                                            signed_at: s.signed_at
                                        }))}
                                        scale={previewScale}
                                        showQrCode={letter.status === 'fully_signed'}
                                        verificationUrl={letter.status === 'fully_signed' ? `${window.location.origin}/verify/${letter.id}` : ''}
                                    />
                                ) : (
                                    <div className="text-muted-foreground flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                            <p>Gagal memuat template surat.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign Dialog */}
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Tanda Tangan</DialogTitle>
                        <DialogDescription>
                            Anda akan menandatangani surat ini. Pastikan Anda telah membaca dan menyetujui isi surat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm font-medium">{letter.subject}</p>
                            <p className="text-sm text-muted-foreground">No: {letter.letter_number}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSignDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSign} disabled={processing}>
                            {processing ? 'Memproses...' : (
                                <>
                                    <PenTool className="h-4 w-4 mr-1.5" />
                                    Ya, Tandatangani
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Surat</DialogTitle>
                        <DialogDescription>
                            Tuliskan alasan penolakan atau revisi yang diperlukan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-reason">Alasan Penolakan / Revisi</Label>
                            <Textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Jelaskan alasan..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason.trim()}>
                            {processing ? 'Memproses...' : 'Tolak Surat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
