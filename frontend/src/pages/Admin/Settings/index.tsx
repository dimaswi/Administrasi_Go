import React, { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, UploadCloud, Image as ImageIcon, Settings } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { appName, appLogo, appIcon, refreshSettings } = useSettings();
    const [name, setName] = useState(appName);
    const [processing, setProcessing] = useState(false);

    // Local preview for files before upload
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);

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
            // Update name
            if (name !== appName) {
                await api.put('/settings', { app_name: name });
            }

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
            // Reset local states
            setLogoFile(null);
            setIconFile(null);
            
            // Refresh global context
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
                        <p className="text-sm text-muted-foreground">Sesuaikan identitas aplikasi seperti nama, logo, dan ikon.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
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

                    {/* Form Actions (Sticky Footer) */}
                    <div className="sticky bottom-0 z-40 mt-auto -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={processing || (!logoFile && !iconFile && name === appName)}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
