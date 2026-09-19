import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActionItems } from '@/components/meeting/action-items';
import { CheckinQRCode } from '@/components/meeting/checkin-qrcode';
import { format, parse, isBefore, subMinutes } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { Calendar, Clock, DoorOpen, Edit3, FileText, MapPin, User, Users, Building2, CheckCircle2, XCircle, Download, Loader2, Play, Ban, RefreshCw, ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';

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
            if (res.data.status === 'ongoing' && !isAutoRefresh) {
                // start auto refresh if it's ongoing and we haven't set it yet
                // However, we only auto-refresh if user opted-in or we default to true. We'll default to true on load.
            }

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
            toast.success('Status kehadiran berhasil diperbarui');
            setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false });
            fetchMeeting();
        } catch (error) {
            toast.error('Gagal memperbarui status kehadiran');
            setMarkAttendanceDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleGenerateDocument = (type: 'invitation' | 'memo' | 'attendance') => {
        if (type === 'memo' && meeting.status !== 'completed') {
            toast.error('Memo hanya dapat didownload setelah rapat selesai');
            return;
        }
        window.open(`http://localhost:8080/api/meetings/${meeting.id}/generate-${type}`, '_blank');
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ongoing': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = { draft: 'Draft', scheduled: 'Terjadwal', ongoing: 'Berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan' };
        return labels[status] || status;
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'moderator': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'secretary': return 'bg-green-100 text-green-800 border-green-200';
            case 'observer': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = { participant: 'Peserta', moderator: 'Moderator', secretary: 'Notulis', observer: 'Observer' };
        return labels[role] || role;
    };

    const getAttendanceBadgeColor = (status: string) => {
        switch (status) {
            case 'attended': return 'bg-green-100 text-green-800 border-green-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'absent': return 'bg-red-100 text-red-800 border-red-200';
            case 'excused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getAttendanceLabel = (status: string) => {
        const labels: Record<string, string> = { invited: 'Diundang', confirmed: 'Dikonfirmasi', attended: 'Hadir', absent: 'Tidak Hadir', excused: 'Izin' };
        return labels[status] || status;
    };

    const formatTime = (t: string) => {
        if (!t) return '-';
        if (t.includes('T')) return t.split('T')[1].substring(0, 5);
        return t.substring(0, 5);
    };

    if (loading) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
    if (!meeting) return <AdminLayout><div className="p-6">Data tidak ditemukan</div></AdminLayout>;

    const isModeratorOrOrganizer = participants.some(p => p.user_id === currentUserId && p.role === 'moderator') || meeting.organizer_id === currentUserId;
    const attendedCount = participants.filter(p => p.attendance_status === 'attended').length;

    let canStartMeeting = false;
    if (meeting.status === 'draft' || meeting.status === 'scheduled') {
        try {
            const meetingDateTimeStr = `${meeting.meeting_date?.substring(0, 10)} ${meeting.start_time}`;
            const meetingDateTime = parse(meetingDateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date());
            canStartMeeting = new Date() >= subMinutes(meetingDateTime, 30);
        } catch (e) { }
        canStartMeeting = true; // Hardcoded true for easy demo.
    }

    return (
        <AdminLayout>
            <div className="h-full overflow-y-auto">
                <div className="mx-auto p-4 max-w-full pb-24">
                    <div className="flex items-center gap-2 mb-6">
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold uppercase">{meeting.title}</h2>
                                {meeting.status === 'ongoing' && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={`h-8 w-8 rounded-full transition-colors ${isAutoRefresh ? 'text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700' : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-500'}`}
                                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                                        title={isAutoRefresh ? "Matikan Auto-refresh" : "Aktifkan Auto-refresh"}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">{meeting.meeting_number}</p>
                        </div>
                        <div className="flex items-center gap-2">

                            {(meeting.status === 'draft' || meeting.status === 'cancelled') && (
                                <Button variant="outline" onClick={() => navigate(`/admin/meetings/${meeting.id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {meeting.status === 'cancelled' ? 'Jadwalkan Ulang' : 'Edit'}
                                </Button>
                            )}
                            {(meeting.status === 'draft' || meeting.status === 'scheduled') && (
                                <Button variant="default" onClick={handleStartMeeting} disabled={!canStartMeeting}>
                                    <Play className="mr-2 h-4 w-4" /> Mulai Rapat
                                </Button>
                            )}
                            {meeting.status === 'ongoing' && (
                                <Button variant="default" onClick={() => setCompleteDialog({ ...completeDialog, open: true })} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Selesaikan Rapat
                                </Button>
                            )}
                            {(meeting.status === 'draft' || meeting.status === 'scheduled' || meeting.status === 'ongoing') && (
                                <Button variant="destructive" onClick={() => setCancelDialog({ ...cancelDialog, open: true })}>
                                    <Ban className="mr-2 h-4 w-4" /> Batalkan Rapat
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {/* Informasi Rapat */}
                        <Card className="shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="h-5 w-5" /> Informasi Rapat
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Status</dt>
                                        <dd className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className={getStatusBadgeColor(meeting.status)}>{getStatusLabel(meeting.status)}</Badge>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Penyelenggara</dt>
                                        <dd className="text-sm flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {meeting.organizer?.name || '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Tanggal</dt>
                                        <dd className="text-sm flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {meeting.meeting_date ? format(new Date(meeting.meeting_date), 'EEEE, dd MMMM yyyy', { locale: indonesianLocale }) : '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Waktu</dt>
                                        <dd className="text-sm flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)} WIB
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Ruangan</dt>
                                        <dd className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                                {meeting.room?.name || '-'}
                                            </div>
                                            {meeting.room?.location && (
                                                <div className="mt-1 ml-6 text-muted-foreground flex items-center gap-2">
                                                    <MapPin className="h-3 w-3" /> {meeting.room.location}
                                                </div>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Unit Organisasi</dt>
                                        <dd className="text-sm flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            {meeting.organization_unit?.name || '-'}
                                        </dd>
                                    </div>
                                    <div className="lg:col-span-3 md:col-span-2">
                                        <dt className="text-sm font-medium text-muted-foreground mb-1">Agenda</dt>
                                        <dd className="text-sm whitespace-pre-line">{meeting.agenda || '-'}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Daftar Peserta */}
                        <Card className="shadow-none">
                            <CardHeader className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                            <Users className="h-5 w-5" /> Daftar Peserta ({participants.length})
                                        </CardTitle>
                                        <CardDescription>
                                            {attendedCount} hadir dari {participants.length} peserta
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/admin/meetings/${meeting.id}/attendance`)}
                                        className="w-full sm:w-auto"
                                        disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    >
                                        <Users className="h-4 w-4 mr-2" /> Kelola Daftar Hadir
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {participants.length > 0 ? (
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead>No.</TableHead>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>NIP</TableHead>
                                                    <TableHead>Unit</TableHead>
                                                    <TableHead>Peran</TableHead>
                                                    <TableHead>Status Kehadiran</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {participants.map((participant, index) => (
                                                    <TableRow key={participant.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{participant.user?.name || '-'}</TableCell>
                                                        <TableCell className="font-mono text-sm">{participant.user?.nip || '-'}</TableCell>
                                                        <TableCell className="text-sm">{participant.user?.organization_unit?.name || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={getRoleBadgeColor(participant.role)}>
                                                                {getRoleLabel(participant.role)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={getAttendanceBadgeColor(participant.attendance_status)}>
                                                                    {getAttendanceLabel(participant.attendance_status)}
                                                                </Badge>
                                                                {isModeratorOrOrganizer && meeting.status === 'ongoing' && (
                                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setMarkAttendanceDialog({ open: true, participant, status: 'attended', loading: false })}>
                                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">Belum ada peserta</div>
                                )}
                            </CardContent>
                        </Card>

                        <CheckinQRCode meetingId={meeting.id} meetingStatus={meeting.status} isModeratorOrOrganizer={isModeratorOrOrganizer} attendedCount={attendedCount} totalParticipants={participants.length} />

                        {/* Dokumen */}
                        <Card className="shadow-none">
                            <CardHeader className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                            <FileText className="h-5 w-5" /> Dokumen Rapat
                                        </CardTitle>
                                        <CardDescription>Generate dan kelola dokumen terkait rapat</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/admin/meetings/${meeting.id}/memo`)}
                                        className="w-full sm:w-auto"
                                        disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}
                                    >
                                        <FileText className="h-4 w-4 mr-2" /> Edit Memo
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" onClick={() => handleGenerateDocument('invitation')}>
                                        <Download className="h-5 w-5" />
                                        <div className="text-left">
                                            <div className="font-semibold text-sm md:text-base">Undangan Rapat</div>
                                            <div className="text-xs text-muted-foreground">Download undangan format PDF</div>
                                        </div>
                                    </Button>
                                    <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" onClick={() => navigate(`/admin/meetings/${meeting.id}/attendance`)} disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}>
                                        <CheckCircle2 className="h-5 w-5" />
                                        <div className="text-left">
                                            <div className="font-semibold text-sm md:text-base">Konfirmasi Kehadiran</div>
                                            <div className="text-xs text-muted-foreground">Konfirmasi kehadiran Anda di rapat</div>
                                        </div>
                                    </Button>
                                    <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" onClick={() => navigate(`/admin/meetings/${meeting.id}/memo`)} disabled={meeting.status !== 'ongoing' && meeting.status !== 'completed'}>
                                        <Edit3 className="h-5 w-5" />
                                        <div className="text-left">
                                            <div className="font-semibold text-sm md:text-base">Memo Hasil Rapat</div>
                                            <div className="text-xs text-muted-foreground">Buat dan download memo rapat</div>
                                        </div>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {(meeting.status === 'ongoing' || meeting.status === 'completed') && (
                            <ActionItems meetingId={meeting.id} canEdit={isModeratorOrOrganizer} />
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Dialog open={markAttendanceDialog.open} onOpenChange={(open) => !open && setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Kehadiran</DialogTitle>
                        <DialogDescription>
                            Tandai <strong>{markAttendanceDialog.participant?.user?.name}</strong> sebagai <strong>Hadir</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMarkAttendanceDialog({ open: false, participant: null, status: 'attended', loading: false })} disabled={markAttendanceDialog.loading}>Batal</Button>
                        <Button onClick={handleConfirmMarkAttendance} disabled={markAttendanceDialog.loading}>
                            {markAttendanceDialog.loading ? 'Menyimpan...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={completeDialog.open} onOpenChange={(open) => !open && setCompleteDialog({ open: false, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selesaikan Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyelesaikan rapat <strong>{meeting?.title}</strong>? Setelah diselesaikan, status menjadi "Selesai" dan rapat tidak dapat diubah lagi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompleteDialog({ open: false, loading: false })} disabled={completeDialog.loading}>Tidak</Button>
                        <Button onClick={handleCompleteMeeting} disabled={completeDialog.loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {completeDialog.loading ? 'Menyelesaikan...' : 'Ya, Selesaikan Rapat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan rapat <strong>{meeting?.title}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialog({ open: false, loading: false })} disabled={cancelDialog.loading}>Tidak</Button>
                        <Button variant="destructive" onClick={handleCancelMeeting} disabled={cancelDialog.loading}>
                            {cancelDialog.loading ? 'Membatalkan...' : 'Ya, Batalkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
