import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
}

export default function RolePermissions() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [role, setRole] = useState<Role | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch role details
            const roleRes = await api.get(`/roles/${id}`);
            setRole(roleRes.data.data);

            // Fetch all permissions
            const permRes = await api.get('/permissions');
            const allPerms: Permission[] = permRes.data.data || [];
            setPermissions(allPerms);

            // Fetch assigned permissions for this role
            const assignedRes = await api.get(`/roles/${id}/permissions`);
            const assigned: number[] = assignedRes.data.data || [];
            setAssignedIds(new Set(assigned));

        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data hak akses");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (permId: number) => {
        setAssignedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permId)) {
                newSet.delete(permId);
            } else {
                newSet.add(permId);
            }
            return newSet;
        });
    };

    const handleSelectAllModule = (module: string, selectAll: boolean) => {
        const modulePerms = permissions.filter(p => p.module === module);
        setAssignedIds(prev => {
            const newSet = new Set(prev);
            modulePerms.forEach(p => {
                if (selectAll) newSet.add(p.id);
                else newSet.delete(p.id);
            });
            return newSet;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/roles/${id}/permissions`, {
                permission_ids: Array.from(assignedIds)
            });
            toast.success("Hak akses berhasil disimpan");
            navigate('/hr/access/roles');
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan hak akses");
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, curr) => {
        const mod = curr.module || 'Lainnya';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(curr);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <HrLayout>
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none overflow-hidden flex flex-col font-sans mb-12">
                {/* Header Toolbar */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate('/hr/access/roles')} 
                            className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300 shrink-0"
                            title="Kembali"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                            <ShieldCheck className="size-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                                Atur Hak Akses: {role?.name || '...'}
                            </h1>
                            <p className="text-[11px] text-neutral-500 font-mono">
                                {assignedIds.size} permission aktif • Tentukan modul & aksi yang diizinkan untuk role ini
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={loading || saving} 
                        className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48 bg-white dark:bg-neutral-950">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent" />
                    </div>
                ) : (
                    <div className="p-4 sm:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(groupedPermissions).map(([module, perms]) => {
                                const isAllSelected = perms.every(p => assignedIds.has(p.id));

                                return (
                                    <div key={module} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                        <div className="px-3.5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">{module.replace(/_/g, ' ')}</h4>
                                                <p className="text-[11px] text-neutral-500 font-mono">{perms.length} hak akses</p>
                                            </div>
                                            <Switch 
                                                checked={isAllSelected}
                                                onCheckedChange={(checked) => handleSelectAllModule(module, checked)}
                                                className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-white"
                                            />
                                        </div>
                                        <div className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {perms.map(perm => (
                                                <div 
                                                    key={perm.id} 
                                                    className="flex items-start justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer"
                                                    onClick={() => handleToggle(perm.id)}
                                                >
                                                    <div className="flex-1 pr-3">
                                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">{perm.display_name}</p>
                                                        {perm.description && (
                                                            <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{perm.description}</p>
                                                        )}
                                                        <p className="text-[10px] font-mono text-neutral-400 mt-1">{perm.name}</p>
                                                    </div>
                                                    <Switch 
                                                        checked={assignedIds.has(perm.id)}
                                                        onCheckedChange={() => handleToggle(perm.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-white"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Toolbar */}
                <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 flex items-center justify-between gap-3 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/hr/access/roles')}
                        className="h-8 px-4 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none text-xs font-semibold"
                    >
                        Batal
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={loading || saving} 
                        className="h-8 px-4 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-none text-xs font-semibold gap-1.5"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                    </Button>
                </div>
            </div>
        </HrLayout>
    );
}
