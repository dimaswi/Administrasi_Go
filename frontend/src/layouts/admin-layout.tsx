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
  LogOut,
  ChevronRight,
  Settings,
  CalendarDays,
  Mail,
  UserCheck,
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

// --- Workspace Switcher ---
const workspaces = [
  {
    id: 'administrasi',
    name: 'Administrasi',
    label: 'Administrasi',
    icon: Building,
    href: '/admin/dashboard', // Default Admin route
  },
  {
    id: 'hr',
    name: 'Human Resources',
    label: 'Human Resources',
    icon: Users,
    href: '/hr/dashboard', // Default HR route
  },
];

function WorkspaceSwitcherAdmin() {
  const { state } = useSidebar();
  const { appName, appLogo } = useSettings();
  const currentWorkspace = workspaces[0]; // Administrasi
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
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Persuratan',
    href: '/admin/incoming-letters',
    icon: Mail,
    children: [
      { title: 'Surat Masuk', href: '/admin/incoming-letters', permission: 'incoming_letter.view' },
      { title: 'Surat Keluar', href: '/admin/outgoing-letters', permission: 'outgoing_letter.view' },
      { title: 'Kotak Disposisi', href: '/admin/dispositions', permission: 'disposition.view' },
      { title: 'Template Surat', href: '/arsip/document-templates', permission: 'document_template.view' },
    ],
  },
  {
    title: 'Manajemen Rapat',
    href: '/admin/meetings',
    icon: CalendarDays,
    children: [
      { title: 'Daftar Rapat', href: '/admin/meetings', permission: 'meeting.view' },
      { title: 'Daftar Ruangan', href: '/admin/rooms', permission: 'room.view' },
    ],
  },
];

function NavMain() {
  const location = useLocation();
  const url = location.pathname;
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const { hasPermission } = useAuth();

  React.useEffect(() => {
    // Set initial open menu based on active URL
    const activeItem = navItems.find(item =>
      (url.startsWith(item.href) && item.href !== '/admin/dashboard') ||
      (item.href === '/admin/dashboard' && url === '/admin/dashboard') ||
      (item.children && item.children.some((c: any) => url === c.href || url.startsWith(c.href + '/')))
    );
    if (activeItem && activeItem.children) {
      setOpenMenu(activeItem.title);
    }
  }, [url]);

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarMenu>
        {navItems.map((item) => {
          let itemChildren = item.children;
          if (itemChildren) {
            itemChildren = itemChildren.filter((c: any) => !c.permission || hasPermission(c.permission));
          }

          if (itemChildren && itemChildren.length === 0) {
            return null;
          }

          const hasChildren = itemChildren && itemChildren.length > 0;
          const isActive = url.startsWith(item.href) && item.href !== '/admin/dashboard' || (item.href === '/admin/dashboard' && url === '/admin/dashboard');

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
                    {itemChildren!.map((child: any) => {
                      const childActive = url === child.href || url.startsWith(child.href + '/');
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

function AdminBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const crumbs = React.useMemo(() => {
    const list: { title: string; href?: string }[] = [
      { title: 'Administrasi', href: '/admin/dashboard' },
    ];

    if (path === '/admin/dashboard' || path === '/admin') {
      list.push({ title: 'Dashboard' });
      return list;
    }

    if (path.startsWith('/admin/incoming-letters')) {
      list.push({ title: 'Surat Masuk', href: path === '/admin/incoming-letters' ? undefined : '/admin/incoming-letters' });
      if (path === '/admin/incoming-letters/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      else if (path !== '/admin/incoming-letters') list.push({ title: 'Detail' });
      return list;
    }

    if (path.startsWith('/admin/outgoing-letters')) {
      list.push({ title: 'Surat Keluar', href: path === '/admin/outgoing-letters' ? undefined : '/admin/outgoing-letters' });
      if (path === '/admin/outgoing-letters/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      else if (path !== '/admin/outgoing-letters') list.push({ title: 'Detail' });
      return list;
    }

    if (path.startsWith('/admin/dispositions')) {
      list.push({ title: 'Kotak Disposisi', href: path === '/admin/dispositions' ? undefined : '/admin/dispositions' });
      if (path === '/admin/dispositions/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      else if (path !== '/admin/dispositions') list.push({ title: 'Detail' });
      return list;
    }

    if (path.startsWith('/arsip/document-templates')) {
      list.push({ title: 'Template Surat', href: path === '/arsip/document-templates' ? undefined : '/arsip/document-templates' });
      if (path === '/arsip/document-templates/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      else if (path !== '/arsip/document-templates') list.push({ title: 'Detail' });
      return list;
    }

    if (path.startsWith('/admin/meetings')) {
      list.push({ title: 'Daftar Rapat', href: path === '/admin/meetings' ? undefined : '/admin/meetings' });
      if (path === '/admin/meetings/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      else if (path !== '/admin/meetings') list.push({ title: 'Detail' });
      return list;
    }

    if (path.startsWith('/admin/rooms')) {
      list.push({ title: 'Daftar Ruangan', href: path === '/admin/rooms' ? undefined : '/admin/rooms' });
      if (path === '/admin/rooms/create') list.push({ title: 'Tambah' });
      else if (path.endsWith('/edit')) list.push({ title: 'Edit' });
      else if (path !== '/admin/rooms') list.push({ title: 'Detail' });
      return list;
    }

    if (path.startsWith('/admin/settings')) {
      list.push({ title: 'Pengaturan' });
      return list;
    }

    // Fallback
    const segments = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
    segments.forEach((seg, i) => {
      const formatted = seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const isLast = i === segments.length - 1;
      list.push({
        title: formatted === 'Create' ? 'Tambah' : formatted === 'Edit' ? 'Edit' : formatted,
        href: isLast ? undefined : `/admin/${segments.slice(0, i + 1).join('/')}`,
      });
    });

    return list;
  }, [path]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="font-semibold text-neutral-900 dark:text-neutral-100">{crumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.href} />} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                    {crumb.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// --- Layout ---
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <WorkspaceSwitcherAdmin />
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
            <AdminBreadcrumbs />
          </div>
          <div className="flex items-center gap-2">
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
