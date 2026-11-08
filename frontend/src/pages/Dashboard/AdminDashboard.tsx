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
      <div className="w-full space-y-4 pb-12 font-sans">
        {/* Header Toolbar */}
        <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0 rounded-none">
                <Box className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                  Dashboard Administrasi
                </h1>
                <p className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
                  Ringkasan statistik surat masuk, surat keluar, rapat, dan ruangan
                </p>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards: Mobile-first 2x2 on mobile, 4 in row on lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="p-4 sm:p-5 space-y-2 border-b lg:border-b-0 border-r lg:border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">
                      {stat.title}
                    </span>
                    <div className="size-7 rounded-none border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                      <Icon className="size-3.5 text-neutral-700 dark:text-neutral-300" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-900 dark:text-white tracking-tight">
                    {loading ? <span className="text-neutral-300 animate-pulse">...</span> : stat.value}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-mono truncate">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
