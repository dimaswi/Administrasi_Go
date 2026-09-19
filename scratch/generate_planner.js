const fs = require('fs');
const path = require('path');

const plannerCode = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HrLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RosterPlanner() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    
    // State untuk bulan/tahun terpilih (default: bulan ini)
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Asumsi Unit ID bisa didapat dari context login atau dipilih
    // Untuk demo ini, kita hardcode atau biarkan pengguna memilih jika dia admin super
    // Dalam real app, ini diambil dari authContext.user.organization_unit_id
    const unitId = 1; // Contoh: Unit ID 1

    useEffect(() => {
        fetchInitialData();
    }, [currentDate]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Ambil daftar shift
            const shiftRes = await api.get('/work-schedules');
            setShifts(shiftRes.data || []);

            // 2. Ambil user di unit tersebut. 
            // Karena tidak ada endpoint khusus users by unit, kita fetch semua lalu filter (sementara)
            const usersRes = await api.get('/hr/access/users'); // sesuaikan endpoint
            const unitUsers = (usersRes.data || []).filter((u: any) => u.organization_unit_id === unitId || true); // Dummy fallback
            setUsers(unitUsers);

            // 3. Ambil roster bulan ini
            const yearMonth = \`\${currentDate.getFullYear()}-\${String(currentDate.getMonth() + 1).padStart(2, '0')}\`;
            const rosterRes = await api.get(\`/roster-schedules/unit/\${unitId}/\${yearMonth}\`);
            setRosters(rosterRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data roster");
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const days = getDaysInMonth(currentDate);

    // DND Handlers
    const handleDragStart = (e: React.DragEvent, shiftId: number) => {
        e.dataTransfer.setData('shiftId', shiftId.toString());
    };

    const handleDrop = async (e: React.DragEvent, userId: number, dateObj: Date) => {
        e.preventDefault();
        const shiftIdStr = e.dataTransfer.getData('shiftId');
        if (!shiftIdStr) return;
        
        const shiftId = parseInt(shiftIdStr);
        const dateStr = \`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}-\${String(dateObj.getDate()).padStart(2, '0')}\`;

        // Optimistic UI update
        const newRoster = { user_id: userId, date: \`\${dateStr}T00:00:00Z\`, work_schedule_id: shiftId };
        
        setRosters(prev => {
            // Hapus yang lama di hari & user yang sama
            const filtered = prev.filter(r => !(r.user_id === userId && r.date.startsWith(dateStr)));
            if (shiftId === 0) return filtered; // 0 = Hapus/Libur
            return [...filtered, newRoster];
        });

        // API Call
        try {
            await api.post('/roster-schedules/assign', {
                user_id: userId,
                work_schedule_id: shiftId,
                date: dateStr
            });
            toast.success("Shift berhasil disimpan");
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan shift");
            fetchInitialData(); // Revert
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const getShiftForCell = (userId: number, dateObj: Date) => {
        const dateStr = \`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}-\${String(dateObj.getDate()).padStart(2, '0')}\`;
        const roster = rosters.find(r => r.user_id === userId && r.date.startsWith(dateStr));
        if (!roster) return null;
        return shifts.find(s => s.id === roster.work_schedule_id);
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
        <HrLayout>
            <div className="flex flex-col h-full bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => navigate('/hr/rosters')}><ArrowLeft className="h-4 w-4"/></Button>
                        <h1 className="text-xl font-bold">Roster Planner (Drag & Drop)</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={prevMonth}>&lt; Bulan Sebelumnya</Button>
                        <span className="font-semibold text-lg">{currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                        <Button variant="outline" onClick={nextMonth}>Bulan Selanjutnya &gt;</Button>
                    </div>
                </div>

                <div className="flex gap-4 flex-1 min-h-0">
                    {/* Sidebar Palette */}
                    <div className="w-64 bg-white border rounded-xl p-4 flex flex-col gap-3 shadow-sm shrink-0">
                        <h3 className="font-semibold border-b pb-2">Palette Shift</h3>
                        <p className="text-xs text-muted-foreground">Tarik (drag) blok shift di bawah ini dan jatuhkan (drop) ke dalam sel kalender.</p>
                        
                        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                            {/* Tombol Hapus/Libur */}
                            <div 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, 0)}
                                className="p-3 border-2 border-dashed border-red-200 bg-red-50 text-red-700 rounded-lg cursor-grab hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                                ✕ Libur / Hapus Shift
                            </div>

                            {shifts.map(shift => (
                                <div 
                                    key={shift.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, shift.id)}
                                    className="p-3 border rounded-lg bg-indigo-50 border-indigo-200 cursor-grab hover:bg-indigo-100 transition-colors shadow-sm"
                                >
                                    <div className="font-bold text-indigo-900">{shift.name}</div>
                                    <div className="text-xs text-indigo-700">{shift.clock_in_time.substring(0,5)} - {shift.clock_out_time.substring(0,5)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="flex-1 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="overflow-auto flex-1 custom-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                                        <tr>
                                            <th className="border-b border-r p-3 text-left w-48 sticky left-0 bg-slate-100 font-semibold shadow-[1px_0_0_0_#e2e8f0]">Karyawan</th>
                                            {days.map(d => (
                                                <th key={d.toISOString()} className="border-b border-r p-2 text-center min-w-[100px] text-xs">
                                                    <div className="font-bold">{d.getDate()}</div>
                                                    <div className="text-muted-foreground">{d.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr><td colSpan={days.length + 1} className="text-center p-8 text-muted-foreground">Tidak ada karyawan di unit ini.</td></tr>
                                        ) : (
                                            users.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 group">
                                                    <td className="border-b border-r p-3 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_#e2e8f0] font-medium text-sm">
                                                        {user.name}
                                                    </td>
                                                    {days.map(d => {
                                                        const shift = getShiftForCell(user.id, d);
                                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                                        return (
                                                            <td 
                                                                key={d.toISOString()} 
                                                                className={\`border-b border-r p-1 relative h-16 transition-colors \${isWeekend ? 'bg-slate-50' : ''}\`}
                                                                onDragOver={handleDragOver}
                                                                onDrop={(e) => handleDrop(e, user.id, d)}
                                                            >
                                                                {shift && (
                                                                    <div className="absolute inset-1 bg-indigo-100 border border-indigo-300 rounded p-1 flex flex-col justify-center items-center pointer-events-none overflow-hidden">
                                                                        <span className="font-bold text-[10px] text-indigo-900 text-center leading-tight">{shift.name}</span>
                                                                        <span className="text-[9px] text-indigo-700">{shift.clock_in_time.substring(0,5)}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HrLayout>
    );
}`;

fs.writeFileSync(path.join(__dirname, '../frontend/src/pages/HR/RosterSchedule/planner.tsx'), plannerCode);
console.log('Planner generated');
