import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, type LucideIcon } from "lucide-react";

export interface FormCardProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: LucideIcon;
    onBack?: () => void;
    headerActions?: React.ReactNode;
    actions?: React.ReactNode;
    onSubmit?: (e: React.FormEvent<any>) => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    loading?: boolean;
    submitText?: string;
    cancelText?: string;
    onCancel?: () => void;
    className?: string;
    contentClassName?: string;
}

export function FormCard({
    title,
    subtitle,
    icon: Icon,
    onBack,
    headerActions,
    actions,
    onSubmit,
    children,
    footer,
    loading = false,
    submitText = "Simpan",
    cancelText = "Batal",
    onCancel,
    className,
    contentClassName,
}: FormCardProps) {
    const finalHeaderActions = headerActions || actions;

    return (
        <div className={cn("w-full max-w-full", className)}>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                {/* Unified Card Header */}
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <div className="flex items-center gap-3 min-w-0">
                        {onBack && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onBack}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                            {Icon && (
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Icon className="size-4" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-[11px] sm:text-xs text-neutral-500 font-mono truncate">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    {finalHeaderActions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {finalHeaderActions}
                        </div>
                    )}
                </div>

                {/* Form or Card Body */}
                {onSubmit ? (
                    <form onSubmit={onSubmit}>
                        <div className={cn("p-4 sm:p-6 space-y-5", contentClassName)}>
                            {children}
                        </div>
                        {footer !== null && (
                            <div className="px-4 py-3 sm:px-6 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between sm:justify-end gap-2.5">
                                {footer ? footer : (
                                    <>
                                        {onCancel && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={onCancel}
                                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                                            >
                                                {cancelText}
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={loading}
                                            className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs px-3.5 gap-1.5 shadow-none"
                                        >
                                            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                                            <span>{submitText}</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </form>
                ) : (
                    <div>
                        <div className={cn("p-4 sm:p-6 space-y-5", contentClassName)}>
                            {children}
                        </div>
                        {footer && (
                            <div className="px-4 py-3 sm:px-6 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between sm:justify-end gap-2.5">
                                {footer}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export interface FormSectionProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
}

export function FormSection({ title, description, icon: Icon, children, className }: FormSectionProps) {
    return (
        <div className={cn("space-y-3.5", className)}>
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center gap-2">
                {Icon && <Icon className="size-3.5 text-neutral-500 shrink-0" />}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                        {title}
                    </h3>
                    {description && <p className="text-[11px] text-neutral-500">{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

export interface DetailCardProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: LucideIcon;
    onBack?: () => void;
    badges?: React.ReactNode;
    statusBadge?: React.ReactNode;
    headerActions?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function DetailCard({
    title,
    subtitle,
    icon: Icon,
    onBack,
    badges,
    statusBadge,
    headerActions,
    actions,
    children,
    className,
    contentClassName,
}: DetailCardProps) {
    const finalBadges = badges || statusBadge;
    const finalActions = headerActions || actions;

    return (
        <div className={cn("w-full max-w-full", className)}>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                {/* Header */}
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <div className="flex items-center gap-3 min-w-0">
                        {onBack && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onBack}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                            {Icon && (
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Icon className="size-4" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-sm sm:text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                        {title}
                                    </h1>
                                    {finalBadges}
                                </div>
                                {subtitle && (
                                    <p className="text-[11px] sm:text-xs text-neutral-500 font-mono truncate">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    {finalActions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {finalActions}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={cn("p-4 sm:p-6 space-y-6", contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
}
