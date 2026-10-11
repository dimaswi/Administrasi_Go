import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
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

export function EmployeeSearchDialog() {
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
    api.get('/org-units')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const map = new Map<number, string>();
        list.forEach((u: any) => map.set(u.id, u.name));
        setUnitsMap(map);
      })
      .catch(() => {});
  }, []);

  // Global Keyboard shortcut: '/' or 'Ctrl+K' / 'Cmd+K' to open search
  useEffect(() => {
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
  }, []);

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

  return (
    <>
      {/* Search Bar Button in Header (matching Gambar 1) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center h-9 w-44 sm:w-60 md:w-72 lg:w-80 rounded-full border border-input/60 bg-muted/40 hover:bg-muted/70 px-3.5 text-xs text-muted-foreground shadow-xs transition-all hover:border-primary/40 cursor-pointer justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">
            Cari karyawan...
          </span>
        </div>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground shadow-2xs">
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
                        {/* Avatar */}
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden border',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {emp.photo ? (
                            <img
                              src={emp.photo}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>
                              {emp.first_name?.[0]?.toUpperCase() || 'E'}
                              {emp.last_name?.[0]?.toUpperCase() || ''}
                            </span>
                          )}
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
