import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FormCard, FormSection } from '@/components/ui/form-card';

export default function UserCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        nip: '',
        password: '',
        role_id: 0
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const roleRes = await api.get('/roles');
                setRoles(roleRes.data.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchOptions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users', formData);
            navigate('/hr/access/users');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HrLayout>
            <FormCard
                title="Tambah Pengguna Baru"
                subtitle="Daftarkan akun user login dan atur hak akses role di sistem"
                icon={Users}
                onBack={() => navigate('/hr/access/users')}
                onSubmit={handleSubmit}
                loading={loading}
                submitText="Simpan Pengguna"
                onCancel={() => navigate('/hr/access/users')}
            >
                <FormSection title="1. Akun & Kredensial" description="Informasi identitas akun pegawai dan hak akses sistem">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Nama Lengkap <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Budi Santoso, S.Kom"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="nip" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                NIP / NIK <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="nip"
                                required
                                value={formData.nip}
                                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                                placeholder="Nomor Induk Pegawai"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Kata Sandi <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimal 6 karakter"
                                className="h-9 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="role_id" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                Role Hak Akses <span className="text-rose-500">*</span>
                            </Label>
                            <SearchableSelect
                                options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                                value={formData.role_id ? String(formData.role_id) : ""}
                                onValueChange={(val) => setFormData({ ...formData, role_id: Number(val) })}
                                placeholder="Pilih Role Pengguna"
                            />
                        </div>
                    </div>
                </FormSection>
            </FormCard>
        </HrLayout>
    );
}
