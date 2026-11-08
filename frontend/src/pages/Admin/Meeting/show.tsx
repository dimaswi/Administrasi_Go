import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import api, { getApiUrl } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActionItems } from '@/components/meeting/action-items';
import { CheckinQRCode } from '@/components/meeting/checkin-qrcode';
import { format, parse, isBefore, subMinutes } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { Calendar, Clock, DoorOpen, Edit3, FileText, MapPin, User, Users, Building2, CheckCircle2, XCircle, Download, Loader2, Play, Ban, RefreshCw, ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { DetailCard } from '@/components/ui/form-card';

export default function MeetingShow() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [meeting, setMeeting] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAutoRefresh, setIsAutoRefresh] = useState(false);

    // Auth context (dummy: user_id = 1)
    const currentUserId = 1;

    // Modals
    const [cancelDialog, setCancelDialog] = useState({ open: false, loading: false });
    const [completeDialog, setCompleteDialog] = useState({ open: false, loading: false });
    const [markAttendanceDialog, setMarkAttendanceDialog] = useState<{ open: boolean; participant: any | null; status: string; loading: boolean }>({
        open: false, participant: null, status: 'attended', loading: false
    });

    const fetchMeeting = useCallback(async () => {
        try {
            const res = await api.get(`/meetings/${id}`);
            setMeeting(res.data);

            const pres = await api.get(`/meetings/${id}/participants`);
            setParticipants(pres.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat rapat');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchMeeting();
    }, [fetchMeeting]);

    useEffect(() => {
        if (meeting?.status === 'ongoing') {
            setIsAutoRefresh(true);
        }
    }, [meeting?.status]);

    useEffect(() => {
        if (!isAutoRefresh || meeting?.status !== 'ongoing') return;
        const interval = setInterval(() => {
            fetchMeeting();
        }, 10000);
        return () => clearInterval(interval);
    }, [isAutoRefresh, meeting?.status, fetchMeeting]);

    const handleManualRefresh = () => {
        fetchMeeting();
        toast.success('Data berhasil diperbarui');
    };

    const handleStartMeeting = async () => {
        try {
            await api.post(`/meetings/${id}/start`);
            toast.success('Rapat berhasil dimulai');
            fetchMeeting();
        } catch (error) {
            toast.error('Gagal memulai rapat');
        }
    };

    const handleCompleteMeeting = async () => {
        setCompleteDialog({ ...completeDialog, loading: true });
        try {
            await api.put(`/meetings/${id}/complete`);
            toast.success('Rapat telah diselesaikan');
            setCompleteDialog({ open: false, loading: false });
            fetchMeeting();
        } catch (error) {
            toast.error('Gagal menyelesaikan rapat');
            setCompleteDialog({ ...completeDialog, loading: false });
        }
    };

    const handleCancelMeeting = async () => {
        setCancelDialog({ ...cancelDialog, loading: true });
        try {
            await api.post(`/meetings/${id}/cancel`);
            toast.success('Rapat dibatalkan');
            setCancelDialog({ open: false, loading: false });
            fetchMeeting();
        } catch (error) {
            toast.error('Gagal membatalkan rapat');
            setCancelDialog({ ...cancelDialog, loading: false });
        }
    };

    const handleConfirmMarkAttendance = async () => {
        if (!markAttendanceDialog.participant) return;
        setMarkAttendanceDialog(prev => ({ ...prev, loading: true }));
        try {
            await api.put(`/meetings/${meeting.id}/participants/${markAttendanceDialog.participant.user_id}/attendance`, {
                attendance_status: markAttendanceDialog.status
            });
            toast.success('Status presensi berhasil diupdate');
            setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false });
            fetchMeeting();
        } catch (error) {
            toast.error('Gagal mengupdate presensi');
            setMarkAttendanceDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleGenerateDocument = async (type: string) => {
        try {
            toast.info('Sedang mengunduh dokumen...');
            const response = await api.get(`/meetings/${meeting.id}/export?type=${type}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${meeting.meeting_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Dokumen berhasil diunduh');
        } catch (error) {
            toast.error('Gagal mengunduh dokumen');
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Draft';
            case 'scheduled': return 'Terjadwal';
            case 'ongoing': return 'Berlangsung';
            case 'completed': return 'Selesai';
            case 'cancelled': return 'Dibatalkan';
            default: return status;
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
            case 'scheduled': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
            case 'ongoing': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 animate-pulse';
            case 'completed': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
            case 'cancelled': return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800';
            default: return '';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'moderator': return 'Moderator';
            case 'secretary': return 'Sekretaris';
            case 'observer': return 'Observer';
            case 'participant': return 'Peserta';
            default: return role;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'moderator': return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800';
            case 'secretary': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
            case 'observer': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
            default: return 'bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800';
        }
    };

    const getAttendanceLabel = (status: string) => {
        switch (status) {
            case 'attended': return 'Hadir';
            case 'absent': return 'Tidak Hadir';
            case 'excused': return 'Izin';
            default: return 'Diundang';
        }
    };

    const getAttendanceBadgeColor = (status: string) => {
        switch (status) {
            case 'attended': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
            case 'absent': return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800';
            case 'excused': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800';
            default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700';
        }
    };

    const isModeratorOrOrganizer = useMemo(() => {
        if (!meeting) return false;
        if (meeting.organizer_id === currentUserId) return true;
        const p = participants.find(part => part.user_id === currentUserId);
        return p && (p.role === 'moderator' || p.role === 'secretary');
    }, [meeting, participants]);

    const attendedCount = useMemo(() => {
        return participants.filter(p => p.attendance_status === 'attended').length;
    }, [participants]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data rapat...
                </div>
            </AdminLayout>
        );
    }

    if (!meeting) {
        return (
            <AdminLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    Data rapat tidak ditemukan.
                </div>
            </AdminLayout>
        );
    }

    let canStartMeeting = false;
    if (meeting.meeting_date && meeting.start_time) {
        try {
            const meetingDateTimeStr = `${meeting.meeting_date.substring(0, 10)} ${meeting.start_time}`;
            const meetingDateTime = parse(meetingDateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date());
            canStartMeeting = new Date() >= subMinutes(meetingDateTime, 30);
        } catch (e) { }
        canStartMeeting = true;
    }

    return (
        <AdminLayout>
                        <DetailCard
                            title={meeting.title}
                            subtitle={`${meeting.meeting_number}${meeting.room?.name ? ` • Ruangan: ${meeting.room.name}` : ''}${meeting.meeting_date ? ` • ${format(new Date(meeting.meeting_date), 'dd MMMM yyyy', { locale: indonesianLocale })}` : ''}`}
                            icon={Calendar}
                            onBack={() => navigate('/admin/meetings')}
                            statusBadge={
                                <Badge variant="outline" className={`rounded-none text-[10px] uppercase font-mono px-2 py-0.5 font-semibold ${getStatusBadgeColor(meeting.status)}`}>
                                    {getStatusLabel(meeting.status)}
                                </Badge>
                            }
                            headerActions={
                                <div className="flex items-center gap-2 flex-wrap">
                                    {meeting.status === 'ongoing' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                                            className="h-8 px-2.5 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-mono shadow-none gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                            title={isAutoRefresh ? "Jeda auto-refresh" : "Aktifkan auto-refresh"}
                                        >
                                            <RefreshCw className={`size-3 ${isAutoRefresh ? 'animate-spin text-emerald-600' : 'text-neutral-400'}`} />
                                            <span>{isAutoRefresh ? 'Live' : 'Jeda'}</span>
                                        </Button>
                                    )}
                                    {(meeting.status === 'draft' || meeting.status === 'cancelled') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none gap-1.5 font-semibold"
                                            onClick={() => navigate(`/admin/meetings/${meeting.id}/edit`)}
                                        >
                                            <Edit className="size-3.5" />
                                            <span>{meeting.status === 'cancelled' ? 'Jadwalkan Ulang' : 'Edit'}</span>
                                        </Button>
                                    )}
                                    {(meeting.status === 'draft' || meeting.status === 'scheduled') && (
                                        <Button
                                            size="sm"
                                            className="h-8 px-3.5 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs shadow-none gap-1.5 font-semibold"
                                            onClick={handleStartMeeting}
                                            disabled={!canStartMeeting}
                                        >
                                            <Play className="size-3.5" />
                                            <span>Mulai Rapat</span>
                                        </Button>
                                    )}
                                    {meeting.status === 'ongoing' && (
                                        <Button
                                            size="sm"
                                            onClick={() => setCompleteDialog({ ...completeDialog, open: true })}
                                            className="h-8 px-3.5 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-xs shadow-none font-semibold gap-1.5"
                                        >
                                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                                            <span>Selesaikan Rapat</span>
                                        </Button>
                                    )}
                                    {(meeting.status === 'draft' || meeting.status === 'scheduled' || meeting.status === 'ongoing') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 rounded-none border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shadow-none gap-1.5 font-semibold"
                                            onClick={() => setCancelDialog({ ...cancelDialog, open: true })}
                                        >
                                            <Ban className="size-3.5" />
                                            <span>Batalkan Rapat</span>
                                        </Button>
                                    )}
                                </div>
                }
            >
                        {/* 1. INFORMASI RAPAT */}
                        <div className="space-y-3">
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-neutral-500" /> Informasi Jadwal & Lokasi
                                </h3>
                                <span className="text-[11px] font-mono text-neutral-500 uppercase">
                                    {meeting.meeting_date ? format(new Date(meeting.meeting_date), 'dd MMMM yyyy', { locale: indonesianLocale }) : '-'}
                                </span>
                            </div>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 py-2">
                                <div>
                                    <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Penyelenggara</dt>
                                    <dd className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                        <span>{meeting.organizer?.name || '-'}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Waktu Pelaksanaan</dt>
                                    <dd className="text-sm font-mono font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                        <span>{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)} WIB</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Ruangan / Tempat</dt>
                                    <dd className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                                        <DoorOpen className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                        <span>{meeting.room?.name || 'Belum ditentukan'}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-0.5">Unit Organisasi</dt>
                                    <dd className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                        <span>{meeting.organization_unit?.name || '-'}</span>
                                    </dd>
                                </div>
                                <div className="col-span-1 sm:col-span-2 lg:col-span-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-1">Agenda Utama</dt>
                                    <dd className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-line font-medium leading-relaxed">
                                        {meeting.agenda || 'Tidak ada agenda khusus'}
                                    </dd>
                                </div>
                                {meeting.notes && (
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                        <dt className="text-[11px] font-mono uppercase text-neutral-500 mb-1">Catatan Tambahan</dt>
                                        <dd className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                                            {meeting.notes}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* 2. DAFTAR PESERTA RAPAT */}
                        <div className="space-y-3">
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 text-neutral-500" /> Daftar Peserta Undangan ({participants.length})
                                    </h3>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        {attendedCount} hadir dari {participants.length} peserta undangan
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/meetings/${meeting.id}/attendance`)}
                                    className="h-7 px-3 rounded-none border-neutral-300 dark:border-neutral-700 text-xs shadow-none font-semibold gap-1.5 self-start sm:self-auto"
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                >
                                    <Users className="h-3.5 w-3.5" /> Kelola Presensi
                                </Button>
                            </div>

                            <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-neutral-100/70 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                        <TableRow>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>Nama Pegawai</TableHead>
                                            <TableHead className="w-36">NIP</TableHead>
                                            <TableHead className="w-48">Unit Kerja</TableHead>
                                            <TableHead className="w-32">Peran</TableHead>
                                            <TableHead className="w-36">Kehadiran</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-neutral-200 dark:border-neutral-800 text-xs">
                                        {participants.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-neutral-500 font-mono">
                                                    Belum ada peserta yang didaftarkan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            participants.map((participant, index) => (
                                                <TableRow key={participant.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <TableCell className="py-2.5 text-center font-mono text-neutral-400">{index + 1}</TableCell>
                                                    <TableCell className="py-2.5 font-semibold text-neutral-900 dark:text-white">{participant.user?.name || '-'}</TableCell>
                                                    <TableCell className="py-2.5 font-mono text-neutral-500">{participant.user?.nip || '-'}</TableCell>
                                                    <TableCell className="py-2.5 text-neutral-600 dark:text-neutral-400">{participant.user?.organization_unit?.name || '-'}</TableCell>
                                                    <TableCell className="py-2.5">
                                                        <Badge variant="outline" className={`rounded-none text-[10px] py-0 px-1.5 font-mono ${getRoleBadgeColor(participant.role)}`}>
                                                            {getRoleLabel(participant.role)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={`rounded-none text-[10px] py-0 px-1.5 font-mono ${getAttendanceBadgeColor(participant.attendance_status)}`}>
                                                                {getAttendanceLabel(participant.attendance_status)}
                                                            </Badge>
                                                            {isModeratorOrOrganizer && meeting.status === 'ongoing' && (
                                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-none text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setMarkAttendanceDialog({ open: true, participant, status: 'attended', loading: false })}>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* 3. DOKUMEN & NOTULENSI */}
                        <div className="space-y-3">
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-neutral-500" /> Dokumen & Notulensi Rapat
                                    </h3>
                                    <p className="text-[11px] text-neutral-500 font-mono">Undangan resmi, konfirmasi kehadiran, dan memo hasil rapat</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/meetings/${meeting.id}/memo`)}
                                    className="h-7 px-3 rounded-none border-neutral-300 dark:border-neutral-700 text-xs shadow-none font-semibold gap-1.5"
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                >
                                    <Edit3 className="h-3.5 w-3.5" /> Edit Memo Hasil Rapat
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleGenerateDocument('invitation')}
                                    className="text-left p-3 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors flex items-start gap-3 rounded-none group cursor-pointer"
                                >
                                    <div className="size-8 rounded-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 text-neutral-600 dark:text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition-colors">
                                        <Download className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-tight">Undangan Rapat Resmi</div>
                                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">Download dokumen undangan PDF</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/meetings/${meeting.id}/attendance`)}
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    className="text-left p-3 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors flex items-start gap-3 rounded-none group disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <div className="size-8 rounded-none bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-tight">Konfirmasi Kehadiran</div>
                                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">Check-in mandiri peserta rapat</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/meetings/${meeting.id}/memo`)}
                                    disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    className="text-left p-3 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors flex items-start gap-3 rounded-none group disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <div className="size-8 rounded-none bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-tight">Memo Hasil & Notulensi</div>
                                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">Baca notulensi dan unduh memo PDF</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* 4. TINDAK LANJUT / ACTION ITEMS */}
                        <div className="space-y-3">
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Tindak Lanjut & Action Items
                                </h3>
                                <p className="text-[11px] text-neutral-500 font-mono">Daftar penugasan dan aksi nyata pasca pertemuan</p>
                            </div>
                            <ActionItems meetingId={meeting.id} canEdit={isModeratorOrOrganizer} />
                        </div>

                        {/* QR Code Checkin Section if ongoing */}
                        {meeting.status === 'ongoing' && (
                            <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                        QR Code Presensi Cepat
                                    </h3>
                                    <p className="text-[11px] text-neutral-500 font-mono">Scan untuk presensi kehadiran peserta secara instan</p>
                                </div>
                                <CheckinQRCode
                                    meetingId={meeting.id}
                                    meetingStatus={meeting.status}
                                    meetingTitle={meeting.title}
                                    meetingNumber={meeting.meeting_number}
                                    roomName={meeting.room?.name}
                                    meetingDate={meeting.meeting_date}
                                    startTime={meeting.start_time}
                                    endTime={meeting.end_time}
                                    isModeratorOrOrganizer={isModeratorOrOrganizer}
                                    attendedCount={attendedCount}
                                    totalParticipants={participants.length}
                                />
                            </div>
                        )}
            </DetailCard>

            {/* Complete Dialog */}
            <Dialog open={completeDialog.open} onOpenChange={(open) => setCompleteDialog({ ...completeDialog, open })}>
                <DialogContent className="rounded-none border border-neutral-200 dark:border-neutral-800 p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Selesaikan Rapat</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Apakah Anda yakin ingin menandai rapat ini sebagai selesai? Peserta tidak dapat melakukan presensi lagi setelah selesai.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-3">
                        <Button variant="outline" size="sm" onClick={() => setCompleteDialog({ open: false, loading: false })} disabled={completeDialog.loading} className="rounded-none text-xs">
                            Batal
                        </Button>
                        <Button size="sm" onClick={handleCompleteMeeting} disabled={completeDialog.loading} className="rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                            {completeDialog.loading ? 'Menyelesaikan...' : 'Ya, Selesaikan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}>
                <DialogContent className="rounded-none border border-neutral-200 dark:border-neutral-800 p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Batalkan Rapat</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Apakah Anda yakin ingin membatalkan jadwal rapat ini? Status rapat akan diubah menjadi Dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-3">
                        <Button variant="outline" size="sm" onClick={() => setCancelDialog({ open: false, loading: false })} disabled={cancelDialog.loading} className="rounded-none text-xs">
                            Kembali
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleCancelMeeting} disabled={cancelDialog.loading} className="rounded-none text-xs font-semibold">
                            {cancelDialog.loading ? 'Membatalkan...' : 'Batalkan Rapat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark Attendance Dialog */}
            <Dialog open={markAttendanceDialog.open} onOpenChange={(open) => setMarkAttendanceDialog({ ...markAttendanceDialog, open })}>
                <DialogContent className="rounded-none border border-neutral-200 dark:border-neutral-800 p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Konfirmasi Kehadiran</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Ubah status kehadiran untuk <strong>{markAttendanceDialog.participant?.user?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-3">
                        <select
                            value={markAttendanceDialog.status}
                            onChange={(e) => setMarkAttendanceDialog({ ...markAttendanceDialog, status: e.target.value })}
                            className="w-full h-9 px-3 text-xs border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 focus:outline-none"
                        >
                            <option value="attended">Hadir</option>
                            <option value="excused">Izin</option>
                            <option value="absent">Tidak Hadir</option>
                        </select>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false })} className="rounded-none text-xs">
                            Batal
                        </Button>
                        <Button size="sm" onClick={handleConfirmMarkAttendance} disabled={markAttendanceDialog.loading} className="rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold">
                            {markAttendanceDialog.loading ? 'Menyimpan...' : 'Simpan Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
