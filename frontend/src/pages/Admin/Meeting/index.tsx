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
import { Plus, Edit, Trash2, CalendarDays, List, Eye, Users } from 'lucide-react';
import api from '@/lib/api';
import { format, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Meeting {
    id: number;
    meeting_number: string;
    title: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    status: string;
}

export default function MeetingIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [allData, setAllData] = useState<Meeting[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
    });
    const [loading, setLoading] = useState(true);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

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
            const res = await api.get('/meetings');
            let meetings = res.data;

            const search = searchParams.get('search') || '';
            if (search) {
                const lower = search.toLowerCase();
                meetings = meetings.filter((m: Meeting) =>
                    m.title.toLowerCase().includes(lower) ||
                    m.meeting_number.toLowerCase().includes(lower)
                );
            }

            setAllData(meetings);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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

    const handleDeleteClick = (meeting: Meeting) => {
        setMeetingToDelete(meeting);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (meetingToDelete) {
            try {
                await api.delete(`/meetings/${meetingToDelete.id}`);
                setDeleteDialogOpen(false);
                setMeetingToDelete(null);
                fetchData();
            } catch (error) {
                console.error("Failed to delete meeting", error);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Terjadwal</Badge>;
            case 'ongoing':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Sedang Berjalan</Badge>;
            case 'completed':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Selesai</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Dibatalkan</Badge>;
            case 'draft':
            default:
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Draft</Badge>;
        }
    };

    const getDotColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500';
            case 'ongoing': return 'bg-orange-500';
            case 'completed': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            case 'draft':
            default: return 'bg-slate-400';
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        if (timeStr.includes('T')) return timeStr.split('T')[1].substring(0, 5);
        return timeStr.substring(0, 5);
    };

    const columns = [
        {
            key: 'meeting_number',
            label: 'No. Rapat',
            className: 'w-[150px]',
            render: (m: Meeting) => (
                <span className="font-mono text-sm">{m.meeting_number}</span>
            ),
        },
        {
            key: 'title',
            label: 'Judul Rapat',
            className: 'w-[250px]',
            render: (m: Meeting) => (
                <div className="font-medium">{m.title}</div>
            ),
        },
        {
            key: 'datetime',
            label: 'Waktu Pelaksanaan',
            className: 'w-[200px]',
            render: (m: Meeting) => {
                const dateObj = parseISO(m.meeting_date);
                
                return (
                    <div>
                        <div className="text-sm">{format(dateObj, 'dd MMMM yyyy', { locale: idLocale })}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(m.start_time)} - {formatTime(m.end_time)}</div>
                    </div>
                )
            },
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[150px]',
            render: (m: Meeting) => getStatusBadge(m.status),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[120px] text-right',
            render: (m: Meeting) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => navigate(`/admin/meetings/${m.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/admin/meetings/${m.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(m)}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calendar View rendering - Premium Aesthetic
    const renderCalendarView = () => {
        const startDate = startOfMonth(currentMonth);
        const endDate = endOfMonth(currentMonth);
        const startDay = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1; // Mon = 0, Sun = 6
        const daysInMonth = endDate.getDate();
        
        const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
        const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
        const today = () => setCurrentMonth(new Date());

        return (
            <div className="flex flex-col h-full bg-white rounded-xl border border-border overflow-hidden animate-in fade-in duration-200">
                {/* Calendar Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">
                            {format(currentMonth, 'MMMM', { locale: idLocale })}
                            <span className="ml-2 font-normal text-slate-500">
                                {format(currentMonth, 'yyyy')}
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={today}
                            className="text-xs font-medium h-8 bg-white"
                        >
                            Hari Ini
                        </Button>
                        <div className="flex items-center p-0.5 rounded-md border border-border bg-white">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={prevMonth}
                                className="h-7 w-7 rounded-sm"
                            >
                                <span className="sr-only">Previous month</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={nextMonth}
                                className="h-7 w-7 rounded-sm"
                            >
                                <span className="sr-only">Next month</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.1584 3.13508C5.95694 3.32394 5.94673 3.64036 6.1356 3.84182L9.565 7.49991L6.1356 11.158C5.94673 11.3595 5.95694 11.6759 6.1584 11.8648C6.35986 12.0536 6.67627 12.0434 6.86514 11.842L10.6151 7.84197C10.7954 7.64964 10.7954 7.35036 10.6151 7.15803L6.86514 3.15803C6.67627 2.95657 6.35986 2.94636 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-border/50">
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                            <div key={day} className="py-3 text-center">
                                <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                                    {day}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 flex-1 bg-slate-50/30">
                        {Array.from({ length: 42 }).map((_, i) => {
                            const dayNum = i - startDay + 1;
                            const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                            
                            const hasMeeting = isCurrentMonth ? allData.filter(m => {
                                const date = parseISO(m.meeting_date);
                                return date.getDate() === dayNum && 
                                       date.getMonth() === currentMonth.getMonth() && 
                                       date.getFullYear() === currentMonth.getFullYear();
                            }).sort((a, b) => a.start_time.localeCompare(b.start_time)) : [];
                            
                            const isToday = isCurrentMonth && 
                                            dayNum === new Date().getDate() && 
                                            currentMonth.getMonth() === new Date().getMonth() &&
                                            currentMonth.getFullYear() === new Date().getFullYear();

                            return (
                                <div 
                                    key={i} 
                                    className={`
                                        relative min-h-[140px] p-2 border-b border-r border-border/40 transition-colors z-0
                                        ${i % 7 === 6 ? 'border-r-0' : ''}
                                        ${isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/50 opacity-40'}
                                    `}
                                >
                                    {/* Watermark Date */}
                                    {dayNum > 0 && dayNum <= daysInMonth && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
                                            <span className={`text-[120px] font-bold tracking-tighter leading-none ${isToday ? 'text-primary/[0.08]' : 'text-slate-900/[0.04]'}`}>
                                                {dayNum}
                                            </span>
                                        </div>
                                    )}

                                    <div className="relative z-10 mb-2" />

                                    {isCurrentMonth && (
                                        <div className="relative z-10 space-y-0.5 px-0.5 flex-1 overflow-hidden">
                                            {hasMeeting.slice(0, 4).map(meeting => (
                                                <div 
                                                    key={meeting.id}
                                                    onClick={() => navigate(`/admin/meetings/${meeting.id}`)}
                                                    className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] hover:bg-slate-100 rounded cursor-pointer"
                                                    title={`${formatTime(meeting.start_time)} - ${meeting.title}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getDotColor(meeting.status)}`} />
                                                    <span className="font-semibold">{formatTime(meeting.start_time)}</span>
                                                    <span className="truncate opacity-90">{meeting.title}</span>
                                                </div>
                                            ))}
                                            {hasMeeting.length > 4 && (
                                                <div className="px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                                                    + {hasMeeting.length - 4} rapat lainnya
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Rapat</h1>
                    <p className="text-muted-foreground">Kelola jadwal rapat, notulensi, dan presensi.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center p-1 bg-muted rounded-lg border border-border">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4 mr-2" /> List
                        </Button>
                        <Button
                            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarDays className="h-4 w-4 mr-2" /> Kalender
                        </Button>
                    </div>
                    <Button onClick={() => navigate('/admin/meetings/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Rapat
                    </Button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <IndexPage
                    title=""
                    description=""
                    actions={[]}
                    data={paginatedData}
                    columns={columns}
                    pagination={paginationInfo}
                    onPageChange={(p) => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', p.toString());
                        setSearchParams(params);
                    }}
                    onPerPageChange={(pp) => setPagination({ ...pagination, per_page: pp, current_page: 1 })}
                    searchValue={filterValues.search}
                    searchPlaceholder="Cari judul, No Rapat..."
                    onSearchChange={(val: string) => handleFilterChange('search', val)}
                    onFilterSubmit={handleFilterSubmit}
                    onFilterReset={handleFilterReset}
                    emptyMessage="Belum ada data rapat"
                    emptyIcon={CalendarDays}
                    isLoading={loading}
                />
            ) : (
                renderCalendarView()
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Rapat</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus jadwal rapat ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {meetingToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{meetingToDelete.title}</p>
                                <p className="text-sm text-muted-foreground">No: {meetingToDelete.meeting_number}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setMeetingToDelete(null);
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
