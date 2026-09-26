import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ArrowLeft, Save, Eye, Mail, FileText, UserCheck, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OutgoingLetterCreate() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openTemplateBox, setOpenTemplateBox] = useState(false);

    const [formData, setFormData] = useState({
        template_id: '',
        subject: '',
        letter_date: new Date().toISOString().split('T')[0],
        variable_values: {} as any
    });

    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [signatories, setSignatories] = useState<any[]>([]);
    const [previewScale, setPreviewScale] = useState(0.67);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch Templates
                const resTpl = await fetch(`http://localhost:8080/api/document-templates?per_page=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataTpl = await resTpl.json();
                if (resTpl.ok) setTemplates(dataTpl.data || []);

                // Fetch Users for Signatories
                const resUsers = await fetch(`http://localhost:8080/api/users?perPage=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataUsers = await resUsers.json();
                if (resUsers.ok) setUsers(dataUsers.data || []);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }
        };
        fetchInitialData();
    }, []);

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
            setFormData(prev => ({ ...prev, variable_values: initialVars }));

            // initialize signatories based on signature_settings slots
            if (parsedSig && parsedSig.slots && Array.isArray(parsedSig.slots)) {
                const defaultSigs = parsedSig.slots.map((slot: any, idx: number) => ({
                    slot_id: slot.id || `slot_${idx}`,
                    user_id: '',
                    sign_order: idx + 1,
                    role: slot.label_position || slot.role || 'Penandatangan',
                    sub_role: slot.role || 'Penandatangan',
                    column: slot.text_align === 'left' ? 'Kiri' : slot.text_align === 'right' ? 'Kanan' : 'Tengah',
                    show_name: slot.show_name,
                    show_nip: slot.show_nip
                }));
                setSignatories(defaultSigs);
            } else {
                setSignatories([{ slot_id: 'director', user_id: '', sign_order: 1, role: 'Pimpinan' }]);
            }
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

            const res = await fetch(`http://localhost:8080/api/outgoing-letters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Surat keluar berhasil dibuat");
                navigate('/admin/outgoing-letters');
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal membuat surat");
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
                if (!previewVariableValues[key]) {
                    if (v.source === 'auto_number') previewVariableValues[key] = '[Nomor Otomatis]';
                    else if (v.source === 'auto_date') previewVariableValues[key] = formData.letter_date || new Date().toISOString().split('T')[0];
                    else if (v.source === 'auto_user') previewVariableValues[key] = '[Nama Penandatangan]';
                    else if (v.source === 'auto_unit') previewVariableValues[key] = '[Unit Kerja]';
                    else previewVariableValues[key] = '[Diisi Otomatis]';
                }
            }
        });
    }

    return (
        <AdminLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/admin/outgoing-letters')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-semibold">Buat Surat Keluar</h2>
                            <p className="text-sm text-muted-foreground">Formulir pembuatan draft surat keluar baru.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 relative pb-32">
                        <form id="letter-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <Tabs defaultValue="informasi" className="w-full">
                                    <div className="border-b mb-6">
                                        <TabsList className="w-full flex justify-start rounded-none bg-transparent h-12 p-0">
                                            <TabsTrigger value="informasi" className="h-12 rounded-none px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-primary">Info Dasar</TabsTrigger>
                                            <TabsTrigger value="variabel" disabled={!(selectedTemplate?.parsedVars?.length > 0)} className="h-12 rounded-none px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-primary">Variabel</TabsTrigger>
                                            <TabsTrigger value="penandatangan" disabled={!(selectedTemplate && signatories.length > 0)} className="h-12 rounded-none px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-primary">Signer</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="pr-2">
                                        <TabsContent value="informasi" className="m-0 focus-visible:outline-none">
                                            <div className="flex items-center gap-2 text-primary font-medium pb-2 border-b mb-6">
                                                <Mail className="h-5 w-5" />
                                                Informasi Dasar
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="flex gap-1">Pilih Template <span className="text-destructive">*</span></Label>
                                                    <Popover open={openTemplateBox} onOpenChange={setOpenTemplateBox}>
                                                        <PopoverTrigger render={
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openTemplateBox}
                                                                className="w-full justify-between bg-white text-left font-normal"
                                                            />
                                                        }>
                                                            {formData.template_id
                                                                ? (() => {
                                                                    const t = templates.find((t) => t.id.toString() === formData.template_id);
                                                                    return t ? `[${t.code || t.id}] ${t.name}` : "Pilih template surat...";
                                                                })()
                                                                : "Pilih template surat..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Cari template..." />
                                                                <CommandList>
                                                                    <CommandEmpty>Template tidak ditemukan.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {templates.map((t) => (
                                                                            <CommandItem
                                                                                key={t.id}
                                                                                value={`${t.code} ${t.name}`}
                                                                                onSelect={() => {
                                                                                    setFormData({ ...formData, template_id: t.id.toString() });
                                                                                    setOpenTemplateBox(false);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        formData.template_id === t.id.toString() ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {`[${t.code || t.id}] ${t.name}`}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
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
                                                        <Card key={idx} className="border p-4 bg-card shadow-sm space-y-4 relative overflow-hidden">
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
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>

                        </form>
                    </div>

                    {/* Live Preview Pane */}
                    <div className="lg:col-span-7">
                        <div className="h-[calc(100vh-120px)] sticky top-6 overflow-hidden bg-slate-100 flex flex-col border-l border-r border-t">
                            <div className="bg-white border-b py-2 px-4 shrink-0 flex items-center justify-between">
                                <div className="text-sm font-medium text-transparent">
                                    {/* Empty space for flex alignment */}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <button type="button" onClick={() => setPreviewScale(Math.max(0.2, previewScale - 0.1))} className="p-1 hover:bg-slate-100">
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-medium w-8 text-center">{Math.round(previewScale * 100)}%</span>
                                    <button type="button" onClick={() => setPreviewScale(Math.min(2.0, previewScale + 0.1))} className="p-1 hover:bg-slate-100 rounded">
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button type="button" onClick={() => setPreviewScale(0.67)} className="p-1 hover:bg-slate-100 rounded ml-2 border-l pl-3">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto flex justify-center py-8 relative">
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
                                    <div className="text-muted-foreground flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                            <p>Pilih template untuk melihat pratinjau surat.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate('/admin/outgoing-letters')} disabled={loading}>Batal</Button>
                    <Button type="submit" size="sm" className="h-9 px-6" disabled={loading} form="letter-form">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Menyimpan...' : 'Simpan Draft'}
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
