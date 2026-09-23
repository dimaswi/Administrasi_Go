import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, Timer, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface Props {
    meetingId: string | number;
    meetingStatus: string;
    isModeratorOrOrganizer: boolean;
    attendedCount: number;
    totalParticipants: number;
}

export function CheckinQRCode({ meetingId, meetingStatus, isModeratorOrOrganizer, attendedCount, totalParticipants }: Props) {
    const [token, setToken] = useState<string | null>(null);
    const [checkinUrl, setCheckinUrl] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState(60); // minutes
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        if (!countdown) return;
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 0) {
                    clearInterval(interval);
                    setToken(null);
                    setCheckinUrl(null);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [countdown]);

    if (meetingStatus !== 'ongoing' || !isModeratorOrOrganizer) return null;

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/meetings/${meetingId}/generate-checkin-token`, {
                duration_minutes: expiresIn
            });
            setToken(res.data.token);
            setCheckinUrl(res.data.checkin_url);
            setCountdown(expiresIn * 60);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatCountdown = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="shadow-none">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>QR Code Presensi</CardTitle>
                            <CardDescription>Tampilkan QR code agar peserta dapat check-in mandiri</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{attendedCount}</span>
                        <span>/ {totalParticipants} Hadir</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {!token ? (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="w-40 h-40 bg-muted/50 rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2">
                            <QrCode className="h-16 w-16 text-muted-foreground/40" />
                            <p className="text-xs text-muted-foreground text-center px-2">QR belum dibuat</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <SearchableSelect
                                options={[
                                    { value: "15", label: "15 menit" },
                                    { value: "30", label: "30 menit" },
                                    { value: "60", label: "60 menit" },
                                    { value: "120", label: "2 jam" }
                                ]}
                                value={String(expiresIn)}
                                onChange={(val) => setExpiresIn(Number(val))}
                                placeholder="Pilih Waktu"
                                className="w-[140px]"
                            />
                            <Button onClick={handleGenerate} disabled={loading}>
                                <QrCode className="h-4 w-4 mr-2" />
                                {loading ? 'Membuat...' : 'Generate QR Code'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-white rounded-xl border-2 border-primary/20 shadow-sm">
                                <QRCodeSVG
                                    value={checkinUrl!}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    style={{ display: 'block' }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Timer className="h-4 w-4 text-orange-500" />
                                <span className={`font-mono font-semibold ${countdown && countdown < 120 ? 'text-red-500' : 'text-orange-500'}`}>
                                    {countdown !== null ? formatCountdown(countdown) : '--:--'}
                                </span>
                                <span className="text-muted-foreground">tersisa</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">URL Check-in</p>
                                <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">{checkinUrl}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Minta peserta untuk <strong>scan QR code</strong> ini menggunakan kamera HP atau buka URL di atas untuk melakukan check-in kehadiran.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={handleGenerate} disabled={loading} size="sm">
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh Token
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setToken(null); setCheckinUrl(null); setCountdown(null); }}>
                                    Hapus QR
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
