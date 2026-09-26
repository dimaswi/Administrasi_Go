import { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { 
  Users, 
  Mail, 
  Send, 
  CalendarDays,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardIndex() {
  const [stats, setStats] = useState({
    employees: 0,
    incomingLetters: 0,
    outgoingLetters: 0,
    meetings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const responses = await Promise.allSettled([
          api.get('/employees'),
          api.get('/incoming-letters'),
          api.get('/outgoing-letters'),
          api.get('/meetings')
        ]);
        
        setStats({
          employees: responses[0].status === 'fulfilled' ? (responses[0].value.data?.data?.length || 0) : 0,
          incomingLetters: responses[1].status === 'fulfilled' ? (responses[1].value.data?.data?.length || 0) : 0,
          outgoingLetters: responses[2].status === 'fulfilled' ? (responses[2].value.data?.data?.length || 0) : 0,
          meetings: responses[3].status === 'fulfilled' ? (responses[3].value.data?.data?.length || 0) : 0,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Karyawan",
      value: stats.employees,
      icon: Users,
      description: "Tenaga kerja aktif"
    },
    {
      title: "Surat Masuk",
      value: stats.incomingLetters,
      icon: Mail,
      description: "Total surat diterima"
    },
    {
      title: "Surat Keluar",
      value: stats.outgoingLetters,
      icon: Send,
      description: "Total surat diterbitkan"
    },
    {
      title: "Agenda Rapat",
      value: stats.meetings,
      icon: CalendarDays,
      description: "Total jadwal rapat"
    }
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Utama</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                       <span className="text-gray-300">...</span>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
