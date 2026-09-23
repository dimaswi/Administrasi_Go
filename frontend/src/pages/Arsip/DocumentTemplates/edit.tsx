import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Save, Eye,
    Loader2, ZoomIn, ZoomOut, RotateCcw, Check
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

export default function DocumentTemplateEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [initialTemplate, setInitialTemplate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch template
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:8080/api/document-templates/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setInitialTemplate(json.data);
                } else {
                    toast.error("Template tidak ditemukan");
                    navigate('/arsip/document-templates');
                }
            } catch (err) {
                toast.error("Gagal mengambil data template");
                navigate('/arsip/document-templates');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplate();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[calc(100vh-140px)]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    if (!initialTemplate) return null;

    return <EditForm initialTemplate={initialTemplate} categories={["Umum", "Kepegawaian", "Keuangan"]} />;
}

function EditForm({ initialTemplate, categories }: { initialTemplate: any, categories: string[] }) {
    const availableCategories = categories.length > 0 ? categories : ["Umum", "Kepegawaian", "Keuangan"];
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewScale, setPreviewScale] = useState(0.6);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const breadcrumbs = [
        { title: 'Arsip', href: '/arsip' },
        { title: 'Template Surat', href: '/arsip/document-templates' },
        { title: initialTemplate.name, href: '#' },
    ];

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
    } = useTemplateBuilder(initialTemplate);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        setSaveSuccess(false);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/document-templates/${initialTemplate.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(template)
            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Gagal menyimpan template');
            }
        } catch (err) {
            toast.error('Gagal menyimpan template');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = () => {
        window.open(`/arsip/document-templates/${initialTemplate.id}/preview`, '_blank');
    };

    const handleZoom = (delta: number) => {
        setPreviewScale(prev => Math.min(1, Math.max(0.3, prev + delta)));
    };

    const resetZoom = () => {
        setPreviewScale(0.6);
    };

    return (
        <AdminLayout>
            <div className="w-full">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/arsip/document-templates')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-sm font-semibold leading-none">{initialTemplate.name}</h1>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {initialTemplate.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {saveSuccess && (
                            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                                <Check className="h-3 w-3" />
                                Tersimpan
                            </Badge>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={handlePreview}>
                            <Eye className="h-4 w-4 mr-1.5" />
                            Preview
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1.5" />
                            )}
                            Simpan
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Panel - Settings */}
                    <div className="lg:col-span-5 relative pb-32">
                        <div className="flex flex-col overflow-visible">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                                <TabsList className="w-full justify-start border-b rounded-none h-11 bg-transparent p-0 space-x-6">
                                    <TabsTrigger
                                        value="general"
                                        className="bg-transparent text-muted-foreground shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1 text-sm font-medium"
                                    >
                                        Umum
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="page"
                                        className="bg-transparent text-muted-foreground shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1 text-sm font-medium"
                                    >
                                        Halaman
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="content"
                                        className="bg-transparent text-muted-foreground shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1 text-sm font-medium"
                                    >
                                        Konten
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="signature"
                                        className="bg-transparent text-muted-foreground shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1 text-sm font-medium"
                                    >
                                        TTD
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="variables"
                                        className="bg-transparent text-muted-foreground shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2 px-1 text-sm font-medium"
                                    >
                                        Variabel
                                    </TabsTrigger>
                                </TabsList>


                                <TabsContent value="general" className="m-0 mt-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs">
                                                Nama Template <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={template.name}
                                                onChange={(e) => updateTemplate({ name: e.target.value })}
                                                placeholder="Surat Keputusan"
                                                className="h-9"
                                            />
                                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="code" className="text-xs">
                                                    Kode <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="code"
                                                    value={template.code}
                                                    onChange={(e) => updateTemplate({ code: e.target.value.toUpperCase() })}
                                                    placeholder="SK"
                                                    className="h-9 uppercase font-mono"
                                                />
                                                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="category" className="text-xs">Kategori</Label>
                                                <SearchableSelect
                                                    value={template.category || '__none__'}
                                                    onValueChange={(value) => updateTemplate({ category: value === '__none__' ? null : value })}
                                                    options={[
                                                        { value: '__none__', label: 'Tanpa Kategori' },
                                                        ...availableCategories.map(cat => ({ value: cat, label: cat }))
                                                    ]}
                                                    placeholder="Pilih"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="template_type" className="text-xs">Tipe Template</Label>
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
                                                placeholder="Pilih tipe"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-xs">Deskripsi</Label>
                                            <Textarea
                                                id="description"
                                                value={template.description || ''}
                                                onChange={(e) => updateTemplate({ description: e.target.value || null })}
                                                placeholder="Deskripsi singkat..."
                                                rows={2}
                                                className="resize-none text-sm"
                                            />
                                        </div>

                                        <Separator />

                                        <NumberingFormatBuilder
                                            value={template.numbering_format || ''}
                                            onChange={(format) => updateTemplate({ numbering_format: format })}
                                        />

                                        <Separator />

                                        <div className="space-y-2">
                                            <Label htmlFor="is_active" className="text-xs">Status</Label>
                                            <SearchableSelect
                                                value={template.is_active ? 'true' : 'false'}
                                                onValueChange={(value) => updateTemplate({ is_active: value === 'true' })}
                                                options={[
                                                    { value: 'true', label: 'Aktif' },
                                                    { value: 'false', label: 'Nonaktif' },
                                                ]}
                                                placeholder="Pilih status"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="page" className="m-0 mt-6 space-y-4">
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

                                <TabsContent value="content" className="m-0 mt-6">
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

                                <TabsContent value="signature" className="m-0 mt-6">
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

                                <TabsContent value="variables" className="m-0 mt-6">
                                    <VariablesPanel
                                        variables={template.variables}
                                        templateType={template.template_type}
                                        onAdd={addVariable}
                                        onUpdate={updateVariable}
                                        onRemove={removeVariable}
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="lg:col-span-7">
                        <div
                            ref={previewContainerRef}
                            className="h-[calc(100vh-120px)] sticky top-6 overflow-hidden bg-slate-100 flex flex-col border-l border-r border-t"
                        >
                            {/* Preview Toolbar */}
                            <div className="h-10 border-b bg-background/80 backdrop-blur-sm flex items-center justify-center gap-1 px-4 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleZoom(-0.1)}
                                    disabled={previewScale <= 0.3}
                                >
                                    <ZoomOut className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs text-muted-foreground w-12 text-center font-mono">
                                    {Math.round(previewScale * 100)}%
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleZoom(0.1)}
                                    disabled={previewScale >= 1}
                                >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                                <Separator orientation="vertical" className="h-4 mx-1" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={resetZoom}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 overflow-auto">
                                <div
                                    className="min-h-full min-w-full flex items-start justify-center p-6"
                                    style={{
                                        minWidth: template.page_settings?.orientation === 'landscape'
                                            ? Math.max(1123 * previewScale + 48, '100%' as any)
                                            : '100%'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: (template.page_settings?.orientation === 'landscape' ? 1123 : 794) * previewScale,
                                            height: (template.page_settings?.orientation === 'landscape' ? 794 : 1123) * previewScale,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            className="shadow-2xl origin-top-left"
                                            style={{ transform: `scale(${previewScale})` }}
                                        >
                                            <TemplatePreview
                                                pageSettings={template.page_settings}
                                                headerSettings={template.header_settings}
                                                contentBlocks={template.content_blocks}
                                                signatureSettings={template.signature_settings}
                                                footerSettings={template.footer_settings}
                                                scale={1}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate('/arsip/document-templates')} disabled={isSubmitting}>Batal</Button>
                    <Button onClick={handleSubmit} size="sm" className="h-9 px-6" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </div>
            </div>
        </AdminLayout>

    );
}
