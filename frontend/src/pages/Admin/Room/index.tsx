import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import api from '@/lib/api';

interface Room {
    id: number;
    code: string;
    name: string;
    building?: string;
    floor?: string;
    capacity?: number;
    is_active: boolean;
}

export default function RoomIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [allData, setAllData] = useState<Room[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
    });
    const [loading, setLoading] = useState(true);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

    const [filterValues, setFilterValues] = useState({
        search: searchParams.get('search') || '',
    });

    useEffect(() => {
        const pageParam = parseInt(searchParams.get('page') || '1');
        setPagination(prev => ({ ...prev, current_page: pageParam }));
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Note: Since GetAll handler currently returns all rooms (no pagination), 
            // we will simulate pagination state here. 
            // Ideally, backend should implement pagination in GetAll.
            const res = await api.get('/rooms');
            let rooms = res.data;
            
            const search = searchParams.get('search') || '';
            if (search) {
                const lower = search.toLowerCase();
                rooms = rooms.filter((r: Room) => 
                    r.name.toLowerCase().includes(lower) || 
                    r.code.toLowerCase().includes(lower)
                );
            }

            setAllData(rooms);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        const params = new URLSearchParams(searchParams);
        if (filterValues.search) params.set('search', filterValues.search);
        else params.delete('search');
        
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    const handlePerPageChange = (perPage: number) => {
        setPagination({ ...pagination, per_page: perPage, current_page: 1 });
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        setSearchParams(params);
    };

    const total = allData.length;
    const last_page = Math.ceil(total / pagination.per_page) || 1;
    const from = total > 0 ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
    const to = Math.min(total, pagination.current_page * pagination.per_page);
    
    const paginatedData = allData.slice(
        (pagination.current_page - 1) * pagination.per_page,
        pagination.current_page * pagination.per_page
    );

    const paginationInfo = {
        ...pagination,
        total,
        last_page,
        from,
        to
    };

    const handleDeleteClick = (room: Room) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (roomToDelete) {
            try {
                await api.delete(`/rooms/${roomToDelete.id}`);
                setDeleteDialogOpen(false);
                setRoomToDelete(null);
                fetchData();
            } catch (error) {
                console.error("Failed to delete room", error);
            }
        }
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode',
            className: 'w-[120px]',
            render: (room: Room) => (
                <span className="font-mono text-sm">{room.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nama Ruangan',
            className: 'w-[250px]',
            render: (room: Room) => (
                <div className="font-medium">{room.name}</div>
            ),
        },
        {
            key: 'location',
            label: 'Lokasi & Kapasitas',
            className: 'w-[200px]',
            render: (room: Room) => (
                <div>
                    <div className="text-sm">{room.building || '-'} {room.floor ? `(Lt. ${room.floor})` : ''}</div>
                    <div className="text-xs text-muted-foreground">{room.capacity ? `${room.capacity} Orang` : 'Kapasitas tidak diatur'}</div>
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            className: 'w-[150px]',
            render: (room: Room) => (
                room.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Nonaktif
                    </Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[100px] text-right',
            render: (room: Room) => (
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/admin/rooms/${room.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(room)}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <IndexPage
                title="Ruangan"
                description="Kelola data ruangan rapat"
                actions={[
                    {
                        label: 'Tambah Ruangan',
                        href: '/admin/rooms/create',
                        icon: Plus,
                    },
                ]}
                data={paginatedData}
                columns={columns}
                pagination={paginationInfo}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchValue={filterValues.search}
                searchPlaceholder="Cari kode, nama..."
                onSearchChange={(val: string) => handleFilterChange('search', val)}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                emptyMessage="Belum ada data ruangan"
                emptyIcon={MapPin}
                isLoading={loading}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Ruangan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus ruangan ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {roomToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{roomToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">Kode: {roomToDelete.code}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setRoomToDelete(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
