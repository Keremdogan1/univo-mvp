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
                    className="flex items-center gap-2 bg-[#C8102E] !text-white px-4 py-2 font-bold uppercase hover:bg-[#a60d26] transition-colors"
                >
                    <Plus size={20} />
                    Yeni Etkinlik
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-neutral-300 p-12 text-center">
                    <Calendar size={48} className="mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500 font-bold mb-4">Henüz bir etkinlik oluşturmadınız.</p>
                </div>
            ) : (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-100 border-b-2 border-black">
                            <tr>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Etkinlik Adı</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Tarih</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Konum</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-neutral-50">
                                    <td className="p-4 font-medium">{event.title}</td>
                                    <td className="p-4 text-neutral-600">{new Date(event.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="p-4 text-neutral-600 flex items-center gap-1">
                                        <MapPin size={16} />
                                        {event.location}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-neutral-200 rounded text-neutral-600" title="Düzenle">
                                                <Edit size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-neutral-200 rounded text-red-600" title="Sil">
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
