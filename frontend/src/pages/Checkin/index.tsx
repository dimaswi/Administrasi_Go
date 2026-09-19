import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

export default function CheckinPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [step, setStep] = useState<'form' | 'loading' | 'success' | 'error'>('form');
    const [nip, setNip] = useState('');
    const [message, setMessage] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setMessage('Token tidak ditemukan di URL.');
            setStep('error');
            return;
        }
        setStep('loading');
        try {
            // First resolve user_id by NIP
            const userRes = await api.get(`/users?nip=${nip}`);
            const users = userRes.data;
            if (!users || users.length === 0) {
                setMessage('NIP tidak ditemukan. Pastikan NIP Anda terdaftar dalam sistem.');
                setStep('error');
                return;
            }
            const userId = users[0].id;

            const res = await api.post(`/meetings/check-in-by-token?token=${token}`, { user_id: userId });
            setMeetingTitle(res.data.meeting_title || 'Rapat');
            setStep('success');
        } catch (err: any) {
            const errMsg = err?.response?.data?.error || 'Terjadi kesalahan. Coba lagi.';
            setMessage(errMsg);
            setStep('error');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Token Tidak Valid</h1>
                    <p className="text-gray-500 text-sm">URL check-in tidak valid. Minta moderator untuk menampilkan QR Code kembali.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                {step === 'form' && (
                    <>
                        <div className="text-center mb-6">
                            <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                                <QrCode className="h-7 w-7 text-blue-600" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">Check-in Kehadiran</h1>
                            <p className="text-sm text-gray-500 mt-1">Masukkan NIP Anda untuk mengkonfirmasi kehadiran</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="nip" className="text-sm font-medium">NIP</Label>
                                <Input
                                    id="nip"
                                    type="text"
                                    value={nip}
                                    onChange={e => setNip(e.target.value)}
                                    placeholder="Masukkan NIP Anda"
                                    required
                                    className="mt-1"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={!nip.trim()}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Konfirmasi Kehadiran
                            </Button>
                        </form>
                    </>
                )}

                {step === 'loading' && (
                    <div className="text-center py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600">Memproses check-in...</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Check-in Berhasil!</h2>
                        <p className="text-sm text-gray-500 mb-2">Kehadiran Anda telah dikonfirmasi untuk:</p>
                        <p className="font-semibold text-blue-700">{meetingTitle}</p>
                        <p className="text-xs text-gray-400 mt-4">Terima kasih atas partisipasi Anda.</p>
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Check-in Gagal</h2>
                        <p className="text-sm text-gray-500 mb-4">{message}</p>
                        <Button variant="outline" onClick={() => { setStep('form'); setMessage(''); }}>
                            Coba Lagi
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
