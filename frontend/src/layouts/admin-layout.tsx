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
  Mail
} from 'lucide-react';
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
    href: '/dashboard', // Default Admin route
  },
  {
    id: 'hr',
    name: 'Human Resources',
    label: 'Human Resources',
    icon: Users,
    href: '/hr/employees', // Default HR route
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
      { title: 'Daftar Rapat', href: '/admin/meetings' },
      { title: 'Daftar Ruangan', href: '/admin/rooms' },
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
      (url.startsWith(item.href) && item.href !== '/dashboard') || 
      (item.href === '/dashboard' && url === '/dashboard') ||
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
          const isActive = url.startsWith(item.href) && item.href !== '/dashboard' || (item.href === '/dashboard' && url === '/dashboard');

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton render={<Link to={item.href} />} isActive={isActive} tooltip={{ children: item.title }}>
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
                  className="w-full"
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
                  <BreadcrumbLink render={<Link to="/dashboard" />}>
                    Administrasi
                  </BreadcrumbLink>
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
