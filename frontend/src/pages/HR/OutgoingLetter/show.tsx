import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ZoomIn, ZoomOut, CheckCircle, Clock, XCircle } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { TemplatePreview } from '@/components/document-template/template-preview';

export default function OutgoingLetterShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [letter, setLetter] = useState<any>(null);
    const [template, setTemplate] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [previewScale, setPreviewScale] = useState(1.0);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                
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
                                catch(e) { return defaultVal; }
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
        switch(status) {
            case 'draft': return <Badge variant="outline" className="bg-slate-100 text-slate-700">Draft</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Pending</Badge>;
            case 'approved': return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            case 'revision_requested': return <Badge className="bg-orange-500 hover:bg-orange-600">Revision</Badge>;
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
                        <Button variant="outline" className="rounded-none" onClick={() => window.print()}>
                            Cetak
                        </Button>
                        {letter.status === 'draft' && (
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
                                    {Object.keys(varValues).length > 0 ? (
                                        Object.keys(varValues).map(key => (
                                            <div key={key} className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2 min-w-0">
                                                <div className="text-sm text-muted-foreground col-span-1 break-words min-w-0">{key}</div>
                                                <div className="font-medium text-sm col-span-2 break-words min-w-0 whitespace-pre-wrap">{varValues[key] || '-'}</div>
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
                                        variableValues={{...varValues, nomor_surat: letter.letter_number}}
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
        </AdminLayout>
    );
}
