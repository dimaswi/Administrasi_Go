import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndexPage } from '@/components/ui/index-page';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/SearchableSelect';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Users, Key } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import api from '@/lib/api';

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name?: string;
    gender: string;
    status: string;
    email?: string;
    phone?: string;
    user_id?: number | null;
}

export default function EmployeeIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // State
    const [data, setData] = useState<Employee[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    const [loading, setLoading] = useState(true);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    // Account Modal
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [selectedEmployeeForAccount, setSelectedEmployeeForAccount] = useState<Employee | null>(null);
    const [accountPassword, setAccountPassword] = useState("");
    const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
    const [accountRoleId, setAccountRoleId] = useState<number>(2); // Default to 'user' or 'pegawai'
    const [accountSubmitting, setAccountSubmitting] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [accountLinkMode, setAccountLinkMode] = useState<"new"|"link">("new");
    const [selectedUserIdToLink, setSelectedUserIdToLink] = useState("");

    // Check Role
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // JWT base64url might need padding before atob
                let base64Url = token.split('.')[1];
                let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                console.log("Decoded Token:", decoded); // debug log

                // role_id 1 (administrator) or 7 (admin)
                if (Number(decoded.role_id) === 1 || Number(decoded.role_id) === 7) {
                    setIsAdmin(true);
                } else {
                    console.log("Bukan admin, role_id:", decoded.role_id);
                }
            } catch (e) {
                console.error("Gagal parse JWT:", e);
            }
        }
        fetchData();
        fetchRoles();
        fetchUsers();
    }, [searchParams]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch roles", e);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?perPage=1000');
            setUsers(res.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    const [filterValues, setFilterValues] = useState({
        search: searchParams.get('search') || '',
    });



    const fetchData = async () => {
        setLoading(true);
        try {
            const page = searchParams.get('page') || '1';
            const perPage = searchParams.get('perPage') || '10';
            const search = searchParams.get('search') || '';

            const res = await api.get(`/employees?page=${page}&perPage=${perPage}&search=${search}`);
            setData(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterSubmit = () => {
        const params = new URLSearchParams(searchParams);
        if (filterValues.search) params.set('search', filterValues.search);
        else params.delete('search');
        
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleFilterReset = () => {
        setFilterValues({ search: '' });
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    const handlePerPageChange = (perPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('perPage', perPage.toString());
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleDeleteClick = (emp: Employee) => {
        setEmployeeToDelete(emp);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (employeeToDelete) {
            // Call API delete here...
            setDeleteDialogOpen(false);
            setEmployeeToDelete(null);
            fetchData();
        }
    };

    const handleManageAccountClick = (emp: Employee) => {
        setSelectedEmployeeForAccount(emp);
        setAccountPassword("");
        setAccountPasswordConfirm("");
        setAccountLinkMode("new");
        setSelectedUserIdToLink("");
        setAccountModalOpen(true);
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeForAccount) return;

        let payload: any = {};
        if (!selectedEmployeeForAccount.user_id && accountLinkMode === "link") {
            if (!selectedUserIdToLink) {
                toast.error("Pilih user yang ingin ditautkan!");
                return;
            }
            payload = { user_id: parseInt(selectedUserIdToLink) };
        } else {
            if (accountPassword !== accountPasswordConfirm) {
                toast.error("Password dan Konfirmasi Password tidak cocok!");
                return;
            }
            payload = {
                password: accountPassword,
                role_id: accountRoleId
            };
        }

        setAccountSubmitting(true);
        try {
            await api.post(`/employees/${selectedEmployeeForAccount.id}/account`, payload);
            toast.success(
                selectedEmployeeForAccount.user_id 
                ? "Password berhasil diupdate!" 
                : (accountLinkMode === "link" ? "Akun berhasil ditautkan!" : "Akun berhasil dibuat dan disambungkan!")
            );
            setAccountModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Gagal mengelola akun");
        } finally {
            setAccountSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'employee_id',
            label: 'NIP',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                <span className="font-mono text-sm">{emp.employee_id}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nama Pegawai',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                        {emp.first_name.charAt(0)}{emp.last_name ? emp.last_name.charAt(0) : ''}
                    </div>
                    <div className="ml-3">
                        <div className="font-medium text-sm">{emp.first_name} {emp.last_name || ''}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'Kontak',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                <div>
                    <div className="text-sm">{emp.email || '-'}</div>
                    <div className="text-xs text-muted-foreground">{emp.phone || '-'}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-[200px]',
            render: (emp: Employee) => (
                emp.status === 'active' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {emp.status}
                    </Badge>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[150px] text-right',
            render: (emp: Employee) => (
                <div className="flex items-center justify-end gap-2">
                    {isAdmin && (
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-amber-500 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleManageAccountClick(emp)}
                            title={emp.user_id ? "Ubah Password Akun" : "Buat Akun"}
                        >
                            <Key className="h-4 w-4" />
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => navigate(`/hr/employees/${emp.id}`)}
                        title="Lihat Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteClick(emp)}
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <HrLayout>
            <IndexPage
                title="Pegawai"
                description="Kelola data pegawai"
                actions={[
                    {
                        label: 'Tambah Pegawai',
                        href: '/hr/employees/create',
                        icon: Plus,
                    },
                ]}
                data={data}
                columns={columns}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchValue={filterValues.search}
                searchPlaceholder="Cari NIP, nama..."
                onSearchChange={(val: string) => handleFilterChange('search', val)}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                emptyMessage="Belum ada data pegawai"
                emptyIcon={Users}
                isLoading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Pegawai</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data pegawai ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    {employeeToDelete && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">{employeeToDelete.first_name} {employeeToDelete.last_name}</p>
                                <p className="text-sm text-muted-foreground">NIP: {employeeToDelete.employee_id}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setEmployeeToDelete(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account Manager Dialog */}
            <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEmployeeForAccount?.user_id ? "Ubah Password Akun" : "Buat Akun Baru"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEmployeeForAccount?.user_id 
                                ? "Karyawan ini sudah memiliki akun. Anda dapat mereset passwordnya di sini." 
                                : "Buat akun untuk karyawan ini. NIP akan digunakan sebagai username default."}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedEmployeeForAccount && (
                        <form onSubmit={handleAccountSubmit} className="space-y-4 py-4">
                            {!selectedEmployeeForAccount.user_id && (
                                <div className="space-y-2">
                                    <Label>Pilihan Akun</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="linkMode" 
                                                checked={accountLinkMode === 'new'} 
                                                onChange={() => setAccountLinkMode('new')} 
                                            />
                                            <span className="text-sm">Buat Akun Baru</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="linkMode" 
                                                checked={accountLinkMode === 'link'} 
                                                onChange={() => setAccountLinkMode('link')} 
                                            />
                                            <span className="text-sm">Tautkan User yang Ada</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {(!selectedEmployeeForAccount.user_id && accountLinkMode === 'link') ? (
                                <div className="space-y-2">
                                    <Label>Pilih User Lama</Label>
                                    <SearchableSelect 
                                        value={selectedUserIdToLink}
                                        onValueChange={setSelectedUserIdToLink}
                                        placeholder="Cari user yang ingin ditautkan..."
                                        options={users.map(u => ({ 
                                            value: u.id.toString(), 
                                            label: `${u.name || ''} ${u.nip ? `(${u.nip})` : ''}` 
                                        }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Karyawan akan menggunakan kredensial dari User ini.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Username / NIP</Label>
                                        <Input 
                                            value={selectedEmployeeForAccount.employee_id} 
                                            readOnly 
                                            className="bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">Username tidak dapat diubah (Otomatis dari NIP)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password Baru</Label>
                                        <Input 
                                            type="password" 
                                            placeholder="Masukkan password..." 
                                            value={accountPassword}
                                            onChange={(e) => setAccountPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Konfirmasi Password</Label>
                                        <Input 
                                            type="password" 
                                            placeholder="Ulangi password..." 
                                            value={accountPasswordConfirm}
                                            onChange={(e) => setAccountPasswordConfirm(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role Akses</Label>
                                        <SearchableSelect 
                                            value={accountRoleId.toString()}
                                            onValueChange={(val) => setAccountRoleId(Number(val))}
                                            placeholder="Pilih Role..."
                                            options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                                        />
                                    </div>
                                </>
                            )}

                            <DialogFooter className="pt-4">
                                <DialogClose render={<Button type="button" variant="outline">Batal</Button>} />
                                <Button type="submit" disabled={accountSubmitting}>
                                    {accountSubmitting ? "Memproses..." : "Simpan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </HrLayout>
    );
}
