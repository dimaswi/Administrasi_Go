import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Filter,
    ChevronDown,
    RotateCcw,
    Search,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============ Types ============

interface Column<T> {
    key: string;
    label: string;
    className?: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
}

interface FilterOption {
    value: string;
    label: string;
}

interface FilterField {
    key: string;
    label?: string;
    type: "text" | "select" | "date";
    placeholder?: string;
    options?: FilterOption[];
    className?: string;
}

interface PageAction {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
}

interface IndexPageProps<T> {
    // Header
    title: string;
    description?: string;
    actions?: PageAction[];

    // Data
    data: T[];
    columns: Column<T>[];

    // Pagination
    pagination?: Pagination;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;

    // Filter
    filterFields?: FilterField[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;
    onFilterSubmit?: () => void;
    onFilterReset?: () => void;

    // Search
    searchValue?: string;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;

    // States
    emptyMessage?: string;
    emptyIcon?: LucideIcon;
    isLoading?: boolean;

    // Extra content in header
    headerExtra?: React.ReactNode;

    // Override table area (e.g. grid view)
    tableContent?: React.ReactNode;
}

// ============ Component ============

export function IndexPage<T extends { id: number | string }>({
    title,
    description,
    actions,
    data,
    columns,
    pagination,
    onPageChange,
    onPerPageChange,
    filterFields,
    filterValues = {},
    onFilterChange,
    onFilterSubmit,
    onFilterReset,
    searchValue,
    searchPlaceholder = "Cari data...",
    onSearchChange,
    emptyMessage = "Tidak ada data",
    emptyIcon: EmptyIcon,
    isLoading = false,
    headerExtra,
    tableContent,
}: IndexPageProps<T>) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [sortKey, setSortKey] = React.useState<string | null>(null);
    const [sortDir, setSortDir] = React.useState<"asc" | "desc" | null>(null);

    // Keep ref to latest onFilterSubmit to avoid stale closures in debounce effect
    const onFilterSubmitRef = React.useRef(onFilterSubmit);
    onFilterSubmitRef.current = onFilterSubmit;
    const isFirstRender = React.useRef(true);
    const prevSearchValRef = React.useRef(searchValue);

