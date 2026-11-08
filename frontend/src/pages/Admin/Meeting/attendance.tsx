import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function MeetingAttendance() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [meeting, setMeeting] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [confirmDialog, setConfirmDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Hardcode user ID 1 as currently logged in user for demo purposes
    const currentUserId = 1;

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const mRes = await api.get(`/meetings/${id}`);
            setMeeting(mRes.data);

            const pRes = await api.get(`/meetings/${id}/participants`);
            setParticipants(pRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const userParticipant = participants.find(p => p.user_id === currentUserId);
    const canCheckIn = meeting && ['ongoing', 'completed'].includes(meeting.status);

    const handleMarkAttendance = async () => {
        if (!userParticipant) return;
        setProcessing(true);
        try {
            await api.post(`/meetings/${id}/check-in`, { user_id: currentUserId });
            toast.success('Kehadiran berhasil dikonfirmasi!');
            setConfirmDialog(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengkonfirmasi kehadiran');
        } finally {
            setProcessing(false);
        }
    };

    const getAttendanceBadge = (status: string) => {
        const badges: any = {
            invited: <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">Diundang</Badge>,
            confirmed: <Badge variant="outline" className="rounded-none border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-mono text-[10px] uppercase font-semibold">Dikonfirmasi</Badge>,
            attended: <Badge variant="outline" className="rounded-none border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] uppercase font-semibold">Hadir</Badge>,
            absent: <Badge variant="outline" className="rounded-none border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono text-[10px] uppercase font-semibold">Tidak Hadir</Badge>,
            excused: <Badge variant="outline" className="rounded-none border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono text-[10px] uppercase font-semibold">Berhalangan</Badge>,
        };
        return badges[status] || badges.invited;
    };

    const getRoleBadge = (role: string) => {
        const badges: any = {
            participant: <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">Peserta</Badge>,
            moderator: <Badge variant="outline" className="rounded-none border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-mono text-[10px] uppercase font-semibold">Moderator</Badge>,
            secretary: <Badge variant="outline" className="rounded-none border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] uppercase font-semibold">Sekretaris</Badge>,
            observer: <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">Observer</Badge>,
        };
        return badges[role] || badges.participant;
    };

    if (loading) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
    if (!meeting) return <AdminLayout><div className="p-6">Data tidak ditemukan</div></AdminLayout>;

    const dateObj = meeting.meeting_date ? parseISO(meeting.meeting_date) : null;
    const formattedDate = dateObj ? format(dateObj, 'EEEE, dd MMMM yyyy', { locale: indonesianLocale }) : '-';

    return (
        <AdminLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col font-sans">
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
                            <CheckCircle className="size-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                Konfirmasi Kehadiran Rapat
                            </h1>
                            <p className="text-[11px] text-neutral-500 font-mono truncate">
                                {meeting.meeting_number} • {meeting.title}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unified Content Flow - No Nested Cards */}
                <div className="p-4 sm:p-6 space-y-6">
                    {/* 1. Informasi Rapat */}
                    <div className="space-y-3">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Informasi Jadwal & Tempat
                            </h3>
                        </div>

                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                            <div>
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">No. Rapat</dt>
                                <dd className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">{meeting.meeting_number}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Status Rapat</dt>
                                <dd className="flex gap-2">
                                    {meeting.status === 'draft' && <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">Draft</Badge>}
                                    {meeting.status === 'scheduled' && <Badge variant="outline" className="rounded-none border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-mono text-[10px] uppercase font-semibold">Dijadwalkan</Badge>}
                                    {meeting.status === 'ongoing' && <Badge variant="outline" className="rounded-none border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono text-[10px] uppercase font-semibold">Berlangsung</Badge>}
                                    {meeting.status === 'completed' && <Badge variant="outline" className="rounded-none border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] uppercase font-semibold">Selesai</Badge>}
                                    {meeting.status === 'cancelled' && <Badge variant="outline" className="rounded-none border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono text-[10px] uppercase font-semibold">Dibatalkan</Badge>}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Judul Rapat</dt>
                                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{meeting.title}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Tanggal</dt>
                                <dd className="text-sm font-medium">{formattedDate}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Waktu</dt>
                                <dd className="text-sm font-mono">{meeting.start_time?.substring(0, 5)} - {meeting.end_time?.substring(0, 5)} WIB</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Ruangan / Tempat</dt>
                                <dd className="text-sm font-medium">{meeting.room?.name || 'Belum ditentukan'}</dd>
                            </div>
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Agenda</dt>
                                <dd className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">{meeting.agenda || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* 2. Status Kehadiran Anda */}
                    <div className="space-y-3">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Status Kehadiran Anda
                            </h3>
                            <p className="text-[11px] text-neutral-500 font-mono">Informasi kehadiran dan role Anda dalam rapat ini</p>
                        </div>

                        {!userParticipant ? (
                            <div className="py-8 text-center border border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50/50 dark:bg-neutral-900/30">
                                <Clock className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                                <h3 className="text-xs font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-0.5">Anda Bukan Peserta</h3>
                                <p className="text-xs text-neutral-500 font-mono">Anda tidak terdaftar sebagai peserta dalam rapat ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Nama Peserta</dt>
                                        <dd className="text-sm font-semibold">{userParticipant.user?.name || 'Anda'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Peran (Role)</dt>
                                        <dd>{getRoleBadge(userParticipant.role)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Status Presensi</dt>
                                        <dd>{getAttendanceBadge(userParticipant.attendance_status)}</dd>
                                    </div>
                                </dl>

                                {userParticipant.check_in_time && (
                                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <span className="text-[11px] font-mono uppercase text-neutral-500">Waktu Check-in: </span>
                                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">{userParticipant.check_in_time}</span>
                                    </div>
                                )}

                                {(meeting.status === 'ongoing' || meeting.status === 'scheduled') && userParticipant.attendance_status !== 'attended' && (
                                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <Button
                                            onClick={() => setConfirmDialog(true)}
                                            className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5"
                                            disabled={!canCheckIn}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" /> Konfirmasi Kehadiran Sekarang
                                        </Button>
                                        <p className="text-[11px] text-neutral-500 font-mono mt-1.5">
                                            {canCheckIn ? 'Check-in dapat dilakukan hingga akhir rapat' : 'Check-in dibuka setelah rapat dimulai'}
                                        </p>
                                    </div>
                                )}

                                {userParticipant.attendance_status === 'attended' && (
                                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1">
                                            <CheckCircle className="size-3.5" />
                                            <span>Kehadiran Anda telah terverifikasi secara resmi.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Kehadiran</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin mengkonfirmasi kehadiran Anda untuk rapat ini?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog(false)} disabled={processing}>Batal</Button>
                        <Button onClick={handleMarkAttendance} disabled={processing}>
                            {processing ? 'Memproses...' : 'Ya, Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
