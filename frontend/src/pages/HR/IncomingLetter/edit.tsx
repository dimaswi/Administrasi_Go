import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getApiUrl } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { Mail, Loader2 } from 'lucide-react';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function IncomingLetterEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [letter, setLetter] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get(`/incoming-letters/${id}`).then(res => setLetter(res.data.data || res.data));
    }, [id]);

    if (!letter) {
        return (
            <AdminLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data surat masuk...
                </div>
            </AdminLayout>
        );
    }

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

            const res = await fetch(getApiUrl(`/api/incoming-letters/${id}`), {
                method: 'PUT',
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
                title={`Edit Surat Masuk: ${letter.incoming_number}`}
                subtitle="Perbarui data agenda, pengirim, perihal, atau lampiran surat masuk"
                icon={Mail}
                onBack={() => navigate('/admin/incoming-letters')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Perubahan"
                cancelText="Batal"
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
                            <Input id="incoming_number" name="incoming_number" required placeholder="Contoh: 001/AGENDA/2026" defaultValue={letter.incoming_number} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="original_number" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nomor Surat Asli <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="original_number" name="original_number" required placeholder="Nomor tertera pada surat fisik" defaultValue={letter.original_number} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="original_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Tanggal Surat Asli <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="original_date" name="original_date" type="date" required defaultValue={letter.original_date ? letter.original_date.substring(0, 10) : ''} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="received_date" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Tanggal Diterima <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="received_date" name="received_date" type="date" required defaultValue={letter.received_date ? letter.received_date.substring(0, 10) : ''} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="2. Isi & Berkas Surat" description="Keterangan pengirim, hal/perihal, dan lampiran dokumen scan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="sender" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Pengirim <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="sender" name="sender" required placeholder="Instansi / Nama Pengirim" defaultValue={letter.sender} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="subject" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Perihal / Hal <span className="text-rose-500">*</span>
                            </Label>
                            <Input id="subject" name="subject" required placeholder="Tentang apa surat ini" defaultValue={letter.subject} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kategori
                            </Label>
                            <Input id="category" name="category" placeholder="Contoh: Undangan, Edaran, dll" defaultValue={letter.category} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="classification" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Klasifikasi
                            </Label>
                            <Input id="classification" name="classification" placeholder="Biasa / Penting / Rahasia" defaultValue={letter.classification} className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="attachment_count" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Jumlah Lampiran
                            </Label>
                            <Input id="attachment_count" name="attachment_count" type="number" min="0" defaultValue={letter.attachment_count || 0} required className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="file" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                File Scan Surat (PDF)
                            </Label>
                            <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Format PDF/JPG, maks 10MB.</p>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="notes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Catatan Tambahan
                            </Label>
                            <Textarea id="notes" name="notes" placeholder="Catatan opsional..." rows={3} defaultValue={letter.notes} className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm" />
                        </div>
                    </div>
                </FormSection>
            </FormCard>
        </AdminLayout>
    );
}
