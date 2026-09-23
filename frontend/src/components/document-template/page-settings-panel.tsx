import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageSettings } from '@/types/document-template';
import { RotateCcw } from 'lucide-react';

interface PageSettingsPanelProps {
    settings: PageSettings;
    onUpdate: (updates: Partial<PageSettings>) => void;
    onUpdateMargins: (updates: Partial<PageSettings['margins']>) => void;
    onUpdateDefaultFont: (updates: Partial<PageSettings['default_font']>) => void;
    onReset: () => void;
}

const paperSizeOptions = [
    { value: 'A4', label: 'A4 (210 × 297 mm)' },
    { value: 'Letter', label: 'Letter (216 × 279 mm)' },
    { value: 'Legal', label: 'Legal (216 × 356 mm)' },
    { value: 'F4', label: 'F4/Folio (215 × 330 mm)' },
];

const fontFamilyOptions = [
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Courier New', label: 'Courier New' },
];

export function PageSettingsPanel({
    settings,
    onUpdate,
    onUpdateMargins,
    onUpdateDefaultFont,
    onReset,
}: PageSettingsPanelProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Pengaturan Halaman</h3>
                <Button variant="ghost" size="sm" onClick={onReset} title="Reset ke default" className="h-7 w-7 p-0">
                    <RotateCcw className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
                <Label className="text-xs">Ukuran Kertas</Label>
                <SearchableSelect
            value={settings.paper_size}
            onValueChange={(value) => onUpdate({ paper_size: value as any })}
            options={paperSizeOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            className="h-9"
        />
            </div>

            {/* Orientation */}
            <div className="space-y-2">
                <Label className="text-xs">Orientasi</Label>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={settings.orientation === 'portrait' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => onUpdate({ orientation: 'portrait' })}
                    >
                        Portrait
                    </Button>
                    <Button
                        type="button"
                        variant={settings.orientation === 'landscape' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => onUpdate({ orientation: 'landscape' })}
                    >
                        Landscape
                    </Button>
                </div>
            </div>

            {/* Margins */}
            <div className="space-y-2">
                <Label className="text-xs">Margin (mm)</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Atas</Label>
                        <Input
                            type="number"
                            value={settings.margins.top}
                            onChange={(e) => onUpdateMargins({ top: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            step={1}
                            className="h-8"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Bawah</Label>
                        <Input
                            type="number"
                            value={settings.margins.bottom}
                            onChange={(e) => onUpdateMargins({ bottom: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            step={1}
                            className="h-8"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Kiri</Label>
                        <Input
                            type="number"
                            value={settings.margins.left}
                            onChange={(e) => onUpdateMargins({ left: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            step={1}
                            className="h-8"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Kanan</Label>
                        <Input
                            type="number"
                            value={settings.margins.right}
                            onChange={(e) => onUpdateMargins({ right: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            step={1}
                            className="h-8"
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Default Font */}
            <div className="space-y-3">
                <Label className="text-xs font-medium">Font Default</Label>
                
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground">Jenis Font</Label>
                    <SearchableSelect
            value={settings.default_font.family}
            onValueChange={(value) => onUpdateDefaultFont({ family: value })}
            options={fontFamilyOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            className="h-8"
        />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Ukuran (pt)</Label>
                        <Input
                            type="number"
                            value={settings.default_font.size}
                            onChange={(e) => onUpdateDefaultFont({ size: parseFloat(e.target.value) || 12 })}
                            min={8}
                            max={72}
                            step={0.5}
                            className="h-8"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Spasi Baris</Label>
                        <Input
                            type="number"
                            value={settings.default_font.line_height}
                            onChange={(e) => onUpdateDefaultFont({ line_height: parseFloat(e.target.value) || 1.5 })}
                            min={1}
                            max={3}
                            step={0.1}
                            className="h-8"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
