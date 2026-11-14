import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    loading?: boolean;
    hideCancel?: boolean;
    onConfirm?: () => void | Promise<void>;
    inputLabel?: string;
    inputPlaceholder?: string;
    inputRequired?: boolean;
    onConfirmWithInput?: (value: string) => void | Promise<void>;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText,
    cancelText = 'Batal',
    variant = 'default',
    loading = false,
    hideCancel = false,
    onConfirm,
    inputLabel,
    inputPlaceholder,
    inputRequired = false,
    onConfirmWithInput,
}: ConfirmDialogProps) {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (!open) {
            setInputValue('');
        }
    }, [open]);

    const resolvedTitle = title || (hideCancel ? 'Informasi' : 'Konfirmasi');
    const resolvedConfirmText = confirmText || (hideCancel ? 'OK' : variant === 'destructive' ? 'Hapus' : 'Konfirmasi');

    const handleConfirm = async () => {
        if (onConfirmWithInput) {
            if (inputRequired && !inputValue.trim()) return;
            await onConfirmWithInput(inputValue);
            return;
        }
        if (onConfirm) {
            await onConfirm();
        } else {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-none border-neutral-200 dark:border-neutral-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-tight">
                        {variant === 'destructive' ? (
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        ) : (
                            <Info className="h-4 w-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                        )}
                        {resolvedTitle}
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed pt-1 whitespace-pre-line">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {onConfirmWithInput && (
                    <div className="space-y-1.5 py-1">
                        {inputLabel && (
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                                {inputLabel} {inputRequired && <span className="text-rose-500">*</span>}
                            </label>
                        )}
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={inputPlaceholder}
                            className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 text-xs"
                            autoFocus
                        />
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-2">
                    {!hideCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-none border-neutral-200 dark:border-neutral-800 text-xs h-8"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        size="sm"
                        className={
                            variant === 'destructive'
                                ? 'rounded-none text-xs h-8'
                                : 'rounded-none text-xs h-8 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'
                        }
                        onClick={handleConfirm}
                        disabled={loading || (Boolean(onConfirmWithInput) && inputRequired && !inputValue.trim())}
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                        {resolvedConfirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
