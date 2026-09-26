import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Users, Building2, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import api from '@/lib/api';

export default function OrganizationChart() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [units, setUnits] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    // UI States
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editForm, setEditForm] = useState({ head_id: '' });
    const [assignEmployeeId, setAssignEmployeeId] = useState('');
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    
    // Custom Dialog State for Alerts & Confirms
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm?: () => void;
    }>({ open: false, title: '', message: '', type: 'alert' });

    const showAlert = (title: string, message: string) => {
        setDialogState({ open: true, title, message, type: 'alert' });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setDialogState({ open: true, title, message, type: 'confirm', onConfirm });
    };

    const [scale, setScale] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resOrg, resEmp] = await Promise.all([
                api.get('/org-units?perPage=1000'),
                api.get('/employees?perPage=1000')
            ]);
            setUnits(resOrg.data?.data || []);
            setEmployees(resEmp.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Build Tree Map
    const treeMap: Record<number, any[]> = {};
    const rootNodes: any[] = [];

    units.forEach(unit => {
        if (!unit.parent_id) {
            rootNodes.push(unit);
        } else {
            if (!treeMap[unit.parent_id]) treeMap[unit.parent_id] = [];
            treeMap[unit.parent_id].push(unit);
        }
    });

    const handleSelectUnit = (unit: any) => {
        setSelectedUnit(unit);
        setEditForm({ head_id: unit.head_id ? unit.head_id.toString() : '' });
        setIsDrawerOpen(true);
    };

    const handleSaveUnit = async () => {
        if (!selectedUnit) return;
        setSaving(true);
        try {
            await api.put(`/org-units/${selectedUnit.id}`, {
                ...selectedUnit,
                head_id: editForm.head_id ? parseInt(editForm.head_id) : null
            });
            await fetchData(); // Refresh data

            setSelectedUnit({
                ...selectedUnit,
                head_id: editForm.head_id ? parseInt(editForm.head_id) : null
            });

            setIsDrawerOpen(false);
        } catch (error: any) {
            console.error('Save failed', error);
            const msg = error.response?.data?.error || 'Gagal menyimpan perubahan';
            showAlert('Peringatan', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleAssignEmployee = async () => {
        if (!selectedUnit || !assignEmployeeId) return;
        setAssigning(true);
        try {
            // Find the full employee object from state
            const empToAssign = employees.find(e => e.id.toString() === assignEmployeeId);
            if (empToAssign) {
                await api.put(`/employees/${empToAssign.id}`, {
                    ...empToAssign,
                    organization_unit_id: selectedUnit.id
                });
                
                // Refresh data to show updated member list
                await fetchData();
                setAssignEmployeeId('');
            }
        } catch (error) {
            console.error('Assign failed', error);
            showAlert('Peringatan', 'Gagal memindahkan karyawan ke unit ini');
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassignEmployee = (employeeId: number) => {
        showConfirm('Konfirmasi', 'Keluarkan karyawan ini dari unit?', async () => {
            setAssigning(true);
            try {
                const empToUnassign = employees.find(e => e.id === employeeId);
                if (empToUnassign) {
                    await api.put(`/employees/${empToUnassign.id}`, {
                        ...empToUnassign,
                        organization_unit_id: null
                    });
                    await fetchData();
                }
            } catch (error) {
                console.error('Unassign failed', error);
                showAlert('Peringatan', 'Gagal mengeluarkan karyawan');
            } finally {
                setAssigning(false);
            }
        });
    };

    const OrgNode = ({ node }: { node: any }) => {
        const children = treeMap[node.id] || [];
        const nodeEmployees = employees.filter(e => e.organization_unit_id === node.id);
        const head = employees.find(e => e.user_id === node.head_id);

        return (
            <div className="flex flex-col items-center">
                {/* Node Box */}
                <div
                    className="z-10 bg-white border-2 border-slate-200 rounded-xl p-4 w-64 shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all group relative"
                    onClick={() => handleSelectUnit(node)}
                >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="secondary" className="bg-slate-100 text-xs text-slate-600 border shadow-sm">Level {node.level}</Badge>
                    </div>

                    <h4 className="font-bold text-center text-slate-800 mt-2">{node.name}</h4>
                    <p className="text-[11px] font-mono text-muted-foreground text-center mt-1">{node.code}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 text-sm">
                        <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Kepala</span>
                                <span className="text-xs font-medium">
                                    {head ? `${head.first_name} ${head.last_name || ''}` : <span className="text-muted-foreground italic">Belum ditentukan</span>}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 rounded-md p-1.5 mt-1 border">
                            <Users className="h-3.5 w-3.5" />
                            <span>{nodeEmployees.length} Karyawan</span>
                        </div>
                    </div>
                </div>

                {/* Children */}
                {children.length > 0 && (
                    <div className="flex flex-col items-center mt-0">
                        {/* Vertical line dropping from this node */}
                        <div className="w-px h-6 bg-slate-300"></div>

                        {/* Children Container */}
                        <div className="flex justify-center">
                            {children.map((child, idx) => {
                                const isFirst = idx === 0;
                                const isLast = idx === children.length - 1;
                                const isOnly = children.length === 1;

                                return (
                                    <div key={child.id} className="relative flex flex-col items-center px-4">
                                        {/* Horizontal connection lines */}
                                        {!isOnly && (
                                            <>
                                                <div className={`absolute top-0 left-0 w-1/2 h-px ${isFirst ? 'bg-transparent' : 'bg-slate-300'}`}></div>
                                                <div className={`absolute top-0 right-0 w-1/2 h-px ${isLast ? 'bg-transparent' : 'bg-slate-300'}`}></div>
                                            </>
                                        )}
                                        {/* Vertical drop to child */}
                                        <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-300 -translate-x-1/2"></div>

                                        <div className="mt-6">
                                            <OrgNode node={child} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <HrLayout>
            <div className="w-full flex flex-col h-[calc(100vh-80px)] relative">
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-50 flex gap-2 bg-white/80 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(s + 0.1, 2))} title="Zoom In">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setScale(1)}>
                        {Math.round(scale * 100)}%
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(s - 0.1, 0.3))} title="Zoom Out">
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                </div>

                {/* Chart Container */}
                <Card className="flex-1 overflow-hidden flex flex-col shadow-sm border-slate-200 rounded-none border-0">
                    <CardContent className="p-0 flex-1 overflow-auto bg-[#f8fafc] relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Memuat struktur...</div>
                        ) : rootNodes.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Belum ada Unit Organisasi (Root).</div>
                        ) : (
                            <div
                                className="min-w-max p-12 flex justify-center pb-32"
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-out'
                                }}
                            >
                                <div className="flex gap-16">
                                    {rootNodes.map(root => (
                                        <OrgNode key={root.id} node={root} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Edit Node */}
            <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Kelola Unit: {selectedUnit?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Atur kepengurusan dan anggota untuk unit ini.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUnit && (
                        <div className="py-4 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Penugasan Kepala Unit</Label>
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <SearchableSelect
                                        value={editForm.head_id}
                                        onValueChange={(val) => setEditForm({ head_id: val })}
                                        placeholder="Pilih Kepala Unit..."
                                        options={[
                                            { value: '', label: '-- Kosongkan --' },
                                            ...employees.filter(e => e.user_id).map(e => ({
                                                value: e.user_id.toString(),
                                                label: `${e.first_name} ${e.last_name || ''} - ${e.position || 'No Position'}`
                                            }))
                                        ]}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Hanya karyawan yang memiliki akun (User ID) yang bisa menjadi Kepala Unit.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Karyawan di Unit Ini</Label>
                                    <Badge variant="outline">{employees.filter(e => e.organization_unit_id === selectedUnit.id).length} Orang</Badge>
                                </div>
                                <div className="bg-white border rounded-lg max-h-48 overflow-y-auto">
                                    {employees.filter(e => e.organization_unit_id === selectedUnit.id).length > 0 ? (
                                        <div className="divide-y">
                                            {employees.filter(e => e.organization_unit_id === selectedUnit.id).map(e => (
                                                <div key={e.id} className="p-3 text-sm flex items-center justify-between hover:bg-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600 text-xs">
                                                            {e.first_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{e.first_name} {e.last_name}</div>
                                                            <div className="text-xs text-muted-foreground">{e.position || 'Staff'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate(`/hr/employees/${e.id}/edit`)}>
                                                            Lihat
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleUnassignEmployee(e.id)}>
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground italic">
                                            Belum ada karyawan di unit ini.
                                        </div>
                                    )}
                                </div>
                                
                                {/* Assign Employee Form */}
                                <div className="mt-4 p-3 bg-slate-50 border rounded-lg flex flex-col gap-2">
                                    <Label className="text-sm font-semibold">Tambah Anggota Unit</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                value={assignEmployeeId}
                                                onValueChange={setAssignEmployeeId}
                                                placeholder="Pilih karyawan dari luar unit..."
                                                options={employees
                                                    .filter(e => e.organization_unit_id !== selectedUnit.id)
                                                    .map(e => ({
                                                        value: e.id.toString(),
                                                        label: `${e.first_name} ${e.last_name || ''} - ${e.position || 'No Position'}`
                                                    }))}
                                            />
                                        </div>
                                        <Button 
                                            size="sm" 
                                            disabled={!assignEmployeeId || assigning}
                                            onClick={handleAssignEmployee}
                                        >
                                            {assigning ? '...' : 'Tambah'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveUnit} disabled={saving}>
                            {saving ? 'Menyimpan...' : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert / Confirm Dialog */}
            <Dialog open={dialogState.open} onOpenChange={(open) => !open && setDialogState(prev => ({ ...prev, open: false }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{dialogState.title}</DialogTitle>
                        <DialogDescription>
                            {dialogState.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        {dialogState.type === 'confirm' && (
                            <Button variant="outline" onClick={() => setDialogState(prev => ({ ...prev, open: false }))}>
                                Batal
                            </Button>
                        )}
                        <Button 
                            variant={dialogState.type === 'confirm' ? 'default' : 'secondary'}
                            onClick={() => {
                                setDialogState(prev => ({ ...prev, open: false }));
                                if (dialogState.type === 'confirm' && dialogState.onConfirm) {
                                    dialogState.onConfirm();
                                }
                            }}
                        >
                            {dialogState.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}
