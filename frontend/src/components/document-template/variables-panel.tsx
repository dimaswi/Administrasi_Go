import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TemplateVariable, TemplateType } from '@/types/document-template';
import { Plus, Trash2, GripVertical, Zap, Lock, Copy } from 'lucide-react';
import { useState } from 'react';

interface VariablesPanelProps {
    variables: TemplateVariable[];
    templateType?: TemplateType;
    onAdd: () => void;
    onUpdate: (index: number, updates: Partial<TemplateVariable>) => void;
    onRemove: (index: number) => void;
}

const variableTypeOptions = [
    { value: 'text', label: 'Teks' },
    { value: 'textarea', label: 'Teks Panjang' },
    { value: 'date', label: 'Tanggal' },
    { value: 'number', label: 'Angka' },
    { value: 'select', label: 'Pilihan' },
];

const variableSourceOptions = [
    { value: 'manual', label: 'Input Manual', description: 'Diisi pengguna saat membuat surat' },
    { value: 'auto_number', label: 'Nomor Otomatis', description: 'Nomor surat digenerate otomatis' },
    { value: 'auto_date', label: 'Tanggal Otomatis', description: 'Tanggal saat surat dibuat' },
    { value: 'auto_user', label: 'User Pembuat', description: 'Nama user yang membuat surat' },
    { value: 'auto_unit', label: 'Unit Kerja', description: 'Unit kerja user pembuat' },
];

export function VariablesPanel({
    variables,
    templateType = 'general',
    onAdd,
    onUpdate,
    onRemove,
}: VariablesPanelProps) {
    const isFixedTemplate = ['leave', 'early_leave', 'leave_response', 'early_leave_response'].includes(templateType);
    
    const getTemplateTypeName = () => {
        switch (templateType) {
            case 'leave': return 'Variabel Surat Pengajuan Cuti';
            case 'early_leave': return 'Variabel Surat Pengajuan Izin Pulang Cepat';
            case 'leave_response': return 'Variabel Surat Balasan Cuti';
            case 'early_leave_response': return 'Variabel Surat Balasan Izin Pulang Cepat';
            default: return 'Variabel Template';
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };
    
    const generateKeyFromLabel = (label: string): string => {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium">Variabel Template</h3>
                    <p className="text-[10px] text-muted-foreground">
                        {isFixedTemplate ? 'Klik variabel untuk copy' : <>Gunakan: {'{{'}<code>key</code>{'}}'}</>}
                    </p>
                </div>
                {!isFixedTemplate && (
                    <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-7">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tambah
                    </Button>
                )}
            </div>

            {isFixedTemplate && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                            {getTemplateTypeName()}
                        </span>
                    </div>
                    <p className="text-[10px] text-amber-700">
                        Variabel ini sudah fixed dan akan otomatis diisi dari data pengajuan. Klik untuk copy ke clipboard.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {variables.map((variable, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded text-[10px] font-mono hover:bg-amber-100 transition-colors cursor-pointer"
                                title={`${variable.label} - Klik untuk copy`}
                            >
                                <Copy className="h-2.5 w-2.5 text-amber-600" />
                                {`{{${variable.key}}}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isFixedTemplate && (
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Deskripsi Variabel:</Label>
                    <div className="border rounded divide-y text-xs">
                        {variables.map((variable, index) => (
                            <div key={index} className="flex items-center px-2 py-1.5 hover:bg-muted/50">
                                <span className="font-mono text-[10px] w-48 shrink-0 text-primary">{`{{${variable.key}}}`}</span>
                                <span className="text-muted-foreground">{variable.label}</span>
                                {variable.required && <Badge variant="destructive" className="ml-auto text-[8px] h-4">Wajib</Badge>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isFixedTemplate && (
                <div className="space-y-2">
                {variables.map((variable, index) => (
                    <div key={index} className="border rounded p-2 space-y-2 bg-muted/30">
                        <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 mt-1.5 text-muted-foreground cursor-move shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Label</Label>
                                        <Input
                                            value={variable.label}
                                            onChange={(e) => {
                                                const label = e.target.value;
                                                const autoKey = generateKeyFromLabel(label);
                                                const currentKeyIsAuto = !variable.key || 
                                                    variable.key.startsWith('var_') || 
                                                    variable.key === generateKeyFromLabel(variable.label);
                                                
                                                const updates: Partial<TemplateVariable> = { label };
                                                if (currentKeyIsAuto) {
                                                    updates.key = autoKey;
                                                }
                                                onUpdate(index, updates);
                                            }}
                                            placeholder="Nomor Surat"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Key (auto)</Label>
                                        <Input
                                            value={variable.key}
                                            onChange={(e) => onUpdate(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').replace(/\s+/g, '_') })}
                                            placeholder="nomor_surat"
                                            className="h-7 font-mono text-[10px]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Tipe</Label>
                                        <SearchableSelect
            value={variable.type}
            onValueChange={(val) => onUpdate(index, { type: val as any })}
            options={variableTypeOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            className="h-7 text-xs"
        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Placeholder</Label>
                                        <Input
                                            value={variable.placeholder}
                                            onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
                                            placeholder="..."
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Sumber Variabel */}
                                <div className="space-y-0.5">
                                    <Label className="text-[9px] text-muted-foreground">Sumber</Label>
                                    <SearchableSelect
            value={variable.source || 'manual'}
            onValueChange={(val) => onUpdate(index, { source: val as any })}
            options={variableSourceOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            className="h-7 text-xs"
        />
                                    <p className="text-[9px] text-muted-foreground">
                                        {variableSourceOptions.find(o => o.value === (variable.source || 'manual'))?.description}
                                    </p>
                                </div>

                                {variable.source === 'manual' && (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <Switch
                                                id={`required-${index}`}
                                                checked={variable.required}
                                                onCheckedChange={(checked) => onUpdate(index, { required: checked })}
                                            />
                                            <Label htmlFor={`required-${index}`} className="text-[10px]">Wajib</Label>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Switch
                                                id={`readonly-${index}`}
                                                checked={variable.readonly || false}
                                                onCheckedChange={(checked) => onUpdate(index, { readonly: checked })}
                                            />
                                            <Label htmlFor={`readonly-${index}`} className="text-[10px]">Readonly</Label>
                                        </div>
                                    </div>
                                )}

                                {variable.source !== 'manual' && (
                                    <Badge variant="secondary" className="text-[9px] w-fit">
                                        <Zap className="h-2.5 w-2.5 mr-1 text-amber-500" />
                                        Otomatis terisi saat membuat surat
                                    </Badge>
                                )}

                                {variable.source === 'manual' && variable.type !== 'select' && (
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Nilai Default</Label>
                                        <Input
                                            value={variable.default_value || ''}
                                            onChange={(e) => onUpdate(index, { default_value: e.target.value || null })}
                                            placeholder="Opsional"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                )}

                                {variable.source === 'manual' && variable.type === 'select' && (
                                    <div className="space-y-0.5">
                                        <Label className="text-[9px] text-muted-foreground">Opsi (satu per baris)</Label>
                                        <textarea
                                            value={variable.options.join('\n')}
                                            onChange={(e) => onUpdate(index, { 
                                                options: e.target.value.split('\n').filter(o => o.trim())
                                            })}
                                            placeholder="Opsi 1&#10;Opsi 2"
                                            className="w-full min-h-[60px] text-xs p-2 border rounded resize-none"
                                        />
                                    </div>
                                )}

                                <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono">
                                    {'{{'}{variable.key || 'key'}{'}}'}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => onRemove(index)}
                            >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}

                {variables.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded">
                        Belum ada variabel
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
