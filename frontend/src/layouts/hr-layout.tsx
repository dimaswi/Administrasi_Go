import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarInset,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import {
  Building,
  Check,
  ChevronsUpDown,
  Users,
  LayoutDashboard,
  Settings2,
  LogOut,
  ChevronRight,
  Settings,
  Mail,
  UserCheck,
  FileSpreadsheet,
  Target,
  GraduationCap,
  Award,
  Sun,
  Moon,
} from 'lucide-react';

function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      return;
    }
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="size-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors shadow-none cursor-pointer"
      title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppLogoIcon from '@/components/AppLogoIcon';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeSearchDialog } from '@/components/EmployeeSearchDialog';

// --- Workspace Switcher ---
const workspaces = [
  {
    id: 'administrasi',
    name: 'Administrasi',
    label: 'Administrasi',
    icon: Building,
    href: '/admin/dashboard',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    label: 'Human Resources',
    icon: Users,
    href: '/hr/dashboard',
  },
];

function WorkspaceSwitcherHR() {
  const { state } = useSidebar();
  const { appName, appLogo } = useSettings();
  const currentWorkspace = workspaces[1]; // HR
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton
            size="lg"
            className={cn(
              "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "transition-colors"
            )}
          >
            <div className={cn(
              "flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden shrink-0",
              !appLogo && "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold"
            )}>
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="size-full object-contain" />
              ) : (
                <AppLogoIcon className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{appName || currentWorkspace.name}</span>
              <span className="truncate text-xs text-neutral-500 font-normal">Modul {currentWorkspace.label}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-neutral-400" />
          </SidebarMenuButton>} />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none"
            align="start"
            side={isCollapsed ? "right" : "bottom"}
            sideOffset={4}
          >
            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Modul Sistem
            </div>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                render={<Link to={workspace.href} />}
                className="cursor-pointer gap-2 p-2 rounded-none"
              >
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-lg border",
                  workspace.id === currentWorkspace.id
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                )}>
                  <workspace.icon className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{workspace.name}</div>
                  <div className="text-xs text-neutral-500">Modul {workspace.label}</div>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <Check className="size-4 text-neutral-900 dark:text-neutral-100" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// --- Navigation ---
const navItems = [
  {
    title: 'Dashboard Presensi',
    href: '/hr/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  {
    title: 'Karyawan',
    href: '/hr/employees',
    icon: Users,
    children: [
      { title: 'Data Karyawan', href: '/hr/employees', permission: 'employee.view' },
      { title: 'Jadwal Karyawan', href: '/hr/rosters/planner', permission: 'roster.view' },
      { title: 'Tukar Shift', href: '/hr/shift-exchanges', permission: 'shift_exchange.view' },
      { title: 'Riwayat Absensi (Admin)', href: '/hr/attendances', permission: 'attendance.view' },
      { title: 'Izin & Cuti Karyawan', href: '/hr/leaves', permission: 'leave.view' },
    ],
  },
  {
    title: 'Rekap Absensi',
    href: '/hr/reports/attendance',
    icon: FileSpreadsheet,
    permission: 'report.view',
  },
  {
    title: 'Training',
    href: '/hr/trainings',
    icon: GraduationCap,
    children: [
      { title: 'Daftar Training', href: '/hr/trainings', permission: 'training.view' },
      { title: 'Peserta Training', href: '/hr/employee-trainings', permission: 'employee_training.view' },
    ],
  },
  {
    title: 'Kinerja',
    href: '/hr/performance-reviews',
    icon: Award,
    children: [
      { title: 'Penilaian Kinerja', href: '/hr/performance-reviews', permission: 'performance_review.view' },
      { title: '360 Feedback', href: '/hr/feedback360', permission: 'feedback_360.view' },
      { title: 'Kalibrasi', href: '/hr/calibration', permission: 'calibration.view' },
      { title: 'Periode Penilaian', href: '/hr/performance-periods', permission: 'performance_period.view' },
      { title: 'Kategori & KPI', href: '/hr/kpi', permission: 'kpi.view' },
    ],
  },
  {
    title: 'Master Data',
    href: '/hr/access/users',
    icon: Settings2,
    children: [
      { title: 'Daftar User', href: '/hr/access/users', permission: 'user.view' },
      { title: 'Daftar Role', href: '/hr/access/roles', permission: 'role.view' },
      { title: 'Daftar Permission', href: '/hr/access/permissions', permission: 'permission.view' },
      { title: 'Unit Organisasi', href: '/hr/organizations', permission: 'organization.view' },
      { title: 'Kategori Pekerjaan', href: '/hr/master-data/jobcategory', permission: 'job_category.view' },
      { title: 'Status Kepegawaian', href: '/hr/master-data/employmentstatus', permission: 'employment_status.view' },
      { title: 'Tingkat Pendidikan', href: '/hr/master-data/educationlevel', permission: 'education_level.view' },
      { title: 'Jenis Cuti', href: '/hr/master-data/leavetype', permission: 'leave_type.view' },
      { title: 'Lokasi Presensi (GPS)', href: '/hr/master-data/work-location', permission: 'work_location.view' },
      { title: 'Master Shift', href: '/hr/work-schedules', permission: 'work_schedule.view' },
    ],
  },
];

