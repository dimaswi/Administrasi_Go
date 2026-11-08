import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
    ArrowLeft, Save,
    Loader2, ZoomIn, ZoomOut, RotateCcw, FileText
} from 'lucide-react';
import { useTemplateBuilder, getVariablesByTemplateType } from '@/hooks/use-template-builder';
import { PageSettingsPanel } from '@/components/document-template/page-settings-panel';
import { HeaderSettingsPanel } from '@/components/document-template/header-settings-panel';
import { ContentBlocksPanel } from '@/components/document-template/content-blocks-panel';
import { SignatureSettingsPanel } from '@/components/document-template/signature-settings-panel';
import { VariablesPanel } from '@/components/document-template/variables-panel';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { NumberingFormatBuilder } from '@/components/document-template/numbering-format-builder';
import { TemplateType } from '@/types/document-template';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api';

interface Props {
    categories?: string[];
}

export default function DocumentTemplateCreate({ categories = [] }: Props) {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewScale, setPreviewScale] = useState(0.67);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Provide default categories if empty
    const availableCategories = categories.length > 0 ? categories : ["Umum", "Kepegawaian", "Keuangan"];

    const {
        template,
        updateTemplate,
        updatePageSettings,
        updateMargins,
        updateDefaultFont,
        resetPageSettings,
        updateHeaderSettings,
        updateHeaderLogo,
        updateHeaderBorder,
        addHeaderTextLine,
        updateHeaderTextLine,
        removeHeaderTextLine,
        reorderHeaderTextLines,
        resetHeaderSettings,
        addContentBlock,
        updateContentBlock,
        updateContentBlockStyle,
        removeContentBlock,
        reorderContentBlocks,
        duplicateContentBlock,
        updateSignatureSettings,
        addSignatureSlot,
        updateSignatureSlot,
        removeSignatureSlot,
        updateFooterSettings,
        toggleFooter,
        addVariable,
        updateVariable,
        removeVariable,
    } = useTemplateBuilder();

    // Auto-fit preview scale based on container size and orientation
    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const container = previewContainerRef.current;
                const containerHeight = container.clientHeight - 80;
                const containerWidth = container.clientWidth - 48;
                
                // A4 dimensions in pixels at 96 DPI
                const isLandscape = template.page_settings?.orientation === 'landscape';
                const a4Width = isLandscape ? 1123 : 794;
                const a4Height = isLandscape ? 794 : 1123;
                
                const scaleByHeight = containerHeight / a4Height;
                const scaleByWidth = containerWidth / a4Width;
                const optimalScale = Math.min(scaleByHeight, scaleByWidth, 0.75);
                
                setPreviewScale(Math.max(0.3, optimalScale));
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [template.page_settings?.orientation]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!template.name?.trim()) {
            newErrors.name = 'Nama template wajib diisi';
        }
        if (!template.code?.trim()) {
            newErrors.code = 'Kode template wajib diisi';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) {
            setActiveTab('general');
            toast.error('Mohon lengkapi field wajib');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: template.name,
                code: template.code,
                category: template.category,
                description: template.description,
                template_type: template.template_type,
                page_settings: template.page_settings,
                header_settings: template.header_settings,
                content_blocks: template.content_blocks,
                signature_settings: template.signature_settings,
                footer_settings: template.footer_settings,
                variables: template.variables,
                numbering_format: template.numbering_format,
            };

            const res = await fetch(getApiUrl('/api/document-templates'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success('Template berhasil dibuat');
                navigate('/arsip/document-templates');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Gagal membuat template');
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal membuat template');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.67);
    };

    return (
        <AdminLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col lg:h-[calc(100vh-120px)]">
                {/* Unified Card Header */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate('/arsip/document-templates')} 
                            className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0"
                            title="Kembali"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                            <FileText className="size-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                Buat Template Surat
                            </h1>
                            <p className="text-[11px] text-neutral-500 font-mono truncate">
                                Rancang tata letak, variabel data dinamis, dan struktur dokumen surat resmi
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unified Card Body: 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 items-stretch overflow-hidden">
                    {/* Left Column: Form Settings Container */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full min-h-0 bg-white dark:bg-neutral-950 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
                            {/* Tab Navigation Header: Clean Kawan-Dolan Tabs (No scrollbar bug) */}
                            <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 px-2 shrink-0 flex items-center overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'general', label: 'Umum' },
                                    { id: 'page', label: 'Halaman' },
                                    { id: 'content', label: 'Konten' },
                                    { id: 'signature', label: 'TTD' },
                                    { id: 'variables', label: 'Variabel' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`h-10 px-3.5 flex items-center text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer rounded-none shrink-0 whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white bg-white dark:bg-neutral-950 -mb-px'
                                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Panels */}
                            <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                    <TabsContent value="general" className="m-0 focus-visible:outline-none space-y-4">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="name" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                                    Nama Template <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={template.name}
                                                    onChange={(e) => updateTemplate({ name: e.target.value })}
                                                    placeholder="Contoh: Surat Keputusan Direktur"
                                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                                />
                                                {errors.name && <p className="text-xs text-rose-500 font-mono">{errors.name}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="code" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                                        Kode Template <span className="text-rose-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="code"
                                                        value={template.code}
                                                        onChange={(e) => updateTemplate({ code: e.target.value.toUpperCase() })}
                                                        placeholder="SK"
                                                        className="h-9 uppercase font-mono rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                                    />
                                                    {errors.code && <p className="text-xs text-rose-500 font-mono">{errors.code}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="category" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Kategori</Label>
                                                    <SearchableSelect
                                                        value={template.category || '__none__'}
                                                        onValueChange={(value) => updateTemplate({ category: value === '__none__' ? null : value })}
                                                        options={[
                                                            { value: '__none__', label: 'Tanpa Kategori' },
                                                            ...availableCategories.map(cat => ({ value: cat, label: cat }))
                                                        ]}
                                                        placeholder="Pilih Kategori"
                                                        className="h-9 rounded-none border-neutral-200 dark:border-neutral-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="template_type" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Tipe Template</Label>
                                                <SearchableSelect
                                                    value={template.template_type}
                                                    onValueChange={(value: any) => {
                                                        const presetVariables = getVariablesByTemplateType(value as TemplateType);
                                                        updateTemplate({ 
                                                            template_type: value,
                                                            variables: presetVariables,
                                                        });
                                                    }}
                                                    options={[
                                                        { value: 'general', label: 'Umum' },
                                                        { value: 'leave', label: 'Surat Pengajuan Cuti' },
                                                        { value: 'early_leave', label: 'Surat Pengajuan Izin Pulang Cepat' },
                                                        { value: 'leave_response', label: 'Surat Balasan Cuti' },
                                                        { value: 'early_leave_response', label: 'Surat Balasan Izin Pulang Cepat' },
                                                    ]}
                                                    placeholder="Pilih Tipe Template"
                                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800"
                                                />
                                                <p className="text-[11px] text-neutral-500 font-mono">
                                                    {template.template_type === 'general' && 'Template surat umum dengan variabel manual'}
                                                    {template.template_type === 'leave' && 'Template surat permohonan cuti'}
                                                    {template.template_type === 'early_leave' && 'Template surat izin pulang cepat'}
                                                    {template.template_type === 'leave_response' && 'Template surat balasan permohonan cuti'}
                                                    {template.template_type === 'early_leave_response' && 'Template surat balasan izin pulang cepat'}
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="description" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Deskripsi</Label>
                                                <Textarea
                                                    id="description"
                                                    value={template.description || ''}
                                                    onChange={(e) => updateTemplate({ description: e.target.value })}
                                                    placeholder="Deskripsi singkat peruntukan template..."
                                                    rows={2}
                                                    className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                                />
                                            </div>

                                            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                                <NumberingFormatBuilder
                                                    value={template.numbering_format}
                                                    onChange={(format) => updateTemplate({ numbering_format: format })}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="page" className="m-0 focus-visible:outline-none space-y-5">
                                        <PageSettingsPanel
                                            settings={template.page_settings}
                                            onUpdate={updatePageSettings}
                                            onUpdateMargins={updateMargins}
                                            onUpdateDefaultFont={updateDefaultFont}
                                            onReset={resetPageSettings}
                                        />

                                        <HeaderSettingsPanel
                                            settings={template.header_settings}
                                            defaultFont={template.page_settings.default_font}
                                            onUpdate={updateHeaderSettings}
                                            onUpdateLogo={updateHeaderLogo}
                                            onUpdateBorder={updateHeaderBorder}
                                            onAddTextLine={addHeaderTextLine}
                                            onUpdateTextLine={updateHeaderTextLine}
                                            onRemoveTextLine={removeHeaderTextLine}
                                            onReorderTextLines={reorderHeaderTextLines}
                                            onReset={resetHeaderSettings}
                                        />
                                    </TabsContent>

                                    <TabsContent value="content" className="m-0 focus-visible:outline-none">
                                        <ContentBlocksPanel
                                            blocks={template.content_blocks}
                                            defaultFont={template.page_settings.default_font}
                                            variables={template.variables}
                                            onAdd={addContentBlock}
                                            onUpdate={updateContentBlock}
                                            onUpdateStyle={updateContentBlockStyle}
                                            onRemove={removeContentBlock}
                                            onReorder={reorderContentBlocks}
                                            onDuplicate={duplicateContentBlock}
                                        />
                                    </TabsContent>

                                    <TabsContent value="signature" className="m-0 focus-visible:outline-none">
                                        <SignatureSettingsPanel
                                            settings={template.signature_settings}
                                            totalPages={template.content_blocks.filter((b: any) => b.type === 'page-break').length + 1}
                                            variables={template.variables}
                                            onUpdate={updateSignatureSettings}
                                            onAddSlot={addSignatureSlot}
                                            onUpdateSlot={updateSignatureSlot}
                                            onRemoveSlot={removeSignatureSlot}
                                        />
                                    </TabsContent>

                                    <TabsContent value="variables" className="m-0 focus-visible:outline-none">
                                        <VariablesPanel
                                            variables={template.variables}
                                            templateType={template.template_type}
                                            onAdd={addVariable}
                                            onUpdate={updateVariable}
                                            onRemove={removeVariable}
                                        />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                    {/* Right Column: Live Document Preview */}
                    <div 
                        ref={previewContainerRef}
                        className="lg:col-span-7 flex flex-col bg-neutral-100 dark:bg-neutral-900 min-h-[500px]"
                    >
                        {/* Preview Toolbar */}
                        <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between px-3 shrink-0">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                <FileText className="h-3.5 w-3.5 text-neutral-500" />
                                <span>Pratinjau Lembar Surat</span>
                                <span className="text-[11px] font-mono text-neutral-400 font-normal">
                                    ({template.page_settings?.paper_size || 'A4'} • {template.page_settings?.orientation || 'portrait'})
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    onClick={() => handleZoom(-0.1)}
                                    disabled={previewScale <= 0.3}
                                    title="Perkecil"
                                >
                                    <ZoomOut className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs text-neutral-600 dark:text-neutral-400 w-12 text-center font-mono">
                                    {Math.round(previewScale * 100)}%
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    onClick={() => handleZoom(0.1)}
                                    disabled={previewScale >= 1}
                                    title="Perbesar"
                                >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                                <Separator orientation="vertical" className="h-4 mx-1" />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                    onClick={resetZoom}
                                    title="Reset Ukuran"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 min-h-0 overflow-auto p-6 md:p-8 flex justify-center custom-scrollbar bg-neutral-100/80 dark:bg-neutral-900/50">
                            <TemplatePreview
                                pageSettings={template.page_settings}
                                headerSettings={template.header_settings}
                                contentBlocks={template.content_blocks}
                                signatureSettings={template.signature_settings}
                                footerSettings={template.footer_settings}
                                scale={previewScale}
                            />
                        </div>
                    </div>
                </div>

                {/* Unified Card Footer */}
                <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5 shrink-0">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-4 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-xs font-semibold" 
                        onClick={() => navigate('/arsip/document-templates')} 
                        disabled={isSubmitting}
                    >
                        Batal
                    </Button>
                    <Button 
                        onClick={() => handleSubmit()} 
                        size="sm" 
                        className="h-8 px-5 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 shadow-none text-xs font-semibold gap-1.5" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Template'}</span>
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
