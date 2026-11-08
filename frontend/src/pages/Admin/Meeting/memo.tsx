import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileDown, Save, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import api, { getApiUrl } from '@/lib/api';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function MeetingMemo() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [meeting, setMeeting] = useState<any>(null);
    const [memoContent, setMemoContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/meetings/${id}`);
            setMeeting(res.data);
            
            const savedDraft = localStorage.getItem(`memo_draft_${id}`);
            if (savedDraft) {
                setMemoContent(savedDraft);
                toast.info('Draft memo yang belum tersimpan berhasil dipulihkan.');
            } else {
                setMemoContent(res.data.memo_content || '');
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleContentChange = (content: string) => {
        setMemoContent(content);
        localStorage.setItem(`memo_draft_${id}`, content);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await api.put(`/meetings/${id}/memo`, { memo_content: memoContent });
            toast.success('Memo berhasil disimpan!');
            localStorage.removeItem(`memo_draft_${id}`);
            // update local state
            setMeeting({ ...meeting, memo_content: memoContent });
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan memo');
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadMemo = () => {
        window.open(getApiUrl(`/api/meetings/${id}/generate-memo`), '_blank');
    };

    if (loading) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
    if (!meeting) return <AdminLayout><div className="p-6">Data tidak ditemukan</div></AdminLayout>;

    const dateObj = meeting.meeting_date ? parseISO(meeting.meeting_date) : null;
    const formattedDate = dateObj ? format(dateObj, 'EEEE, dd MMMM yyyy', { locale: indonesianLocale }) : '-';

    return (
        <AdminLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col font-sans mb-12">
                {/* Header Toolbar */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0" 
                            type="button" 
                            onClick={() => navigate(`/admin/meetings/${id}`)}
                            title="Kembali"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                            <FileDown className="size-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                Edit Memo Hasil Rapat
                            </h1>
                            <p className="text-[11px] text-neutral-500 font-mono truncate">
                                {meeting.meeting_number} • {meeting.title}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {meeting.memo_content && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={handleDownloadMemo} 
                                className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none gap-1.5"
                                disabled={meeting.status !== 'completed'}
                            >
                                <FileDown className="h-3.5 w-3.5" /> 
                                <span>Download PDF</span>
                            </Button>
                        )}
                        <Button 
                            type="submit" 
                            form="memo-form" 
                            size="sm"
                            disabled={processing} 
                            className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {processing ? 'Menyimpan...' : 'Simpan Memo'}
                        </Button>
                    </div>
                </div>

                {/* Informasi Rapat Bar */}
                <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                            <dt className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">No. Rapat</dt>
                            <dd className="font-mono font-medium text-neutral-900 dark:text-white">{meeting.meeting_number}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Judul</dt>
                            <dd className="font-medium text-neutral-900 dark:text-white truncate">{meeting.title}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Tanggal</dt>
                            <dd className="font-medium text-neutral-900 dark:text-white">{formattedDate}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Waktu</dt>
                            <dd className="font-mono font-medium text-neutral-900 dark:text-white">
                                {meeting.start_time?.substring(0,5)} - {meeting.end_time?.substring(0,5)} WIB
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Konten Memo Editor */}
                <form id="memo-form" onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 flex flex-col bg-white dark:bg-neutral-950">
                    <div className="bg-white text-neutral-900">
                        <ReactQuill
                            theme="snow"
                            value={memoContent}
                            onChange={handleContentChange}
                            className="h-[320px] mb-12"
                        />
                    </div>
                </form>

                {/* Footer Toolbar */}
                <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 flex items-center justify-between gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/meetings/${id}`)}
                        className="h-8 px-4 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-xs font-semibold"
                    >
                        Kembali
                    </Button>
                    <div className="flex items-center gap-2">
                        {meeting.memo_content && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={handleDownloadMemo} 
                                className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none gap-1.5"
                                disabled={meeting.status !== 'completed'}
                            >
                                <FileDown className="h-3.5 w-3.5" /> 
                                <span>Download PDF</span>
                            </Button>
                        )}
                        <Button 
                            type="submit" 
                            form="memo-form" 
                            size="sm"
                            disabled={processing} 
                            className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {processing ? 'Menyimpan...' : 'Simpan Memo'}
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
