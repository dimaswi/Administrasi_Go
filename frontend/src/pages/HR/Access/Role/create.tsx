import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield } from 'lucide-react';
import api from '@/lib/api';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function RoleCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/roles', formData);
            navigate('/hr/access/roles');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Role Baru"
                subtitle="Definisikan kelompok peran dan hak otorisasi pengguna dalam sistem"
                icon={Shield}
                onBack={() => navigate('/hr/access/roles')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Role"
                onCancel={() => navigate('/hr/access/roles')}
            >
                <FormSection title="1. Identitas Role" description="Nama pengenal unik dan keterangan tujuan peran">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Role <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: hr_manager, staff, admin"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Deskripsi Peran
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Keterangan cakupan dan tanggung jawab hak akses role ini..."
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
