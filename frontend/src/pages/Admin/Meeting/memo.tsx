import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileDown, Save, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';

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
        window.open(`http://localhost:8080/api/meetings/${id}/generate-memo`, '_blank');
    };

    if (loading) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
    if (!meeting) return <AdminLayout><div className="p-6">Data tidak ditemukan</div></AdminLayout>;

    const dateObj = meeting.meeting_date ? parseISO(meeting.meeting_date) : null;
    const formattedDate = dateObj ? format(dateObj, 'EEEE, dd MMMM yyyy', { locale: indonesianLocale }) : '-';

    return (
        <AdminLayout>
            <div className="p-4 max-w-full pb-24">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate(`/admin/meetings/${id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Edit Memo</h2>
                        <p className="text-sm text-muted-foreground">Edit konten memo untuk rapat ini.</p>
                    </div>
                </div>

                <div className="pb-6">
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Informasi Rapat</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">No. Rapat</dt>
                                    <dd className="font-medium">{meeting.meeting_number}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Judul</dt>
                                    <dd className="font-medium">{meeting.title}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Tanggal</dt>
                                    <dd className="font-medium">{formattedDate}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Waktu</dt>
                                    <dd className="font-medium">
                                        {meeting.start_time?.substring(0,5)} - {meeting.end_time?.substring(0,5)} WIB
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Konten Memo</CardTitle>
                            <CardDescription>
                                Gunakan editor di bawah untuk membuat konten memo rapat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={memoContent}
                                    onChange={handleContentChange}
                                    className="h-[300px] mb-12"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
                                <div>
                                    {meeting.memo_content && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={handleDownloadMemo} 
                                            className="w-full sm:w-auto"
                                            disabled={meeting.status !== 'completed'}
                                        >
                                            <FileDown className="mr-2 h-4 w-4" /> Download PDF
                                            {meeting.status !== 'completed' && <span className="ml-2 text-xs">(Setelah Selesai)</span>}
                                        </Button>
                                    )}
                                </div>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Memo'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
