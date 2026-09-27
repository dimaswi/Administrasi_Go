import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, FileText, Calendar, User, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !letter) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Verifikasi Gagal</h1>
                    <p className="text-slate-600">{error || 'Dokumen tidak valid.'}</p>
                </div>
            </div>
        );
    }

    const signatories = letter.signatories?.filter((s: any) => s.status === 'signed') || [];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                        <ShieldCheck className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dokumen Valid</h1>
                    <p className="mt-2 text-slate-600">Dokumen elektronik ini resmi dan tercatat di sistem kami.</p>
                </div>

                <Card className="shadow-xl overflow-hidden border-slate-100">
                    <CardContent className="p-6 sm:p-10">
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <FileText className="w-6 h-6 text-slate-400 mt-1 mr-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Perihal</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900 break-words">{letter.subject}</p>
                                    <p className="text-sm text-slate-500 mt-1 break-all">{letter.letter_number}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Calendar className="w-6 h-6 text-slate-400 mt-1 mr-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tanggal Dokumen</p>
                                    <p className="mt-1 text-base text-slate-900 break-words">
                                        {new Date(letter.letter_date).toLocaleDateString('id-ID', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    {signatories.length > 0 && (
                        <div className="bg-slate-50 p-6 sm:p-10 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                                Ditandatangani Elektronik Oleh
                            </h3>
                            <ul className="space-y-4">
                                {signatories.map((sig: any, index: number) => (
                                    <li key={index} className="flex items-start bg-white p-4 border border-slate-200 shadow-sm rounded-md overflow-hidden">
                                        <div className="bg-blue-50 p-2 mr-4 shrink-0 rounded-md">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">{sig.user_name || `Penanda Tangan ${index + 1}`}</p>
                                            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1">
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
                </Card>
                
                <div className="mt-8 text-center text-sm text-slate-500">
                    <p>Sistem Administrasi Klinik Rawat Inap Utama Muhammadiyah Kedungadem</p>
                </div>
            </div>
        </div>
    );
}
