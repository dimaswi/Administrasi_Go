import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            invited: <Badge className="bg-gray-100 text-gray-800 border-gray-200">Diundang</Badge>,
            confirmed: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Dikonfirmasi</Badge>,
            attended: <Badge className="bg-green-100 text-green-800 border-green-200">Hadir</Badge>,
            absent: <Badge className="bg-red-100 text-red-800 border-red-200">Tidak Hadir</Badge>,
            excused: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Berhalangan</Badge>,
        };
        return badges[status] || badges.invited;
    };

    const getRoleBadge = (role: string) => {
        const badges: any = {
            participant: <Badge variant="outline">Peserta</Badge>,
            moderator: <Badge className="bg-purple-100 text-purple-800 border-purple-200">Moderator</Badge>,
            secretary: <Badge className="bg-green-100 text-green-800 border-green-200">Sekretaris</Badge>,
            observer: <Badge variant="outline">Observer</Badge>,
        };
        return badges[role] || badges.participant;
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
                        <h2 className="text-xl font-semibold">Konfirmasi Kehadiran</h2>
                        <p className="text-sm text-muted-foreground">Konfirmasi kehadiran Anda untuk rapat ini.</p>
                    </div>
                </div>

                <div className='pb-6'>
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Informasi Rapat</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">No. Rapat</dt>
                                    <dd className="font-medium">{meeting.meeting_number}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Status</dt>
                                    <dd className="flex gap-2">
                                        {meeting.status === 'draft' && <Badge variant="outline">Draft</Badge>}
                                        {meeting.status === 'scheduled' && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Dijadwalkan</Badge>}
                                        {meeting.status === 'ongoing' && <Badge className="bg-orange-100 text-orange-800 border-orange-200">Berlangsung</Badge>}
                                        {meeting.status === 'completed' && <Badge className="bg-gray-100 text-gray-800 border-gray-200">Selesai</Badge>}
                                        {meeting.status === 'cancelled' && <Badge className="bg-red-100 text-red-800 border-red-200">Dibatalkan</Badge>}
                                    </dd>
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
                                    <dd className="font-medium">{meeting.start_time?.substring(0, 5)} - {meeting.end_time?.substring(0, 5)} WIB</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Tempat</dt>
                                    <dd className="font-medium">{meeting.room?.name || 'Belum ditentukan'}</dd>
                                </div>
                                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Agenda</dt>
                                    <dd className="text-sm">{meeting.agenda || '-'}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {!userParticipant ? (
                    <Card className="shadow-none">
                        <CardContent className="py-12 text-center">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">Anda Bukan Peserta</h3>
                            <p className="text-sm md:text-base text-muted-foreground">Anda tidak terdaftar sebagai peserta dalam rapat ini.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Status Kehadiran Anda</CardTitle>
                            <CardDescription>Informasi kehadiran dan role Anda dalam rapat ini</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Nama</dt>
                                    <dd className="font-medium">{userParticipant.user?.name || 'Anda'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Role</dt>
                                    <dd>{getRoleBadge(userParticipant.role)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Status Kehadiran</dt>
                                    <dd>{getAttendanceBadge(userParticipant.attendance_status)}</dd>
                                </div>
                            </dl>
                            {userParticipant.check_in_time && (
                                <dl className="mt-6">
                                    <dt className="text-sm font-medium text-muted-foreground mb-1">Waktu Check-in</dt>
                                    <dd className="font-medium">{userParticipant.check_in_time}</dd>
                                </dl>
                            )}

                            {(meeting.status === 'ongoing' || meeting.status === 'scheduled') && userParticipant.attendance_status !== 'attended' && (
                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={() => setConfirmDialog(true)}
                                        className="w-full sm:w-auto min-w-[200px]"
                                        size="lg"
                                        disabled={!canCheckIn}
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" /> Konfirmasi Kehadiran
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {canCheckIn ? 'Check-in dapat dilakukan hingga akhir rapat' : 'Check-in dibuka setelah rapat dimulai'}
                                    </p>
                                </div>
                            )}

                            {userParticipant.attendance_status === 'attended' && (
                                <div className="pt-4 border-t">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mx-auto max-w-full">
                                        <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                                        <p className="text-sm md:text-base font-semibold text-green-800">Kehadiran Telah Dikonfirmasi</p>
                                        <p className="text-xs md:text-sm text-green-600 mt-1">Terima kasih atas partisipasi Anda</p>
                                    </div>
                                </div>
                            )}

                            {meeting.status === 'completed' && userParticipant.attendance_status !== 'attended' && (
                                <div className="pt-4 border-t">
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center mx-auto max-w-full">
                                        <p className="text-sm md:text-base font-semibold text-gray-800">Rapat Telah Selesai</p>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">Konfirmasi kehadiran tidak dapat dilakukan lagi</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
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
