import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Search, Users as UsersIcon, CheckSquare, XSquare, CalendarClock } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
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

export default function MeetingCreate() {
    const navigate = useNavigate();
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

    // Participant state
    const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOrgUnit, setFilterOrgUnit] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [roomRes, orgRes, userRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/org-units?perPage=999'),
                api.get('/users?perPage=999'),
            ]);
            const roomData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data?.data ?? []);
            setRooms(roomData.filter((r: any) => r.is_active).map((r: any) => ({
                value: r.id.toString(), label: r.name,
            })));
            const orgData = orgRes.data;
            setOrgUnits(Array.isArray(orgData) ? orgData : (orgData?.data ?? orgData?.items ?? []));
            const rawUsers = userRes.data;
            setUsers(Array.isArray(rawUsers) ? rawUsers : (rawUsers?.data ?? rawUsers?.users ?? []));
        } catch (e) {
            console.error(e);
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
            const res = await api.post('/meetings', payload);
            const meetingId = res.data.id;

            // Save participants
            if (selectedParticipants.length > 0) {
                await Promise.all(selectedParticipants.map(p =>
                    api.post(`/meetings/${meetingId}/participants`, {
                        user_id: p.user_id,
                        role: p.role,
                        attendance_status: 'invited',
                    })
                ));
            }

            toast.success('Rapat berhasil dibuat');
            navigate('/admin/meetings');
        } catch (error) {
            toast.error('Gagal menyimpan rapat');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <FormCard
                title="Buat Rapat Baru"
                subtitle="Jadwalkan rapat dinas, tentukan ruangan, dan undang peserta rapat"
                icon={CalendarClock}
                onBack={() => navigate('/admin/meetings')}
                onSubmit={handleSubmit}
                loading={submitting}
                submitText="Simpan Rapat"
                onCancel={() => navigate('/admin/meetings')}
            >
                <div className="space-y-6">
                    {/* 1. Informasi Umum */}
                    <FormSection title="1. Informasi Umum Rapat" description="Detail dasar terkait agenda rapat">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="meeting_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Nomor Rapat <span className="text-rose-500">*</span>
                                </Label>
                                <Input 
                                    id="meeting_number" 
                                    name="meeting_number" 
                                    required 
                                    value={formData.meeting_number} 
                                    onChange={handleChange} 
                                    placeholder="Contoh: 001/RAPAT/2026" 
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Judul Rapat <span className="text-rose-500">*</span>
                                </Label>
                                <Input 
                                    id="title" 
                                    name="title" 
                                    required 
                                    value={formData.title} 
                                    onChange={handleChange} 
                                    placeholder="Contoh: Rapat Koordinasi Bulanan" 
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="agenda" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Agenda Utama
                            </Label>
                            <Textarea 
                                id="agenda" 
                                name="agenda" 
                                value={formData.agenda} 
                                onChange={handleChange} 
                                placeholder="Tuliskan pokok bahasan rapat..." 
                                rows={3} 
                                className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Catatan Tambahan
                            </Label>
                            <Textarea 
                                id="notes" 
                                name="notes" 
                                value={formData.notes} 
                                onChange={handleChange} 
                                placeholder="Catatan tambahan bagi peserta rapat (opsional)..." 
                                rows={2} 
                                className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Status Rapat
                                </Label>
                                <SearchableSelect
                                    value={formData.status}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                    placeholder="Pilih status"
                                    options={[
                                        { value: "draft", label: "Draft" },
                                        { value: "scheduled", label: "Terjadwal" },
                                    ]}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* 2. Waktu & Lokasi */}
                    <FormSection title="2. Waktu & Lokasi Pelaksanaan" description="Penjadwalan tanggal, jam, dan lokasi ruangan">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="meeting_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Tanggal <span className="text-rose-500">*</span>
                                </Label>
                                <Input 
                                    id="meeting_date" 
                                    name="meeting_date" 
                                    type="date" 
                                    required 
                                    value={formData.meeting_date} 
                                    onChange={handleChange} 
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="start_time" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Waktu Mulai <span className="text-rose-500">*</span>
                                </Label>
                                <Input 
                                    id="start_time" 
                                    name="start_time" 
                                    type="time" 
                                    required 
                                    value={formData.start_time} 
                                    onChange={handleChange} 
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="end_time" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Waktu Selesai <span className="text-rose-500">*</span>
                                </Label>
                                <Input 
                                    id="end_time" 
                                    name="end_time" 
                                    type="time" 
                                    required 
                                    value={formData.end_time} 
                                    onChange={handleChange} 
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="room_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Ruangan Rapat
                                </Label>
                                <SearchableSelect
                                    value={formData.room_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, room_id: val }))}
                                    placeholder="Pilih Ruangan"
                                    options={rooms.length > 0 ? rooms : [{ value: "", label: "Loading..." }]}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="organization_unit_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Unit Penyelenggara
                                </Label>
                                <SearchableSelect
                                    value={formData.organization_unit_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, organization_unit_id: val }))}
                                    placeholder="Pilih Unit (opsional)"
                                    options={[
                                        { value: '', label: 'Tidak ada unit khusus' },
                                        ...orgUnits.map(u => ({ value: u.id.toString(), label: u.name }))
                                    ]}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* 3. Peserta Rapat */}
                    <FormSection 
                        title={`3. Peserta Rapat (${selectedParticipants.length} Dipilih)`} 
                        description="Pilih pegawai yang diundang dan tentukan peran dalam rapat"
                    >
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nama atau NIP..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-8 h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                    />
                                </div>
                                <div className="w-full sm:w-60">
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
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAll}
                                        className="h-9 rounded-none text-xs border-neutral-200 dark:border-neutral-800 shadow-none"
                                        title="Pilih semua yang tampil"
                                    >
                                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                        Semua
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeselectAll}
                                        className="h-9 rounded-none text-xs border-neutral-200 dark:border-neutral-800 shadow-none text-rose-600"
                                        title="Batal pilih semua"
                                    >
                                        <XSquare className="h-3.5 w-3.5 mr-1" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            {/* User List */}
                            <div className="border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-neutral-500 font-mono">
                                        Tidak ada pengguna yang cocok dengan kriteria pencarian.
                                    </div>
                                ) : (
                                    filteredUsers.map(user => {
                                        const sel = isSelected(user.id);
                                        const role = getRole(user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                className={`flex items-center justify-between p-2.5 px-3 transition-colors ${
                                                    sel ? 'bg-neutral-50/80 dark:bg-neutral-900/60' : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30'
                                                }`}
                                                onClick={() => handleToggle(user.id, !sel)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Checkbox
                                                        checked={sel}
                                                        onCheckedChange={(checked) => handleToggle(user.id, checked as boolean)}
                                                        className="rounded-none pointer-events-none"
                                                        tabIndex={-1}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                                                        <p className="text-[11px] text-neutral-500 font-mono truncate">
                                                            {user.nip ? `NIP: ${user.nip}` : ''}
                                                            {user.organization_unit ? ` • ${user.organization_unit.name}` : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                {sel && (
                                                    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                                        {ROLE_OPTIONS.map(r => (
                                                            <Button
                                                                key={r.value}
                                                                type="button"
                                                                size="sm"
                                                                variant={role === r.value ? 'default' : 'outline'}
                                                                onClick={() => handleRoleChange(user.id, r.value)}
                                                                className="h-6 text-[10px] px-2 rounded-none shadow-none uppercase font-bold"
                                                            >
                                                                {r.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Selected preview */}
                            {selectedParticipants.length > 0 && (
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1.5">
                                    <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                        Ringkasan Peserta Terpilih ({selectedParticipants.length})
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedParticipants.map(p => {
                                            const u = users.find(u => u.id === p.user_id);
                                            return (
                                                <span key={p.user_id} className="font-mono text-xs px-2 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                                                    {u?.name} ({ROLE_OPTIONS.find(r => r.value === p.role)?.label})
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSection>
                </div>
            </FormCard>
        </AdminLayout>
    );
}
