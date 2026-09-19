import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Search, Users as UsersIcon, CheckSquare, XSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';

interface UserOption {
    id: number;
    name: string;
    nip: string;
    organization_unit_id: number | null;
    organization_unit?: { id: number; name: string };
}

interface OrgUnit {
    id: number;
    name: string;
}

interface SelectedParticipant {
    user_id: number;
    role: string;
}

const ROLE_OPTIONS = [
    { value: 'participant', label: 'Peserta' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'secretary', label: 'Sekretaris' },
    { value: 'observer', label: 'Observer' },
];

export default function MeetingEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [rooms, setRooms] = useState<{ value: string; label: string }[]>([]);
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    const [formData, setFormData] = useState({
        meeting_number: '',
        title: '',
        agenda: '',
        meeting_date: '',
        start_time: '',
        end_time: '',
        room_id: '',
        organization_unit_id: '',
        notes: '',
        status: 'draft',
    });

    const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOrgUnit, setFilterOrgUnit] = useState('');
    // Keep track of original participant IDs (from DB) to handle deletions
    const [originalParticipantIds, setOriginalParticipantIds] = useState<number[]>([]);

    useEffect(() => {
        fetchAll();
    }, [id]);

    const fetchAll = async () => {
        try {
            const [roomRes, orgRes, userRes, meetingRes, partRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/org-units?perPage=999'),
                api.get('/users?perPage=999'),
                api.get(`/meetings/${id}`),
                api.get(`/meetings/${id}/participants`),
            ]);
            const roomData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data?.data ?? []);
            setRooms(roomData.filter((r: any) => r.is_active).map((r: any) => ({
                value: r.id.toString(), label: r.name,
            })));
            const orgData = orgRes.data;
            setOrgUnits(Array.isArray(orgData) ? orgData : (orgData?.data ?? orgData?.items ?? []));
            const rawUsers = userRes.data;
            setUsers(Array.isArray(rawUsers) ? rawUsers : (rawUsers?.data ?? rawUsers?.users ?? []));

            const data = meetingRes.data;
            setFormData({
                meeting_number: data.meeting_number || '',
                title: data.title || '',
                agenda: data.agenda || '',
                meeting_date: data.meeting_date ? data.meeting_date.substring(0, 10) : '',
                start_time: data.start_time ? data.start_time.substring(0, 5) : '',
                end_time: data.end_time ? data.end_time.substring(0, 5) : '',
                room_id: data.room_id ? data.room_id.toString() : '',
                organization_unit_id: data.organization_unit_id ? data.organization_unit_id.toString() : '',
                notes: data.notes || '',
                status: data.status || 'draft',
            });

            // Pre-load existing participants
            const existingParts = (partRes.data || []).map((p: any) => ({
                user_id: p.user_id,
                role: p.role || 'participant',
            }));
            setSelectedParticipants(existingParts);
            setOriginalParticipantIds(existingParts.map((p: any) => p.user_id));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchSearch = searchQuery === '' ||
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.nip || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchUnit = filterOrgUnit === '' ||
                u.organization_unit_id?.toString() === filterOrgUnit;
            return matchSearch && matchUnit;
        });
    }, [users, searchQuery, filterOrgUnit]);

    const isSelected = (userId: number) => selectedParticipants.some(p => p.user_id === userId);
    const getRole = (userId: number) => selectedParticipants.find(p => p.user_id === userId)?.role || 'participant';

    const handleToggle = (userId: number, checked: boolean) => {
        if (checked) {
            setSelectedParticipants(prev => [...prev, { user_id: userId, role: 'participant' }]);
        } else {
            setSelectedParticipants(prev => prev.filter(p => p.user_id !== userId));
        }
    };

    const handleRoleChange = (userId: number, role: string) => {
        setSelectedParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, role } : p));
    };

    const handleSelectAll = () => {
        const newOnes = filteredUsers
            .filter(u => !isSelected(u.id))
            .map(u => ({ user_id: u.id, role: 'participant' }));
        setSelectedParticipants(prev => [...prev, ...newOnes]);
    };

    const handleDeselectAll = () => setSelectedParticipants([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                room_id: formData.room_id ? parseInt(formData.room_id) : null,
                organization_unit_id: formData.organization_unit_id ? parseInt(formData.organization_unit_id) : null,
                start_time: formData.start_time + ':00',
                end_time: formData.end_time + ':00',
            };
            await api.put(`/meetings/${id}`, payload);

            // Sync participants
            const currentIds = selectedParticipants.map(p => p.user_id);
            const toAdd = selectedParticipants.filter(p => !originalParticipantIds.includes(p.user_id));
            const toRemove = originalParticipantIds.filter(uid => !currentIds.includes(uid));

            // Remove deselected
            await Promise.all(toRemove.map(uid =>
                api.delete(`/meetings/${id}/participants/${uid}`)
            ));

            // Add new participants
            await Promise.all(toAdd.map(p =>
                api.post(`/meetings/${id}/participants`, {
                    user_id: p.user_id,
                    role: p.role,
                    attendance_status: 'invited',
                })
            ));

            // Update roles for existing
            const toUpdateRole = selectedParticipants.filter(p => originalParticipantIds.includes(p.user_id));
            await Promise.all(toUpdateRole.map(p =>
                api.post(`/meetings/${id}/participants`, {
                    user_id: p.user_id,
                    role: p.role,
                    attendance_status: 'invited',
                })
            ));

            toast.success('Rapat berhasil diperbarui');
            navigate(`/admin/meetings/${id}`);
        } catch (error) {
            toast.error('Gagal memperbarui rapat');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="w-full">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate(`/admin/meetings/${id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Edit Rapat</h2>
                        <p className="text-sm text-muted-foreground">Perbarui informasi jadwal rapat.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-4">
                        {/* Informasi Umum */}
                        <Card className="shadow-none">
                            <CardHeader>
                                <CardTitle>Informasi Umum</CardTitle>
                                <CardDescription>Detail dasar terkait rapat yang akan diadakan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting_number">Nomor Rapat *</Label>
                                        <Input id="meeting_number" name="meeting_number" required value={formData.meeting_number} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Judul Rapat *</Label>
                                        <Input id="title" name="title" required value={formData.title} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="agenda">Agenda Utama</Label>
                                    <Textarea id="agenda" name="agenda" value={formData.agenda} onChange={handleChange} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Catatan tambahan (opsional)..." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status Rapat</Label>
                                        <SearchableSelect
                                            value={formData.status}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                            placeholder="Pilih status"
                                            options={[
                                                { value: "draft", label: "Draft" },
                                                { value: "scheduled", label: "Terjadwal" },
                                                { value: "ongoing", label: "Sedang Berjalan" },
                                                { value: "completed", label: "Selesai" },
                                                { value: "cancelled", label: "Dibatalkan" },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Waktu & Lokasi */}
                        <Card className="shadow-none">
                            <CardHeader>
                                <CardTitle>Waktu & Lokasi</CardTitle>
                                <CardDescription>Penjadwalan dan pemilihan ruangan rapat</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting_date">Tanggal *</Label>
                                        <Input id="meeting_date" name="meeting_date" type="date" required value={formData.meeting_date} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="start_time">Waktu Mulai *</Label>
                                        <Input id="start_time" name="start_time" type="time" required value={formData.start_time} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_time">Waktu Selesai *</Label>
                                        <Input id="end_time" name="end_time" type="time" required value={formData.end_time} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ruangan</Label>
                                        <SearchableSelect
                                            value={formData.room_id}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, room_id: val }))}
                                            placeholder="Pilih ruangan"
                                            options={rooms.length > 0 ? rooms : [{ value: "", label: "Loading..." }]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unit Organisasi</Label>
                                        <SearchableSelect
                                            value={formData.organization_unit_id}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, organization_unit_id: val }))}
                                            placeholder="Pilih unit (opsional)"
                                            options={[
                                                { value: '', label: 'Tidak ada unit khusus' },
                                                ...orgUnits.map(u => ({ value: u.id.toString(), label: u.name }))
                                            ]}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pemilihan Peserta */}
                        <Card className="shadow-none">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <UsersIcon className="h-5 w-5" />
                                            Peserta Rapat
                                        </CardTitle>
                                        <CardDescription>
                                            {selectedParticipants.length} peserta dipilih
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Pilih Semua
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                                            <XSquare className="h-4 w-4 mr-2" />
                                            Batal Semua
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nama atau NIP..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <SearchableSelect
                                        value={filterOrgUnit}
                                        onValueChange={setFilterOrgUnit}
                                        placeholder="Semua Unit"
                                        options={[
                                            { value: '', label: 'Semua Unit' },
                                            ...orgUnits.map(u => ({ value: u.id.toString(), label: u.name }))
                                        ]}
                                    />
                                </div>

                                <div className="border rounded-lg">
                                    <div className="max-h-80 overflow-y-auto">
                                        {filteredUsers.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Tidak ada pengguna ditemukan
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {filteredUsers.map(user => {
                                                    const sel = isSelected(user.id);
                                                    const role = getRole(user.id);
                                                    return (
                                                        <div
                                                            key={user.id}
                                                            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors ${sel ? 'bg-muted/25' : ''}`}
                                                            onClick={() => handleToggle(user.id, !sel)}
                                                        >
                                                            <Checkbox
                                                                checked={sel}
                                                                onCheckedChange={(checked) => handleToggle(user.id, checked as boolean)}
                                                                className="mt-1 pointer-events-none"
                                                                tabIndex={-1}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {user.nip} • {user.organization_unit?.name || 'Tanpa Unit'}
                                                                </p>
                                                                {sel && (
                                                                    <div className="flex flex-wrap gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                                                                        {ROLE_OPTIONS.map(r => (
                                                                            <Button
                                                                                key={r.value}
                                                                                type="button"
                                                                                size="sm"
                                                                                variant={role === r.value ? 'default' : 'outline'}
                                                                                onClick={() => handleRoleChange(user.id, r.value)}
                                                                                className="h-6 text-xs px-2"
                                                                            >
                                                                                {r.label}
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedParticipants.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">Peserta Terpilih:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedParticipants.map(p => {
                                                const u = users.find(u => u.id === p.user_id);
                                                return (
                                                    <Badge key={p.user_id} variant="secondary" className="text-xs">
                                                        {u?.name} ({ROLE_OPTIONS.find(r => r.value === p.role)?.label})
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate(`/admin/meetings/${id}`)} disabled={submitting}>Batal</Button>
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
