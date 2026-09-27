import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    QrCode,
    RefreshCw,
    Timer,
    Users,
    Maximize2,
    Smartphone,
    Camera,
    CheckCircle2,
    Copy,
    Check,
    MapPin,
    Clock,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    meetingId: string | number;
    meetingStatus: string;
    meetingTitle?: string;
    meetingNumber?: string;
    roomName?: string;
    meetingDate?: string;
    startTime?: string;
    endTime?: string;
    isModeratorOrOrganizer: boolean;
    attendedCount: number;
    totalParticipants: number;
}

export function CheckinQRCode({
    meetingId,
    meetingStatus,
    meetingTitle,
    meetingNumber,
    roomName,
    meetingDate,
    startTime,
    endTime,
    isModeratorOrOrganizer,
    attendedCount,
    totalParticipants,
}: Props) {
    const [token, setToken] = useState<string | null>(null);
    const [checkinUrl, setCheckinUrl] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState(60); // minutes
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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

    // Auto-generate QR code immediately when meeting is ongoing and token is not set
    useEffect(() => {
        if (meetingStatus === 'ongoing' && !token && !loading) {
            handleGenerate();
        }
    }, [meetingStatus, meetingId]);

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

    const handleCopy = () => {
        if (!checkinUrl) return;
        navigator.clipboard.writeText(checkinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatCountdown = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const attendancePercent = totalParticipants > 0 ? Math.round((attendedCount / totalParticipants) * 100) : 0;

    return (
        <Card className="shadow-none border border-border/80 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">QR Code Presensi Rapat</CardTitle>
                            <CardDescription className="text-xs">Tampilkan QR code agar peserta dapat check-in mandiri lewat aplikasi mobile</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border text-xs font-medium">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-primary">{attendedCount}</span>
                        <span className="text-muted-foreground">/ {totalParticipants} Hadir</span>
                        <span className="text-xs text-muted-foreground">({attendancePercent}%)</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {!token ? (
                    <div className="flex flex-col items-center gap-5 py-6">
                        <div className="w-44 h-44 bg-muted/40 rounded-2xl border-2 border-dashed border-primary/25 flex flex-col items-center justify-center gap-2.5">
                            <QrCode className="h-14 w-14 text-muted-foreground/35" />
                            <p className="text-xs text-muted-foreground text-center px-4">QR Code presensi belum aktif</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Durasi:</span>
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
                                    className="w-[130px]"
                                />
                            </div>
                            <Button onClick={handleGenerate} disabled={loading} size="sm">
                                <QrCode className="h-4 w-4 mr-2" />
                                {loading ? 'Membuat QR...' : 'Aktifkan QR Code'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center gap-8 py-2">
                        {/* QR Box Left */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-sm transition-all hover:shadow-md">
                                <QRCodeSVG
                                    value={checkinUrl!}
                                    size={180}
                                    level="Q"
                                    includeMargin={false}
                                    style={{ display: 'block' }}
                                />
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-medium">
                                <Timer className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-muted-foreground">Berlaku:</span>
                                <span className={`font-mono font-bold ${countdown && countdown < 120 ? 'text-red-500 animate-pulse' : 'text-amber-700'}`}>
                                    {countdown !== null ? formatCountdown(countdown) : '--:--'}
                                </span>
                            </div>
                        </div>

                        {/* Controls & Details Right */}
                        <div className="flex-1 flex flex-col gap-4 w-full">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Tautan Presensi Langsung
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 font-mono text-xs bg-muted/50 border rounded-lg px-3 py-2 text-foreground truncate">
                                        {checkinUrl}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="shrink-0 text-xs"
                                        title="Salin Tautan"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                        {copied ? 'Tersalin' : 'Salin'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-xl border">
                                <div className="flex items-start gap-2">
                                    <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>Scan via <strong>Aplikasi Mobile Administrasi</strong> pada tab <strong>Ambil Gambar</strong>.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Users className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Check-in otomatis mencatat nama peserta dan waktu kehadiran.</span>
                                </div>
                            </div>

                            <div className="flex gap-2.5 flex-wrap pt-1">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setFullscreenOpen(true)}
                                    className="gap-2"
                                >
                                    <Maximize2 className="h-4 w-4" />
                                    Tampilkan Layar Penuh (Proyektor)
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh Token
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => { setToken(null); setCheckinUrl(null); setCountdown(null); }}
                                >
                                    Tutup QR
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Projector Fullscreen Dialog - Spacious, Neat & Professional */}
            <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
                <DialogContent className="sm:max-w-[620px] md:max-w-[680px] p-0 gap-0 overflow-hidden rounded-2xl border bg-card shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-5 pr-14">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            Presensi Kehadiran Rapat
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">
                            {meetingTitle || 'Rapat Koordinasi'}
                        </h2>

                        <div className="flex items-center gap-3 flex-wrap mt-3 text-xs text-muted-foreground">
                            {meetingNumber && (
                                <span className="font-mono bg-background/80 px-2 py-0.5 rounded border">
                                    #{meetingNumber}
                                </span>
                            )}
                            {roomName && (
                                <span className="flex items-center gap-1 font-medium text-foreground">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    {roomName}
                                </span>
                            )}
                            {(startTime || endTime) && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {startTime || '--:--'} - {endTime || '--:--'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 md:p-8 flex flex-col items-center gap-6">
                        {/* QR Code Container */}
                        <div className="relative group">
                            <div className="p-5 bg-white rounded-2xl border-2 border-primary/30 shadow-md">
                                {checkinUrl && (
                                    <QRCodeSVG
                                        value={checkinUrl}
                                        size={230}
                                        level="Q"
                                        includeMargin={false}
                                        style={{ display: 'block' }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${countdown && countdown < 120 ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${countdown && countdown < 120 ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                </span>
                                <span className="text-muted-foreground">Berlaku selama:</span>
                                <span className={`font-mono font-bold text-sm ${countdown && countdown < 120 ? 'text-red-500' : 'text-amber-700'}`}>
                                    {countdown !== null ? formatCountdown(countdown) : '--:--'}
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-medium text-emerald-800">
                                <Users className="h-3.5 w-3.5 text-emerald-600" />
                                <span><strong>{attendedCount}</strong> / {totalParticipants} Hadir ({attendancePercent}%)</span>
                            </div>
                        </div>

                        {/* Visual 3-Step Guide */}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-left">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                                    <Smartphone className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold text-foreground">1. Buka Aplikasi</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug">Buka app <strong>Administrasi</strong> di smartphone</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-left">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                                    <Camera className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold text-foreground">2. Scan QR Rapat</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug">Pilih <strong>Ambil Gambar</strong> &rarr; <strong>Scan QR Rapat</strong></p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-left">
                                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold text-foreground">3. Presensi Berhasil</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug">Arahkan kamera ke QR untuk check-in instan</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-muted/30 border-t px-6 py-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground">
                            QR kedaluwarsa otomatis demi keamanan kehadiran.
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={loading}
                                className="h-8 text-xs gap-1.5"
                            >
                                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                Perbarui QR
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setFullscreenOpen(false)}
                                className="h-8 text-xs"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

