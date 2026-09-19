import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ChevronRight, ChevronLeft, CalendarCheck } from 'lucide-react';
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
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    const todoItems = items.filter(i => i.status === 'todo');
    const inProgressItems = items.filter(i => i.status === 'in_progress');
    const doneItems = items.filter(i => i.status === 'completed');

    const Column = ({ title, colItems }: { title: string, colItems: ActionItem[] }) => (
        <div className="flex-1 min-w-[280px] bg-muted/30 rounded-xl border p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary">{colItems.length}</Badge>
            </div>
            <div className="space-y-3">
                {colItems.map(item => (
                    <Card key={item.id} className="shadow-sm">
                        <CardContent className="p-3">
                            <p className="font-medium text-sm mb-3">{item.title}</p>
                            {canEdit && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                    <div className="flex gap-1">
                                        {item.status !== 'todo' && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatusChange(item.id, item.status === 'completed' ? 'in_progress' : 'todo')}>
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                        )}
                                        {item.status !== 'completed' && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatusChange(item.id, item.status === 'todo' ? 'in_progress' : 'completed')}>
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {colItems.length === 0 && (
                    <div className="text-center p-4 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                        Kosong
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle>Tindak Lanjut (Action Items)</CardTitle>
                        <CardDescription>Papan Kanban untuk tugas-tugas hasil rapat</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {canEdit && (
                    <div className="flex gap-2 mb-6">
                        <Input 
                            placeholder="Tambahkan tugas baru..." 
                            value={newItemTitle} 
                            onChange={e => setNewItemTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                        </Button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
                    <Column title="To Do" colItems={todoItems} />
                    <Column title="In Progress" colItems={inProgressItems} />
                    <Column title="Done" colItems={doneItems} />
                </div>
            </CardContent>
        </Card>
    );
}
