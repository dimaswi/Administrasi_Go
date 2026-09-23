import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContentBlock, BlockStyle, PageSettings, FieldItem, FieldGroupConfig, defaultFieldItem, defaultFieldGroupConfig, TemplateVariable, PageBreakConfig, defaultPageBreakConfig, LetterOpeningConfig, defaultLetterOpeningConfig, RecipientSlot, defaultRecipientSlot, defaultLetterDateConfig, TableConfig, TableCell, defaultTableConfig, defaultTableCell } from '@/types/document-template';
import {
    ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type, Pilcrow, Minus, Settings2, List, Variable, Zap, FileText, Mail,
    Calendar, User, MapPin, Building, Table
} from 'lucide-react';
import { useState } from 'react';

interface ContentBlocksPanelProps {
    blocks: ContentBlock[];
    defaultFont: PageSettings['default_font'];
    variables?: TemplateVariable[];
    onAdd: (type: ContentBlock['type']) => void;
    onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
    onUpdateStyle: (id: string, styleUpdates: Partial<BlockStyle>) => void;
    onRemove: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onDuplicate: (id: string) => void;
}

const fontFamilyOptions = [
    { value: '__default__', label: 'Default' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Courier New', label: 'Courier New' },
];

const blockTypeOptions = [
    { value: 'letter-opening', label: 'Pembuka Surat', icon: Mail },
    { value: 'text', label: 'Teks', icon: Type },
    { value: 'paragraph', label: 'Paragraf', icon: Pilcrow },
    { value: 'field-group', label: 'Field', icon: List },
    { value: 'table', label: 'Tabel', icon: Table },
    { value: 'spacer', label: 'Spasi', icon: Minus },
    { value: 'page-break', label: 'Halaman Baru', icon: FileText },
];

// Recipient slot type options
const recipientSlotTypeOptions = [
    { value: 'label', label: 'Label (Yth.)', icon: Mail },
    { value: 'title', label: 'Jabatan', icon: Building },
    { value: 'name', label: 'Nama', icon: User },
    { value: 'address', label: 'Alamat', icon: MapPin },
    { value: 'custom', label: 'Kustom', icon: Type },
];

// Letter Opening Editor Component
interface LetterOpeningEditorProps {
    block: ContentBlock;
    variables?: TemplateVariable[];
    onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
}

function LetterOpeningEditor({ block, variables = [], onUpdate }: LetterOpeningEditorProps) {
    const config = block.letter_opening || defaultLetterOpeningConfig;
    const dateConfig = config.date || defaultLetterDateConfig;

    // Get variable options for dropdown
    const dateVariables = variables.filter(v => v.type === 'date' || (v.key && v.key.toLowerCase().includes('tanggal')));
    const textVariables = variables.filter(v => v.type === 'text' || v.type === 'textarea');

    // Helper functions
    const generateId = () => `rs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const updateConfig = (updates: Partial<LetterOpeningConfig>) => {
        onUpdate(block.id, {
            letter_opening: { ...config, ...updates }
        });
    };

    const updateDateConfig = (updates: Partial<typeof dateConfig>) => {
        onUpdate(block.id, {
            letter_opening: {
                ...config,
                date: { ...dateConfig, ...updates }
            }
        });
    };

    const addRecipientSlot = (column: number) => {
        const newSlot: RecipientSlot = {
            ...defaultRecipientSlot,
            id: generateId(),
            column,
            order: config.recipient_slots.filter(s => s.column === column).length,
            type: 'label',
            source: 'manual',
            text: 'Yth.',
            prefix: '',
            text_align: 'left',
        };
        updateConfig({
            recipient_slots: [...config.recipient_slots, newSlot]
        });
    };

    const updateRecipientSlot = (slotId: string, updates: Partial<RecipientSlot>) => {
        updateConfig({
            recipient_slots: config.recipient_slots.map(s =>
                s.id === slotId ? { ...s, ...updates } : s
            )
        });
    };

    const removeRecipientSlot = (slotId: string) => {
        updateConfig({
            recipient_slots: config.recipient_slots.filter(s => s.id !== slotId)
        });
    };

    const getColumnSlots = (column: number) => {
        return config.recipient_slots
            .filter(s => s.column === column)
            .sort((a, b) => a.order - b.order);
    };

    const columnCount = config.recipient_layout === '2-column' ? 2 : 1;

    // Format date to Indonesian format
    const formatDateIndonesian = (dateStr: string) => {
        if (!dateStr) return '';
        // Already in Indonesian format like "1 Januari 2025"
        if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(dateStr)) return dateStr;
        // Try to parse from yyyy-mm-dd
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const day = parseInt(parts[2], 10);
            const month = months[parseInt(parts[1], 10) - 1];
            const year = parts[0];
            return `${day} ${month} ${year}`;
        }
        return dateStr;
    };

    // Preview text helper
    const getSlotPreviewText = (slot: RecipientSlot) => {
        const prefix = slot.prefix || '';
        if (slot.source === 'variable') {
            return `${prefix}{{${slot.text.replace(/[{}]/g, '')}}}`;
        }
        return `${prefix}${slot.text}`;
    };

    return (
        <div className="space-y-3">
            {/* Preview */}
            <div className="p-2 bg-muted/30 rounded text-[10px] space-y-1">
                {dateConfig.enabled && (
                    <div className={`${dateConfig.position === 'right' ? 'text-right' : 'text-left'}`}>
                        {dateConfig.show_place && (
                            <span>
                                {dateConfig.place_source === 'variable'
                                    ? <span className="italic text-muted-foreground">{dateConfig.place_text}</span>
                                    : dateConfig.place_text}
                            </span>
                        )}
                        {dateConfig.show_place && ', '}
                        {dateConfig.date_source === 'variable'
                            ? <span className="italic text-muted-foreground">{dateConfig.date_variable}</span>
                            : formatDateIndonesian(dateConfig.date_manual) || 'tanggal'}
                    </div>
                )}
                {config.recipient_slots.length > 0 && (
                    <div className={`pt-2 ${config.recipient_layout === '2-column' ? 'grid grid-cols-2 gap-2' : ''}`}>
                        {config.recipient_layout === '1-column' ? (
                            <div>
                                {getColumnSlots(0).map((slot) => (
                                    <div
                                        key={slot.id}
                                        className={`${slot.source === 'variable' ? 'italic text-muted-foreground' : ''} ${slot.text_align === 'right' ? 'text-right' : slot.text_align === 'center' ? 'text-center' : 'text-left'
                                            }`}
                                    >
                                        {getSlotPreviewText(slot)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div>
                                    {getColumnSlots(0).map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`${slot.source === 'variable' ? 'italic text-muted-foreground' : ''} ${slot.text_align === 'right' ? 'text-right' : slot.text_align === 'center' ? 'text-center' : 'text-left'
                                                }`}
                                        >
                                            {getSlotPreviewText(slot)}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    {getColumnSlots(1).map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`${slot.source === 'variable' ? 'italic text-muted-foreground' : ''} ${slot.text_align === 'right' ? 'text-right' : slot.text_align === 'center' ? 'text-center' : 'text-left'
                                                }`}
                                        >
                                            {getSlotPreviewText(slot)}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Date Settings */}
            <div className="space-y-2 pb-2 border-b border-dashed">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Tempat & Tanggal
                    </Label>
                    <Switch
                        checked={dateConfig.enabled}
                        onCheckedChange={(checked) => updateDateConfig({ enabled: checked })}
                    />
                </div>

                {dateConfig.enabled && (
                    <div className="space-y-2 pl-2 border-l-2 border-muted">
                        {/* Position */}
                        <SearchableSelect
                            value={dateConfig.position}
                            onValueChange={(val) => updateDateConfig({ position: val as any })}
                            options={[{ value: 'right', label: 'Rata Kanan' }, { value: 'left', label: 'Rata Kiri' }]}
                            className="h-7 text-[10px]"
                        />

                        {/* Place */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={dateConfig.show_place}
                                    onCheckedChange={(checked) => updateDateConfig({ show_place: checked })}
                                />
                                <Label className="text-[10px]">Tampilkan Tempat</Label>
                            </div>
                            {dateConfig.show_place && (
                                <div className="flex gap-1">
                                    <SearchableSelect
                                        value={dateConfig.place_source}
                                        onValueChange={(val) => updateDateConfig({ place_source: val as any })}
                                        options={[{ value: 'manual', label: 'Manual' }, { value: 'variable', label: 'Variabel' }]}
                                        className="h-6 text-[10px] w-28"
                                    />
                                    {dateConfig.place_source === 'manual' ? (
                                        <Input
                                            value={dateConfig.place_text}
                                            onChange={(e) => updateDateConfig({ place_text: e.target.value })}
                                            placeholder="Jakarta"
                                            className="h-6 text-[10px] flex-1"
                                        />
                                    ) : (
                                        <SearchableSelect
                                            value={dateConfig.place_text}
                                            onValueChange={(val) => updateDateConfig({ place_text: val })}
                                            options={textVariables.map(v => ({ value: v.key, label: `{{${v.key}}}` }))}
                                            className="h-6 text-[10px] flex-1"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div className="space-y-1">
                            <Label className="text-[9px] text-muted-foreground">Tanggal</Label>
                            <div className="flex gap-1">
                                <SearchableSelect
                                    value={dateConfig.date_source}
                                    onValueChange={(val) => updateDateConfig({ date_source: val as any })}
                                    options={[{ value: 'manual', label: 'Manual' }, { value: 'variable', label: 'Variabel' }]}
                                    className="h-6 text-[10px] w-24"
                                />
                                {dateConfig.date_source === 'manual' ? (
                                    <Input
                                        type="text"
                                        value={dateConfig.date_manual}
                                        onChange={(e) => updateDateConfig({ date_manual: e.target.value })}
                                        placeholder="1 Januari 2025"
                                        className="h-6 text-[10px] flex-1"
                                    />
                                ) : (
                                    <SearchableSelect
                                        value={dateConfig.date_variable}
                                        onValueChange={(val) => updateDateConfig({ date_variable: val })}
                                        options={dateVariables.map(v => ({ value: v.key, label: `{{${v.key}}}` }))}
                                        className="h-6 text-[10px] flex-1"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Spacing after date */}
                        <div className="flex items-center gap-1">
                            <Label className="text-[9px] text-muted-foreground">Jarak ke penerima:</Label>
                            <Input
                                type="number"
                                value={dateConfig.spacing_bottom}
                                onChange={(e) => updateDateConfig({ spacing_bottom: parseFloat(e.target.value) || 10 })}
                                className="h-5 w-12 text-[10px]"
                                min={0}
                                max={50}
                            />
                            <span className="text-[9px] text-muted-foreground">mm</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Recipient Settings */}
            <div className="space-y-2">
                <Label className="text-[10px] font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Penerima
                </Label>

                {/* Layout Selection */}
                <div className="flex gap-2">
                    <SearchableSelect
                        value={config.recipient_layout}
                        onValueChange={(val) => updateConfig({ recipient_layout: val as any })}
                        options={[{ value: '1-column', label: '1 Kolom' }, { value: '2-column', label: '2 Kolom' }]}
                        className="h-7 text-[10px] flex-1"
                    />
                </div>

                {/* Recipient Slots */}
                <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                    {Array.from({ length: columnCount }).map((_, colIndex) => {
                        const columnSlots = getColumnSlots(colIndex);

                        return (
                            <div key={colIndex} className="border rounded p-2 space-y-2 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-medium">
                                        {columnCount === 1 ? 'Slot' : `Kolom ${colIndex + 1}`}
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-5 text-[9px] px-1.5"
                                        onClick={() => addRecipientSlot(colIndex)}
                                    >
                                        <Plus className="h-2.5 w-2.5 mr-0.5" />
                                        Tambah
                                    </Button>
                                </div>

                                <div className="space-y-1.5">
                                    {columnSlots.map((slot, slotIndex) => {
                                        const TypeIcon = recipientSlotTypeOptions.find(o => o.value === slot.type)?.icon || Type;

                                        return (
                                            <div key={slot.id} className="border rounded p-2 space-y-2 bg-background">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <TypeIcon className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-[9px] font-medium">
                                                            Slot #{slotIndex + 1}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0"
                                                        onClick={() => removeRecipientSlot(slot.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </div>

                                                {/* Type Selection */}
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] text-muted-foreground">Tipe</Label>
                                                    <SearchableSelect
                                                        value={slot.type}
                                                        onValueChange={(val) => updateRecipientSlot(slot.id, { type: val as any })}
                                                        options={recipientSlotTypeOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                                                        className="h-6 text-[10px]"
                                                    />
                                                </div>

                                                {/* Source & Text */}
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] text-muted-foreground">Sumber & Nilai</Label>
                                                    <div className="flex gap-1.5">
                                                        <SearchableSelect
                                                            value={slot.source}
                                                            onValueChange={(val) => updateRecipientSlot(slot.id, { source: val as any })}
                                                            options={[{ value: 'manual', label: 'Manual' }, { value: 'variable', label: 'Variabel' }]}
                                                            className="h-6 text-[10px] w-20"
                                                        />

                                                        {slot.type === 'address' && (
                                                            <Input
                                                                value={slot.prefix}
                                                                onChange={(e) => updateRecipientSlot(slot.id, { prefix: e.target.value })}
                                                                placeholder="di-"
                                                                className="h-6 text-[10px] w-12"
                                                            />
                                                        )}

                                                        {slot.source === 'manual' ? (
                                                            <Input
                                                                value={slot.text}
                                                                onChange={(e) => updateRecipientSlot(slot.id, { text: e.target.value })}
                                                                placeholder="Teks..."
                                                                className="h-6 text-[10px] flex-1"
                                                            />
                                                        ) : (
                                                            <SearchableSelect
                                                                value={slot.text}
                                                                onValueChange={(val) => updateRecipientSlot(slot.id, { text: val })}
                                                                options={variables.map(v => ({ value: v.key, label: `{{${v.key}}}` }))}
                                                                className="h-6 text-[10px] flex-1"
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Text Alignment */}
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[9px] text-muted-foreground">Rata</Label>
                                                    <div className="flex gap-0.5 border rounded p-0.5">
                                                        {(['left', 'center', 'right'] as const).map((align) => (
                                                            <Button
                                                                key={align}
                                                                type="button"
                                                                variant={slot.text_align === align ? 'secondary' : 'ghost'}
                                                                size="sm"
                                                                className="h-5 w-6 p-0"
                                                                onClick={() => updateRecipientSlot(slot.id, { text_align: align })}
                                                            >
                                                                {align === 'left' && <AlignLeft className="h-3 w-3" />}
                                                                {align === 'center' && <AlignCenter className="h-3 w-3" />}
                                                                {align === 'right' && <AlignRight className="h-3 w-3" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {columnSlots.length === 0 && (
                                        <div className="text-center py-2 text-[9px] text-muted-foreground border border-dashed rounded">
                                            Klik "Tambah"
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Spacing after recipient */}
            <div className="flex items-center gap-1 pt-2 border-t border-dashed">
                <Label className="text-[9px] text-muted-foreground">Jarak setelah penerima:</Label>
                <Input
                    type="number"
                    value={config.spacing_after_recipient}
                    onChange={(e) => updateConfig({ spacing_after_recipient: parseFloat(e.target.value) || 10 })}
                    className="h-5 w-12 text-[10px]"
                    min={0}
                    max={50}
                />
                <span className="text-[9px] text-muted-foreground">mm</span>
            </div>
        </div>
    );
}

// Table Editor Component
interface TableEditorProps {
    block: ContentBlock;
    variables?: TemplateVariable[];
    onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
}

function TableEditor({ block, variables = [], onUpdate }: TableEditorProps) {
    const config: TableConfig = block.table_config || defaultTableConfig;

    const updateConfig = (updates: Partial<TableConfig>) => {
        onUpdate(block.id, {
            table_config: { ...config, ...updates }
        });
    };

    const updateCell = (rowIndex: number, colIndex: number, updates: Partial<TableCell>) => {
        const newRows = config.rows.map((row, ri) =>
            ri === rowIndex
                ? row.map((cell, ci) => ci === colIndex ? { ...cell, ...updates } : cell)
                : row
        );
        updateConfig({ rows: newRows });
    };

    const addRow = () => {
        const newRow: TableCell[] = Array(config.columns).fill(null).map(() => ({ ...defaultTableCell }));
        updateConfig({ rows: [...config.rows, newRow] });
    };

    const removeRow = (rowIndex: number) => {
        if (config.rows.length <= 1) return;
        updateConfig({ rows: config.rows.filter((_, i) => i !== rowIndex) });
    };

    const addColumn = () => {
        const newColumns = config.columns + 1;
        const newWidths = Array(newColumns).fill(100 / newColumns);
        const newRows = config.rows.map(row => [...row, { ...defaultTableCell }]);
        updateConfig({ columns: newColumns, rows: newRows, column_widths: newWidths });
    };

    const removeColumn = (colIndex: number) => {
        if (config.columns <= 1) return;
        const newColumns = config.columns - 1;
        const newWidths = Array(newColumns).fill(100 / newColumns);
        const newRows = config.rows.map(row => row.filter((_, i) => i !== colIndex));
        updateConfig({ columns: newColumns, rows: newRows, column_widths: newWidths });
    };

    return (
        <div className="space-y-3">
            {/* Table Settings */}
            <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-dashed">
                <div className="flex items-center gap-1">
                    <Switch
                        id={`border-${block.id}`}
                        checked={config.border}
                        onCheckedChange={(checked) => updateConfig({ border: checked })}
                    />
                    <Label htmlFor={`border-${block.id}`} className="text-[9px]">Border</Label>
                </div>
                <div className="flex items-center gap-1">
                    <Switch
                        id={`header-${block.id}`}
                        checked={config.header_row}
                        onCheckedChange={(checked) => updateConfig({ header_row: checked })}
                    />
                    <Label htmlFor={`header-${block.id}`} className="text-[9px]">Header</Label>
                </div>
                <div className="flex items-center gap-1">
                    <Label className="text-[9px] text-muted-foreground">Padding:</Label>
                    <Input
                        type="number"
                        value={config.cell_padding}
                        onChange={(e) => updateConfig({ cell_padding: parseFloat(e.target.value) || 2 })}
                        className="w-10 h-5 text-[10px] px-1"
                        min={0}
                        max={10}
                    />
                    <span className="text-[9px] text-muted-foreground">mm</span>
                </div>
            </div>

            {/* Table Preview/Editor */}
            <div className="border rounded overflow-hidden">
                <table className="w-full border-collapse text-[10px]">
                    <tbody>
                        {config.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex === 0 && config.header_row ? 'bg-muted/50' : ''}>
                                {row.map((cell, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`border p-1 ${cell.bold ? 'font-bold' : ''}`}
                                        style={{ textAlign: cell.align || 'left' }}
                                    >
                                        <div className="flex items-center gap-0.5">
                                            <Input
                                                value={cell.content || ''}
                                                onChange={(e) => updateCell(rowIndex, colIndex, { content: e.target.value })}
                                                placeholder="Isi sel..."
                                                className="h-5 text-[9px] px-1 border-0 shadow-none focus-visible:ring-0"
                                            />
                                            {variables.length > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        render={
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-4 w-4 p-0 shrink-0"
                                                            >
                                                                <Variable className="h-2.5 w-2.5" />
                                                            </Button>
                                                        }
                                                    />
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuLabel className="text-[10px]">
                                                                Sisipkan Variabel
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {variables.map((v) => (
                                                                <DropdownMenuItem
                                                                    key={v.key}
                                                                    className="text-xs cursor-pointer"
                                                                    onClick={() => {
                                                                        const newContent = (cell.content || '') + `{{${v.key}}}`;
                                                                        updateCell(rowIndex, colIndex, { content: newContent });
                                                                    }}
                                                                >
                                                                    <span className="truncate">{v.label || v.key}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </td>
                                ))}
                                <td className="w-6 border-l">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0"
                                        onClick={() => removeRow(rowIndex)}
                                        disabled={config.rows.length <= 1}
                                    >
                                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Cell Style Controls */}
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span>Tip: Gunakan {`{{variabel}}`} untuk data dinamis</span>
            </div>

            {/* Row/Column Actions */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={addRow}
                >
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Baris
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={addColumn}
                >
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Kolom
                </Button>
                {config.columns > 1 && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] text-destructive"
                        onClick={() => removeColumn(config.columns - 1)}
                    >
                        <Trash2 className="h-2.5 w-2.5 mr-1" />
                        Kolom
                    </Button>
                )}
            </div>
        </div>
    );
}

export function ContentBlocksPanel({
    blocks,
    defaultFont,
    variables = [],
    onAdd,
    onUpdate,
    onUpdateStyle,
    onRemove,
    onReorder,
    onDuplicate,
}: ContentBlocksPanelProps) {
    const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            onReorder(draggedIndex, index);
            setDraggedIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const getBlockIcon = (type: ContentBlock['type']) => {
        const option = blockTypeOptions.find(o => o.value === type);
        return option?.icon || Type;
    };

    const getBlockLabel = (type: ContentBlock['type']) => {
        const option = blockTypeOptions.find(o => o.value === type);
        return option?.label || 'Teks';
    };

    const generateId = () => `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const handleAddFieldItem = (blockId: string, fieldGroup: FieldGroupConfig | undefined) => {
        const items = fieldGroup?.items || [];
        const newItem: FieldItem = {
            ...defaultFieldItem,
            id: generateId(),
        };
        onUpdate(blockId, {
            field_group: {
                ...defaultFieldGroupConfig,
                ...fieldGroup,
                items: [...items, newItem],
            },
        });
    };

    const handleUpdateFieldItem = (blockId: string, fieldGroup: FieldGroupConfig | undefined, itemId: string, updates: Partial<FieldItem>) => {
        const items = fieldGroup?.items || [];
        onUpdate(blockId, {
            field_group: {
                ...defaultFieldGroupConfig,
                ...fieldGroup,
                items: items.map(item => item.id === itemId ? { ...item, ...updates } : item),
            },
        });
    };

    const handleRemoveFieldItem = (blockId: string, fieldGroup: FieldGroupConfig | undefined, itemId: string) => {
        const items = fieldGroup?.items || [];
        onUpdate(blockId, {
            field_group: {
                ...defaultFieldGroupConfig,
                ...fieldGroup,
                items: items.filter(item => item.id !== itemId),
            },
        });
    };

    const handleUpdateFieldGroup = (blockId: string, fieldGroup: FieldGroupConfig | undefined, updates: Partial<FieldGroupConfig>) => {
        onUpdate(blockId, {
            field_group: {
                ...defaultFieldGroupConfig,
                ...fieldGroup,
                ...updates,
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Add Block Buttons */}
            <div className="space-y-2">
                <Label className="text-xs">Tambah Blok</Label>
                <div className="flex flex-wrap gap-1">
                    {blockTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => onAdd(option.value as ContentBlock['type'])}
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {option.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Blocks List */}
            <div className="space-y-2">
                {blocks.map((block, index) => {
                    const Icon = getBlockIcon(block.type);
                    const isExpanded = expandedBlock === block.id;

                    return (
                        <div
                            key={block.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`border rounded bg-muted/30 ${draggedIndex === index ? 'opacity-50' : ''
                                }`}
                        >
                            {/* Block Header */}
                            <div className="flex items-center gap-1 p-1.5 border-b bg-muted/50">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-move" />
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium flex-1">
                                    {getBlockLabel(block.type)} #{index + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                                    title="Pengaturan"
                                >
                                    <Settings2 className="h-3 w-3" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onDuplicate(block.id)}
                                    title="Duplikat"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onRemove(block.id)}
                                >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </div>

                            {/* Block Content */}
                            <div className="p-2 space-y-2">
                                {block.type === 'spacer' ? (
                                    <div className="flex items-center gap-2">
                                        <Label className="text-[10px] text-muted-foreground">Tinggi (mm):</Label>
                                        <Input
                                            type="number"
                                            value={block.style.margin_top + block.style.margin_bottom + 5}
                                            onChange={(e) => {
                                                const total = parseFloat(e.target.value) || 10;
                                                onUpdateStyle(block.id, { margin_top: total / 2, margin_bottom: total / 2 });
                                            }}
                                            className="w-16 h-7"
                                            min={5}
                                            max={100}
                                        />
                                    </div>
                                ) : block.type === 'page-break' ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center py-2 border-t border-b border-dashed border-primary/50 bg-primary/5">
                                            <span className="text-[10px] text-primary font-medium">── Halaman Baru ──</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-[10px]">Tampilkan Kop</Label>
                                                <p className="text-[9px] text-muted-foreground">Kop surat di halaman baru</p>
                                            </div>
                                            <Switch
                                                checked={block.page_break?.show_header ?? true}
                                                onCheckedChange={(checked) => onUpdate(block.id, {
                                                    page_break: { ...block.page_break, show_header: checked }
                                                })}
                                            />
                                        </div>
                                    </div>
                                ) : block.type === 'letter-opening' ? (
                                    <LetterOpeningEditor
                                        block={block}
                                        variables={variables}
                                        onUpdate={onUpdate}
                                    />
                                ) : block.type === 'table' ? (
                                    <TableEditor
                                        block={block}
                                        variables={variables}
                                        onUpdate={onUpdate}
                                    />
                                ) : block.type === 'field-group' ? (
                                    <div className="space-y-2">
                                        {/* Field Group Settings */}
                                        <div className="flex items-center gap-3 pb-2 border-b border-dashed">
                                            <div className="flex items-center gap-1">
                                                <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Lebar:</Label>
                                                <Input
                                                    type="number"
                                                    value={block.field_group?.label_width || defaultFieldGroupConfig.label_width}
                                                    onChange={(e) => handleUpdateFieldGroup(block.id, block.field_group, {
                                                        label_width: parseFloat(e.target.value) || 25
                                                    })}
                                                    className="w-12 h-5 text-[10px] px-1"
                                                />
                                                <span className="text-[10px] text-muted-foreground">mm</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Pemisah:</Label>
                                                <Input
                                                    value={block.field_group?.separator || ':'}
                                                    onChange={(e) => handleUpdateFieldGroup(block.id, block.field_group, {
                                                        separator: e.target.value
                                                    })}
                                                    className="w-6 h-5 text-[10px] text-center px-1"
                                                    maxLength={3}
                                                />
                                            </div>
                                        </div>

                                        {/* Field Items */}
                                        <div className="space-y-1.5">
                                            {(block.field_group?.items || []).map((item, itemIndex) => (
                                                <div key={item.id} className="flex items-center gap-1 bg-muted/30 rounded px-1 py-0.5">
                                                    <Input
                                                        value={item.label}
                                                        onChange={(e) => handleUpdateFieldItem(block.id, block.field_group, item.id, { label: e.target.value })}
                                                        placeholder="Label"
                                                        className="w-20 h-5 text-[10px] px-1"
                                                    />
                                                    <span className="text-muted-foreground text-[10px]">{block.field_group?.separator || ':'}</span>
                                                    <Input
                                                        value={item.value}
                                                        onChange={(e) => handleUpdateFieldItem(block.id, block.field_group, item.id, { value: e.target.value })}
                                                        placeholder="{{variabel}}"
                                                        className="flex-1 h-5 text-[10px] px-1"
                                                    />
                                                    {/* Insert Variable Button */}
                                                    {variables.length > 0 && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                render={
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-5 w-5 p-0"
                                                                        title="Sisipkan Variabel"
                                                                    >
                                                                        <Variable className="h-2.5 w-2.5" />
                                                                    </Button>
                                                                }
                                                            />
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuGroup>
                                                                    <DropdownMenuLabel className="text-[10px]">
                                                                        Pilih Variabel
                                                                    </DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {variables.map((v) => (
                                                                        <DropdownMenuItem
                                                                            key={v.key}
                                                                            className="text-xs cursor-pointer"
                                                                            onClick={() => {
                                                                                const newValue = (item.value || '') + `{{${v.key}}}`;
                                                                                handleUpdateFieldItem(block.id, block.field_group, item.id, { value: newValue });
                                                                            }}
                                                                        >
                                                                            {v.source !== 'manual' && (
                                                                                <Zap className="h-3 w-3 mr-1.5 text-amber-500" />
                                                                            )}
                                                                            <span className="truncate">{v.label || v.key}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuGroup>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0"
                                                        onClick={() => handleRemoveFieldItem(block.id, block.field_group, item.id)}
                                                    >
                                                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Field Button */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-5 text-[10px]"
                                            onClick={() => handleAddFieldItem(block.id, block.field_group)}
                                        >
                                            <Plus className="h-2.5 w-2.5 mr-1" />
                                            Tambah Field
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Textarea
                                            value={block.content}
                                            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                                            placeholder={block.type === 'paragraph' ? 'Isi paragraf...' : 'Isi teks...'}
                                            rows={block.type === 'paragraph' ? 3 : 1}
                                            className="resize-none text-xs"
                                        />

                                        {/* Quick Style Buttons */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <Button
                                                type="button"
                                                variant={block.style.font_weight === 'bold' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => onUpdateStyle(block.id, {
                                                    font_weight: block.style.font_weight === 'bold' ? 'normal' : 'bold'
                                                })}
                                            >
                                                <Bold className="h-3 w-3" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant={block.style.font_style === 'italic' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => onUpdateStyle(block.id, {
                                                    font_style: block.style.font_style === 'italic' ? 'normal' : 'italic'
                                                })}
                                            >
                                                <Italic className="h-3 w-3" />
                                            </Button>

                                            <div className="flex border rounded">
                                                <Button
                                                    type="button"
                                                    variant={block.style.text_align === 'left' ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-6 w-6 p-0 rounded-r-none"
                                                    onClick={() => onUpdateStyle(block.id, { text_align: 'left' })}
                                                >
                                                    <AlignLeft className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={block.style.text_align === 'center' ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-6 w-6 p-0 rounded-none border-x"
                                                    onClick={() => onUpdateStyle(block.id, { text_align: 'center' })}
                                                >
                                                    <AlignCenter className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={block.style.text_align === 'right' ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-6 w-6 p-0 rounded-none border-r"
                                                    onClick={() => onUpdateStyle(block.id, { text_align: 'right' })}
                                                >
                                                    <AlignRight className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={block.style.text_align === 'justify' ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-6 w-6 p-0 rounded-l-none"
                                                    onClick={() => onUpdateStyle(block.id, { text_align: 'justify' })}
                                                >
                                                    <AlignJustify className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Expanded Settings */}
                                <Collapsible open={isExpanded}>
                                    <CollapsibleContent className="pt-2 border-t space-y-2">
                                        {block.type !== 'spacer' && (
                                            <>
                                                {/* Font Settings */}
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground">Font</Label>
                                                        <SearchableSelect
                                                            value={block.style.font_family || '__default__'}
                                                            onValueChange={(val) => onUpdateStyle(block.id, { font_family: val === '__default__' ? undefined : val })}
                                                            options={fontFamilyOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                                                            className="h-7 text-[10px]"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground">Ukuran</Label>
                                                        <Input
                                                            type="number"
                                                            value={block.style.font_size || ''}
                                                            onChange={(e) => onUpdateStyle(block.id, {
                                                                font_size: e.target.value ? parseFloat(e.target.value) : null
                                                            })}
                                                            placeholder={`${defaultFont.size}`}
                                                            className="h-7 text-[10px]"
                                                            min={8}
                                                            max={72}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground">Spasi</Label>
                                                        <Input
                                                            type="number"
                                                            value={block.style.line_height || ''}
                                                            onChange={(e) => onUpdateStyle(block.id, {
                                                                line_height: e.target.value ? parseFloat(e.target.value) : null
                                                            })}
                                                            placeholder={`${defaultFont.line_height}`}
                                                            className="h-7 text-[10px]"
                                                            min={1}
                                                            max={3}
                                                            step={0.1}
                                                        />
                                                    </div>
                                                </div>

                                                {block.type === 'paragraph' && (
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground">Indentasi (mm)</Label>
                                                        <Input
                                                            type="number"
                                                            value={block.style.indent_first_line}
                                                            onChange={(e) => onUpdateStyle(block.id, {
                                                                indent_first_line: parseFloat(e.target.value) || 0
                                                            })}
                                                            className="h-7 text-[10px] w-20"
                                                            min={0}
                                                            max={50}
                                                            step={1}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Margin Settings */}
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Margin (mm)</Label>
                                            <div className="grid grid-cols-4 gap-1">
                                                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                                                    <div key={side} className="space-y-0.5">
                                                        <span className="text-[9px] text-muted-foreground capitalize">{side === 'top' ? 'Atas' : side === 'bottom' ? 'Bawah' : side === 'left' ? 'Kiri' : 'Kanan'}</span>
                                                        <Input
                                                            type="number"
                                                            value={block.style[`margin_${side}`]}
                                                            onChange={(e) => onUpdateStyle(block.id, {
                                                                [`margin_${side}`]: parseFloat(e.target.value) || 0
                                                            })}
                                                            className="h-6 text-[10px]"
                                                            min={0}
                                                            max={50}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </div>
                    );
                })}
            </div>

            {blocks.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded">
                    Belum ada blok konten
                </div>
            )}
        </div>
    );
}
