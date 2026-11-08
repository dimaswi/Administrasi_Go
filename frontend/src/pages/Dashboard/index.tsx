import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { 
  Users, 
  Mail, 
  Send, 
  CalendarDays,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function DashboardIndex() {
  const navigate = useNavigate();
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
      description: "Pegawai & tenaga aktif",
      link: "/hr/employees",
    },
    {
      title: "Surat Masuk",
      value: stats.incomingLetters,
      icon: Mail,
      description: "Arsip surat diterima",
      link: "/hr/incoming-letters",
    },
    {
      title: "Surat Keluar",
      value: stats.outgoingLetters,
      icon: Send,
      description: "Surat resmi terbit",
      link: "/hr/outgoing-letters",
    },
    {
      title: "Agenda Rapat",
      value: stats.meetings,
      icon: CalendarDays,
      description: "Jadwal & notulensi",
      link: "/admin/meetings",
    }
  ];

  return (
    <AdminLayout>
      <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col font-sans">
        {/* Header Toolbar */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0 rounded-none">
              <LayoutDashboard className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                Dashboard Utama
              </h1>
              <p className="text-[11px] text-neutral-500 font-mono truncate">
                Ringkasan modul operasional, SDM, persuratan, dan agenda administrasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="size-3" />
              <span>Sistem Aktif</span>
            </div>
          </div>
        </div>

        {/* Unified 4 Stat Strip: Kawan-Dolan Standard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                onClick={() => navigate(stat.link)}
                className="p-4 sm:p-5 space-y-2 hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Icon className="size-3.5 text-neutral-700 dark:text-neutral-300" />
                    {stat.title}
                  </span>
                  <ArrowRight className="size-3 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 dark:text-white tracking-tight">
                  {loading ? '...' : stat.value}
                </div>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Akses Cepat Modul Utama
            </h3>
            <p className="text-[11px] text-neutral-500 font-mono">Pintasan navigasi langsung ke modul pengelolaan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Kelola Karyawan', desc: 'Data pegawai & jabatan', path: '/hr/employees', icon: Users },
              { label: 'Surat Masuk', desc: 'Registrasi & disposisi surat', path: '/hr/incoming-letters', icon: Mail },
              { label: 'Surat Keluar', desc: 'Penerbitan surat resmi', path: '/hr/outgoing-letters', icon: Send },
              { label: 'Manajemen Rapat', desc: 'Agenda, notulensi & absensi', path: '/admin/meetings', icon: CalendarDays },
            ].map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(mod.path)}
                  className="p-3.5 text-left border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100/80 dark:bg-neutral-900/40 dark:hover:bg-neutral-850 transition-colors flex items-start gap-3 rounded-none group"
                >
                  <div className="size-8 rounded-none bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition-colors">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                      {mod.label}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
                      {mod.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
