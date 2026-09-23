import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HeaderSettings, HeaderTextLine, PageSettings } from '@/types/document-template';
import { ChevronDown, ChevronUp, GripVertical, Plus, RotateCcw, Trash2, Upload, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Image, ImageIcon, Type, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useRef } from 'react';

interface HeaderSettingsPanelProps {
    settings: HeaderSettings;
    defaultFont: PageSettings['default_font'];
    onUpdate: (updates: Partial<HeaderSettings>) => void;
    onUpdateLogo: (updates: Partial<HeaderSettings['logo']>) => void;
    onUpdateBorder: (updates: Partial<HeaderSettings['border_bottom']>) => void;
    onAddTextLine: () => void;
    onUpdateTextLine: (id: string, updates: Partial<HeaderTextLine>) => void;
    onRemoveTextLine: (id: string) => void;
    onReorderTextLines: (fromIndex: number, toIndex: number) => void;
    onReset: () => void;
}

const fontFamilyOptions = [
    { value: '__default__', label: 'Default' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
];

export function HeaderSettingsPanel({
    settings,
    defaultFont,
    onUpdate,
    onUpdateLogo,
    onUpdateBorder,
    onAddTextLine,
    onUpdateTextLine,
    onRemoveTextLine,
    onReorderTextLines,
    onReset,
}: HeaderSettingsPanelProps) {
    const [isLogoOpen, setIsLogoOpen] = useState(false);
    const [isBorderOpen, setIsBorderOpen] = useState(false);
    const [isTextOpen, setIsTextOpen] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const headerImageInputRef = useRef<HTMLInputElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onUpdateLogo({ src: e.target?.result as string, enabled: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onUpdate({ 
                    header_image: { 
                        ...settings.header_image,
                        src: e.target?.result as string, 
                        enabled: true 
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            onReorderTextLines(draggedIndex, index);
            setDraggedIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="space-y-3">
            {/* Header Toggle */}
            <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                    <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => onUpdate({ enabled: checked })}
                    />
                    <span className="text-xs font-medium">Aktifkan Kop Surat</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onReset} title="Reset ke default" className="h-6 w-6 p-0">
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>

            {settings.enabled && (
                <div className="space-y-3">
                    {/* Mode Kop Surat */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Jenis Kop</Label>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant={!settings.use_image ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => onUpdate({ use_image: false })}
                            >
                                <Type className="h-3.5 w-3.5 mr-1.5" />
                                Logo + Teks
                            </Button>
                            <Button
                                type="button"
                                variant={settings.use_image ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => onUpdate({ use_image: true })}
                            >
                                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                Gambar Kop
                            </Button>
                        </div>
                    </div>

                    {/* Mode: Gambar Kop Lengkap */}
                    {settings.use_image && (
                        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Gambar Kop Surat</Label>
                                {settings.header_image?.src && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-destructive hover:text-destructive"
                                        onClick={() => onUpdate({ 
                                            header_image: { ...settings.header_image, src: null, enabled: false }
                                        })}
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Hapus
                                    </Button>
                                )}
                            </div>
                            
                            <input
                                type="file"
                                ref={headerImageInputRef}
                                onChange={handleHeaderImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            
                            {!settings.header_image?.src ? (
                                <div 
                                    className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => headerImageInputRef.current?.click()}
                                >
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Klik untuk upload gambar kop surat
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Gambar akan ditampilkan full width
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="border rounded overflow-hidden bg-white">
                                        <img 
                                            src={settings.header_image.src} 
                                            alt="Kop Surat" 
                                            className="w-full h-auto"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-7"
                                        onClick={() => headerImageInputRef.current?.click()}
                                    >
                                        <Upload className="h-3 w-3 mr-1" />
                                        Ganti Gambar
                                    </Button>
                                </div>
                            )}

                            {/* Tinggi Gambar */}
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Tinggi (mm) - kosongkan untuk auto</Label>
                                <Input
                                    type="number"
                                    value={settings.header_image?.height || ''}
                                    onChange={(e) => onUpdate({ 
                                        header_image: { 
                                            ...settings.header_image,
                                            height: e.target.value ? parseFloat(e.target.value) : null 
                                        }
                                    })}
                                    placeholder="Auto"
                                    className="h-7"
                                />
                            </div>

                            {/* Jarak ke Isi */}
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Jarak ke Isi (mm)</Label>
                                <Input
                                    type="number"
                                    value={settings.margin_bottom}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val)) onUpdate({ margin_bottom: val });
                                    }}
                                    className="h-7"
                                />
                            </div>

                            {/* Border Bottom */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Switch
                                    checked={settings.border_bottom.enabled}
                                    onCheckedChange={(checked) => onUpdateBorder({ enabled: checked })}
                                />
                                <Label className="text-xs">Garis Bawah</Label>
                            </div>

                            {settings.border_bottom.enabled && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Style</Label>
                                        <SearchableSelect
            value={settings.border_bottom.style}
            onValueChange={(val) => onUpdate({ border_bottom: { ...settings.border_bottom, style: val as any } })}
            options={[{ value: 'single', label: 'Single' }, { value: 'double', label: 'Double' }]}
            className="h-7 text-xs"
        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Tebal</Label>
                                        <Input
                                            type="number"
                                            value={settings.border_bottom.width}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) onUpdateBorder({ width: val });
                                            }}
                                            className="h-7"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Warna</Label>
                                        <Input
                                            type="color"
                                            value={settings.border_bottom.color}
                                            onChange={(e) => onUpdateBorder({ color: e.target.value })}
                                            className="h-7 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode: Logo + Teks */}
                    {!settings.use_image && (
                        <>
                            {/* Dimensi Kop */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Dimensi Kop</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Tinggi (mm)</Label>
                                        <Input
                                            type="number"
                                            value={settings.height}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) onUpdate({ height: val });
                                            }}
                                            className="h-7"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Jarak ke Isi (mm)</Label>
                                        <Input
                                            type="number"
                                            value={settings.margin_bottom}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) onUpdate({ margin_bottom: val });
                                            }}
                                            className="h-7"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logo Section */}
                            <Collapsible open={isLogoOpen} onOpenChange={setIsLogoOpen}>
                                <CollapsibleTrigger
                                    render={
                                        <Button variant="ghost" className="w-full justify-between px-2 py-1.5 h-auto hover:bg-muted/50 border-b">
                                            <div className="flex items-center gap-2">
                                                <Image className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-xs font-medium">Logo</span>
                                                {settings.logo.enabled && settings.logo.src && (
                                                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Aktif</span>
                                                )}
                                            </div>
                                            {isLogoOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                        </Button>
                                    }
                                />
                                <CollapsibleContent className="pt-3 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={settings.logo.enabled}
                                            onCheckedChange={(checked) => onUpdateLogo({ enabled: checked })}
                                        />
                                        <Label className="text-xs">Tampilkan Logo</Label>
                                    </div>

                                    {settings.logo.enabled && (
                                        <div className="space-y-3 pl-2 border-l-2 border-muted">
                                            {/* Upload & Preview */}
                                            <div className="flex gap-3 items-start">
                                                <input
                                                    type="file"
                                                    ref={logoInputRef}
                                                    onChange={handleLogoUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="h-7"
                                                >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    Upload
                                                </Button>
                                                {settings.logo.src && (
                                                    <div className="relative w-12 h-12 border rounded overflow-hidden bg-white">
                                                        <img 
                                                            src={settings.logo.src} 
                                                            alt="Logo" 
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Posisi Logo */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground">Posisi</Label>
                                                <div className="flex gap-1">
                                                    {(['left', 'center', 'right'] as const).map((pos) => (
                                                        <Button
                                                            key={pos}
                                                            type="button"
                                                            variant={settings.logo.position === pos ? 'default' : 'outline'}
                                                            size="sm"
                                                            className="h-6 text-[10px] flex-1"
                                                            onClick={() => onUpdateLogo({ position: pos })}
                                                        >
                                                            {pos === 'left' ? 'Kiri' : pos === 'center' ? 'Tengah' : 'Kanan'}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Ukuran Logo */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Lebar (mm)</Label>
                                                    <Input
                                                        type="number"
                                                        value={settings.logo.width}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) onUpdateLogo({ width: val });
                                                        }}
                                                        className="h-7"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Tinggi (mm)</Label>
                                                    <Input
                                                        type="number"
                                                        value={settings.logo.height || ''}
                                                        onChange={(e) => onUpdateLogo({ 
                                                            height: e.target.value ? parseFloat(e.target.value) : null 
                                                        })}
                                                        placeholder="Auto"
                                                        className="h-7"
                                                    />
                                                </div>
                                            </div>

                                            {/* Margin Logo */}
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Jarak dari tepi (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.logo.margin}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) onUpdateLogo({ margin: val });
                                                    }}
                                                    className="h-7"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Garis Bawah Section */}
                            <Collapsible open={isBorderOpen} onOpenChange={setIsBorderOpen}>
                                <CollapsibleTrigger
                                    render={
                                        <Button variant="ghost" className="w-full justify-between px-2 py-1.5 h-auto hover:bg-muted/50 border-b">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3.5 w-3.5 flex flex-col justify-center gap-0.5">
                                                    <div className="h-px bg-muted-foreground" />
                                                    <div className="h-px bg-muted-foreground" />
                                                </div>
                                                <span className="text-xs font-medium">Garis Bawah</span>
                                                {settings.border_bottom.enabled && (
                                                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Aktif</span>
                                                )}
                                            </div>
                                            {isBorderOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                        </Button>
                                    }
                                />
                                <CollapsibleContent className="pt-3 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={settings.border_bottom.enabled}
                                            onCheckedChange={(checked) => onUpdateBorder({ enabled: checked })}
                                        />
                                        <Label className="text-xs">Tampilkan Garis</Label>
                                    </div>

                                    {settings.border_bottom.enabled && (
                                        <div className="space-y-3 pl-2 border-l-2 border-muted">
                                            {/* Style Garis */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground">Style</Label>
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant={settings.border_bottom.style === 'single' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-6 flex-1 text-[10px]"
                                                        onClick={() => onUpdateBorder({ style: 'single' })}
                                                    >
                                                        Single
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={settings.border_bottom.style === 'double' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-6 flex-1 text-[10px]"
                                                        onClick={() => onUpdateBorder({ style: 'double' })}
                                                    >
                                                        Double
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Tebal (px)</Label>
                                                    <Input
                                                        type="number"
                                                        value={settings.border_bottom.width}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) onUpdateBorder({ width: val });
                                                        }}
                                                        className="h-7"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Warna</Label>
                                                    <Input
                                                        type="color"
                                                        value={settings.border_bottom.color}
                                                        onChange={(e) => onUpdateBorder({ color: e.target.value })}
                                                        className="h-7 p-1 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Teks Kop Section */}
                            <Collapsible open={isTextOpen} onOpenChange={setIsTextOpen}>
                                <CollapsibleTrigger
                                    render={
                                        <Button variant="ghost" className="w-full justify-between px-2 py-1.5 h-auto hover:bg-muted/50 border-b">
                                            <div className="flex items-center gap-2">
                                                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-xs font-medium">Teks KOP Surat</span>
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1">{settings.text_lines.length}</Badge>
                                            </div>
                                            {isTextOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                        </Button>
                                    }
                                />
                                <CollapsibleContent className="pt-3 space-y-2">
                                    {/* Add Button */}
                                    <Button type="button" variant="outline" size="sm" onClick={onAddTextLine} className="w-full h-7">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Tambah Baris
                                    </Button>

                                    {/* Text Lines */}
                                    <div className="space-y-2">
                                        {settings.text_lines.map((line, index) => (
                                            <div
                                                key={line.id}
                                                draggable
                                                onDragStart={() => handleDragStart(index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`border rounded-md p-2 space-y-2 bg-muted/20 ${
                                                    draggedIndex === index ? 'opacity-50 ring-2 ring-primary' : ''
                                                }`}
                                            >
                                                {/* Baris Utama */}
                                                <div className="flex items-center gap-1.5">
                                                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-move shrink-0" />
                                                    <span className="text-[10px] text-muted-foreground w-4 shrink-0">{index + 1}.</span>
                                                    <Input
                                                        value={line.content}
                                                        onChange={(e) => onUpdateTextLine(line.id, { content: e.target.value })}
                                                        placeholder="Isi teks..."
                                                        className="flex-1 h-6 text-xs"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 shrink-0 hover:bg-destructive/10"
                                                        onClick={() => onRemoveTextLine(line.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </div>

                                                {/* Format Controls */}
                                                <div className="flex items-center gap-1 pl-6">
                                                    {/* Font Family */}
                                                    <SearchableSelect
            value={line.font_family || '__default__'}
            onValueChange={(val) => onUpdateTextLine(line.id, { font_family: val === '__default__' ? null : val })}
            options={fontFamilyOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            className="w-20 h-5 text-[9px] px-1"
        />

                                                    {/* Font Size */}
                                                    <Input
                                                        type="number"
                                                        value={line.font_size}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) onUpdateTextLine(line.id, { font_size: val });
                                                        }}
                                                        className="w-10 h-5 text-[9px] px-1 text-center"
                                                    />

                                                    {/* Bold */}
                                                    <Button
                                                        type="button"
                                                        variant={line.font_weight === 'bold' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-5 w-5 p-0"
                                                        onClick={() => onUpdateTextLine(line.id, { 
                                                            font_weight: line.font_weight === 'bold' ? 'normal' : 'bold' 
                                                        })}
                                                    >
                                                        <Bold className="h-2.5 w-2.5" />
                                                    </Button>

                                                    {/* Italic */}
                                                    <Button
                                                        type="button"
                                                        variant={line.font_style === 'italic' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-5 w-5 p-0"
                                                        onClick={() => onUpdateTextLine(line.id, { 
                                                            font_style: line.font_style === 'italic' ? 'normal' : 'italic' 
                                                        })}
                                                    >
                                                        <Italic className="h-2.5 w-2.5" />
                                                    </Button>

                                                    {/* Separator */}
                                                    <div className="w-px h-4 bg-border mx-0.5" />

                                                    {/* Alignment */}
                                                    <div className="flex border rounded">
                                                        <Button
                                                            type="button"
                                                            variant={line.text_align === 'left' ? 'secondary' : 'ghost'}
                                                            size="sm"
                                                            className="h-5 w-5 p-0 rounded-r-none"
                                                            onClick={() => onUpdateTextLine(line.id, { text_align: 'left' })}
                                                        >
                                                            <AlignLeft className="h-2.5 w-2.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={line.text_align === 'center' ? 'secondary' : 'ghost'}
                                                            size="sm"
                                                            className="h-5 w-5 p-0 rounded-none border-x"
                                                            onClick={() => onUpdateTextLine(line.id, { text_align: 'center' })}
                                                        >
                                                            <AlignCenter className="h-2.5 w-2.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={line.text_align === 'right' ? 'secondary' : 'ghost'}
                                                            size="sm"
                                                            className="h-5 w-5 p-0 rounded-l-none"
                                                            onClick={() => onUpdateTextLine(line.id, { text_align: 'right' })}
                                                        >
                                                            <AlignRight className="h-2.5 w-2.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {settings.text_lines.length === 0 && (
                                        <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">
                                            Belum ada teks kop surat
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
