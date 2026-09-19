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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden text-center p-8 border border-gray-100">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Presensi Rapat</h1>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center space-y-4 py-8">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Memproses presensi Anda...</p>
                    </div>
                ) : (
                    <div className="py-6">
                        {status === 'success' ? (
                            <div>
                                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-green-700 mb-2">Sukses!</h2>
                                <p className="text-gray-600">{message}</p>
                            </div>
                        ) : (
                            <div>
                                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                    <XCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-red-700 mb-2">Presensi Gagal</h2>
                                <p className="text-gray-600">{message}</p>
                            </div>
                        )}
                    </div>
                )}
                
                {!loading && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <Button className="w-full" variant="outline" onClick={() => window.close()}>
                            Tutup Halaman
                        </Button>
                    </div>
                )}
            </div>
            
            <p className="mt-8 text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Klinik Kedungadem
            </p>
        </div>
    );
}
