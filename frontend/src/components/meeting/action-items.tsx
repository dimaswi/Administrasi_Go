import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';

interface ActionItem {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    deadline?: string;
}

export function ActionItems({ meetingId, canEdit = true }: { meetingId: string | number, canEdit?: boolean }) {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemTitle, setNewItemTitle] = useState('');

    useEffect(() => {
        fetchItems();
    }, [meetingId]);

    const fetchItems = async () => {
        try {
            const res = await api.get(`/meetings/${meetingId}/action-items`);
            setItems(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newItemTitle.trim()) return;
        try {
            const res = await api.post(`/meetings/${meetingId}/action-items`, {
                title: newItemTitle,
                status: 'todo',
                priority: 'medium'
            });
            setItems([...items, res.data]);
            setNewItemTitle('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        
        try {
            // Optimistic update
            setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));
            await api.put(`/meetings/${meetingId}/action-items/${id}`, { ...item, status: newStatus });
        } catch (error) {
            console.error(error);
            // Revert on error
            fetchItems();
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setItems(items.filter(i => i.id !== id));
            await api.delete(`/meetings/${meetingId}/action-items/${id}`);
        } catch (error) {
            console.error(error);
            fetchItems();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-6 text-neutral-400 font-mono text-xs">
                <Loader2 className="size-4 animate-spin mr-2" /> Memuat action items...
            </div>
        );
    }

    const todoItems = items.filter(i => i.status === 'todo');
    const inProgressItems = items.filter(i => i.status === 'in_progress');
    const doneItems = items.filter(i => i.status === 'completed');

    const Column = ({ title, colItems }: { title: string, colItems: ActionItem[] }) => (
        <div className="flex-1 min-w-[240px] bg-neutral-50/50 dark:bg-neutral-900/30 rounded-none border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-200 dark:border-neutral-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-800 dark:text-neutral-200">{title}</h4>
                    <Badge variant="outline" className="rounded-none font-mono text-[10px] px-1.5 py-0 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">{colItems.length}</Badge>
                </div>
                <div className="space-y-2">
                    {colItems.map(item => (
                        <div key={item.id} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2.5 rounded-none shadow-none text-xs">
                            <p className="font-medium text-neutral-900 dark:text-white leading-snug">{item.title}</p>
                            {canEdit && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-900">
                                    <div className="flex gap-1">
                                        {item.status !== 'todo' && (
                                            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none text-neutral-500 hover:text-neutral-900 dark:hover:text-white" onClick={() => handleStatusChange(item.id, item.status === 'completed' ? 'in_progress' : 'todo')} title="Kembalikan">
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                        )}
                                        {item.status !== 'completed' && (
                                            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none text-neutral-500 hover:text-neutral-900 dark:hover:text-white" onClick={() => handleStatusChange(item.id, item.status === 'todo' ? 'in_progress' : 'completed')} title="Majukan">
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={() => handleDelete(item.id)} title="Hapus">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {colItems.length === 0 && (
                        <div className="text-center py-4 text-[11px] font-mono text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-none bg-white/40 dark:bg-neutral-950/40">
                            Tidak ada tugas
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {canEdit && (
                <div className="flex gap-2 max-w-md">
                    <Input 
                        placeholder="Ketik tugas / tindak lanjut baru..." 
                        value={newItemTitle} 
                        onChange={e => setNewItemTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        className="h-8 rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none text-xs"
                    />
                    <Button onClick={handleCreate} className="h-8 px-3 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold shadow-none shrink-0 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah</span>
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Column title="To Do" colItems={todoItems} />
                <Column title="In Progress" colItems={inProgressItems} />
                <Column title="Done" colItems={doneItems} />
            </div>
        </div>
    );
}
