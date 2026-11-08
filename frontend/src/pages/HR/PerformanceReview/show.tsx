import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    Edit,
    Loader2,
    CheckCircle2,
    UserCheck,
    FileCheck,
    Target,
    Layers,
    FileText,
    TrendingUp,
    ChevronRight,
    AlertCircle,
    User,
    Calendar,
    BarChart3,
} from 'lucide-react';
import { DetailCard } from '@/components/ui/form-card';
import api from '@/lib/api';

interface PerformanceReviewItem {
    id: number;
    review_id: number;
    template_id: number | null;
    category_id: number;
    category_name: string;
    name: string;
    description: string | null;
    measurement_type: string;
    unit: string | null;
    target: number | null;
    actual: number | null;
    weight: number;
    self_score: number | null;
    manager_score: number | null;
    final_score: number | null;
    self_comment: string | null;
    manager_comment: string | null;
}

interface ReviewDetail {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_nik: string;
    organization_unit: string | null;
    period_id: number;
    period_name: string;
    reviewer_id: number | null;
    reviewer_name: string | null;
    status: string;
    self_score: number | null;
    manager_score: number | null;
    final_score: number | null;
    final_grade: string | null;
    employee_notes: string | null;
    manager_notes: string | null;
    strengths: string | null;
    improvements: string | null;
    development_plan: string | null;
    self_reviewed_at: string | null;
    manager_reviewed_at: string | null;
    completed_at: string | null;
    items: PerformanceReviewItem[];
}

