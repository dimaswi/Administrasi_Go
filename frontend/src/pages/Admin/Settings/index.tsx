import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, UploadCloud, Image as ImageIcon, Settings, MapPin, Navigation } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { hasPermission, isAdmin } = useAuth();
    const canEdit = isAdmin || hasPermission('settings.edit');
    const { appName, appLogo, appIcon, refreshSettings } = useSettings();
    const [name, setName] = useState(appName);
    const [processing, setProcessing] = useState(false);

    // Office Location Settings State
    const [officeName, setOfficeName] = useState('Kantor Utama');
    const [officeLat, setOfficeLat] = useState('-6.200000');
    const [officeLon, setOfficeLon] = useState('106.816666');
    const [officeRadius, setOfficeRadius] = useState('100');
    const [detectingLoc, setDetectingLoc] = useState(false);

    // Local preview for files before upload
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchOfficeSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data) {
                    if (res.data.office_name) setOfficeName(res.data.office_name);
                    if (res.data.office_latitude) setOfficeLat(res.data.office_latitude);
                    if (res.data.office_longitude) setOfficeLon(res.data.office_longitude);
                    if (res.data.office_radius) setOfficeRadius(res.data.office_radius);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchOfficeSettings();
    }, []);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Browser tidak mendukung Geolocation.');
            return;
        }
        setDetectingLoc(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOfficeLat(pos.coords.latitude.toString());
                setOfficeLon(pos.coords.longitude.toString());
                toast.success('Lokasi koordinat browser berhasil didapatkan!');
                setDetectingLoc(false);
            },
            (err) => {
                toast.error('Gagal mengambil lokasi browser: ' + err.message);
                setDetectingLoc(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // Update settings
            const settingsPayload: Record<string, string> = {
                office_name: officeName,
                office_latitude: officeLat,
                office_longitude: officeLon,
                office_radius: officeRadius,
            };

            if (name !== appName) {
                settingsPayload.app_name = name;
            }

            await api.put('/settings', settingsPayload);

            // Upload logo
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await api.post('/settings/upload-logo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Upload icon
            if (iconFile) {
                const formData = new FormData();
                formData.append('file', iconFile);
                await api.post('/settings/upload-icon', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            toast.success('Pengaturan berhasil disimpan');
            setLogoFile(null);
            setIconFile(null);
            await refreshSettings();

        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan saat menyimpan pengaturan');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AdminLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col font-sans mb-12">
                {/* Header Toolbar */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                            <Settings className="size-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                Pengaturan Aplikasi
                            </h1>
                            <p className="text-[11px] text-neutral-500 font-mono">
                                Identitas aplikasi, logo branding, serta konfigurasi presensi GPS kantor
                            </p>
                        </div>
                    </div>

                    {canEdit && (
                        <Button 
                            type="submit" 
                            form="settings-form" 
                            size="sm" 
                            className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5" 
                            disabled={processing}
                        >
                            <Save className="h-3.5 w-3.5" />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    )}
                </div>

                <form id="settings-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-8 flex-1 bg-white dark:bg-neutral-950">
                    {/* Identitas Aplikasi */}
                    <div className="space-y-6">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                <Settings className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                                Identitas Aplikasi
                            </h2>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                Perubahan nama dan logo akan langsung memengaruhi seluruh sistem
                            </p>
                        </div>

                        {/* App Name */}
                        <div className="space-y-1.5 max-w-xl">
                            <Label htmlFor="appName" className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                Nama Aplikasi
                            </Label>
                            <Input
                                id="appName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: SIMKEP"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-sm"
                            />
                            <p className="text-[11px] text-neutral-500 font-mono">Ditampilkan di header browser dan menu navigasi.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Logo Aplikasi
                                </Label>
                                <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-none p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        {logoPreview || appLogo ? (
                                            <div className="relative h-20 w-auto max-w-[200px]">
                                                <img
                                                    src={logoPreview || appLogo}
                                                    alt="Logo"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-none flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-neutral-400" />
                                            </div>
                                        )}
                                        <div>
                                            <Input
                                                type="file"
                                                id="logo"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleLogoChange}
                                            />
                                            <Label htmlFor="logo" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-semibold border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none hover:bg-neutral-50 dark:hover:bg-neutral-800 h-8 px-3 gap-1.5">
                                                <UploadCloud className="h-3.5 w-3.5" /> Pilih File Logo
                                            </Label>
                                        </div>
                                        <p className="text-[11px] text-neutral-500 font-mono">Format PNG, JPG, SVG. Rasio landscape disarankan.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Icon Upload */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Ikon Aplikasi (Favicon)
                                </Label>
                                <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-none p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        {iconPreview || appIcon ? (
                                            <div className="relative h-16 w-16">
                                                <img
                                                    src={iconPreview || appIcon}
                                                    alt="Icon"
                                                    className="h-full w-full object-cover rounded-none"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-none flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-neutral-400" />
                                            </div>
                                        )}
                                        <div>
                                            <Input
                                                type="file"
                                                id="icon"
                                                accept="image/png, image/jpeg, image/x-icon, image/svg+xml"
                                                className="hidden"
                                                onChange={handleIconChange}
                                            />
                                            <Label htmlFor="icon" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-semibold border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none hover:bg-neutral-50 dark:hover:bg-neutral-800 h-8 px-3 gap-1.5">
                                                <UploadCloud className="h-3.5 w-3.5" /> Pilih File Ikon
                                            </Label>
                                        </div>
                                        <p className="text-[11px] text-neutral-500 font-mono">Ikon browser (1:1 / kotak).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Geofencing Location */}
                    <div className="space-y-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                                Lokasi Presensi Kantor (Geofencing GPS)
                            </h2>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                Tentukan lokasi kantor &amp; radius toleransi bagi pegawai untuk presensi
                            </p>
                        </div>

                        {/* Interactive Map Picker */}
                        <div className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <LocationPickerMap
                                latitude={officeLat}
                                longitude={officeLon}
                                radius={officeRadius}
                                onChange={(lat, lon) => {
                                    setOfficeLat(lat.toFixed(6));
                                    setOfficeLon(lon.toFixed(6));
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="officeName" className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Nama Lokasi Kantor
                                </Label>
                                <Input
                                    id="officeName"
                                    value={officeName}
                                    onChange={(e) => setOfficeName(e.target.value)}
                                    placeholder="Contoh: Kantor Utama"
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="officeRadius" className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Radius Toleransi (Meter)
                                </Label>
                                <Input
                                    id="officeRadius"
                                    type="number"
                                    value={officeRadius}
                                    onChange={(e) => setOfficeRadius(e.target.value)}
                                    placeholder="Contoh: 100"
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-sm font-mono"
                                />
                                <p className="text-[11px] text-neutral-500 font-mono">Jarak maksimum dalam meter dari koordinat kantor.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="officeLat" className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Latitude Kantor
                                </Label>
                                <Input
                                    id="officeLat"
                                    value={officeLat}
                                    onChange={(e) => setOfficeLat(e.target.value)}
                                    placeholder="Contoh: -6.200000"
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-sm font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="officeLon" className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Longitude Kantor
                                </Label>
                                <Input
                                    id="officeLon"
                                    value={officeLon}
                                    onChange={(e) => setOfficeLon(e.target.value)}
                                    placeholder="Contoh: 106.816666"
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/hr/master-data/work-location')}
                                className="h-8 px-3 rounded-none border-neutral-200 dark:border-neutral-800 text-xs shadow-none gap-1.5"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                                <span>Kelola Master Lokasi (Multi Lokasi)</span>
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Footer Toolbar */}
                {canEdit && (
                    <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 flex items-center justify-end gap-3 shrink-0">
                        <Button 
                            type="submit" 
                            form="settings-form" 
                            size="sm" 
                            className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5" 
                            disabled={processing}
                        >
                            <Save className="h-3.5 w-3.5" />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
