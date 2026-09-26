import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
    searchPlaceholder = "Cari...",
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

    return (
        <div className="w-full space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight">{title}</h2>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {headerExtra}
                    {actions && actions.map((action, index) => {
                        const Icon = action.icon || Plus;
                        if (action.href) {
                            return (
                                <Link key={index} to={action.href} className={buttonVariants({ variant: action.variant || "default", size: "sm" })}>
                                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                                    {action.label}
                                </Link>
                            );
                        }
                        return (
                            <Button key={index} variant={action.variant || "default"} size="sm" onClick={action.onClick}>
                                <Icon className="h-3.5 w-3.5 mr-1.5" />
                                {action.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Toolbar: Search + Filter */}
            {(onSearchChange || (filterFields && filterFields.length > 0)) && (
                <div className="flex items-center gap-2">
                    {onSearchChange && (
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                value={searchValue || ""}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && onFilterSubmit?.()}
                                placeholder={searchPlaceholder}
                                className={cn("h-8 pl-8 text-sm", searchValue && "pr-8")}
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSearchChange("");
                                        const newParams = new URLSearchParams(searchParams);
                                        newParams.delete('search');
                                        navigate(`?${newParams.toString()}`);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Hapus pencarian"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                    {filterFields && filterFields.length > 0 && (
                        <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                            <CollapsibleTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5 text-xs")}>
                                <Filter className="h-3.5 w-3.5" />
                                Filter
                                {activeFilterCount > 0 && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                                        {activeFilterCount}
                                    </span>
                                )}
                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", filterOpen && "rotate-180")} />
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                    {/* total count */}
                    {pagination && (
                        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                            {pagination.total} total data
                        </span>
                    )}
                </div>
            )}

            {/* Collapsible Filter Panel */}
            {filterFields && filterFields.length > 0 && (
                <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                    <CollapsibleContent>
                        <div className="rounded-md border bg-muted/20 px-4 py-4 mt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-4">
                                {filterFields.map((field) => (
                                    <div key={field.key} className="space-y-1">
                                        {field.label && (
                                            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
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
                                                className={cn("h-8 w-[160px] text-xs", field.className)}
                                            />
                                        )}
                                        {field.type === "date" && (
                                            <div className="relative">
                                                <Input
                                                    type="date"
                                                    value={filterValues[field.key] || ""}
                                                    onChange={(e) => onFilterChange?.(field.key, e.target.value)}
                                                    className={cn("h-8 w-full text-xs flex items-center justify-between", field.className)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="col-span-full flex gap-2 justify-end mt-2">
                                    <Button onClick={onFilterSubmit} size="sm" className="h-8 text-xs">
                                        Terapkan
                                    </Button>
                                    {hasActiveFilters && (
                                        <Button variant="outline" size="sm" onClick={onFilterReset} className="h-8 text-xs gap-1.5">
                                            <RotateCcw className="h-3 w-3" />
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* Table or custom content */}
            {tableContent ?? (
                <div className="overflow-x-auto rounded-md border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border hover:bg-transparent bg-muted/40">
                                {columns.map((column) => (
                                    <TableHead
                                        key={column.key}
                                        className={cn(
                                            "h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-0 select-none",
                                            column.sortable !== false && column.label && "cursor-pointer hover:text-foreground transition-colors",
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
                                                            ? <ArrowUp className="h-3 w-3 text-primary" />
                                                            : <ArrowDown className="h-3 w-3 text-primary" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 opacity-30" />
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
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            Memuat data...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedData.length === 0 ? (
                                <TableRow className="border-0">
                                    <TableCell colSpan={columns.length} className="h-36 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            {EmptyIcon && <EmptyIcon className="h-8 w-8 opacity-30" />}
                                            <span className="text-sm">{emptyMessage}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors h-[46px]"
                                    >
                                        {columns.map((column) => (
                                            <TableCell key={column.key} className={cn("py-2 text-sm", column.className)}>
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

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    {/* Left: rows per page + range info */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span>Baris:</span>
                            {onPerPageChange ? (
                                <Select
                                    value={pagination.per_page.toString()}
                                    onValueChange={(val) => val && onPerPageChange(parseInt(val))}
                                >
                                    <SelectTrigger className="h-7 w-[70px]">
                                        <SelectValue placeholder="10" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="200">200</SelectItem>
                                        <SelectItem value="250">250</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                        <SelectItem value="1000">1000</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="font-medium">{pagination.per_page}</span>
                            )}
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <span>
                            {pagination.from ?? 1}–{pagination.to ?? sortedData.length}
                            {" "}dari{" "}
                            <span className="font-medium text-foreground">{pagination.total}</span>
                        </span>
                    </div>

                    {/* Right: page nav */}
                    <div className="flex items-center gap-2">
                        <span>
                            Hal. <span className="font-medium text-foreground">{pagination.current_page}</span> / {pagination.last_page}
                        </span>
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onPageChange?.(1)}
                                disabled={pagination.current_page === 1}
                            >
                                <ChevronsLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onPageChange?.(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onPageChange?.(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onPageChange?.(pagination.last_page)}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <ChevronsRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