export default function PerformanceReviewShow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<ReviewDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal Dialog states
    const [isSelfReviewOpen, setIsSelfReviewOpen] = useState(false);
    const [isManagerReviewOpen, setIsManagerReviewOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Self Review Form State
    const [selfItems, setSelfItems] = useState<
        { id: number; name: string; weight: number; actual: string; self_score: string; self_comment: string }[]
    >([]);
    const [selfEmployeeNotes, setSelfEmployeeNotes] = useState('');

    // Manager Review Form State
    const [managerItems, setManagerItems] = useState<
        { id: number; name: string; weight: number; target: string; actual: string; self_score: string; manager_score: string; manager_comment: string }[]
    >([]);
    const [mgrNotes, setMgrNotes] = useState('');
    const [mgrStrengths, setMgrStrengths] = useState('');
    const [mgrImprovements, setMgrImprovements] = useState('');
    const [mgrDevPlan, setMgrDevPlan] = useState('');

    const fetchReview = async () => {
        try {
            const res = await api.get(`/performance-reviews/${id}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching review details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchReview();
        }
    }, [id]);

    // Open Self Review Dialog
    const handleOpenSelfReview = () => {
        if (!data) return;
        setSelfItems(
            (data.items || []).map(item => ({
                id: item.id,
                name: item.name,
                weight: item.weight,
                actual: item.actual !== null && item.actual !== undefined ? String(item.actual) : '',
                self_score: item.self_score !== null && item.self_score !== undefined ? String(item.self_score) : '',
                self_comment: item.self_comment || '',
            }))
        );
        setSelfEmployeeNotes(data.employee_notes || '');
        setIsSelfReviewOpen(true);
    };

    // Calculate live weighted self score
    const liveCalculatedSelfScore = useMemo(() => {
        let totalW = 0;
        let weightedS = 0;
        selfItems.forEach(item => {
            const sc = parseFloat(item.self_score);
            if (!isNaN(sc) && item.weight > 0) {
                totalW += item.weight;
                weightedS += sc * item.weight;
            }
        });
        return totalW > 0 ? (weightedS / totalW).toFixed(2) : '-';
    }, [selfItems]);

    const handleSubmitSelfReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                employee_notes: selfEmployeeNotes || null,
                items: selfItems.map(item => ({
                    id: item.id,
                    actual: item.actual !== '' ? Number(item.actual) : null,
                    self_score: item.self_score !== '' ? Number(item.self_score) : null,
                    self_comment: item.self_comment || null,
                })),
            };

            await api.post(`/performance-reviews/${id}/self-review`, payload);
            setIsSelfReviewOpen(false);
            fetchReview();
        } catch (error: any) {
            console.error('Error submitting self review:', error);
            alert(error?.response?.data?.error || 'Gagal menyimpan penilaian mandiri');
        } finally {
            setSubmitting(false);
        }
    };

    // Open Manager Review Dialog
    const handleOpenManagerReview = () => {
        if (!data) return;
        setManagerItems(
            (data.items || []).map(item => ({
                id: item.id,
                name: item.name,
                weight: item.weight,
                target: item.target !== null && item.target !== undefined ? String(item.target) : '-',
                actual: item.actual !== null && item.actual !== undefined ? String(item.actual) : '-',
                self_score: item.self_score !== null && item.self_score !== undefined ? String(item.self_score) : '-',
                manager_score: item.manager_score !== null && item.manager_score !== undefined ? String(item.manager_score) : (item.self_score !== null && item.self_score !== undefined ? String(item.self_score) : ''),
                manager_comment: item.manager_comment || '',
            }))
        );
        setMgrNotes(data.manager_notes || '');
        setMgrStrengths(data.strengths || '');
        setMgrImprovements(data.improvements || '');
        setMgrDevPlan(data.development_plan || '');
        setIsManagerReviewOpen(true);
    };

    // Calculate live weighted manager score & grade
    const liveManagerScoreDetails = useMemo(() => {
        let totalW = 0;
        let weightedS = 0;
        managerItems.forEach(item => {
            const sc = parseFloat(item.manager_score);
            if (!isNaN(sc) && item.weight > 0) {
                totalW += item.weight;
                weightedS += sc * item.weight;
            }
        });

        if (totalW === 0) return { score: '-', grade: '-' };
        const score = (weightedS / totalW);
        let grade = 'E';
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';

        return { score: score.toFixed(2), grade };
    }, [managerItems]);

    const handleSubmitManagerReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                manager_notes: mgrNotes || null,
                strengths: mgrStrengths || null,
                improvements: mgrImprovements || null,
                development_plan: mgrDevPlan || null,
                items: managerItems.map(item => ({
                    id: item.id,
                    manager_score: item.manager_score !== '' ? Number(item.manager_score) : null,
                    manager_comment: item.manager_comment || null,
                })),
            };

            await api.post(`/performance-reviews/${id}/manager-review`, payload);
            setIsManagerReviewOpen(false);
            fetchReview();
        } catch (error: any) {
            console.error('Error submitting manager review:', error);
            alert(error?.response?.data?.error || 'Gagal menyimpan review atasan');
        } finally {
            setSubmitting(false);
        }
    };

    // Complete Review Action
    const handleCompleteReview = async () => {
        if (!confirm('Apakah Anda yakin ingin menyelesaikan dan mengunci sesi penilaian ini? Setelah selesai, nilai tidak dapat diubah lagi.')) {
            return;
        }

        try {
            await api.post(`/performance-reviews/${id}/complete`);
            fetchReview();
        } catch (error: any) {
            console.error('Error completing review:', error);
            alert(error?.response?.data?.error || 'Gagal menyelesaikan penilaian');
        }
    };

    if (loading) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data penilaian kinerja...
                </div>
            </HrLayout>
        );
    }

    if (!data) {
        return (
            <HrLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data penilaian kinerja tidak ditemukan.
                </div>
            </HrLayout>
        );
    }

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'draft':
                return <Badge variant="outline" className="rounded-none bg-neutral-100 text-neutral-700 border-neutral-300 font-mono uppercase text-[10px]">1. Draf Awal</Badge>;
            case 'self_review':
                return <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-700 border-blue-300 font-mono uppercase text-[10px]">2. Self Review Selesai</Badge>;
            case 'manager_review':
                return <Badge variant="outline" className="rounded-none bg-amber-50 text-amber-700 border-amber-300 font-mono uppercase text-[10px]">3. Review Atasan Selesai</Badge>;
            case 'calibration':
                return <Badge variant="outline" className="rounded-none bg-purple-50 text-purple-700 border-purple-300 font-mono uppercase text-[10px]">4. Kalibrasi</Badge>;
            case 'completed':
                return <Badge variant="outline" className="rounded-none bg-emerald-50 text-emerald-700 border-emerald-300 font-mono uppercase text-[10px]">5. Selesai (Final)</Badge>;
            default:
                return <Badge variant="outline" className="rounded-none font-mono uppercase text-[10px]">{st}</Badge>;
        }
    };

    const getGradeBadge = (grade: string | null) => {
        if (!grade) return <span className="text-neutral-400">-</span>;
        const color = {
            A: 'bg-emerald-600 text-white',
            B: 'bg-blue-600 text-white',
            C: 'bg-amber-600 text-white',
            D: 'bg-orange-600 text-white',
            E: 'bg-rose-600 text-white',
        }[grade] || 'bg-neutral-800 text-white';

        return (
            <span className={`inline-block px-2.5 py-0.5 text-xs font-mono font-black ${color}`}>
                Grade {grade}
            </span>
        );
    };

    return (
        <HrLayout>
            <DetailCard
                title={`Evaluasi: ${data.employee_name}`}
                subtitle={`Periode: ${data.period_name} • NIK: ${data.employee_nik || '-'} • Unit: ${data.organization_unit || '-'}`}
                icon={Award}
                onBack={() => navigate('/hr/performance-reviews')}
                badges={getStatusBadge(data.status)}
                headerActions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Self Review Button */}
                        {data.status !== 'completed' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOpenSelfReview}
                                className="h-8 px-3 rounded-none border-neutral-300 dark:border-neutral-700 text-xs font-semibold gap-1.5 shadow-none hover:bg-neutral-100 dark:hover:bg-neutral-900"
                            >
                                <UserCheck className="size-3.5 text-blue-600" />
                                {data.self_reviewed_at ? 'Edit Self Review' : 'Isi Self Review'}
                            </Button>
                        )}

                        {/* 2. Manager Review Button */}
                        {data.status !== 'completed' && (
                            <Button
                                size="sm"
                                onClick={handleOpenManagerReview}
                                className="h-8 px-3 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <FileCheck className="size-3.5" />
                                {data.manager_reviewed_at ? 'Edit Review Atasan' : 'Review Atasan (Manager)'}
                            </Button>
                        )}

                        {/* 3. Complete Review Button */}
                        {data.status === 'manager_review' && (
                            <Button
                                size="sm"
                                onClick={handleCompleteReview}
                                className="h-8 px-3 rounded-none bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <CheckCircle2 className="size-3.5" /> Selesaikan Penilaian
                            </Button>
                        )}

                        {/* 4. Edit Configuration Button */}
                        {data.status !== 'completed' && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/hr/performance-reviews/${id}/edit`)}
                                className="h-8 px-2.5 rounded-none text-xs font-semibold gap-1 shadow-none"
                                title="Edit Item & Indikator KPI"
                            >
                                <Edit className="size-3.5" />
                            </Button>
                        )}
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Score Summary Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Skor Mandiri (Self)
                            </div>
                            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                {data.self_score !== null && data.self_score !== undefined ? `${data.self_score}` : '-'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                {data.self_reviewed_at ? `Selesai ${new Date(data.self_reviewed_at).toLocaleDateString('id-ID')}` : 'Belum diisi'}
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Skor Atasan (Manager)
                            </div>
                            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                {data.manager_score !== null && data.manager_score !== undefined ? `${data.manager_score}` : '-'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                {data.reviewer_name ? `Oleh: ${data.reviewer_name}` : 'Belum dinilai'}
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Skor Akhir (Weighted)
                            </div>
                            <div className="text-xl font-black font-mono text-neutral-900 dark:text-white mt-1">
                                {data.final_score !== null && data.final_score !== undefined ? `${data.final_score}` : '-'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                Skala 0 - 100
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                                Predikat / Grade Akhir
                            </div>
                            <div className="mt-1">
                                {getGradeBadge(data.final_grade)}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-1">
                                {data.completed_at ? `Terkunci ${new Date(data.completed_at).toLocaleDateString('id-ID')}` : 'Status Berjalan'}
                            </div>
                        </div>
                    </div>

                    {/* Section: KPI Indicators Table */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                    <Target className="size-4" /> Rincian Capaian Indikator KPI
                                </h3>
                                <p className="text-[11px] text-neutral-500 font-mono">
                                    Daftar target capaian kinerja, realisasi lapangan, dan skor pembobotan
                                </p>
                            </div>
                            <div className="text-xs font-mono text-neutral-500">
                                Total: <strong>{data.items?.length || 0}</strong> Indikator
                            </div>
                        </div>

                        <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                        <th className="py-2.5 px-3 w-40">Kategori</th>
                                        <th className="py-2.5 px-3 min-w-[200px]">Indikator KPI</th>
                                        <th className="py-2.5 px-3 w-28">Tipe & Satuan</th>
                                        <th className="py-2.5 px-3 w-24 text-right">Target</th>
                                        <th className="py-2.5 px-3 w-24 text-right">Capaian Riil</th>
                                        <th className="py-2.5 px-3 w-20 text-center">Bobot</th>
                                        <th className="py-2.5 px-3 w-24 text-right">Skor Self</th>
                                        <th className="py-2.5 px-3 w-24 text-right">Skor Atasan</th>
                                        <th className="py-2.5 px-3 min-w-[180px]">Catatan / Ulasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {(!data.items || data.items.length === 0) ? (
                                        <tr>
                                            <td colSpan={10} className="py-6 text-center text-neutral-500 font-mono text-xs">
                                                Belum ada rincian indikator KPI pada sesi ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                <td className="py-2.5 px-3 text-center font-mono text-neutral-400 align-top">
                                                    {index + 1}
                                                </td>

                                                {/* Category */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <Badge variant="outline" className="rounded-none text-[10px] py-0 px-1 font-mono">
                                                        {item.category_name || '-'}
                                                    </Badge>
                                                </td>

                                                {/* Name & Description */}
                                                <td className="py-2.5 px-3 align-top">
                                                    <div className="font-semibold text-neutral-900 dark:text-white">
                                                        {item.name}
                                                    </div>
                                                    {item.description && (
                                                        <div className="text-[11px] text-neutral-500 mt-0.5">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Measurement & Unit */}
                                                <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 align-top">
                                                    <div>{item.measurement_type}</div>
                                                    {item.unit && <div className="text-neutral-400">({item.unit})</div>}
                                                </td>

                                                {/* Target */}
                                                <td className="py-2.5 px-3 text-right font-mono font-medium align-top">
                                                    {item.target !== null && item.target !== undefined ? item.target : '-'}
                                                </td>

                                                {/* Actual */}
                                                <td className="py-2.5 px-3 text-right font-mono font-bold align-top text-blue-700 dark:text-blue-400">
                                                    {item.actual !== null && item.actual !== undefined ? item.actual : '-'}
                                                </td>

                                                {/* Weight */}
                                                <td className="py-2.5 px-3 text-center font-mono font-bold align-top">
                                                    {item.weight}%
                                                </td>

                                                {/* Self Score */}
                                                <td className="py-2.5 px-3 text-right font-mono align-top text-neutral-700 dark:text-neutral-300">
                                                    {item.self_score !== null && item.self_score !== undefined ? item.self_score : '-'}
                                                </td>

                                                {/* Manager Score */}
                                                <td className="py-2.5 px-3 text-right font-mono font-bold align-top text-neutral-900 dark:text-white">
                                                    {item.manager_score !== null && item.manager_score !== undefined ? item.manager_score : '-'}
                                                </td>

                                                {/* Comments */}
                                                <td className="py-2.5 px-3 text-xs align-top space-y-1">
                                                    {item.self_comment && (
                                                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-1.5 border border-neutral-200 dark:border-neutral-800">
                                                            <strong className="text-neutral-700 dark:text-neutral-300 font-mono">[Self]:</strong> {item.self_comment}
                                                        </div>
                                                    )}
                                                    {item.manager_comment && (
                                                        <div className="text-[11px] text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/60 p-1.5 border border-neutral-300 dark:border-neutral-700">
                                                            <strong className="font-mono">[Atasan]:</strong> {item.manager_comment}
                                                        </div>
                                                    )}
                                                    {!item.self_comment && !item.manager_comment && (
                                                        <span className="text-neutral-400 font-mono text-[11px]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section: Qualitative Feedback & Development Plan */}
                    <div className="space-y-4">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                <FileText className="size-4" /> Ulasan Kualitatif & Rencana Pengembangan
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                                <div className="text-[11px] font-mono font-semibold uppercase text-neutral-500">
                                    Catatan Refleksi Diri (Pegawai)
                                </div>
                                <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                    {data.employee_notes || 'Belum ada catatan dari pegawai.'}
                                </div>
                            </div>

                            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                                <div className="text-[11px] font-mono font-semibold uppercase text-neutral-500">
                                    Catatan Umum Evaluasi (Atasan)
                                </div>
                                <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                    {data.manager_notes || 'Belum ada catatan dari penilai.'}
                                </div>
                            </div>

                            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                                <div className="text-[11px] font-mono font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                                    Poin Keunggulan Staf (Strengths)
                                </div>
                                <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                    {data.strengths || '-'}
                                </div>
                            </div>

                            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                                <div className="text-[11px] font-mono font-semibold uppercase text-amber-600 dark:text-amber-400">
                                    Area Perbaikan (Improvements)
                                </div>
                                <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                    {data.improvements || '-'}
                                </div>
                            </div>

                            <div className="md:col-span-2 p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                                <div className="text-[11px] font-mono font-semibold uppercase text-blue-600 dark:text-blue-400">
                                    Rencana Pengembangan Individu (Individual Development Plan / Training)
                                </div>
                                <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                    {data.development_plan || 'Belum ada rencana pelatihan / pengembangan yang ditetapkan.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailCard>

            {/* Self Review Dialog */}
            <Dialog open={isSelfReviewOpen} onOpenChange={setIsSelfReviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <UserCheck className="size-4" /> Formulir Penilaian Mandiri (Self Review)
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Isi capaian riil lapangan dan evaluasi diri terhadap indikator KPI yang telah ditetapkan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitSelfReview} className="space-y-4">
                        {/* Live Score Preview Bar */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-blue-800 dark:text-blue-300">
                                Total Indikator: <strong>{selfItems.length}</strong>
                            </span>
                            <span className="text-blue-900 dark:text-blue-200 font-bold">
                                Estimasi Nilai Mandiri (Weighted): <strong className="text-sm font-black">{liveCalculatedSelfScore}</strong>
                            </span>
                        </div>

                        {/* Items Inputs */}
                        <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                        <th className="py-2.5 px-3 min-w-[200px]">Indikator KPI</th>
                                        <th className="py-2.5 px-3 w-20 text-center">Bobot</th>
                                        <th className="py-2.5 px-3 w-32">Capaian Riil</th>
                                        <th className="py-2.5 px-3 w-28">Skor Mandiri (0-100)</th>
                                        <th className="py-2.5 px-3 min-w-[220px]">Komentar / Kendala Staf</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {selfItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="py-2.5 px-3 align-top">
                                                <div className="font-semibold text-neutral-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono font-bold align-top">
                                                {item.weight}%
                                            </td>
                                            <td className="py-2.5 px-3 align-top">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    placeholder="Realisasi"
                                                    value={item.actual}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelfItems(prev => {
                                                            const copy = [...prev];
                                                            copy[idx].actual = val;
                                                            return copy;
                                                        });
                                                    }}
                                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 shadow-none font-mono"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 align-top">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                    placeholder="0-100"
                                                    value={item.self_score}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelfItems(prev => {
                                                            const copy = [...prev];
                                                            copy[idx].self_score = val;
                                                            return copy;
                                                        });
                                                    }}
                                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 shadow-none font-mono font-bold"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 align-top">
                                                <Input
                                                    type="text"
                                                    placeholder="Catatan pelaksanaan..."
                                                    value={item.self_comment}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelfItems(prev => {
                                                            const copy = [...prev];
                                                            copy[idx].self_comment = val;
                                                            return copy;
                                                        });
                                                    }}
                                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 shadow-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Employee Notes */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Catatan Refleksi Diri Keseluruhan (Self Notes)
                            </label>
                            <Textarea
                                rows={3}
                                value={selfEmployeeNotes}
                                onChange={(e) => setSelfEmployeeNotes(e.target.value)}
                                placeholder="Tuliskan kendala, usulan perbaikan kerja, atau ringkasan capaian Anda..."
                                className="rounded-none border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm shadow-none"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSelfReviewOpen(false)}
                                className="rounded-none border-neutral-300 dark:border-neutral-700 text-xs shadow-none"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submitting}
                                className="rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold shadow-none"
                            >
                                {submitting ? 'Menyimpan...' : 'Simpan Self Review'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manager Review Dialog */}
            <Dialog open={isManagerReviewOpen} onOpenChange={setIsManagerReviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <FileCheck className="size-4" /> Formulir Evaluasi Penilai / Manager
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Verifikasi capaian staf, berikan penilaian terukur per indikator, dan tetapkan rencana pengembangan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitManagerReview} className="space-y-4">
                        {/* Live Score Preview Bar */}
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-amber-800 dark:text-amber-300">
                                Total Indikator: <strong>{managerItems.length}</strong>
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-amber-900 dark:text-amber-200 font-bold">
                                    Estimasi Skor Akhir: <strong className="text-sm font-black">{liveManagerScoreDetails.score}</strong>
                                </span>
                                <Badge className="rounded-none bg-neutral-900 text-white font-mono font-bold text-xs">
                                    Grade: {liveManagerScoreDetails.grade}
                                </Badge>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                        <th className="py-2.5 px-3 min-w-[180px]">Indikator KPI</th>
                                        <th className="py-2.5 px-2 w-16 text-center">Bobot</th>
                                        <th className="py-2.5 px-2 w-20 text-right">Target</th>
                                        <th className="py-2.5 px-2 w-20 text-right">Realisasi</th>
                                        <th className="py-2.5 px-2 w-20 text-right">Skor Self</th>
                                        <th className="py-2.5 px-3 w-28">Skor Atasan (0-100) *</th>
                                        <th className="py-2.5 px-3 min-w-[200px]">Ulasan Atasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {managerItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="py-2.5 px-3 align-top font-semibold text-neutral-900 dark:text-white">
                                                {item.name}
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-mono font-bold align-top">
                                                {item.weight}%
                                            </td>
                                            <td className="py-2.5 px-2 text-right font-mono align-top text-neutral-500">
                                                {item.target}
                                            </td>
                                            <td className="py-2.5 px-2 text-right font-mono font-semibold align-top text-blue-700 dark:text-blue-400">
                                                {item.actual}
                                            </td>
                                            <td className="py-2.5 px-2 text-right font-mono align-top text-neutral-500">
                                                {item.self_score}
                                            </td>
                                            <td className="py-2.5 px-3 align-top">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                    required
                                                    placeholder="0-100"
                                                    value={item.manager_score}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setManagerItems(prev => {
                                                            const copy = [...prev];
                                                            copy[idx].manager_score = val;
                                                            return copy;
                                                        });
                                                    }}
                                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 shadow-none font-mono font-bold"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 align-top">
                                                <Input
                                                    type="text"
                                                    placeholder="Feedback indikator..."
                                                    value={item.manager_comment}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setManagerItems(prev => {
                                                            const copy = [...prev];
                                                            copy[idx].manager_comment = val;
                                                            return copy;
                                                        });
                                                    }}
                                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2 shadow-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Qualitative Feedback Textareas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Catatan Umum Penilai (Manager Notes)
                                </label>
                                <Textarea
                                    rows={2}
                                    value={mgrNotes}
                                    onChange={(e) => setMgrNotes(e.target.value)}
                                    placeholder="Kinerja secara umum selama periode ini..."
                                    className="rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Poin Keunggulan Staf (Strengths)
                                </label>
                                <Textarea
                                    rows={2}
                                    value={mgrStrengths}
                                    onChange={(e) => setMgrStrengths(e.target.value)}
                                    placeholder="Pencapaian luar biasa, dedikasi, inisiatif..."
                                    className="rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                    Area Perbaikan (Improvements)
                                </label>
                                <Textarea
                                    rows={2}
                                    value={mgrImprovements}
                                    onChange={(e) => setMgrImprovements(e.target.value)}
                                    placeholder="Aspek teknis atau perilaku yang perlu ditingkatkan..."
                                    className="rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    Rencana Pengembangan (Training / IDP)
                                </label>
                                <Textarea
                                    rows={2}
                                    value={mgrDevPlan}
                                    onChange={(e) => setMgrDevPlan(e.target.value)}
                                    placeholder="Program pelatihan, sertifikasi, atau penugasan mentor..."
                                    className="rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsManagerReviewOpen(false)}
                                className="rounded-none border-neutral-300 dark:border-neutral-700 text-xs shadow-none"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submitting}
                                className="rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold shadow-none"
                            >
                                {submitting ? 'Menyimpan...' : 'Simpan Review Atasan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}
