import React, { useEffect, useState } from 'react';
import HrLayout from '@/layouts/hr-layout';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MapPin, Navigation, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import api from '@/lib/api';
import { toast } from 'sonner';

interface WorkLocation {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    address?: string;
    is_active: boolean;
}

export default function WorkLocationIndex() {
    const [data, setData] = useState<WorkLocation[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Add/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WorkLocation | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('100');
    const [address, setAddress] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detectingLoc, setDetectingLoc] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<WorkLocation | null>(null);

    // Pagination & Search state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/work-locations');
            const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setData(list);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil data lokasi presensi');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        setName('');
        setLatitude('-6.200000');
        setLongitude('106.816666');
        setRadius('100');
        setAddress('');
        setIsActive(true);
        setModalOpen(true);
    };

    const handleOpenEdit = (item: WorkLocation) => {
        setEditingItem(item);
        setName(item.name || '');
        setLatitude(item.latitude?.toString() || '');
        setLongitude(item.longitude?.toString() || '');
        setRadius(item.radius?.toString() || '100');
        setAddress(item.address || '');
        setIsActive(item.is_active);
        setModalOpen(true);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Browser tidak mendukung Geolocation.');
            return;
        }
        setDetectingLoc(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toString());
                setLongitude(pos.coords.longitude.toString());
                toast.success('Koordinat lokasi browser berhasil didapatkan!');
                setDetectingLoc(false);
            },
            (err) => {
                toast.error('Gagal mengambil lokasi browser: ' + err.message);
                setDetectingLoc(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Nama lokasi wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                latitude: parseFloat(latitude) || 0,
                longitude: parseFloat(longitude) || 0,
                radius: parseInt(radius) || 100,
                address: address.trim(),
                is_active: isActive,
            };

            if (editingItem) {
                await api.put(`/work-locations/${editingItem.id}`, payload);
                toast.success('Lokasi presensi berhasil diupdate');
            } else {
                await api.post('/work-locations', payload);
                toast.success('Lokasi presensi baru berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan lokasi presensi');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await api.delete(`/work-locations/${itemToDelete.id}`);
                toast.success('Lokasi presensi berhasil dihapus');
                fetchData();
            } catch (error) {
                console.error(error);
                toast.error('Gagal menghapus lokasi presensi');
            } finally {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            }
        }
    };

    const filteredData = data.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const total = filteredData.length;
    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

    const pagination = {
        current_page: page,
        last_page: Math.ceil(total / perPage) || 1,
        per_page: perPage,
        total: total,
        from: total === 0 ? 0 : (page - 1) * perPage + 1,
        to: Math.min(page * perPage, total)
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Lokasi Kantor',
            render: (item: WorkLocation) => (
                <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-teal-600 inline" />
                        {item.name}
                    </span>
                    {item.address && <p className="text-xs text-muted-foreground mt-0.5">{item.address}</p>}
                </div>
            )
        },
        {
            key: 'coords',
            label: 'Koordinat (Lat, Long)',
            render: (item: WorkLocation) => (
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {item.latitude}, {item.longitude}
                </span>
            )
        },
        {
            key: 'radius',
            label: 'Radius Geofence',
            render: (item: WorkLocation) => (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    {item.radius} Meter
                </Badge>
            )
        },
        {
            key: 'is_active',
            label: 'Status',
            className: 'w-[120px]',
            render: (item: WorkLocation) => (
                item.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Nonaktif</Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (item: WorkLocation) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Master Lokasi Presensi (Geofencing)"
                description="Kelola daftar tempat & cabang lokasi kantor resmi untuk presensi pegawai"
                actions={[
                    { label: 'Tambah Lokasi Kantor', onClick: handleOpenCreate, icon: Plus },
                ]}
                data={paginatedData}
                columns={columns}
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={(p) => { setPerPage(p); setPage(1); }}
                searchValue={searchTerm}
                onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
                emptyMessage="Belum ada lokasi presensi kantor terdaftar"
                emptyIcon={MapPin}
                isLoading={loading}
            />

            {/* Modal Dialog Add/Edit Location */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-teal-600" />
                            {editingItem ? 'Edit Lokasi Presensi' : 'Tambah Lokasi Presensi Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Tentukan koordinat & radius geofencing bagi pegawai untuk presensi di lokasi ini.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4 py-2">
                        {/* Interactive Map Picker */}
                        <div className="space-y-1.5">
                            <Label>Peta Lokasi Kantor (Klik & Geser Penanda)</Label>
                            <LocationPickerMap
                                latitude={latitude}
                                longitude={longitude}
                                radius={radius}
                                onChange={(lat, lon) => {
                                    setLatitude(lat.toFixed(6));
                                    setLongitude(lon.toFixed(6));
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="locName">Nama Tempat / Cabang Kantor *</Label>
                                <Input
                                    id="locName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Kantor Pusat Jakarta"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="locRadius">Radius Toleransi (Meter) *</Label>
                                <Input
                                    id="locRadius"
                                    type="number"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                    placeholder="100"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="locLat">Latitude *</Label>
                                <Input
                                    id="locLat"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="-6.200000"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="locLon">Longitude *</Label>
                                <Input
                                    id="locLon"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="106.816666"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="locAddress">Alamat Lengkap (Opsional)</Label>
                            <Input
                                id="locAddress"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Jl. Sudirman No. 1, Jakarta"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Status Aktif (Dapat digunakan presensi)</Label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                                <Save className="h-4 w-4 mr-1.5" />
                                {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Lokasi Presensi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus lokasi presensi <strong>{itemToDelete?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" /> Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}