    // Live search debounced auto-submit (otomatis cari tanpa perlu tekan Enter)
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevSearchValRef.current = searchValue;
            return;
        }

        if (prevSearchValRef.current === searchValue) {
            return;
        }
        prevSearchValRef.current = searchValue;

        if (!onFilterSubmitRef.current) return;

        const timer = setTimeout(() => {
            onFilterSubmitRef.current?.();
        }, 350);

        return () => clearTimeout(timer);
    }, [searchValue]);

    const handleSort = (key: string) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
        } else if (sortDir === "asc") {
            setSortDir("desc");
        } else if (sortDir === "desc") {
            setSortKey(null);
            setSortDir(null);
        }
    };

    const sortedData = React.useMemo(() => {
        const safeData = data || [];
        if (!sortKey || !sortDir) return safeData;
        return [...safeData].sort((a, b) => {
            const aVal = (a as any)[sortKey];
            const bVal = (b as any)[sortKey];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    const hasActiveFilters = Object.entries(filterValues).some(
        ([key, v]) => key !== 'search' && v && v !== "" && v !== "all"
    );

    const activeFilterCount = Object.entries(filterValues).filter(
        ([key, v]) => key !== 'search' && v && v !== "" && v !== "all"
    ).length;

    const fromCount = pagination?.from ?? (pagination ? ((pagination.current_page - 1) * pagination.per_page + 1) : 0);
    const toCount = pagination?.to ?? (pagination ? Math.min(pagination.current_page * pagination.per_page, pagination.total) : (data?.length || 0));
    const totalCount = pagination?.total ?? (data?.length || 0);

    return (
        <div className="w-full max-w-full space-y-4">
            {/* ─── Unified Card Container: Kawan-Dolan Sharp Frame ─── */}
            <div className="w-full rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none overflow-hidden">
                
                {/* 1. Header Bar */}
                <div className="px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0">
                            {EmptyIcon ? <EmptyIcon className="size-4" /> : <Search className="size-4" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
                                    {title}
                                </h1>
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                                    {totalCount} Data
                                </span>
                            </div>
                            {description && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input in Header Bar */}
                        {onSearchChange && (
                            <div className="relative w-44 sm:w-56 md:w-64">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                                <Input
                                    placeholder={searchPlaceholder}
                                    value={searchValue || ""}
                                    onChange={(e) => {
                                        onSearchChange(e.target.value);
                                        onPageChange?.(1);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            onFilterSubmitRef.current?.();
                                        }
                                    }}
                                    className="h-8 pl-8 pr-7 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                />
                                {searchValue && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSearchChange("");
                                            onPageChange?.(1);
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.delete('search');
                                            newParams.set('page', '1');
                                            navigate(`?${newParams.toString()}`);
                                            if (onFilterSubmitRef.current) {
                                                setTimeout(() => onFilterSubmitRef.current?.(), 0);
                                            }
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                                        title="Hapus pencarian"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Extra Toolbar Actions */}
                        {headerExtra}

                        {/* Filter Trigger Button */}
                        {filterFields && filterFields.length > 0 && (
                            <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                                <CollapsibleTrigger
                                    className={cn(
                                        buttonVariants({ variant: "outline", size: "sm" }),
                                        "h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium gap-1.5 px-3 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-none",
                                        filterOpen && "bg-neutral-100 dark:bg-neutral-800"
                                    )}
                                >
                                    <Filter className="size-3.5" />
                                    <span>Filter</span>
                                    {activeFilterCount > 0 && (
                                        <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-none bg-neutral-900 text-[10px] text-white font-mono font-bold dark:bg-white dark:text-neutral-900">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                    <ChevronDown className={cn("size-3.5 transition-transform duration-200", filterOpen && "rotate-180")} />
                                </CollapsibleTrigger>
                            </Collapsible>
                        )}

                        {/* Header Action Buttons (e.g. Tambah Data) */}
                        {actions && actions.map((action, index) => {
                            const Icon = action.icon || Plus;
                            const isPrimary = !action.variant || action.variant === "default";
                            const btnClass = cn(
                                "h-8 px-3 rounded-none text-xs font-semibold gap-1.5 shadow-none transition-colors inline-flex items-center justify-center",
                                isPrimary
                                    ? "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                                    : "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            );

                            if (action.href) {
                                return (
                                    <Link key={index} to={action.href} className={btnClass}>
                                        <Icon className="size-3.5" />
                                        {action.label}
                                    </Link>
                                );
                            }
                            return (
                                <Button 
                                    key={index} 
                                    variant={action.variant || "default"} 
                                    size="sm" 
                                    onClick={action.onClick}
                                    className={btnClass}
                                >
                                    <Icon className="size-3.5" />
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Shaded Filter Strip */}
                {filterFields && filterFields.length > 0 && (
                    <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                        <CollapsibleContent>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 p-3.5 px-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {filterFields.map((field) => (
                                        <div key={field.key} className="space-y-1">
                                            {field.label && (
                                                <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                                    {field.label}
                                                </label>
                                            )}
                                            {field.type === "select" && field.options && (
                                                <SearchableSelect
                                                    options={field.options}
                                                    value={filterValues[field.key] || "all"}
                                                    onChange={(val) => onFilterChange?.(field.key, val === "all" || !val ? "" : val)}
                                                    placeholder={field.placeholder || "Pilih..."}
                                                    className={field.className}
                                                />
                                            )}
                                            {field.type === "text" && (
                                                <Input
                                                    value={filterValues[field.key] || ""}
                                                    onChange={(e) => onFilterChange?.(field.key, e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && onFilterSubmit?.()}
                                                    placeholder={field.placeholder}
                                                    className={cn("h-8 rounded-none text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800", field.className)}
                                                />
                                            )}
                                            {field.type === "date" && (
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={filterValues[field.key] || ""}
                                                        onChange={(e) => onFilterChange?.(field.key, e.target.value)}
                                                        className={cn("h-8 w-full rounded-none text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex items-center justify-between", field.className)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="col-span-full flex items-center gap-2 justify-end pt-1">
                                        {hasActiveFilters && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={onFilterReset} 
                                                className="h-8 rounded-none text-xs gap-1 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                            >
                                                <RotateCcw className="size-3.5" />
                                                Reset
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={onFilterSubmit} 
                                            size="sm" 
                                            className="h-8 rounded-none text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                                        >
                                            Terapkan Filter
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* 3. Table or Custom Content */}
                {tableContent ?? (
                    <div className="relative w-full overflow-x-auto select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 hover:bg-neutral-100/70">
                                    {columns.map((column) => (
                                        <TableHead
                                            key={column.key}
                                            className={cn(
                                                "h-8 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 select-none",
                                                column.sortable !== false && column.label && "cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors",
                                                column.className
                                            )}
                                            onClick={() => column.sortable !== false && column.label ? handleSort(column.key) : undefined}
                                        >
                                            {column.label ? (
                                                <span className="inline-flex items-center gap-1">
                                                    {column.label}
                                                    {column.sortable !== false && (
                                                        sortKey === column.key ? (
                                                            sortDir === "asc"
                                                                ? <ArrowUp className="size-3 text-neutral-900 dark:text-neutral-100" />
                                                                : <ArrowDown className="size-3 text-neutral-900 dark:text-neutral-100" />
                                                        ) : (
                                                            <ArrowUpDown className="size-3 opacity-30 hover:opacity-70 transition-opacity" />
                                                        )
                                                    )}
                                                </span>
                                            ) : null}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow className="border-0">
                                        <TableCell colSpan={columns.length} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-neutral-500">
                                                <div className="size-4 animate-spin rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent" />
                                                <span className="text-xs font-mono">Memuat data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedData.length === 0 ? (
                                    <TableRow className="border-0">
                                        <TableCell colSpan={columns.length} className="h-36 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1.5 text-neutral-500">
                                                {EmptyIcon ? (
                                                    <EmptyIcon className="size-8 opacity-30 mb-0.5" />
                                                ) : (
                                                    <div className="size-9 rounded-none bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-0.5">
                                                        <Search className="size-4 opacity-40" />
                                                    </div>
                                                )}
                                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">{emptyMessage}</span>
                                                <p className="text-[11px] text-neutral-500 font-mono max-w-sm">
                                                    Tidak ada data yang cocok dengan kriteria pencarian atau filter yang dipilih.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedData.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors h-9"
                                        >
                                            {columns.map((column) => (
                                                <TableCell key={column.key} className={cn("px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200", column.className)}>
                                                    {column.render
                                                        ? column.render(item)
                                                        : (item as any)[column.key]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* 4. Footer Pagination Bar */}
                {pagination && pagination.total > 0 && (
                    <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        {/* Left: Summary */}
                        <div>
                            Menampilkan <span className="font-semibold text-neutral-900 dark:text-neutral-100">{fromCount}</span> - <span className="font-semibold text-neutral-900 dark:text-neutral-100">{toCount}</span> dari <span className="font-semibold text-neutral-900 dark:text-neutral-100">{totalCount}</span> data
                        </div>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">Baris:</span>
                                {onPerPageChange ? (
                                    <Select
                                        value={pagination.per_page.toString()}
                                        onValueChange={(val) => val && onPerPageChange(parseInt(val))}
                                    >
                                        <SelectTrigger className="h-8 w-18 text-xs font-mono rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none">
                                            <SelectValue placeholder="10" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-neutral-200 dark:border-neutral-800 shadow-none">
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                            <SelectItem value="200">200</SelectItem>
                                            <SelectItem value="500">500</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-xs">{pagination.per_page}</span>
                                )}
                            </div>

                            <div className="whitespace-nowrap font-mono text-xs text-neutral-500 dark:text-neutral-400">
                                Hal {pagination.total === 0 ? 0 : pagination.current_page} / {pagination.total === 0 ? 0 : pagination.last_page}
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                    title="Halaman pertama"
                                    onClick={() => onPageChange?.(1)}
                                    disabled={pagination.current_page <= 1}
                                >
                                    <ChevronsLeft className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                    title="Halaman sebelumnya"
                                    onClick={() => onPageChange?.(pagination.current_page - 1)}
                                    disabled={pagination.current_page <= 1}
                                >
                                    <ChevronLeft className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                    title="Halaman berikutnya"
                                    onClick={() => onPageChange?.(pagination.current_page + 1)}
                                    disabled={pagination.current_page >= pagination.last_page || pagination.total === 0}
                                >
                                    <ChevronRight className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                    title="Halaman terakhir"
                                    onClick={() => onPageChange?.(pagination.last_page)}
                                    disabled={pagination.current_page >= pagination.last_page || pagination.total === 0}
                                >
                                    <ChevronsRight className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
