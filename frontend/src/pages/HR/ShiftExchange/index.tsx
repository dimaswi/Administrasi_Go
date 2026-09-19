import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { IndexPage } from '@/components/ui/index-page';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function ShiftExchangeIndex() {
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
            // Placeholder: await api.get('/shift-exchanges');
            setData([]); // Empty for now until API is ready
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'requesting_user_id', label: 'Pengaju (ID)', render: (row: any) => row.requesting_user_id },
        { key: 'target_user_id', label: 'Ditujukan ke (ID)', render: (row: any) => row.target_user_id },
        { key: 'reason', label: 'Alasan', render: (row: any) => row.reason },
        { 
            key: 'status', 
            label: 'Status', 
            render: (row: any) => (
                <Badge variant="outline" className={row.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}>
                    {row.status}
                </Badge>
            )
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Tukar Shift"
                description="Kelola pengajuan pertukaran jadwal dinas antar perawat/dokter"
                actions={[{ label: 'Ajukan Tukar Shift', href: '/hr/shift-exchanges/create', icon: Plus }]}
                data={data}
                columns={columns}
                emptyMessage="Belum ada data pengajuan tukar shift"
                emptyIcon={ArrowRightLeft}
                isLoading={loading}
            />
        </HrLayout>
    );
}