import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Award,
    Plus,
    Trash2,
    Layers,
    Search,
    CheckSquare,
    Square,
    FileSpreadsheet,
} from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import api from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const MEASUREMENT_TYPES = [
    { value: 'numeric', label: 'Angka (Numeric)' },
    { value: 'percentage', label: 'Persentase (%)' },
    { value: 'rating', label: 'Rating (1 - 5)' },
    { value: 'yes_no', label: 'Ya / Tidak' },
];

interface KpiCategory {
    id: number;
    name: string;
    code: string;
}

interface KpiTemplate {
    id: number;
    category_id: number;
    category_name: string;
    name: string;
    code: string;
    description: string | null;
    measurement_type: string;
    measurement_type_label?: string;
    unit: string | null;
    target_min: number | null;
    target_max: number | null;
    weight: number;
    is_active: boolean;
}

export interface ReviewItemForm {
    temp_id: string;
    template_id?: number | null;
    category_id: number;
    category_name?: string;
    name: string;
    description?: string;
    measurement_type: string;
    unit?: string;
    target?: number | string;
    weight: number;
}

export default function PerformanceReviewCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
    const [periods, setPeriods] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<KpiCategory[]>([]);
    const [templates, setTemplates] = useState<KpiTemplate[]>([]);

    // Form Main State
    const [employeeId, setEmployeeId] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [employeeNotes, setEmployeeNotes] = useState('');
    const [items, setItems] = useState<ReviewItemForm[]>([]);

    // Template Picker Modal State
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerCategory, setPickerCategory] = useState<string>('all');
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [empRes, periodRes, catRes, tplRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/performance-periods'),
                    api.get('/kpi/categories'),
                    api.get('/kpi/templates'),
                ]);

                const empList = (empRes.data?.data || empRes.data || []).map((e: any) => ({
                    id: e.id,
                    name: `${e.first_name || ''} ${e.last_name || ''} (${e.employee_id || ''})`,
                }));
                const periodList = (Array.isArray(periodRes.data) ? periodRes.data : []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                }));
                const catList = Array.isArray(catRes.data) ? catRes.data : [];
                const tplList = Array.isArray(tplRes.data) ? tplRes.data : [];

                setEmployees(empList);
                setPeriods(periodList);
                setCategories(catList);
                setTemplates(tplList);

                if (empList.length > 0) setEmployeeId(String(empList[0].id));
                if (periodList.length > 0) setPeriodId(String(periodList[0].id));
            } catch (error) {
                console.error('Error fetching initial review options:', error);
            }
        };

        fetchInitialData();
    }, []);

    // Add Blank Custom Item
    const handleAddCustomItem = () => {
        const defaultCategory = categories[0]?.id || 1;
        const newItem: ReviewItemForm = {
            temp_id: `custom-${Date.now()}-${Math.random()}`,
            template_id: null,
            category_id: defaultCategory,
            name: '',
            description: '',
            measurement_type: 'numeric',
            unit: '',
            target: '',
            weight: 10,
        };
        setItems(prev => [...prev, newItem]);
    };

    // Open Template Picker Dialog
    const handleOpenPicker = () => {
        setSelectedTemplateIds([]);
        setPickerSearch('');
        setPickerCategory('all');
        setIsPickerOpen(true);
    };

    const toggleSelectTemplate = (id: number) => {
        setSelectedTemplateIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllFiltered = () => {
        const filtered = filteredTemplates.map(t => t.id);
        const allSelected = filtered.every(id => selectedTemplateIds.includes(id));
        if (allSelected) {
            setSelectedTemplateIds(prev => prev.filter(id => !filtered.includes(id)));
        } else {
            setSelectedTemplateIds(prev => Array.from(new Set([...prev, ...filtered])));
        }
    };

    // Apply Selected Templates to Review Items
    const handleApplyTemplates = () => {
        const selected = templates.filter(t => selectedTemplateIds.includes(t.id));
        const newItems: ReviewItemForm[] = selected.map(tpl => ({
            temp_id: `tpl-${tpl.id}-${Date.now()}-${Math.random()}`,
            template_id: tpl.id,
            category_id: tpl.category_id,
            category_name: tpl.category_name,
            name: tpl.name,
            description: tpl.description || '',
            measurement_type: tpl.measurement_type || 'numeric',
            unit: tpl.unit || '',
            target: tpl.target_min ?? tpl.target_max ?? '',
            weight: tpl.weight || 10,
        }));

        setItems(prev => [...prev, ...newItems]);
        setIsPickerOpen(false);
    };

    // Update single item field
    const handleItemChange = (index: number, field: keyof ReviewItemForm, value: any) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    // Remove single item
    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Filtered templates inside modal
    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchSearch =
                t.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                t.code.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                (t.description || '').toLowerCase().includes(pickerSearch.toLowerCase());
            const matchCategory = pickerCategory === 'all' || String(t.category_id) === pickerCategory;
            return matchSearch && matchCategory;
        });
    }, [templates, pickerSearch, pickerCategory]);

    // Computed totals
    const totalWeight = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId || !periodId) {
            setAlertMessage('Silakan pilih pegawai dan periode penilaian');
            return;
        }

        if (items.length === 0) {
            setAlertMessage('Harap tambahkan minimal 1 indikator KPI untuk penilaian');
            return;
        }

        // Validate items name
        const hasEmptyName = items.some(item => !item.name.trim());
        if (hasEmptyName) {
            setAlertMessage('Setiap indikator KPI wajib memiliki nama/indikator');
            return;
        }

        setLoading(true);

        const payload = {
            employee_id: Number(employeeId),
            period_id: Number(periodId),
            status: 'draft',
            employee_notes: employeeNotes || null,
            items: items.map(item => ({
                template_id: item.template_id || null,
                category_id: Number(item.category_id),
                name: item.name,
                description: item.description || null,
                measurement_type: item.measurement_type,
                unit: item.unit || null,
                target: item.target !== '' && item.target !== null && item.target !== undefined ? Number(item.target) : null,
                weight: Number(item.weight) || 1,
            })),
        };

        try {
            await api.post('/performance-reviews', payload);
            navigate('/hr/performance-reviews');
        } catch (error: any) {
            console.error('Error creating performance review:', error);
            setAlertMessage(error?.response?.data?.error || 'Gagal menyimpan sesi penilaian kinerja');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Buat Sesi Penilaian Kinerja"
                subtitle="Tetapkan indikator KPI, target acuan, dan bobot evaluasi untuk pegawai yang bersangkutan"
                icon={Award}
                onBack={() => navigate('/hr/performance-reviews')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan & Buat Sesi Penilaian"
                cancelText="Batal"
                onCancel={() => navigate('/hr/performance-reviews')}
            >
                {/* 1. Header Information */}
                <FormSection
                    title="1. Informasi Pegawai & Periode Evaluasi"
                    description="Pilih staf yang akan dievaluasi dan siklus periode penilaian kerja"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                Pegawai yang Dinilai <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={employees.map(e => ({ value: String(e.id), label: e.name }))}
                                value={employeeId}
                                onChange={setEmployeeId}
                                placeholder="Pilih Pegawai"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                Periode Penilaian <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                                options={periods.map(p => ({ value: String(p.id), label: p.name }))}
                                value={periodId}
                                onChange={setPeriodId}
                                placeholder="Pilih Periode"
                            />
                        </div>
                    </div>
                </FormSection>

                {/* 2. Multiple KPI Indicators Section */}
                <FormSection
                    title="2. Rincian Indikator Kinerja (KPI Items)"
                    description="Tambahkan indikator kerja terukur untuk staf ini. Anda dapat mengambil dari Master Template atau menambahkan indikator kustom."
                >
                    <div className="space-y-4">
                        {/* Action Header & Weights Info Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={handleOpenPicker}
                                    size="sm"
                                    className="h-8 rounded-none bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Layers className="size-3.5" /> Ambil dari Template KPI
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAddCustomItem}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-none border-neutral-300 dark:border-neutral-700 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Plus className="size-3.5" /> Tambah Indikator Manual
                                </Button>
                            </div>

                            {/* Weight badge indicator */}
                            <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-neutral-500">Total Indikator: <strong>{items.length}</strong></span>
                                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                <span className="text-neutral-500">Total Bobot:</span>
                                <Badge
                                    variant="outline"
                                    className={`rounded-none font-bold text-xs ${
                                        totalWeight === 100
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400'
                                    }`}
                                >
                                    {totalWeight}% {totalWeight === 100 ? '✓ Tepat 100%' : '(Disarankan 100%)'}
                                </Badge>
                            </div>
                        </div>

                        {/* Items Table */}
                        {items.length === 0 ? (
                            <div className="border border-dashed border-neutral-300 dark:border-neutral-800 p-8 text-center bg-neutral-50/50 dark:bg-neutral-950/50">
                                <FileSpreadsheet className="size-8 text-neutral-400 mx-auto mb-2" />
                                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                    Belum ada indikator KPI yang ditambahkan
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                                    Klik tombol <span className="font-semibold text-neutral-700 dark:text-neutral-300">"Ambil dari Template KPI"</span> untuk memilih indikator standar, atau <span className="font-semibold text-neutral-700 dark:text-neutral-300">"Tambah Indikator Manual"</span> untuk membuat indikator baru.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                                            <th className="py-2.5 px-3 w-48">Kategori KPI</th>
                                            <th className="py-2.5 px-3 min-w-[220px]">Indikator & Deskripsi</th>
                                            <th className="py-2.5 px-3 w-40">Tipe Pengukuran</th>
                                            <th className="py-2.5 px-3 w-32">Target</th>
                                            <th className="py-2.5 px-3 w-28">Satuan</th>
                                            <th className="py-2.5 px-3 w-24">Bobot (%)</th>
                                            <th className="py-2.5 px-2 w-12 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {items.map((item, index) => (
                                            <tr key={item.temp_id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                <td className="py-2.5 px-3 text-center font-mono text-neutral-400 align-top pt-3">
                                                    {index + 1}
                                                </td>

                                                {/* Category */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <select
                                                        value={item.category_id}
                                                        onChange={(e) => handleItemChange(index, 'category_id', Number(e.target.value))}
                                                        className="w-full h-8 px-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-none focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                    >
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Name & Description */}
                                                <td className="py-2.5 px-3 space-y-1 align-top">
                                                    <Input
                                                        type="text"
                                                        placeholder="Nama Indikator KPI *"
                                                        value={item.name}
                                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 bg-white dark:bg-neutral-950 shadow-none font-medium"
                                                    />
                                                    <Input
                                                        type="text"
                                                        placeholder="Keterangan / cara pengukuran (opsional)"
                                                        value={item.description || ''}
                                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                        className="h-7 rounded-none border border-neutral-200 dark:border-neutral-800 text-[11px] px-2 bg-white dark:bg-neutral-950 shadow-none text-neutral-500"
                                                    />
                                                </td>

                                                {/* Measurement Type */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <select
                                                        value={item.measurement_type}
                                                        onChange={(e) => handleItemChange(index, 'measurement_type', e.target.value)}
                                                        className="w-full h-8 px-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-none focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                    >
                                                        {MEASUREMENT_TYPES.map(m => (
                                                            <option key={m.value} value={m.value}>
                                                                {m.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Target */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 100"
                                                        value={item.target ?? ''}
                                                        onChange={(e) => handleItemChange(index, 'target', e.target.value)}
                                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 bg-white dark:bg-neutral-950 shadow-none font-mono"
                                                    />
                                                </td>

                                                {/* Unit */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. %, berkas"
                                                        value={item.unit || ''}
                                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 bg-white dark:bg-neutral-950 shadow-none"
                                                    />
                                                </td>

                                                {/* Weight */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={item.weight}
                                                        onChange={(e) => handleItemChange(index, 'weight', Number(e.target.value))}
                                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 bg-white dark:bg-neutral-950 shadow-none font-mono font-bold"
                                                    />
                                                </td>

                                                {/* Remove */}
                                                <td className="py-2.5 px-2 text-center align-top pt-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                                                        title="Hapus Indikator"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </FormSection>

                {/* 3. Initial Notes */}
                <FormSection
                    title="3. Catatan & Arahan Awal (Opsional)"
                    description="Instruksi atau catatan pengantar untuk staf sebelum mengisi penilaian diri"
                >
                    <Textarea
                        rows={3}
                        value={employeeNotes}
                        onChange={(e) => setEmployeeNotes(e.target.value)}
                        placeholder="Contoh: Fokus pada pemenuhan target mutu pelayanan dan kedisiplinan logbook semester ini..."
                        className="rounded-none border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm bg-white dark:bg-neutral-950 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                    />
                </FormSection>
            </FormCard>

            {/* Template Picker Dialog */}
            <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <DialogContent className="max-w-3xl rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Layers className="size-4" /> Pilih Template Indikator KPI
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Pilih satu atau beberapa indikator KPI baku yang sudah disiapkan di master template.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 py-2">
                        <div className="relative flex-1">
                            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <Input
                                placeholder="Cari nama indikator atau kode..."
                                value={pickerSearch}
                                onChange={(e) => setPickerSearch(e.target.value)}
                                className="h-8 pl-8 rounded-none text-xs border-neutral-200 dark:border-neutral-800 shadow-none"
                            />
                        </div>
                        <select
                            value={pickerCategory}
                            onChange={(e) => setPickerCategory(e.target.value)}
                            className="h-8 px-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-none focus:outline-none"
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Template List Container */}
                    <div className="border border-neutral-200 dark:border-neutral-800 max-h-[380px] overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="p-2 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between text-xs font-mono border-b border-neutral-200 dark:border-neutral-800">
                            <button
                                type="button"
                                onClick={handleSelectAllFiltered}
                                className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold hover:underline"
                            >
                                <CheckSquare className="size-3.5" /> Pilih Semua di Tampilan ({filteredTemplates.length})
                            </button>
                            <span className="text-neutral-500">
                                {selectedTemplateIds.length} item terpilih
                            </span>
                        </div>

                        {filteredTemplates.length === 0 ? (
                            <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                                Tidak ada template KPI yang sesuai dengan kriteria pencarian.
                            </div>
                        ) : (
                            filteredTemplates.map(tpl => {
                                const isSelected = selectedTemplateIds.includes(tpl.id);
                                return (
                                    <div
                                        key={tpl.id}
                                        onClick={() => toggleSelectTemplate(tpl.id)}
                                        className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-neutral-100 dark:bg-neutral-900 font-medium'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                                        }`}
                                    >
                                        <div className="pt-0.5 text-neutral-700 dark:text-neutral-300">
                                            {isSelected ? (
                                                <CheckSquare className="size-4 text-neutral-900 dark:text-white" />
                                            ) : (
                                                <Square className="size-4 text-neutral-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                                                    {tpl.name}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] rounded-none py-0 px-1 font-mono">
                                                    {tpl.code}
                                                </Badge>
                                                <span className="text-[11px] text-neutral-500 font-mono">
                                                    • {tpl.category_name}
                                                </span>
                                            </div>
                                            {tpl.description && (
                                                <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                                    {tpl.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono mt-1">
                                                <span>Tipe: <strong>{tpl.measurement_type}</strong></span>
                                                <span>Target: <strong>{tpl.target_min ?? tpl.target_max ?? '-'} {tpl.unit}</strong></span>
                                                <span>Bobot Acuan: <strong>{tpl.weight}%</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPickerOpen(false)}
                            className="rounded-none border-neutral-300 dark:border-neutral-700 text-xs shadow-none"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={selectedTemplateIds.length === 0}
                            onClick={handleApplyTemplates}
                            className="rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold shadow-none"
                        >
                            Gunakan {selectedTemplateIds.length} Indikator Terpilih
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={alertMessage !== null}
                onOpenChange={(open) => { if (!open) setAlertMessage(null); }}
                title="Pemberitahuan"
                description={alertMessage || ''}
                hideCancel
            />
        </HrLayout>
    );
}
