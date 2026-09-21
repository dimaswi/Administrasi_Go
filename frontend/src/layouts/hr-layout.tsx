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
  Mail
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppLogoIcon from '@/components/AppLogoIcon';
import { useSettings } from '@/contexts/SettingsContext';

// --- Workspace Switcher ---
const workspaces = [
  {
    id: 'administrasi',
    name: 'Administrasi',
    label: 'Administrasi',
    icon: Building,
    href: '/dashboard',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    label: 'Human Resources',
    icon: Users,
    href: '/hr/employees',
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
              !appLogo && "bg-primary text-primary-foreground"
            )}>
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="size-full object-contain" />
              ) : (
                <AppLogoIcon className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{appName || currentWorkspace.name}</span>
              <span className="truncate text-xs text-muted-foreground">Modul {currentWorkspace.label}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </SidebarMenuButton>} />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isCollapsed ? "right" : "bottom"}
            sideOffset={4}
          >
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Modul Sistem
            </div>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                render={<Link to={workspace.href} />}
                className="cursor-pointer gap-2 p-2"
              >
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-lg border",
                  workspace.id === currentWorkspace.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border"
                )}>
                  <workspace.icon className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{workspace.name}</div>
                  <div className="text-xs text-muted-foreground">Modul {workspace.label}</div>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <Check className="size-4 text-primary" />
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
    href: '/dashboard',
    icon: LayoutDashboard,
  },

  {
    title: 'Karyawan',
    href: '/hr/employees',
    icon: Users,
    children: [
      { title: 'Data Karyawan', href: '/hr/employees' },
      { title: 'Jadwal Karyawan', href: '/hr/rosters/planner' },
      { title: 'Tukar Shift', href: '/hr/shift-exchanges' },
      { title: 'Riwayat Absensi', href: '/hr/attendances' },
    ],
  },
  {
    title: 'Master Data',
    href: '/hr',
    icon: Settings2,
    children: [
      { title: 'Daftar User', href: '/hr/access/users' },
      { title: 'Daftar Role', href: '/hr/access/roles' },
      { title: 'Daftar Permission', href: '/hr/access/permissions' },
      { title: 'Unit Organisasi', href: '/hr/organizations' },
      { title: 'Kategori Pekerjaan', href: '/hr/master-data/jobcategory' },
      { title: 'Status Kepegawaian', href: '/hr/master-data/employmentstatus' },
      { title: 'Tingkat Pendidikan', href: '/hr/master-data/educationlevel' },
      { title: 'Jenis Cuti', href: '/hr/master-data/leavetype' },
      { title: 'Master Shift', href: '/hr/work-schedules' },
    ],
  },
];

function NavMain() {
  const location = useLocation();
  const url = location.pathname;
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Set initial open menu based on active URL
    const activeItem = navItems.find(item => {
      if (item.children && item.children.length > 0) {
        return item.children.some((c: any) => url === c.href || url.startsWith(c.href + '/'));
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
          const hasChildren = item.children && item.children.length > 0;
          let isActive = false;
          if (hasChildren) {
            isActive = item.children!.some((c: any) => url === c.href || url.startsWith(c.href + '/'));
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
                  className={isActive ? "bg-primary/10 text-primary font-semibold" : ""}
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
                  className={cn("w-full", isActive ? "text-primary font-semibold" : "")}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[open]/collapsible:rotate-90 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>} />
                <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                  <SidebarMenuSub>
                    {item.children.map((child) => {
                      const childActive = url === child.href;
                      return (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            render={<Link to={child.href} />}
                            isActive={childActive}
                            className={childActive ? "bg-primary/10 text-primary font-semibold" : ""}
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
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenu className="px-2">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
            <div className="flex items-center gap-2 flex-1 text-left text-sm leading-tight">
              <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">AD</div>
              <div className="grid flex-1">
                <span className="truncate font-semibold">Admin</span>
                <span className="truncate text-xs text-muted-foreground">admin@admin.com</span>
              </div>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>} />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="end"
            side={isCollapsed ? 'left' : 'bottom'}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">AD</div>
                  <div className="grid flex-1">
                    <span className="truncate font-semibold">Admin</span>
                    <span className="truncate text-xs text-muted-foreground">admin@admin.com</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
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

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/hr" />}>
                    Administrasi
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>HR</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 flex flex-col px-4 py-2 md:px-4 md:py-2 bg-background min-w-0">
          <main className="flex w-full flex-1 flex-col gap-4 min-w-0">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
