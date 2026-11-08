import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { Mail } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';
import { getApiUrl } from '@/lib/api';

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

            const res = await fetch(getApiUrl('/api/incoming-letters'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
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
            <FormCard
                title="Catat Surat Masuk"
                subtitle="Registrasi nomor agenda, pengirim, perihal, dan unggah berkas fisik surat masuk"
                icon={Mail}
                onBack={() => navigate('/admin/incoming-letters')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Surat Masuk"
                onCancel={() => navigate('/admin/incoming-letters')}
            >
                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-none border border-destructive/20 text-sm mb-4">
                        {error}
                    </div>
                )}

                <FormSection title="1. Identitas & Penomoran Surat" description="Nomor agenda penerimaan dan tanggal surat asli">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="incoming_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nomor Agenda (Masuk) <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="incoming_number" name="incoming_number" required placeholder="Contoh: 001/AGENDA/2026" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="original_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nomor Surat Asli <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="original_number" name="original_number" required placeholder="Nomor tertera pada surat fisik" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="original_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Tanggal Surat Asli <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="original_date" name="original_date" type="date" required className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="received_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Tanggal Diterima <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="received_date" name="received_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="2. Isi & Berkas Surat" description="Keterangan pengirim, hal/perihal, dan lampiran dokumen scan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="sender" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Instansi / Pengirim <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="sender" name="sender" required placeholder="Nama instansi, kementerian, atau perorangan pengirim" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="subject" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Perihal / Judul Surat <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="subject" name="subject" required placeholder="Perihal atau ringkasan isi surat..." className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kategori Surat
                            </Label>
                            <Input id="category" name="category" placeholder="Contoh: Undangan, Edaran, Pemberitahuan" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="classification" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Klasifikasi Sifat
                            </Label>
                            <Input id="classification" name="classification" placeholder="Biasa / Penting / Rahasia / Segera" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="attachment_count" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Jumlah Berkas Lampiran
                            </Label>
                            <Input id="attachment_count" name="attachment_count" type="number" min="0" defaultValue="0" required className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="file" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Unggah File Scan (PDF / Gambar)
                            </Label>
                            <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-xs file:mr-3 file:py-1 file:px-2 file:rounded-none file:border-0 file:bg-neutral-900 file:text-white" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="notes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Catatan Tambahan (Opsional)
                            </Label>
                            <Textarea id="notes" name="notes" placeholder="Catatan khusus atau disposisi awal..." rows={2} className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                    </div>
                </FormSection>
            </FormCard>
        </AdminLayout>
    );
}
