import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ArrowLeft, Save, Eye, Mail, FileText, UserCheck, ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';

export default function OutgoingLetterEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openTemplateBox, setOpenTemplateBox] = useState(false);

    const [formData, setFormData] = useState({
        template_id: '',
        subject: '',
        letter_date: new Date().toISOString().split('T')[0],
        variable_values: {} as any,
        letter_number: null as string | null
    });

    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [signatories, setSignatories] = useState<any[]>([]);
    const [previewScale, setPreviewScale] = useState(0.67);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch Templates
                const resTpl = await fetch(getApiUrl(`/api/document-templates?per_page=1000`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataTpl = await resTpl.json();
                if (resTpl.ok) setTemplates(dataTpl.data || []);

                // Fetch Users for Signatories
                const resUsers = await fetch(getApiUrl(`/api/users?perPage=1000`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataUsers = await resUsers.json();
                if (resUsers.ok) setUsers(dataUsers.data || []);

                // Fetch Existing Letter
                if (id) {
                    const resLetter = await fetch(getApiUrl(`/api/outgoing-letters/${id}`), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resLetter.ok) {
                        const dataLetter = await resLetter.json();
                        const letter = dataLetter.data;

                        let parsedVars = {};
                        if (letter.variable_values) {
                            try { parsedVars = typeof letter.variable_values === 'string' ? JSON.parse(letter.variable_values) : letter.variable_values; } catch (e) { }
                        }

                        setFormData({
                            template_id: letter.template_id ? letter.template_id.toString() : '',
                            subject: letter.subject || '',
                            letter_date: letter.letter_date ? letter.letter_date.split('T')[0] : new Date().toISOString().split('T')[0],
                            variable_values: parsedVars,
                            letter_number: letter.letter_number || null
                        });

                        // We don't set signatories here yet because the template useEffect will reset it.
                        // We will merge it inside the template useEffect.
                        // So let's store existing signatories temporarily
                        (window as any)._existingSignatories = letter.signatories;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [id]);

    // When template changes, parse its JSON settings
    useEffect(() => {
        const template = templates.find(t => t.id.toString() === formData.template_id);
        if (template) {
            const parseJson = (str: any, defaultVal: any) => {
                try { return typeof str === 'string' ? JSON.parse(str) : (str || defaultVal); }
                catch (e) { return defaultVal; }
            };

            const parsedVars = parseJson(template.variables, []);
            const parsedSig = parseJson(template.signature_settings, { slots: [] });
            const parsedHeader = parseJson(template.header_settings, { enabled: false, text_lines: [], logo: {} });
            const parsedPage = parseJson(template.page_settings, { paper_size: 'A4', orientation: 'portrait', default_font: { family: 'Arial', size: 12 } });
            const parsedContent = parseJson(template.content_blocks, []);
            const parsedFooter = parseJson(template.footer_settings, { enabled: false, text: '' });

            setSelectedTemplate({
                ...template,
                parsedVars, parsedSig, parsedHeader, parsedPage, parsedContent, parsedFooter
            });

            // initialize variable_values based on parsedVars if empty
            const initialVars: any = {};
            if (parsedVars && Array.isArray(parsedVars)) {
                parsedVars.forEach((v: any) => {
                    initialVars[v.name || v.key] = formData.variable_values[v.name || v.key] || '';
                });
            }
            setFormData(prev => ({ ...prev, variable_values: { ...initialVars, ...prev.variable_values } }));

            // initialize signatories based on signature_settings slots
            let defaultSigs: any[] = [];
            if (parsedSig && parsedSig.slots && Array.isArray(parsedSig.slots)) {
                defaultSigs = parsedSig.slots.map((slot: any, idx: number) => ({
                    slot_id: slot.id || `slot_${idx}`,
                    user_id: '',
                    sign_order: idx + 1,
                    role: slot.label_position || slot.role || 'Penandatangan',
                    sub_role: slot.role || 'Penandatangan',
                    column: slot.text_align === 'left' ? 'Kiri' : slot.text_align === 'right' ? 'Kanan' : 'Tengah',
                    show_name: slot.show_name,
                    show_nip: slot.show_nip
                }));
            } else {
                defaultSigs = [{ slot_id: 'director', user_id: '', sign_order: 1, role: 'Pimpinan' }];
            }

            // Merge with existing signatories if any
            const existingSigs = (window as any)._existingSignatories;
            if (existingSigs && Array.isArray(existingSigs)) {
                defaultSigs = defaultSigs.map(ds => {
                    const found = existingSigs.find((es: any) => es.slot_id === ds.slot_id);
                    if (found) {
                        return { ...ds, user_id: found.user_id ? found.user_id.toString() : '' };
                    }
                    return ds;
                });
                // Note: Do not delete _existingSignatories to support React 18 Strict Mode double-invoke
                // and to keep existing signers when switching templates with matching slot_ids.
            }
            setSignatories(defaultSigs);
        } else {
            setSelectedTemplate(null);
            setSignatories([]);
        }
    }, [formData.template_id, templates]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.template_id || !formData.subject || !formData.letter_date) {
            toast.error("Harap isi semua field wajib (Template, Perihal, Tanggal)");
            return;
        }

        const validSignatories = signatories.filter(s => s.user_id);
        if (validSignatories.length === 0) {
            toast.error("Harap pilih minimal 1 penandatangan");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Populate auto variables before submit
            const finalVars = { ...formData.variable_values };
            if (selectedTemplate?.parsedVars) {
                selectedTemplate.parsedVars.forEach((v: any) => {
                    if (v.source && v.source !== 'manual') {
                        const key = v.name || v.key;
                        if (v.source === 'auto_number') finalVars[key] = '[Diisi Otomatis oleh Sistem]';
                        else if (v.source === 'auto_date') finalVars[key] = formData.letter_date;
                        else if (v.source === 'auto_user') finalVars[key] = '[Pengguna Aktif]';
                        else if (v.source === 'auto_unit') finalVars[key] = '[Unit Kerja]';
                    }
                });
            }

            const payload = {
                template_id: parseInt(formData.template_id),
                subject: formData.subject,
                letter_date: formData.letter_date,
                variable_values: JSON.stringify(finalVars),
                signatories: validSignatories.map(s => ({
                    user_id: parseInt(s.user_id),
                    slot_id: s.slot_id,
                    sign_order: s.sign_order
                }))
            };

            const res = await fetch(getApiUrl(`/api/outgoing-letters/${id}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Surat keluar berhasil diperbarui");
                navigate('/admin/outgoing-letters');
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal memperbarui surat");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Terjadi kesalahan jaringan");
        } finally {
            setLoading(false);
        }
    };

    const previewVariableValues = { ...formData.variable_values };
    if (selectedTemplate?.parsedVars) {
        selectedTemplate.parsedVars.forEach((v: any) => {
            if (v.source && v.source !== 'manual') {
                const key = v.key || v.name;
                if (v.source === 'auto_number') previewVariableValues[key] = formData.letter_number || '[Nomor Otomatis]';
                else if (v.source === 'auto_date') previewVariableValues[key] = formData.letter_date || new Date().toISOString().split('T')[0];
                else if (v.source === 'auto_user') previewVariableValues[key] = '[Nama Penandatangan]';
                else if (v.source === 'auto_unit') previewVariableValues[key] = '[Unit Kerja]';
                else previewVariableValues[key] = '[Diisi Otomatis]';
            }
        });
    }

    return (
        <AdminLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col lg:h-[calc(100vh-120px)]">
                {/* Unified Header */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between shrink-0">
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
                                <Mail className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                    Edit Surat Keluar
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono truncate">
                                    Perbarui informasi dan isi surat keluar Anda
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified 2-Column Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 items-stretch overflow-hidden">
                    {/* Left Column: Form Content */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full min-h-0 bg-white dark:bg-neutral-950 overflow-hidden">
                        <form id="letter-form" onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                            <Tabs defaultValue="informasi" className="w-full flex flex-col h-full min-h-0">
                                <div className="border-b border-neutral-200 dark:border-neutral-800 overflow-hidden shrink-0 bg-neutral-50/60 dark:bg-neutral-900/40 px-2">
                                    <TabsList className="w-full flex justify-start rounded-none bg-transparent h-10 p-0 border-none overflow-x-auto overflow-y-hidden no-scrollbar">
                                        <TabsTrigger value="informasi" className="h-10 rounded-none px-4 bg-transparent after:hidden data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white text-neutral-500 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white font-semibold text-xs uppercase tracking-wider">Info Dasar</TabsTrigger>
                                        <TabsTrigger value="variabel" disabled={!(selectedTemplate?.parsedVars?.length > 0)} className="h-10 rounded-none px-4 bg-transparent after:hidden data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white text-neutral-500 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white font-semibold text-xs uppercase tracking-wider">Variabel</TabsTrigger>
                                        <TabsTrigger value="penandatangan" disabled={!(selectedTemplate && signatories.length > 0)} className="h-10 rounded-none px-4 bg-transparent after:hidden data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white text-neutral-500 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white font-semibold text-xs uppercase tracking-wider">Signer</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                        <TabsContent value="informasi" className="m-0 focus-visible:outline-none">
                                            <div className="flex items-center gap-2 text-primary font-medium pb-2 border-b mb-6">
                                                <Mail className="h-5 w-5" />
                                                Informasi Dasar
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="flex gap-1">Pilih Template <span className="text-destructive">*</span></Label>
                                                    <SearchableSelect
                                                        options={templates.map(t => ({ value: t.id.toString(), label: t.name }))}
                                                        value={formData.template_id}
                                                        onValueChange={(val) => setFormData(prev => ({ ...prev, template_id: val }))}
                                                        placeholder="Pilih template surat..."
                                                        disabled={true}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="flex gap-1">Tanggal Surat <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.letter_date}
                                                        onChange={(e) => setFormData({ ...formData, letter_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="flex gap-1">Perihal Surat <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        placeholder="Masukkan perihal surat..."
                                                        value={formData.subject}
                                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="variabel" className="m-0 focus-visible:outline-none">
                                            {selectedTemplate?.parsedVars?.length > 0 && (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2 text-primary font-medium pb-2 border-b">
                                                        <FileText className="h-5 w-5" />
                                                        Isi Variabel Dokumen
                                                    </div>

                                                    {selectedTemplate.parsedVars.filter((v: any) => !v.source || v.source === 'manual').length === 0 ? (
                                                        <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center border border-dashed">
                                                            Semua variabel pada template ini akan diisi secara otomatis oleh sistem saat surat dicetak.
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 gap-6">
                                                            {selectedTemplate.parsedVars
                                                                .filter((v: any) => !v.source || v.source === 'manual')
                                                                .map((v: any) => (
                                                                    <div key={v.key || v.name} className="space-y-2">
                                                                        <Label>{v.label || v.name || v.key}</Label>
                                                                        {v.type === 'textarea' ? (
                                                                            <Textarea
                                                                                value={formData.variable_values[v.key || v.name] || ''}
                                                                                onChange={(e) => {
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        variable_values: {
                                                                                            ...prev.variable_values,
                                                                                            [v.key || v.name]: e.target.value
                                                                                        }
                                                                                    }))
                                                                                }}
                                                                                placeholder={`Masukkan ${v.label?.toLowerCase() || v.name}...`}
                                                                                rows={4}
                                                                            />
                                                                        ) : (
                                                                            <Input
                                                                                type={v.type === 'date' ? 'date' : 'text'}
                                                                                value={formData.variable_values[v.key || v.name] || ''}
                                                                                onChange={(e) => {
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        variable_values: {
                                                                                            ...prev.variable_values,
                                                                                            [v.key || v.name]: e.target.value
                                                                                        }
                                                                                    }))
                                                                                }}
                                                                                placeholder={`Masukkan ${v.label?.toLowerCase() || v.name}...`}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="penandatangan" className="m-0 focus-visible:outline-none">
                                            {selectedTemplate && signatories.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck className="h-5 w-5 text-muted-foreground" />
                                                            <h3 className="font-semibold text-lg">Penanda Tangan</h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">Tentukan siapa yang akan menandatangani</p>
                                                    </div>

                                                    {signatories.map((sig, idx) => (
                                                        <div key={idx} className="border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-950 rounded-none space-y-3 relative overflow-hidden">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 border flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="font-semibold text-sm">{sig.role}</div>
                                                                    {sig.sub_role && <div className="text-xs text-muted-foreground">{sig.sub_role}</div>}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <SearchableSelect
                                                                    value={sig.user_id}
                                                                    onValueChange={(val) => {
                                                                        const newSigs = [...signatories];
                                                                        newSigs[idx].user_id = val;
                                                                        setSignatories(newSigs);
                                                                    }}
                                                                    options={users.map(u => ({
                                                                        value: u.id.toString(),
                                                                        label: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim()
                                                                    }))}
                                                                    placeholder="Cari penanda tangan..."
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-2 pt-1">
                                                                {sig.column && <div className="text-[11px] px-2 py-0.5 bg-slate-50 border rounded text-slate-600">Kolom {sig.column}</div>}
                                                                {sig.show_name && <div className="text-[11px] px-2 py-0.5 bg-slate-50 border rounded text-slate-600">Nama</div>}
                                                                {sig.show_nip && <div className="text-[11px] px-2 py-0.5 bg-slate-50 border rounded text-slate-600">NIP</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </form>
                        </div>

                    {/* Live Preview Pane */}
                    <div className="lg:col-span-7 flex flex-col bg-neutral-100/80 dark:bg-neutral-900/50">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2 flex items-center justify-between shrink-0">
                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-mono">
                                Pratinjau Surat
                            </span>
                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    onClick={() => setPreviewScale(Math.max(0.2, previewScale - 0.1))}
                                    title="Perkecil"
                                >
                                    <ZoomOut className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs font-mono w-10 text-center">
                                    {Math.round(previewScale * 100)}%
                                </span>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    onClick={() => setPreviewScale(Math.min(2.0, previewScale + 0.1))}
                                    title="Perbesar"
                                >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white ml-1 border-l border-neutral-200 dark:border-neutral-800 pl-2"
                                    onClick={() => setPreviewScale(0.67)}
                                    title="Reset Zoom"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-auto p-6 md:p-8 flex justify-center custom-scrollbar">
                            {selectedTemplate ? (
                                <TemplatePreview
                                    pageSettings={selectedTemplate.parsedPage}
                                    headerSettings={selectedTemplate.parsedHeader}
                                    contentBlocks={selectedTemplate.parsedContent}
                                    signatureSettings={selectedTemplate.parsedSig}
                                    footerSettings={selectedTemplate.parsedFooter || null}
                                    variableValues={previewVariableValues}
                                    signatoriesData={signatories.map(s => ({
                                        slot_id: s.slot_id,
                                        name: users.find(u => u.id.toString() === s.user_id)?.name || users.find(u => u.id.toString() === s.user_id)?.first_name || '(Nama Penandatangan)',
                                        nip: users.find(u => u.id.toString() === s.user_id)?.nip || ''
                                    }))}
                                    scale={previewScale}
                                />
                            ) : (
                                <div className="text-neutral-400 flex items-center justify-center h-full min-h-[300px]">
                                    <div className="text-center font-mono text-xs">
                                        <FileText className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                                        <p>Pilih template untuk melihat pratinjau surat.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Unified Card Footer */}
                <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5 shrink-0">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-4 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold shadow-none" 
                        onClick={() => navigate('/admin/outgoing-letters')} 
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button 
                        type="submit" 
                        size="sm" 
                        className="h-8 px-5 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold shadow-none gap-1.5" 
                        disabled={loading} 
                        form="letter-form"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
