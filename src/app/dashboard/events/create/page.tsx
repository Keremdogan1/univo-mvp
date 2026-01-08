'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Type, FileText } from 'lucide-react';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'event', // event, announcement, workshop, talk
      description: '',
      excerpt: ''
  });

  useEffect(() => {
      async function fetchCommunity() {
          if (!user) return;
          const { data } = await supabase.from('communities').select('id').eq('admin_id', user.id).single();
          if (data) setCommunityId(data.id);
      }
      fetchCommunity();
  }, [user]);

  const handleChange = (e: any) => {
      setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e: any) => {
      e.preventDefault();
      setLoading(true);

      if (!communityId) {
          alert("Topluluk bulunamadı.");
          setLoading(false);
          return;
      }

      try {
          // 1. Create Event
          const { data, error } = await supabase
            .from('events')
            .insert({
                ...formData,
                community_id: communityId
            })
            .select()
            .single();

          if (error) throw error;

          // 2. Notify Followers (Application-level logic)
          // Fetch all followers
          const { data: followers } = await supabase
            .from('community_followers')
            .select('user_id')
            .eq('community_id', communityId);
          
          if (followers && followers.length > 0 && user) {
              const notifications = followers.map(f => ({
                  user_id: f.user_id,
                  type: 'event_created',
                  actor_id: user.id,
                  message: `Takip ettiğiniz topluluk yeni bir etkinlik yayınladı: ${formData.title}`,
                  read: false
              }));
              
              const { error: notifError } = await supabase.from('notifications').insert(notifications);
              if (notifError) console.error("Notification Error:", notifError);
          }

          router.push('/dashboard');
      } catch (err) {
          console.error(err);
          alert("Etkinlik oluşturulurken hata oluştu.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-black font-serif mb-8 text-neutral-900 border-b-4 border-black pb-4">
            YENİ ETKİNLİK OLUŞTUR
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div>
                <label className="block text-sm font-bold uppercase mb-2">Başlık</label>
                <div className="relative">
                    <Type className="absolute top-3 left-3 text-neutral-400" size={20} />
                    <input 
                        type="text" 
                        name="title" 
                        required 
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none font-bold placeholder:font-normal transition-colors"
                        placeholder="Etkinlik Başlığı"
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-bold uppercase mb-2">Tarih</label>
                   <input 
                        type="date" 
                        name="date" 
                        required 
                        className="w-full px-4 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none"
                        onChange={handleChange}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold uppercase mb-2">Saat</label>
                   <input 
                        type="time" 
                        name="time" 
                        required 
                        className="w-full px-4 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none"
                        onChange={handleChange}
                   />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Konum</label>
                <div className="relative">
                    <MapPin className="absolute top-3 left-3 text-neutral-400" size={20} />
                    <input 
                        type="text" 
                        name="location" 
                        required 
                        className="w-full pl-10 pr-32 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none"
                        placeholder="Örn: Ana Kampüs Meydanı"
                        onChange={handleChange}
                        value={formData.location}
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            const query = formData.location || 'ODTÜ Ankara';
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                        }}
                        className="absolute right-2 top-2 bottom-2 bg-neutral-100 hover:bg-[#C8102E] hover:text-white border border-neutral-200 text-neutral-600 text-xs font-bold uppercase px-4 rounded transition-colors flex items-center gap-1"
                    >
                        <MapPin size={14} />
                        Haritada Bul
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Kategori</label>
                <select 
                    name="category" 
                    className="w-full px-4 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none bg-white"
                    onChange={handleChange}
                >
                    <option value="event">Etkinlik</option>
                    <option value="workshop">Atölye</option>
                    <option value="talk">Konuşma / Panel</option>
                    <option value="announcement">Toplantı</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Kısa Açıklama (Özet)</label>
                <textarea 
                    name="excerpt" 
                    required 
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none resize-none"
                    placeholder="Listelenirken görünecek kısa açıklama..."
                    onChange={handleChange}
                />
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Detaylı Açıklama</label>
                <div className="relative">
                     <FileText className="absolute top-3 left-3 text-neutral-400" size={20} />
                     <textarea 
                        name="description" 
                        required 
                        rows={6}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 focus:border-black focus:outline-none"
                        placeholder="Etkinliğin tüm detayları..."
                        onChange={handleChange}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#C8102E] text-white font-bold uppercase py-4 hover:bg-[#a60d26] transition-colors disabled:opacity-50"
            >
                {loading ? 'Oluşturuluyor...' : 'Etkinliği Yayınla'}
            </button>
        </form>
    </div>
  );
}
