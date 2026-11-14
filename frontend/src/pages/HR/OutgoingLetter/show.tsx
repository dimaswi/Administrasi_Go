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
import { getApiUrl } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

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
                const resLetter = await fetch(getApiUrl(`/api/outgoing-letters/${id}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resLetter.ok) {
                    const data = await resLetter.json();
                    setLetter(data.data);

                    // Fetch Template based on letter.template_id
                    if (data.data && data.data.template_id) {
                        const resTpl = await fetch(getApiUrl(`/api/document-templates/${data.data.template_id}`), {
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
                const resUsers = await fetch(getApiUrl(`/api/users?perPage=1000`), {
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
            case 'draft':
                return <Badge variant="outline" className="rounded-none border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] uppercase font-semibold">Draf</Badge>;
            case 'pending':
                return <Badge variant="outline" className="rounded-none border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono text-[10px] uppercase font-semibold">Menunggu</Badge>;
            case 'approved':
                return <Badge variant="outline" className="rounded-none border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] uppercase font-semibold">Disetujui</Badge>;
            case 'partially_signed':
                return <Badge variant="outline" className="rounded-none border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-mono text-[10px] uppercase font-semibold">TTD Sebagian</Badge>;
            case 'fully_signed':
                return <Badge variant="outline" className="rounded-none border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] uppercase font-semibold">TTD Lengkap</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="rounded-none border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono text-[10px] uppercase font-semibold">Ditolak</Badge>;
            case 'revision_requested':
                return <Badge variant="outline" className="rounded-none border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-mono text-[10px] uppercase font-semibold">Revisi</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">{status}</Badge>;
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

    const handleSubmitDraft = () => {
        setSubmitConfirmOpen(true);
    };

    const confirmSubmitDraft = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/outgoing-letters/${id}/submit`), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                setSubmitConfirmOpen(false);
                setAlertMessage(data.error || 'Gagal mengajukan surat');
            }
        } catch (err) {
            console.error(err);
            setSubmitConfirmOpen(false);
            setAlertMessage('Terjadi kesalahan jaringan');
        } finally {
            setProcessing(false);
        }
    };

    const handleSign = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/outgoing-letters/${id}/sign`), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                setAlertMessage(data.error || 'Gagal menandatangani surat');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            setAlertMessage('Terjadi kesalahan jaringan');
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/outgoing-letters/${id}/reject`), {
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
                setAlertMessage(data.error || 'Gagal menolak surat');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            setAlertMessage('Terjadi kesalahan jaringan');
            setProcessing(false);
        }
    };

    const userSignatory = letter?.signatories?.find((s: any) => s.user_id === currentUser?.id);
    const canSign = userSignatory && userSignatory.status === 'pending' && ['pending', 'partially_signed'].includes(letter.status);

    return (
        <AdminLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col lg:h-[calc(100vh-120px)]">
                {/* Unified Header */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0" 
                            type="button" 
                            onClick={() => navigate('/admin/outgoing-letters')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <FileText className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                    Detail Surat Keluar
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono truncate">
                                    {letter.letter_number || letter.subject}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canSign && hasPermission('outgoing_letter.sign') && (
                            <>
                                <Button variant="outline" size="sm" className="h-8 rounded-none border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs shadow-none font-semibold" onClick={() => setRejectDialogOpen(true)}>
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Tolak
                                </Button>
                                <Button size="sm" className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs shadow-none font-semibold" onClick={() => setSignDialogOpen(true)}>
                                    <PenTool className="h-3.5 w-3.5 mr-1.5" />
                                    Tandatangani
                                </Button>
                            </>
                        )}
                        {letter.status === 'draft' && hasPermission('outgoing_letter.submit') && (
                            <Button size="sm" className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs shadow-none font-semibold" onClick={handleSubmitDraft}>
                                Ajukan Surat
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none font-semibold" disabled={processing} onClick={async () => {
                            const token = localStorage.getItem('token');
                            setProcessing(true);
                            const toastId = toast.loading("Membuat PDF dari server...");
                            try {
                                const response = await fetch(getApiUrl(`/api/outgoing-letters/${letter.id}/pdf`), {
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
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            {processing ? "Memproses..." : "Cetak"}
                        </Button>
                        {['draft', 'pending', 'revision_requested'].includes(letter.status) && hasPermission('outgoing_letter.edit') && (
                            <Button size="sm" className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs shadow-none font-semibold" onClick={() => navigate(`/admin/outgoing-letters/${letter.id}/edit`)}>
                                Edit Surat
                            </Button>
                        )}
                    </div>
                </div>

                {/* Unified 2-Column Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 items-stretch overflow-hidden">
                    {/* Left Column: Info */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-white dark:bg-neutral-950">
                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 p-4">
                            <h3 className="font-semibold text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">Informasi Utama</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[11px] text-neutral-500 font-mono uppercase mb-0.5">Nomor Surat</div>
                                    <div className="font-semibold text-sm break-words text-neutral-900 dark:text-white">{letter.letter_number || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-neutral-500 font-mono uppercase mb-0.5">Perihal</div>
                                    <div className="font-medium text-sm break-words text-neutral-900 dark:text-white">{letter.subject}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-neutral-500 font-mono uppercase mb-0.5">Tanggal Surat</div>
                                    <div className="font-medium text-xs text-neutral-900 dark:text-white">{new Date(letter.letter_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-neutral-500 font-mono uppercase mb-1">Status</div>
                                    <div>{getStatusBadge(letter.status)}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-neutral-500 font-mono uppercase mb-0.5">Template Dokumen</div>
                                    <div className="font-medium text-xs break-words text-neutral-900 dark:text-white">{letter.template_name || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 p-4">
                            <h3 className="font-semibold text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">Data Variabel</h3>
                            <div className="space-y-2">
                                {Object.keys(previewVariableValues).length > 0 ? (
                                    Object.keys(previewVariableValues).map(key => (
                                        <div key={key} className="grid grid-cols-3 gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-1.5 min-w-0">
                                            <div className="text-xs text-neutral-500 font-mono col-span-1 break-words min-w-0">{key}</div>
                                            <div className="font-medium text-xs col-span-2 break-words min-w-0 whitespace-pre-wrap text-neutral-900 dark:text-neutral-100">{previewVariableValues[key] || '-'}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-neutral-400 italic">Tidak ada variabel khusus.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 p-4">
                            <h3 className="font-semibold text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">Penandatangan</h3>
                            <div className="space-y-2">
                                {letter.signatories && letter.signatories.length > 0 ? (
                                    letter.signatories.map((sig: any, index: number) => {
                                        const sigUser = users.find(u => u.id?.toString() === sig.user_id?.toString());
                                        const userName = sigUser?.name || `${sigUser?.first_name || ''} ${sigUser?.last_name || ''}`.trim() || `User ID: ${sig.user_id}`;
                                        return (
                                            <div key={index} className="flex items-center justify-between p-2.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                                <div>
                                                    <div className="font-semibold text-xs text-neutral-900 dark:text-white">{userName}</div>
                                                    <div className="text-[10px] text-neutral-500 font-mono">Slot: {sig.slot_id}</div>
                                                </div>
                                                <div>
                                                    {sig.status === 'approved' || sig.status === 'signed' ? (
                                                        <Badge variant="outline" className="rounded-none border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] uppercase font-semibold">Sudah TTD</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="rounded-none border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-[10px] uppercase font-semibold">Menunggu</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-xs text-neutral-400 italic">Tidak ada penandatangan.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-7 flex flex-col bg-neutral-100/80 dark:bg-neutral-900/50">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2 flex items-center justify-between shrink-0">
                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-mono">
                                Pratinjau Dokumen
                            </span>
                            <div className="flex items-center gap-1.5 text-neutral-500">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewScale(Math.max(0.2, previewScale - 0.1))}
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    title="Perkecil"
                                >
                                    <ZoomOut className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs font-mono font-medium px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-none min-w-[50px] text-center text-neutral-700 dark:text-neutral-300">
                                    {Math.round(previewScale * 100)}%
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewScale(Math.min(2.0, previewScale + 0.1))}
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    title="Perbesar"
                                >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-auto p-6 md:p-8 flex justify-center custom-scrollbar">
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
                                <div className="text-neutral-400 flex items-center justify-center h-full min-h-[300px]">
                                    <div className="text-center">
                                        <FileText className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                                        <p className="text-xs font-mono">Gagal memuat template surat.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign Dialog */}
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogContent className="rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold uppercase tracking-tight">Konfirmasi Tanda Tangan</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Anda akan menandatangani surat ini. Pastikan Anda telah membaca dan menyetujui isi surat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-3">
                        <div className="rounded-none bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-white">{letter.subject}</p>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">No: {letter.letter_number || '-'}</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSignDialogOpen(false)} className="rounded-none text-xs border border-neutral-200 dark:border-neutral-800 shadow-none">Batal</Button>
                        <Button size="sm" onClick={handleSign} disabled={processing} className="rounded-none text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-none font-semibold">
                            {processing ? 'Memproses...' : (
                                <>
                                    <PenTool className="h-3.5 w-3.5 mr-1.5" />
                                    Ya, Tandatangani
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold uppercase tracking-tight">Tolak Surat</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Tuliskan alasan penolakan atau revisi yang diperlukan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="reject-reason" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Alasan Penolakan / Revisi</Label>
                            <Textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Jelaskan alasan penolakan..."
                                rows={4}
                                className="rounded-none border border-neutral-200 dark:border-neutral-800 text-sm shadow-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)} className="rounded-none text-xs border border-neutral-200 dark:border-neutral-800 shadow-none">Batal</Button>
                        <Button variant="destructive" size="sm" onClick={handleReject} disabled={processing || !rejectReason.trim()} className="rounded-none text-xs shadow-none font-semibold">
                            {processing ? 'Memproses...' : 'Tolak Surat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={submitConfirmOpen}
                onOpenChange={setSubmitConfirmOpen}
                title="Ajukan Surat"
                description="Apakah Anda yakin ingin mengajukan surat ini? Setelah diajukan, surat tidak dapat diedit lagi."
                confirmText="Ajukan Surat"
                loading={processing}
                onConfirm={confirmSubmitDraft}
            />

            <ConfirmDialog
                open={alertMessage !== null}
                onOpenChange={(open) => { if (!open) setAlertMessage(null); }}
                title="Pemberitahuan"
                description={alertMessage || ''}
                hideCancel
            />
        </AdminLayout>
    );
}
