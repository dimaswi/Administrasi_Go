import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function MeetingCheckin() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (token) {
            handleCheckin();
        } else {
            setStatus('error');
            setMessage('Token tidak valid.');
            setLoading(false);
        }
    }, [token]);

    const handleCheckin = async () => {
        try {
            // Note: API endpoint for public checkin needs to be implemented in backend if not already.
            // Using a dummy endpoint call here.
            await api.post(`/meetings/checkin/${token}`);
            setStatus('success');
            setMessage('Presensi berhasil dicatat. Selamat mengikuti rapat!');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(error.response?.data?.error || 'Gagal melakukan presensi. Token mungkin sudah kedaluwarsa atau tidak valid.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-900/50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white dark:bg-neutral-950 max-w-md w-full rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none overflow-hidden text-center">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-center gap-2.5">
                    <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                        <CheckCircle2 className="size-4" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                            Presensi Kehadiran Rapat
                        </h1>
                        <p className="text-[11px] text-neutral-500 font-mono">
                            Verifikasi kehadiran via QR Code instan
                        </p>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    {loading ? (
                        <div className="flex flex-col items-center space-y-3 py-6">
                            <Loader2 className="w-8 h-8 text-neutral-900 dark:text-white animate-spin" />
                            <p className="text-xs font-mono text-neutral-500">Memproses verifikasi presensi Anda...</p>
                        </div>
                    ) : (
                        <div className="py-4">
                            {status === 'success' ? (
                                <div className="space-y-3">
                                    <div className="mx-auto size-14 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Presensi Berhasil Dikonfirmasi</h2>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono">{message}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="mx-auto size-14 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                                        <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <h2 className="text-sm font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">Presensi Gagal</h2>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono">{message}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!loading && (
                        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800">
                            <Button 
                                className="w-full h-8 text-xs font-semibold rounded-none border-neutral-200 dark:border-neutral-800 shadow-none" 
                                variant="outline" 
                                onClick={() => window.close()}
                            >
                                Tutup Halaman
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            
            <p className="mt-6 text-[11px] font-mono text-neutral-400">
                &copy; {new Date().getFullYear()} Klinik Rawat Inap Utama Muhammadiyah Kedungadem
            </p>
        </div>
    );
}
