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

export default function SettingsPage() {
    const navigate = useNavigate();
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
            <div className="w-full flex-1 flex flex-col">
                {/* Header Component */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Pengaturan Aplikasi</h2>
                        <p className="text-sm text-muted-foreground">Sesuaikan identitas aplikasi, logo, serta lokasi presensi geofencing kantor.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                    {/* Identitas Aplikasi */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Identitas Aplikasi
                            </CardTitle>
                            <CardDescription>
                                Perubahan ini akan memengaruhi tampilan di seluruh sistem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* App Name */}
                            <div className="space-y-2">
                                <Label htmlFor="appName">Nama Aplikasi</Label>
                                <Input 
                                    id="appName" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Contoh: SIMRS Klinik" 
                                />
                                <p className="text-xs text-muted-foreground">Ditampilkan di header browser dan menu navigasi.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Logo Upload */}
                                <div className="space-y-4">
                                    <Label>Logo Aplikasi</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            {logoPreview || appLogo ? (
                                                <div className="relative h-24 w-auto max-w-[200px]">
                                                    <img 
                                                        src={logoPreview || appLogo} 
                                                        alt="Logo" 
                                                        className="h-full w-full object-contain" 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
                                                <Label htmlFor="logo" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2">
                                                    <UploadCloud className="mr-2 h-4 w-4" /> Pilih File Logo
                                                </Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Format gambar (PNG, JPG, SVG). Rasio disarankan: Landscape.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Icon Upload */}
                                <div className="space-y-4">
                                    <Label>Ikon Aplikasi (Favicon)</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            {iconPreview || appIcon ? (
                                                <div className="relative h-16 w-16">
                                                    <img 
                                                        src={iconPreview || appIcon} 
                                                        alt="Icon" 
                                                        className="h-full w-full object-cover rounded shadow-sm" 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
                                                <Label htmlFor="icon" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2">
                                                    <UploadCloud className="mr-2 h-4 w-4" /> Pilih File Ikon
                                                </Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Ikon browser. Disarankan bentuk persegi murni (1:1).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Geofencing Location Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-teal-600" />
                                Lokasi Presensi Kantor (Geofencing GPS)
                            </CardTitle>
                            <CardDescription>
                                Tentukan lokasi kantor & radius maksimal bagi pegawai untuk melakukan check-in / check-out presensi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Interactive Map Picker */}
                            <LocationPickerMap
                                latitude={officeLat}
                                longitude={officeLon}
                                radius={officeRadius}
                                onChange={(lat, lon) => {
                                    setOfficeLat(lat.toFixed(6));
                                    setOfficeLon(lon.toFixed(6));
                                }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="officeName">Nama Lokasi Kantor</Label>
                                    <Input
                                        id="officeName"
                                        value={officeName}
                                        onChange={(e) => setOfficeName(e.target.value)}
                                        placeholder="Contoh: Kantor Pusat Jakarta"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="officeRadius">Radius Toleransi Presensi (Meter)</Label>
                                    <Input
                                        id="officeRadius"
                                        type="number"
                                        value={officeRadius}
                                        onChange={(e) => setOfficeRadius(e.target.value)}
                                        placeholder="Contoh: 100"
                                    />
                                    <p className="text-xs text-muted-foreground">Jarak maksimum dalam meter dari titik koordinat kantor.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="officeLat">Latitude Kantor</Label>
                                    <Input
                                        id="officeLat"
                                        value={officeLat}
                                        onChange={(e) => setOfficeLat(e.target.value)}
                                        placeholder="Contoh: -6.200000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="officeLon">Longitude Kantor</Label>
                                    <Input
                                        id="officeLon"
                                        value={officeLon}
                                        onChange={(e) => setOfficeLon(e.target.value)}
                                        placeholder="Contoh: 106.816666"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    onClick={() => navigate('/hr/master-data/work-location')}
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Kelola Master Lokasi (Tambah Banyak Tempat)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions (Sticky Footer) */}
                    <div className="sticky bottom-0 z-40 mt-auto -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="submit" size="sm" className="h-9 px-6 bg-teal-600 hover:bg-teal-700" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
