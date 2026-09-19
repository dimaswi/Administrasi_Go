import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Plus, CalendarRange } from 'lucide-react';
import api from '@/lib/api';

export default function RosterScheduleIndex() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/roster-schedules');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'date', label: 'Tanggal', render: (row: any) => row.date.substring(0, 10) },
        { key: 'user_id', label: 'ID Pegawai', render: (row: any) => row.user_id },
        { key: 'work_schedule_id', label: 'ID Shift', render: (row: any) => row.work_schedule_id },
        { key: 'notes', label: 'Keterangan', render: (row: any) => row.notes || '-' },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Jadwal Dinas (Roster)"
                description="Kelola shift khusus harian untuk perawat/dokter"
                actions={[{ label: 'Plot Roster Baru', href: '/hr/rosters/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data roster"
                emptyIcon={CalendarRange}
                isLoading={loading}
            />
        </HrLayout>
    );
}