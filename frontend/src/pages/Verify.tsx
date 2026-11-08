import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, FileText, Calendar, User, ShieldCheck, Clock } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

export default function Verify() {
    const { id } = useParams();
    const [letter, setLetter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLetter = async () => {
            try {
                const response = await fetch(getApiUrl(`/api/verify/outgoing-letters/${id}`));
                if (!response.ok) {
                    throw new Error('Dokumen tidak ditemukan atau tidak valid.');
                }
                const data = await response.json();
                setLetter(data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLetter();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-900/50 flex items-center justify-center p-4 font-sans">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="size-10 bg-neutral-300 dark:bg-neutral-700"></div>
                    <div className="h-3 w-32 bg-neutral-300 dark:bg-neutral-700 font-mono text-xs">Memverifikasi...</div>
                </div>
            </div>
        );
    }

    if (error || !letter) {
        return (
            <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-900/50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="bg-white dark:bg-neutral-950 p-6 sm:p-8 rounded-none border border-neutral-200 dark:border-neutral-800 max-w-md w-full text-center">
                    <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                    <h1 className="text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-1">Verifikasi Gagal</h1>
                    <p className="text-xs font-mono text-neutral-500">{error || 'Dokumen tidak valid.'}</p>
                </div>
            </div>
        );
    }

    const signatories = letter.signatories?.filter((s: any) => s.status === 'signed') || [];

    return (
        <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-900/50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-xl mx-auto space-y-4">
                {/* Unified Card Container: Kawan-Dolan Standard */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center gap-3">
                        <div className="size-9 bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Dokumen Resmi Terverifikasi
                                </h1>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold uppercase">
                                    VALID
                                </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
                                Dokumen elektronik ini sah dan tercatat pada basis data administrasi
                            </p>
                        </div>
                    </div>

                    {/* Metadata Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <FileText className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-mono uppercase text-neutral-500">Perihal Surat</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white break-words mt-0.5">{letter.subject}</p>
                                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mt-0.5 break-all">{letter.letter_number}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                            <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-mono uppercase text-neutral-500">Tanggal Surat</p>
                                <p className="text-xs font-semibold text-neutral-900 dark:text-white mt-0.5">
                                    {new Date(letter.letter_date).toLocaleDateString('id-ID', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Signatories List */}
                    {signatories.length > 0 && (
                        <div className="bg-neutral-50/60 dark:bg-neutral-900/40 p-5 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Penanda Tangan Elektronik
                                </h3>
                            </div>
                            <ul className="space-y-2">
                                {signatories.map((sig: any, index: number) => (
                                    <li key={index} className="flex items-start gap-3 bg-white dark:bg-neutral-950 p-3 border border-neutral-200 dark:border-neutral-800 rounded-none">
                                        <div className="size-7 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 text-neutral-600 dark:text-neutral-400">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{sig.user_name || `Penanda Tangan ${index + 1}`}</p>
                                            <p className="text-[11px] font-mono text-neutral-500 mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 shrink-0" />
                                                <span>
                                                    {new Date(sig.signed_at).toLocaleString('id-ID', {
                                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                                                    })} WIB
                                                </span>
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                
                <div className="text-center text-[11px] font-mono text-neutral-500">
                    <p>Sistem Administrasi Klinik Rawat Inap Utama Muhammadiyah Kedungadem</p>
                </div>
            </div>
        </div>
    );
}
