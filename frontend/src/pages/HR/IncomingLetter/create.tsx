import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Save, Loader2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IncomingLetterCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData(e.currentTarget);
            
            // Hardcode orgUnitID and registeredBy for now, should be from context
            formData.append('organization_unit_id', '1');
            formData.append('registered_by', '1');

            const res = await fetch('http://localhost:8080/api/incoming-letters', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do not set Content-Type, browser will set it with boundary for FormData
                },
                body: formData
            });

            if (res.ok) {
                navigate('/admin/incoming-letters');
            } else {
                const data = await res.json();
                setError(data.error || 'Terjadi kesalahan saat menyimpan.');
            }
        } catch (err) {
            console.error(err);
            setError('Gagal terhubung ke server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="w-full">
                {/* Header Component */}
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0" type="button" onClick={() => navigate('/admin/incoming-letters')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold">Catat Surat Masuk</h2>
                        <p className="text-sm text-muted-foreground">Formulir pendaftaran surat masuk baru.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                Data Surat Masuk
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="incoming_number">Nomor Agenda (Masuk)</Label>
                            <Input id="incoming_number" name="incoming_number" required placeholder="Contoh: 001/AGENDA/2026" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="original_number">Nomor Surat Asli</Label>
                            <Input id="original_number" name="original_number" required placeholder="Sesuai fisik surat" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="original_date">Tanggal Surat Asli</Label>
                            <Input id="original_date" name="original_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="received_date">Tanggal Diterima</Label>
                            <Input id="received_date" name="received_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="sender">Pengirim</Label>
                            <Input id="sender" name="sender" required placeholder="Instansi / Nama Pengirim" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="subject">Perihal / Hal</Label>
                            <Input id="subject" name="subject" required placeholder="Tentang apa surat ini" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Input id="category" name="category" placeholder="Contoh: Undangan, Edaran, dll" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classification">Klasifikasi</Label>
                            <Input id="classification" name="classification" placeholder="Biasa / Penting / Rahasia" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attachment_count">Jumlah Lampiran</Label>
                            <Input id="attachment_count" name="attachment_count" type="number" min="0" defaultValue="0" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">File Scan Surat (PDF)</Label>
                            <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                            <p className="text-xs text-muted-foreground mt-1">Format PDF/JPG, maks 10MB.</p>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notes">Catatan Tambahan</Label>
                            <Textarea id="notes" name="notes" placeholder="Catatan opsional..." rows={3} />
                        </div>
                    </CardContent>
                    </Card>

                    {/* Form Actions (Sticky Footer) */}
                    <div className="sticky bottom-0 z-40 -mx-4 -mb-4 px-4 py-4 md:-mx-4 md:-mb-2 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-6" onClick={() => navigate('/admin/incoming-letters')} disabled={loading}>Batal</Button>
                        <Button type="submit" size="sm" className="h-9 px-6" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
