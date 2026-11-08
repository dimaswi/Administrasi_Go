import React, { useState, useEffect } from 'react';
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
        <>
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50 dark:bg-neutral-900/30 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                    <div className="size-7 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 rounded-none">
                        <QrCode className="size-3.5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-800 dark:text-neutral-200">Presensi Cepat QR Code</h4>
                        <p className="text-[11px] text-neutral-500 font-mono">Scan via kamera aplikasi mobile untuk check-in mandiri</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none text-xs font-mono">
                    <Users className="size-3 text-neutral-500" />
                    <span className="font-bold text-neutral-900 dark:text-white">{attendedCount}</span>
                    <span className="text-neutral-500">/ {totalParticipants} Hadir</span>
                    <span className="text-neutral-400">({attendancePercent}%)</span>
                </div>
            </div>

            <div>
                {!token ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-36 h-36 bg-white dark:bg-neutral-950 rounded-none border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-2">
                            <QrCode className="size-10 text-neutral-300 dark:text-neutral-700" />
                            <p className="text-[11px] font-mono text-neutral-400 text-center px-2">QR Code belum aktif</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                                <span className="text-neutral-500">Durasi:</span>
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
                                    className="w-[120px] h-8 text-xs rounded-none"
                                />
                            </div>
                            <Button onClick={handleGenerate} disabled={loading} size="sm" className="h-8 px-3 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold shadow-none gap-1.5">
                                <QrCode className="size-3.5" />
                                {loading ? 'Membuat QR...' : 'Aktifkan QR Code'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center gap-6 py-1">
                        {/* QR Box Left */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className="p-3 bg-white border border-neutral-200 dark:border-neutral-800 rounded-none">
                                <QRCodeSVG
                                    value={checkinUrl!}
                                    size={160}
                                    level="Q"
                                    includeMargin={false}
                                    style={{ display: 'block' }}
                                />
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-none text-[11px] font-mono">
                                <Timer className="size-3 text-amber-600" />
                                <span className="text-neutral-500">Berlaku:</span>
                                <span className={`font-bold ${countdown && countdown < 120 ? 'text-rose-600 animate-pulse' : 'text-amber-700 dark:text-amber-400'}`}>
                                    {countdown !== null ? formatCountdown(countdown) : '--:--'}
                                </span>
                            </div>
                        </div>

                        {/* Controls & Details Right */}
                        <div className="flex-1 flex flex-col gap-3 w-full">
                            <div className="space-y-1">
                                <label className="text-[11px] font-mono uppercase text-neutral-500">
                                    Tautan Presensi Langsung
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 font-mono text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none px-3 py-1.5 text-neutral-800 dark:text-neutral-200 truncate">
                                        {checkinUrl}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none shrink-0"
                                        title="Salin Tautan"
                                    >
                                        {copied ? <Check className="size-3 text-emerald-600 mr-1" /> : <Copy className="size-3 mr-1" />}
                                        {copied ? 'Tersalin' : 'Salin'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-white dark:bg-neutral-950 p-2.5 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-start gap-1.5">
                                    <Smartphone className="size-3.5 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                                    <span>Scan via aplikasi mobile Administrasi pada tab Ambil Gambar.</span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                    <Users className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Presensi otomatis mencatat nama pegawai dan timestamp.</span>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFullscreenOpen(true)}
                                    className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none font-semibold gap-1.5"
                                >
                                    <Maximize2 className="size-3" />
                                    <span>Layar Penuh (Proyektor)</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    size="sm"
                                    className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none gap-1.5"
                                >
                                    <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
                                    <span>Refresh Token</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 rounded-none text-neutral-500 hover:text-rose-600 text-xs"
                                    onClick={() => { setToken(null); setCheckinUrl(null); setCountdown(null); }}
                                >
                                    Tutup QR
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

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
        </>
    );
}

