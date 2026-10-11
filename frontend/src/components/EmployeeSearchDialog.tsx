import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  User,
  Building,
  Briefcase,
  CornerDownLeft,
  Loader2,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeItem {
  id: number;
  employee_id: string;
  first_name: string;
  last_name?: string;
  nik?: string;
  gender?: string;
  position?: string;
  status?: string;
  photo?: string;
  organization_unit_id?: number;
  unit_name?: string;
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (f && l) {
    return `${f[0]}${l[0]}`.toUpperCase();
  }
  if (f) {
    const parts = f.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return f.slice(0, Math.min(2, f.length)).toUpperCase();
  }
  return 'K';
}

export function EmployeeSearchDialog() {
  const { hasPermission, user } = useAuth();

  // Permission check for global employee search
  const canSearch =
    user?.role_id === 1 ||
    user?.name?.toLowerCase().includes('admin') ||
    hasPermission('global_search') ||
    hasPermission('global.search') ||
    hasPermission('employee.search') ||
    hasPermission('hr.employee.search') ||
    hasPermission('employee.view') ||
    hasPermission('employee.read') ||
    hasPermission('employee.index') ||
    hasPermission('employee.list') ||
    hasPermission('employee_view') ||
    hasPermission('employees.view') ||
    hasPermission('employees.index') ||
    hasPermission('hr.employee.view') ||
    hasPermission('hr.employee.read') ||
    hasPermission('hr.employee.index') ||
    hasPermission('hr.employees.index') ||
    hasPermission('hr.employees.view');

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EmployeeItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [unitsMap, setUnitsMap] = useState<Map<number, string>>(new Map());

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Organization Units once for mapping unit names
  useEffect(() => {
    if (!canSearch) return;
    api.get('/org-units')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const map = new Map<number, string>();
        list.forEach((u: any) => map.set(u.id, u.name));
        setUnitsMap(map);
      })
      .catch(() => {});
  }, [canSearch]);

  // Global Keyboard shortcut: '/' or 'Ctrl+K' / 'Cmd+K' to open search (only if user has permission)
  useEffect(() => {
    if (!canSearch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isInput)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSearch]);

  // Focus input when dialog opens & reset state
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Perform search
  const performSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/employees?search=${encodeURIComponent(searchTerm.trim())}&perPage=20`)
      .then((res) => {
        const list: EmployeeItem[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || []);
        setResults(list);
        setSelectedIndex(0);
      })
      .catch((err) => {
        console.error('Failed to search employees:', err);
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 250);
  };

  const handleSelectEmployee = (emp: EmployeeItem) => {
    setOpen(false);
    navigate(`/hr/employees/${emp.id}`);
  };

  // Keyboard navigation within the dialog
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelectEmployee(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Keep selected item in scroll view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results.length]);

  if (!canSearch) {
    return null;
  }

  return (
    <>
      {/* Search Bar Button in Header (Responsive: compact icon on mobile, full bar on desktop) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center sm:justify-between h-8 w-8 sm:w-48 md:w-60 lg:w-72 rounded-full border border-input/60 bg-muted/40 hover:bg-muted/70 p-0 sm:px-3 text-xs text-muted-foreground shadow-xs transition-all hover:border-primary/40 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        title="Cari karyawan (/ atau Ctrl+K)"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          <span className="hidden sm:inline truncate text-muted-foreground group-hover:text-foreground transition-colors">
            Cari karyawan...
          </span>
        </div>
        <kbd className="pointer-events-none hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1 font-mono text-[9px] font-medium text-muted-foreground group-hover:text-foreground shadow-2xs">
          /
        </kbd>
      </button>

      {/* Search Modal Dialog (matching Gambar 2) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="p-0 overflow-hidden max-w-2xl sm:rounded-2xl border bg-card shadow-2xl top-[20%] sm:top-[25%] translate-y-0"
          onKeyDown={handleDialogKeyDown}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Pencarian Global Karyawan</DialogTitle>
          </DialogHeader>

          {/* Modal Input Bar */}
          <div className="relative flex items-center px-4 py-3.5 border-b border-border/60 bg-background/50 backdrop-blur-xs">
            <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="search"
              name="employee_search_query"
              id="employee_search_query"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              value={query}
              onChange={handleInputChange}
              placeholder="Cari NIK, Nama, Posisi, atau Unit..."
              className="flex-1 bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground/70 text-foreground [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted mr-1.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd
              onClick={() => setOpen(false)}
              className="select-none rounded border border-border/80 bg-muted/70 px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
            >
              ESC
            </kbd>
          </div>

          {/* Modal Content Body */}
          <div className="max-h-[380px] min-h-[160px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Mencari data karyawan...</span>
              </div>
            ) : !query.trim() ? (
              /* State when nothing typed yet (matching Gambar 2) */
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <p className="text-sm text-muted-foreground font-normal">
                  Ketik untuk mulai mencari karyawan
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Bisa menggunakan Nama Pegawai, NIK, ID Pegawai, atau Jabatan
                </p>
              </div>
            ) : results.length === 0 ? (
              /* State when no results found */
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2 text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Karyawan tidak ditemukan
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tidak ada data yang cocok dengan pencarian &ldquo;{query}&rdquo;
                </p>
              </div>
            ) : (
              /* Results List */
              <div ref={listRef} className="p-2 space-y-1">
                {results.map((emp, index) => {
                  const fullName = `${emp.first_name} ${emp.last_name || ''}`.trim();
                  const unitName =
                    emp.unit_name ||
                    (emp.organization_unit_id
                      ? unitsMap.get(emp.organization_unit_id)
                      : undefined) ||
                    '-';
                  const isSelected = index === selectedIndex;
                  const isActive =
                    !emp.status ||
                    emp.status === 'active' ||
                    emp.status === 'aktif';

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border',
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-foreground shadow-2xs'
                          : 'border-transparent hover:bg-muted/50 text-foreground/90'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar Huruf Depan / Inisial Nama (Tanpa Foto) */}
                        <div
                          className={cn(
                            'h-9 w-9 rounded-md flex items-center justify-center font-bold text-xs tracking-wider shrink-0 select-none border transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-muted/80 text-foreground border-border/80'
                          )}
                        >
                          {getInitials(emp.first_name, emp.last_name)}
                        </div>

                        {/* Name & Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">
                              {fullName}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 py-0 font-normal uppercase shrink-0',
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {emp.status || 'Aktif'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                            <span className="font-mono text-muted-foreground">
                              {emp.employee_id || `EMP-${emp.id}`}
                            </span>
                            {emp.nik && (
                              <>
                                <span>•</span>
                                <span>NIK: {emp.nik}</span>
                              </>
                            )}
                            {(emp.position || unitName !== '-') && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {emp.position || unitName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right shortcut or action icon */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <div className="flex items-center gap-1 text-xs text-primary font-medium">
                            <span>Buka</span>
                            <CornerDownLeft className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer Helper */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/30 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px]">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px]">
                  ↓
                </kbd>
                <span>Navigasi</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px]">
                  ↵
                </kbd>
                <span>Pilih</span>
              </span>
            </div>
            <span className="hidden sm:inline">
              Gunakan pencarian untuk akses cepat data profil & rekap
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
