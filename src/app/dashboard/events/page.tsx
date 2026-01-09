'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function EventsPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (eventId: string) => {
        if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
        
        try {
            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) throw error;
            setEvents(events.filter(e => e.id !== eventId));
        } catch (error: any) {
            alert('Silme işlemi başarısız: ' + error.message);
        }
    };

    useEffect(() => {
        async function fetchEvents() {
            if (!user) return;
            // Get community first
            const { data: communities } = await supabase.from('communities').select('id').eq('admin_id', user.id).limit(1);
            const community = communities?.[0];
            
            if (community) {
                const { data: eventsData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('community_id', community.id)
                    .order('date', { ascending: false });
                
                if (eventsData) setEvents(eventsData);
            }
            setLoading(false);
        }
        fetchEvents();
    }, [user]);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black font-serif">Geçmiş Etkinlikler</h1>
                <Link 
                    href="/dashboard/events/create" 
                    className="flex items-center gap-2 bg-[var(--primary-color)] !text-white px-4 py-2 font-bold uppercase hover:bg-[var(--primary-color-hover)] transition-colors"
                >
                    <Plus size={20} />
                    Yeni Etkinlik
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center transition-colors">
                    <Calendar size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                    <p className="text-neutral-500 dark:text-neutral-400 font-bold mb-4">Henüz bir etkinlik oluşturmadınız.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-colors">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 border-b-2 border-black dark:border-neutral-700">
                            <tr>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Etkinlik Adı</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Tarih</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Konum</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    <td className="p-4 font-medium">{event.title}</td>
                                    <td className="p-4 text-neutral-600">{new Date(event.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="p-4 text-neutral-600 flex items-center gap-1">
                                        <MapPin size={16} />
                                        {event.location}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/dashboard/events/${event.id}/edit`} className="p-2 hover:bg-neutral-200 rounded text-neutral-600" title="Düzenle">
                                                <Edit size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(event.id)}
                                                className="p-2 hover:bg-neutral-200 rounded text-red-600" 
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
