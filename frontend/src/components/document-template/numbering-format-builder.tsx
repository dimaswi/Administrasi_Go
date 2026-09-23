import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ChevronLeft, ChevronRight, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberingComponent {
    id: string;
    type: 'variable' | 'separator' | 'custom';
    value: string;
}

interface Props {
    value: string | null;
    onChange: (format: string | null) => void;
}

const AVAILABLE_VARIABLES = [
    { value: 'no', label: 'Nomor Urut', example: '001', description: 'Nomor urut otomatis per tahun' },
    { value: 'kode', label: 'Kode Template', example: 'SK', description: 'Kode dari template ini' },
    { value: 'unit', label: 'Kode Unit', example: 'SDM', description: 'Kode unit organisasi pembuat surat' },
    { value: 'bulan', label: 'Bulan (Romawi)', example: 'XII', description: 'Bulan dalam angka romawi' },
    { value: 'tahun', label: 'Tahun', example: '2025', description: 'Tahun saat ini' },
];

const AVAILABLE_SEPARATORS = [
    { value: '/', label: 'Slash (/)' },
    { value: '-', label: 'Dash (-)' },
    { value: '.', label: 'Dot (.)' },
    { value: '_', label: 'Underscore (_)' },
];

export function NumberingFormatBuilder({ value, onChange }: Props) {
    const parseFormat = (formatString: string | null): NumberingComponent[] => {
        if (!formatString) return [];
        
        // Parse existing format string
        const parsed: NumberingComponent[] = [];
        let i = 0;
        let currentId = 0;
        let customBuffer = '';
        
        const flushCustomBuffer = () => {
            if (customBuffer) {
                // Check if buffer is just a separator
                if (customBuffer.length === 1 && ['/', '-', '.', '_'].includes(customBuffer)) {
                    parsed.push({
                        id: `sep-${currentId++}`,
                        type: 'separator',
                        value: customBuffer,
                    });
                } else {
                    parsed.push({
                        id: `custom-${currentId++}`,
                        type: 'custom',
                        value: customBuffer,
                    });
                }
                customBuffer = '';
            }
        };
        
        while (i < formatString.length) {
            if (formatString[i] === '{') {
                flushCustomBuffer();
                const closeIndex = formatString.indexOf('}', i);
                if (closeIndex !== -1) {
                    const varName = formatString.substring(i + 1, closeIndex);
                    parsed.push({
                        id: `var-${currentId++}`,
                        type: 'variable',
                        value: varName,
                    });
                    i = closeIndex + 1;
                } else {
                    customBuffer += formatString[i];
                    i++;
                }
            } else {
                const char = formatString[i];
                // Single separator between variables
                if (['/', '-', '.', '_'].includes(char) && !customBuffer) {
                    parsed.push({
                        id: `sep-${currentId++}`,
                        type: 'separator',
                        value: char,
                    });
                } else {
                    customBuffer += char;
                }
                i++;
            }
        }
        
        flushCustomBuffer();
        
        return parsed;
    };

    const [components, setComponents] = useState<NumberingComponent[]>(() => parseFormat(value));

    // Sync components when value prop changes (for edit mode)
    useEffect(() => {
        const parsed = parseFormat(value);
        if (JSON.stringify(parsed.map(p => ({ type: p.type, value: p.value }))) !== 
            JSON.stringify(components.map(c => ({ type: c.type, value: c.value })))) {
            setComponents(parsed);
        }
    }, [value]);

    const [newVariable, setNewVariable] = useState<string>('');
    const [newSeparator, setNewSeparator] = useState<string>('/');
    const [newCustomText, setNewCustomText] = useState<string>('');

    const updateFormat = (newComponents: NumberingComponent[]) => {
        setComponents(newComponents);
        
        if (newComponents.length === 0) {
            onChange(null);
            return;
        }

        const format = newComponents
            .map(c => {
                if (c.type === 'variable') return `{${c.value}}`;
                return c.value; // separator or custom text
            })
            .join('');
        
        onChange(format);
    };

    const addVariable = () => {
        if (!newVariable) return;
        
        const newComponent: NumberingComponent = {
            id: `var-${Date.now()}`,
            type: 'variable',
            value: newVariable,
        };
        
        updateFormat([...components, newComponent]);
        setNewVariable('');
    };

    const addSeparator = () => {
        const newComponent: NumberingComponent = {
            id: `sep-${Date.now()}`,
            type: 'separator',
            value: newSeparator,
        };
        
        updateFormat([...components, newComponent]);
    };

    const addCustomText = () => {
        if (!newCustomText.trim()) return;
        
        const newComponent: NumberingComponent = {
            id: `custom-${Date.now()}`,
            type: 'custom',
            value: newCustomText.trim(),
        };
        
        updateFormat([...components, newComponent]);
        setNewCustomText('');
    };

    const removeComponent = (id: string) => {
        updateFormat(components.filter(c => c.id !== id));
    };

    const moveComponent = (id: string, direction: 'left' | 'right') => {
        const index = components.findIndex(c => c.id === id);
        if (index === -1) return;
        
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= components.length) return;
        
        const newComponents = [...components];
        [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
        updateFormat(newComponents);
    };

    const getVariableLabel = (value: string) => {
        return AVAILABLE_VARIABLES.find(v => v.value === value)?.label || value;
    };

    const getPreview = () => {
        return components
            .map(c => {
                if (c.type === 'separator' || c.type === 'custom') return c.value;
                const variable = AVAILABLE_VARIABLES.find(v => v.value === c.value);
                return variable?.example || `{${c.value}}`;
            })
            .join('');
    };

    const getComponentDisplay = (component: NumberingComponent) => {
        if (component.type === 'variable') {
            return getVariableLabel(component.value);
        }
        if (component.type === 'custom') {
            return component.value;
        }
        return component.value;
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs">Format Penomoran</Label>
                
                {/* Current Format Display */}
                {components.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30 min-h-[40px] items-center">
                            {components.map((component, index) => (
                                <div
                                    key={component.id}
                                    className="group flex items-center gap-0.5"
                                >
                                    <div className="flex items-center gap-0.5 bg-background border rounded px-1.5 py-0.5">
                                        {/* Move Left Button */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-4 w-4 transition-opacity hover:bg-muted",
                                                index === 0 ? "opacity-30 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
                                            )}
                                            onClick={() => moveComponent(component.id, 'left')}
                                            disabled={index === 0}
                                            title="Pindah ke kiri"
                                        >
                                            <ChevronLeft className="h-2.5 w-2.5" />
                                        </Button>
                                        
                                        {component.type === 'variable' ? (
                                            <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-mono">
                                                {getVariableLabel(component.value)}
                                            </Badge>
                                        ) : component.type === 'custom' ? (
                                            <Badge variant="outline" className="h-5 text-[10px] px-1.5 font-mono bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                                                <Type className="h-2.5 w-2.5 mr-1" />
                                                {component.value}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs font-mono text-muted-foreground px-1">
                                                {component.value}
                                            </span>
                                        )}
                                        
                                        {/* Move Right Button */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-4 w-4 transition-opacity hover:bg-muted",
                                                index === components.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
                                            )}
                                            onClick={() => moveComponent(component.id, 'right')}
                                            disabled={index === components.length - 1}
                                            title="Pindah ke kanan"
                                        >
                                            <ChevronRight className="h-2.5 w-2.5" />
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => removeComponent(component.id)}
                                            title="Hapus"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Preview */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Contoh:</span>
                            <code className="px-2 py-0.5 bg-muted rounded font-mono">
                                {getPreview()}
                            </code>
                        </div>
                    </div>
                )}

                {components.length === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-md text-center">
                        <p className="text-xs text-muted-foreground">
                            Belum ada komponen. Tambahkan variabel atau pemisah di bawah.
                        </p>
                    </div>
                )}
            </div>

            {/* Add Variable */}
            <div className="space-y-2">
                <Label className="text-xs">Tambah Variabel Dinamis</Label>
                <div className="flex gap-2">
                    <SearchableSelect 
                        value={newVariable} 
                        onValueChange={setNewVariable}
                        options={AVAILABLE_VARIABLES.map(v => ({
                            value: v.value,
                            label: v.label,
                            render: (
                                <div className="flex flex-col w-full text-left">
                                    <div className="flex items-center justify-between gap-4">
                                        <span>{v.label}</span>
                                        <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                            {v.example}
                                        </code>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {v.description}
                                    </span>
                                </div>
                            )
                        }))}
                        placeholder="Pilih variabel..."
                        className="h-8 text-xs flex-1"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3"
                        onClick={addVariable}
                        disabled={!newVariable}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Variabel akan diisi otomatis saat membuat surat
                </p>
            </div>

            {/* Add Custom Text */}
            <div className="space-y-2">
                <Label className="text-xs">Tambah Teks Kustom</Label>
                <div className="flex gap-2">
                    <Input
                        value={newCustomText}
                        onChange={(e) => setNewCustomText(e.target.value)}
                        placeholder="Contoh: HRD, KEUANGAN, dll"
                        className="h-8 text-xs flex-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomText();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3"
                        onClick={addCustomText}
                        disabled={!newCustomText.trim()}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Teks tetap yang tidak berubah (misal: kode departemen)
                </p>
            </div>

            {/* Add Separator */}
            <div className="space-y-2">
                <Label className="text-xs">Tambah Pemisah</Label>
                <div className="flex gap-2">
                    <SearchableSelect 
                        value={newSeparator} 
                        onValueChange={setNewSeparator}
                        options={AVAILABLE_SEPARATORS}
                        placeholder="Pilih pemisah..."
                        className="h-8 text-xs flex-1"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3"
                        onClick={addSeparator}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah
                    </Button>
                </div>
            </div>

            {components.length > 0 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => updateFormat([])}
                >
                    <X className="h-3 w-3 mr-1" />
                    Hapus Semua
                </Button>
            )}

            <p className="text-[10px] text-muted-foreground">
                Contoh hasil: <code className="font-mono">001/SK/SDM/XII/2025</code>
            </p>
        </div>
    );
}