function NavMain() {
  const location = useLocation();
  const url = location.pathname;
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const { hasPermission, isAdmin } = useAuth();

  React.useEffect(() => {
    // Set initial open menu based on active URL
    const activeItem = navItems.find(item => {
      if (item.children && item.children.length > 0) {
        return item.children.some((c: any) => {
          const pathOnly = c.href.split('?')[0];
          return url === pathOnly || url.startsWith(pathOnly + '/');
        });
      }
      return url === item.href || url.startsWith(item.href + '/');
    });
    if (activeItem && activeItem.children) {
      setOpenMenu(activeItem.title);
    }
  }, [url]);

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarMenu>
        {navItems.map((item) => {
          let itemChildren = item.children;
          if (itemChildren && !isAdmin) {
            itemChildren = itemChildren.filter((c: any) => !c.permission || hasPermission(c.permission));
          }

          if (itemChildren && itemChildren.length === 0) {
            return null;
          }

          if (item.permission && !isAdmin && !hasPermission(item.permission)) {
            return null;
          }

          const hasChildren = itemChildren && itemChildren.length > 0;
          let isActive = false;
          if (hasChildren) {
            isActive = itemChildren!.some((c: any) => {
              const pathOnly = c.href.split('?')[0];
              return url === pathOnly || url.startsWith(pathOnly + '/');
            });
          } else {
            isActive = url === item.href || url.startsWith(item.href + '/');
          }

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link to={item.href} />}
                  isActive={isActive}
                  tooltip={{ children: item.title }}
                  className={cn(
                    "w-full transition-colors",
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <Collapsible
                open={openMenu === item.title}
                onOpenChange={(isOpen) => setOpenMenu(isOpen ? item.title : null)}
                className="group/collapsible w-full"
              >
                <CollapsibleTrigger render={<SidebarMenuButton
                  tooltip={{ children: item.title }}
                  isActive={isActive}
                  className={cn(
                    "w-full transition-colors",
                    isActive
                      ? "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-semibold"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[open]/collapsible:rotate-90 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>} />
                <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                  <SidebarMenuSub>
                    {itemChildren!.map((child) => {
                      const fullPath = location.pathname + location.search;
                      const childPath = child.href.split('?')[0];
                      const childActive = child.href.includes('?')
                        ? (fullPath === child.href || (location.pathname === childPath && location.search === '' && child.href.endsWith('?tab=daily')))
                        : (url === childPath || url.startsWith(childPath + '/'));
                      return (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            render={<Link to={child.href} />}
                            isActive={childActive}
                            className={cn(
                              "w-full transition-colors",
                              childActive
                                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900"
                                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                            )}
                          >
                            <span>{child.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavUser() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const isCollapsed = state === 'collapsed';

  const name = user?.name || 'Pengguna';
  const nipOrEmail = user?.nip || 'Pegawai';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('') || 'US';

  const canAccessSettings = isAdmin || hasPermission('settings.view') || hasPermission('settings.edit');

  return (
    <SidebarMenu className="px-2">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent rounded-none">
            <div className="flex items-center gap-2 flex-1 text-left text-sm leading-tight min-w-0">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-semibold text-xs shrink-0">{initials}</div>
              <div className="grid flex-1 min-w-0">
                <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{name}</span>
                <span className="truncate text-xs text-neutral-500 font-normal">{nipOrEmail}</span>
              </div>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-neutral-400 shrink-0" />
          </SidebarMenuButton>} />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none"
            align="end"
            side={isCollapsed ? 'left' : 'bottom'}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-semibold text-xs shrink-0">{initials}</div>
                  <div className="grid flex-1">
                    <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{name}</span>
                    <span className="truncate text-xs text-neutral-500 font-mono">{nipOrEmail}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {canAccessSettings && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="cursor-pointer rounded-none">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive rounded-none">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function HrBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const crumbs = React.useMemo(() => {
    const list: { title: string; href?: string }[] = [
      { title: 'HR', href: '/hr/dashboard' },
    ];

    if (path === '/hr/dashboard' || path === '/hr') {
      list.push({ title: 'Dashboard Presensi' });
      return list;
    }

    // 1. Training
    if (path.startsWith('/hr/employee-trainings')) {
      list.push({
        title: 'Peserta Training',
        href: path === '/hr/employee-trainings' ? undefined : '/hr/employee-trainings',
      });
      if (path === '/hr/employee-trainings/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/employee-trainings') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    if (path.startsWith('/hr/trainings')) {
      list.push({
        title: 'Daftar Training',
        href: path === '/hr/trainings' ? undefined : '/hr/trainings',
      });
      if (path === '/hr/trainings/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/trainings') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    // 2. Karyawan
    if (path.startsWith('/hr/employees')) {
      list.push({
        title: 'Data Karyawan',
        href: path === '/hr/employees' ? undefined : '/hr/employees',
      });
      if (path === '/hr/employees/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/employees') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    if (path.startsWith('/hr/rosters')) {
      list.push({ title: 'Jadwal Karyawan' });
      return list;
    }

    if (path.startsWith('/hr/shift-exchanges')) {
      list.push({
        title: 'Tukar Shift',
        href: path === '/hr/shift-exchanges' ? undefined : '/hr/shift-exchanges',
      });
      if (path === '/hr/shift-exchanges/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/shift-exchanges') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    if (path.startsWith('/hr/attendances')) {
      list.push({ title: 'Riwayat Absensi' });
      return list;
    }

    if (path.startsWith('/hr/reports/attendance')) {
      list.push({ title: 'Rekap Absensi' });
      return list;
    }

    if (path.startsWith('/hr/leaves')) {
      list.push({
        title: 'Izin & Cuti Karyawan',
        href: path === '/hr/leaves' ? undefined : '/hr/leaves',
      });
      if (path === '/hr/leaves/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/leaves') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    if (path.startsWith('/hr/my-attendance')) {
      list.push({ title: 'Presensi Saya' });
      return list;
    }

    // 3. Kinerja
    if (path.startsWith('/hr/performance-reviews')) {
      list.push({
        title: 'Penilaian Kinerja',
        href: path === '/hr/performance-reviews' ? undefined : '/hr/performance-reviews',
      });
      if (path === '/hr/performance-reviews/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/performance-reviews') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    if (path.startsWith('/hr/feedback360')) {
      list.push({ title: '360 Feedback' });
      return list;
    }

    if (path.startsWith('/hr/calibration')) {
      list.push({ title: 'Kalibrasi' });
      return list;
    }

    if (path.startsWith('/hr/performance-periods')) {
      list.push({
        title: 'Periode Penilaian',
        href: path === '/hr/performance-periods' ? undefined : '/hr/performance-periods',
      });
      if (path === '/hr/performance-periods/create') {
        list.push({ title: 'Tambah' });
      } else if (path.endsWith('/edit')) {
        list.push({ title: 'Edit' });
      } else if (path !== '/hr/performance-periods') {
        list.push({ title: 'Detail' });
      }
      return list;
    }

    if (path.startsWith('/hr/kpi')) {
      list.push({ title: 'Kategori & KPI' });
      return list;
    }

    // 4. Master Data
    if (path.startsWith('/hr/access/users')) {
      list.push({
        title: 'Daftar User',
        href: path === '/hr/access/users' ? undefined : '/hr/access/users',
      });
      if (path === '/hr/access/users/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      return list;
    }
    if (path.startsWith('/hr/access/roles')) {
      list.push({
        title: 'Daftar Role',
        href: path === '/hr/access/roles' ? undefined : '/hr/access/roles',
      });
      if (path === '/hr/access/roles/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      return list;
    }
    if (path.startsWith('/hr/access/permissions')) {
      list.push({ title: 'Daftar Permission' });
      return list;
    }
    if (path.startsWith('/hr/organizations')) {
      list.push({
        title: 'Unit Organisasi',
        href: path === '/hr/organizations' ? undefined : '/hr/organizations',
      });
      if (path === '/hr/organizations/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      return list;
    }
    if (path.startsWith('/hr/work-schedules')) {
      list.push({
        title: 'Master Shift',
        href: path === '/hr/work-schedules' ? undefined : '/hr/work-schedules',
      });
      if (path === '/hr/work-schedules/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      return list;
    }
    if (path.startsWith('/hr/master-data/jobcategory')) {
      list.push({ title: 'Kategori Pekerjaan' });
      return list;
    }
    if (path.startsWith('/hr/master-data/employmentstatus')) {
      list.push({ title: 'Status Kepegawaian' });
      return list;
    }
    if (path.startsWith('/hr/master-data/educationlevel')) {
      list.push({ title: 'Tingkat Pendidikan' });
      return list;
    }
    if (path.startsWith('/hr/master-data/leavetype')) {
      list.push({ title: 'Jenis Cuti' });
      return list;
    }
    if (path.startsWith('/hr/master-data/work-location')) {
      list.push({ title: 'Lokasi Presensi (GPS)' });
      return list;
    }
    if (path.startsWith('/hr/master-data/')) {
      list.push({ title: 'Master Data' });
      return list;
    }

    // Fallback: format segments gracefully
    const segments = path.replace(/^\/hr\/?/, '').split('/').filter(Boolean);
    segments.forEach((seg, i) => {
      const formatted = seg
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const isLast = i === segments.length - 1;
      list.push({
        title: formatted === 'Create' ? 'Tambah' : formatted === 'Edit' ? 'Edit' : formatted,
        href: isLast ? undefined : `/hr/${segments.slice(0, i + 1).join('/')}`,
      });
    });

    return list;
  }, [path]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          const isEarlyCrumb = idx < crumbs.length - 2; // hide root levels on mobile (Administrasi, HR)
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem className={cn(isEarlyCrumb ? 'hidden sm:inline-flex' : '')}>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="font-semibold text-neutral-900 dark:text-neutral-100">{crumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.href} />} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                    {crumb.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator className={cn("text-neutral-400", isEarlyCrumb ? 'hidden sm:inline-flex' : '')} />
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// --- Layout ---
export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <WorkspaceSwitcherHR />
        </SidebarHeader>

        <SidebarContent>
          <NavMain />
        </SidebarContent>

        <SidebarFooter className="border-t border-neutral-200 dark:border-neutral-800 p-2">
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm px-4 md:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger className="-ml-1 rounded-none hover:bg-neutral-100 dark:hover:bg-neutral-800" />
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            <HrBreadcrumbs />
          </div>
          <div className="flex items-center gap-2">
            <EmployeeSearchDialog />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-zinc-950/50 min-w-0">
          <main className="mx-auto max-w-full w-full flex flex-col gap-4 min-w-0">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
