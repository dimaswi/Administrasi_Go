import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            <div className="w-full space-y-6 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold leading-tight flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-amber-500" />
                                Atur Hak Akses: {role?.name || '...'}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Tentukan fitur apa saja yang dapat diakses oleh role ini
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={loading || saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(groupedPermissions).map(([module, perms]) => {
                            const isAllSelected = perms.every(p => assignedIds.has(p.id));

                            return (
                                <Card key={module} className="shadow-sm">
                                    <CardHeader className="p-4 pb-2 border-b">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base font-semibold capitalize">{module.replace(/_/g, ' ')}</CardTitle>
                                                <CardDescription className="text-xs">{perms.length} hak akses</CardDescription>
                                            </div>
                                            <Switch 
                                                checked={isAllSelected}
                                                onCheckedChange={(checked) => handleSelectAllModule(module, checked)}
                                                className="data-[state=checked]:bg-amber-500"
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="flex flex-col divide-y">
                                            {perms.map(perm => (
                                                <div 
                                                    key={perm.id} 
                                                    className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                                    onClick={() => handleToggle(perm.id)}
                                                >
                                                    <div className="flex-1 pr-4">
                                                        <p className="text-sm font-medium">{perm.display_name}</p>
                                                        {perm.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                                                        )}
                                                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">{perm.name}</p>
                                                    </div>
                                                    <Switch 
                                                        checked={assignedIds.has(perm.id)}
                                                        onCheckedChange={() => handleToggle(perm.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </HrLayout>
    );
}
