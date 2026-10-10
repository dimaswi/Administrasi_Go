import { useState, useEffect } from 'react';
import HrLayout from '@/layouts/hr-layout';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Eye, CheckCircle, XCircle, FileText, Plus, CalendarPlus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Leave {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type_id: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  delegation_to?: number;
  delegation_to_name?: string;
  status: string;
  created_at: string;
}

export default function LeaveMonitoring() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Master data for select
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const [filterValues, setFilterValues] = useState({
    search: searchParams.get('search') || '',
  });
  
  // Action Modal State (Review)
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Create Modal State (Catat Izin / Cuti)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: new Date().toLocaleDateString('en-CA'),
    end_date: new Date().toLocaleDateString('en-CA'),
    reason: '',
    delegation_to: '',
    status: 'approved', // Admin default langsung disetujui (ACC)
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const page = searchParams.get('page') || '1';
      const perPage = searchParams.get('perPage') || '10';
      const search = searchParams.get('search') || '';

      const res = await api.get(`/leaves?page=${page}&perPage=${perPage}&search=${search}`);
      const raw = res.data;
      const list = raw?.data ?? (Array.isArray(raw) ? raw : []);
      setLeaves(list);
      
      const meta = raw?.meta || raw;
      if (meta && typeof meta.total !== 'undefined') {
        setPagination({
          current_page: meta.current_page || 1,
          last_page: meta.last_page || 1,
          per_page: meta.per_page || 10,
          total: meta.total ?? list.length,
          from: meta.from ?? 1,
          to: meta.to ?? list.length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [empRes, ltRes] = await Promise.all([
        api.get('/employees?perPage=500'),
        api.get('/leave-types'),
      ]);
      const empList = empRes.data?.data || empRes.data || [];
      const ltList = ltRes.data?.data || ltRes.data || [];
      setEmployees(Array.isArray(empList) ? empList : []);
      setLeaveTypes(Array.isArray(ltList) ? ltList : []);
    } catch (e) {
      console.error("Failed to load master data", e);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [searchParams]);

  useEffect(() => {
    fetchMasterData();
  }, []);

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

  const handleAction = async (status: 'approved' | 'rejected', targetLeave?: Leave) => {
    const leaveToAct = targetLeave || selectedLeave;
    if (!leaveToAct) return;
    setProcessing(true);
    try {
      await api.put(`/leaves/${leaveToAct.id}/status`, {
        status: status,
        approval_notes: approvalNotes || (status === 'approved' ? 'Disetujui oleh HR' : 'Ditolak oleh HR')
      });
      toast.success(`Cuti berhasil ${status === 'approved' ? 'disetujui (ACC)' : 'ditolak'}`);
      setActionModalOpen(false);
      fetchLeaves();
    } catch (error) {
      toast.error("Gagal memperbarui status cuti");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.employee_id) {
      toast.error("Pilih karyawan terlebih dahulu.");
      return;
    }
    if (!createForm.leave_type_id) {
      toast.error("Pilih jenis cuti / izin terlebih dahulu.");
      return;
    }
    if (!createForm.reason.trim()) {
      toast.error("Alasan cuti / izin wajib diisi.");
      return;
    }

    const start = new Date(createForm.start_date);
    const end = new Date(createForm.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setCreateSubmitting(true);
    try {
      await api.post('/leaves', {
        employee_id: parseInt(createForm.employee_id),
        leave_type_id: parseInt(createForm.leave_type_id),
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        total_days: totalDays > 0 ? totalDays : 1,
        reason: createForm.reason.trim(),
        delegation_to: createForm.delegation_to ? parseInt(createForm.delegation_to) : null,
        status: createForm.status || 'approved',
      });

      toast.success("Data Cuti / Izin berhasil dicatat!");
      setCreateModalOpen(false);
      setCreateForm({
        employee_id: '',
        leave_type_id: '',
        start_date: new Date().toLocaleDateString('en-CA'),
        end_date: new Date().toLocaleDateString('en-CA'),
        reason: '',
        delegation_to: '',
        status: 'approved',
      });
      fetchLeaves();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Gagal mencatat cuti / izin.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Disetujui (ACC)</Badge>;
      case 'rejected': return <Badge variant="destructive">Ditolak</Badge>;
      case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white animate-pulse">Menunggu ACC</Badge>;
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'cancelled': return <Badge variant="secondary">Dibatalkan</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'employee',
      label: 'Karyawan',
      render: (leave: Leave) => (
        <div>
          <div className="font-semibold text-foreground">{leave.employee_name || `Karyawan #${leave.employee_id}`}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={leave.reason}>
            {leave.reason}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Jenis Cuti / Izin',
      render: (leave: Leave) => (
        <span className="font-medium text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
          {leave.leave_type_name || 'Cuti Tahunan'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Tanggal',
      render: (leave: Leave) => {
        try {
          const s = leave.start_date ? format(new Date(leave.start_date), 'dd MMM yyyy') : '-';
          const e = leave.end_date ? format(new Date(leave.end_date), 'dd MMM yyyy') : '-';
          return (
            <div>
              <div className="text-xs font-medium">{s}</div>
              <div className="text-xs text-muted-foreground">s/d {e}</div>
            </div>
          );
        } catch {
          return `${leave.start_date} - ${leave.end_date}`;
        }
      },
    },
    {
      key: 'total',
      label: 'Durasi',
      render: (leave: Leave) => <span className="font-semibold">{leave.total_days} Hari</span>,
    },
    {
      key: 'delegation',
      label: 'Karyawan Pengganti',
      render: (leave: Leave) => leave.delegation_to_name ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          👤 {leave.delegation_to_name}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground italic">-</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (leave: Leave) => getStatusBadge(leave.status),
    },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'w-[160px] text-right',
      render: (leave: Leave) => (
        <div className="flex items-center justify-end gap-1.5">
          {leave.status?.toLowerCase() === 'pending' && (
            <>
              <Button 
                size="sm"
                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={() => handleAction('approved', leave)}
                title="Langsung ACC / Setujui Cuti"
                disabled={processing}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                ACC
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            size="icon"
            className="h-7 w-7 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
            onClick={() => {
              setSelectedLeave(leave);
              setApprovalNotes('');
              setActionModalOpen(true);
            }}
            title="Tinjau Detail Cuti"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <HrLayout>
      <IndexPage
        title="Izin & Cuti Karyawan"
        description="Monitor dan kelola permohonan cuti, izin sakit, izin khusus, dan libur karyawan"
        actions={[
          {
            label: 'Catat Izin / Cuti',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }
        ]}
        data={leaves}
        columns={columns}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        searchValue={filterValues.search}
        searchPlaceholder="Cari karyawan atau alasan..."
        onSearchChange={(val: string) => handleFilterChange('search', val)}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        emptyMessage="Tidak ada data pengajuan cuti ditemukan"
        emptyIcon={FileText}
        isLoading={loading}
      />

      {/* Modal 1: Review / ACC Detail Cuti */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tinjau Pengajuan Cuti / Izin</DialogTitle>
            <DialogDescription>
              Detail permohonan cuti atau izin oleh karyawan.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLeave && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-4">
                <div className="font-medium text-muted-foreground">Karyawan</div>
                <div className="col-span-2 font-medium">{selectedLeave.employee_name}</div>
                
                <div className="font-medium text-muted-foreground mt-2">Jenis Cuti</div>
                <div className="col-span-2 mt-2">{selectedLeave.leave_type_name || 'Cuti Tahunan'}</div>
                
                <div className="font-medium text-muted-foreground mt-2">Tanggal</div>
                <div className="col-span-2 mt-2">
                  {format(new Date(selectedLeave.start_date), 'dd MMM yyyy')} s/d {format(new Date(selectedLeave.end_date), 'dd MMM yyyy')} 
                  <span className="text-muted-foreground ml-1">({selectedLeave.total_days} hari)</span>
                </div>
                
                <div className="font-medium text-muted-foreground mt-2">Alasan</div>
                <div className="col-span-2 mt-2 italic">{selectedLeave.reason}</div>

                <div className="font-medium text-muted-foreground mt-2">Karyawan Pengganti</div>
                <div className="col-span-2 mt-2 font-medium text-amber-700 dark:text-amber-400">
                  {selectedLeave.delegation_to_name ? `👤 ${selectedLeave.delegation_to_name}` : '-'}
                </div>
              </div>

              {selectedLeave.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Catatan Persetujuan (Opsional)</Label>
                  <Input 
                    placeholder="Masukkan catatan jika ada..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className={selectedLeave?.status === 'pending' ? 'justify-between' : 'justify-end'}>
            {selectedLeave?.status === 'pending' ? (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleAction('rejected')}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActionModalOpen(false)}>Batal</Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700" 
                    onClick={() => handleAction('approved')}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui (ACC)
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="outline" onClick={() => setActionModalOpen(false)}>Tutup</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Form Catat Cuti / Izin oleh Admin HR */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700">
              <CalendarPlus className="w-5 h-5 text-teal-600" /> Catat Izin & Cuti Karyawan
            </DialogTitle>
            <DialogDescription>
              Input dan catat data cuti atau izin karyawan terintegrasi dengan Master Cuti.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Karyawan *</Label>
              <SearchableSelect
                options={employees.map((e) => ({
                  value: String(e.id),
                  label: `${e.first_name} ${e.last_name || ''}`.trim(),
                }))}
                value={createForm.employee_id}
                onValueChange={(val) => setCreateForm({ ...createForm, employee_id: val || '' })}
                placeholder="-- Pilih Karyawan --"
                searchPlaceholder="Cari nama karyawan..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Jenis Cuti / Izin *</Label>
              <SearchableSelect
                options={leaveTypes.map((lt) => ({
                  value: String(lt.id),
                  label: `${lt.name} (Kode: ${lt.code || '-'}${lt.default_quota > 0 ? `, Kuota: ${lt.default_quota} Hari` : ''})`,
                }))}
                value={createForm.leave_type_id}
                onValueChange={(val) => setCreateForm({ ...createForm, leave_type_id: val || '' })}
                placeholder="-- Pilih Jenis Cuti / Izin --"
                searchPlaceholder="Cari jenis cuti atau izin..."
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Tanggal Selesai *</Label>
                <Input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Alasan / Keterangan *</Label>
              <Textarea
                placeholder="Tuliskan keterangan keperluan cuti/izin..."
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                className="text-xs min-h-[60px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Karyawan Pengganti (Opsional)</Label>
                <SearchableSelect
                  options={employees
                    .filter((e) => String(e.id) !== createForm.employee_id)
                    .map((e) => ({
                      value: String(e.id),
                      label: `${e.first_name} ${e.last_name || ''}`.trim(),
                    }))}
                  value={createForm.delegation_to}
                  onValueChange={(val) => setCreateForm({ ...createForm, delegation_to: val || '' })}
                  placeholder="-- Pilih Rekan --"
                  searchPlaceholder="Cari rekan..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Status Persetujuan</Label>
                <SearchableSelect
                  options={[
                    { value: 'approved', label: 'Langsung Disetujui (ACC)' },
                    { value: 'pending', label: 'Menunggu ACC' },
                  ]}
                  value={createForm.status}
                  onValueChange={(val) => setCreateForm({ ...createForm, status: val || 'approved' })}
                  placeholder="Pilih Status..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createSubmitting || !createForm.employee_id || !createForm.leave_type_id}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4"
              >
                {createSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Simpan Data Cuti
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HrLayout>
  );
}
