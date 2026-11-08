import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function PermissionCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        module: '',
        action: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/permissions', formData);
            navigate('/hr/access/permissions');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Permission Baru"
                subtitle="Daftarkan token izin akses granular untuk kontrol hak otorisasi fitur"
                icon={KeyRound}
                onBack={() => navigate('/hr/access/permissions')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Permission"
                onCancel={() => navigate('/hr/access/permissions')}
            >
                <FormSection title="1. Detail Hak Akses" description="Identifikasi kode izin unik dan pengelompokan modul">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama / Kode Permission <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: hr.employee.create, leave.approve"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="module" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Modul
                                </Label>
                                <Input
                                    id="module"
                                    value={formData.module}
                                    onChange={e => setFormData({ ...formData, module: e.target.value })}
                                    placeholder="Contoh: Karyawan, Presensi"
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="action" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Aksi
                                </Label>
                                <Input
                                    id="action"
                                    value={formData.action}
                                    onChange={e => setFormData({ ...formData, action: e.target.value })}
                                    placeholder="Contoh: view, create, edit, delete"
                                    className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Deskripsi Hak Akses
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Penjelasan kegunaan hak akses ini..."
                                rows={3}
                                className="rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
