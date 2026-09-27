import { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Mail, Send, CalendarDays, Box } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    incomingLetters: 0,
    outgoingLetters: 0,
    meetings: 0,
    rooms: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const responses = await Promise.allSettled([
          api.get('/incoming-letters'),
          api.get('/outgoing-letters'),
          api.get('/meetings'),
          api.get('/rooms')
        ]);
        
        setStats({
          incomingLetters: responses[0].status === 'fulfilled' ? (responses[0].value.data?.data?.length || 0) : 0,
          outgoingLetters: responses[1].status === 'fulfilled' ? (responses[1].value.data?.data?.length || 0) : 0,
          meetings: responses[2].status === 'fulfilled' ? (responses[2].value.data?.data?.length || 0) : 0,
          rooms: responses[3].status === 'fulfilled' ? (responses[3].value.data?.data?.length || 0) : 0,
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
      title: "Surat Masuk",
      value: stats.incomingLetters,
      icon: Mail,
      description: "Total surat diterima",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Surat Keluar",
      value: stats.outgoingLetters,
      icon: Send,
      description: "Total surat diterbitkan",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Agenda Rapat",
      value: stats.meetings,
      icon: CalendarDays,
      description: "Total jadwal rapat",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Ruangan",
      value: stats.rooms,
      icon: Box,
      description: "Total ruangan terdaftar",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard Administrasi</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-gray-800">
                        {loading ? <span className="text-gray-300 text-2xl">...</span> : stat.value}
                      </h3>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
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
