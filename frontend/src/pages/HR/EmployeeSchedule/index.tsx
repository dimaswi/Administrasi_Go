import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Plus, CalendarDays } from 'lucide-react';
import api from '@/lib/api';

export default function EmployeeScheduleIndex() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/employee-schedules');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'id', label: 'ID', render: (row: any) => row.id },
        { key: 'user_id', label: 'ID Pegawai', render: (row: any) => row.user_id },
        { key: 'start_date', label: 'Mulai Berlaku', render: (row: any) => row.start_date.substring(0, 10) },
        { key: 'end_date', label: 'Berakhir Pada', render: (row: any) => row.end_date ? row.end_date.substring(0, 10) : 'Selamanya' },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Jadwal Mingguan Pegawai"
                description="Kelola jadwal kerja reguler pegawai (Senin - Minggu)"
                actions={[{ label: 'Tetapkan Jadwal', href: '/hr/employee-schedules/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data jadwal mingguan"
                emptyIcon={CalendarDays}
                isLoading={loading}
            />
        </HrLayout>
    );
}