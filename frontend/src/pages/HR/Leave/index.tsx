import { useState, useEffect } from 'react';
import HrLayout from '@/layouts/hr-layout';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { IndexPage } from '@/components/ui/index-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
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
  
  // Action Modal State
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

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

  useEffect(() => {
    fetchLeaves();
  }, [searchParams]);

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
        title="Pemantauan Cuti"
        description="Monitor dan kelola pengajuan cuti karyawan"
        actions={[]}
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

      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tinjau Pengajuan Cuti</DialogTitle>
            <DialogDescription>
              Detail pengajuan cuti oleh karyawan.
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
                    Setujui
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="outline" onClick={() => setActionModalOpen(false)}>Tutup</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrLayout>
  );
}
