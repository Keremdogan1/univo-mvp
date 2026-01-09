'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Type, FileText } from 'lucide-react';

export default function EditEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams(); // { id: string }
  const eventId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'event', 
      description: '',
      excerpt: '',
      image_url: '',
      quota: '',
      registration_link: '',
      maps_url: ''
  });

  useEffect(() => {
    async function fetchEventData() {
        if (!user || !eventId) return;

        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title || '',
                    date: data.date || '',
                    time: data.time || '', // "HH:MM:SS" or "HH:MM"
                    location: data.location || '',
                    category: data.category || 'event',
                    description: data.description || '',
                    excerpt: data.excerpt || '',
                    image_url: data.image_url || '',
                    quota: data.quota ? String(data.quota) : '',
                    registration_link: data.registration_link || '',
                    maps_url: data.maps_url || ''
                });
            }
        } catch (err: any) {
            console.error(err);
            alert("Etkinlik yüklenemedi: " + err.message);
            router.push('/dashboard/events');
        } finally {
            setFetching(false);
        }
    }
    fetchEventData();
  }, [user, eventId]);

  const handleChange = (e: any) => {
      setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e: any) => {
      e.preventDefault();
      setLoading(true);

      try {
          // Prepare update payload
          // quota should be null if empty string
          const payload = {
              ...formData,
              quota: formData.quota === '' ? null : parseInt(String(formData.quota)),
          };

          const { error } = await supabase
            .from('events')
            .update(payload)
            .eq('id', eventId);

          if (error) throw error;

          router.push('/dashboard/events');
      } catch (err: any) {
          console.error(err);
          alert("Etkinlik güncellenirken hata oluştu: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  if (fetching) return <div className="p-8 text-center font-bold">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-black font-serif mb-8 text-neutral-900 dark:text-white border-b-4 border-black dark:border-white pb-4 transition-colors">
            ETKİNLİĞİ DÜZENLE
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-colors">
            <div>
                <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Başlık</label>
                <div className="relative">
                    <Type className="absolute top-3 left-3 text-neutral-400" size={20} />
                    <input 
                        type="text" 
                        name="title" 
                        required 
                        value={formData.title}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors font-bold placeholder:font-normal transition-colors"
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Tarih</label>
                   <input 
                        type="date" 
                        name="date" 
                        required 
                        value={formData.date}
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        onChange={handleChange}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Saat</label>
                   <input 
                        type="time" 
                        name="time" 
                        required 
                        value={formData.time}
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        onChange={handleChange}
                   />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Konum</label>
                <div className="relative mb-2">
                    <MapPin className="absolute top-3 left-3 text-neutral-400" size={20} />
                    <input 
                        type="text" 
                        name="location" 
                        required 
                        value={formData.location}
                        className="w-full pl-10 pr-32 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        onChange={handleChange}
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            const query = formData.location || 'ODTÜ Ankara';
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                        }}
                        className="absolute right-2 top-2 bottom-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-[var(--primary-color)] hover:text-white border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase px-4 rounded transition-colors flex items-center gap-1"
                    >
                        <MapPin size={14} />
                        Haritada Bul
                    </button>
                </div>
                <input 
                    type="text" 
                    name="maps_url" 
                    value={formData.maps_url}
                    className="w-full px-4 py-2 border-2 border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none dark:text-white transition-colors placeholder:italic"
                    placeholder="Google Maps Linki (Opsiyonel) - Eğer 'Haritada Bul' butonu yanlış yer gösteriyorsa buraya doğrusunu yapıştırın."
                    onChange={handleChange}
                />
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Kategori</label>
                <select 
                    name="category" 
                    value={formData.category}
                    className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors bg-white"
                    onChange={handleChange}
                >
                    <option value="event">Etkinlik</option>
                    <option value="workshop">Atölye</option>
                    <option value="talk">Konuşma / Panel</option>
                    <option value="announcement">Toplantı</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Etkinlik Afişi (URL)</label>
                <div className="relative">
                    <div className="absolute top-3 left-3 text-neutral-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                    <input 
                        type="text" 
                        name="image_url" 
                        value={formData.image_url}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        placeholder="https://..."
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Kontenjan (Kişi)</label>
                   <input 
                        type="number" 
                        name="quota" 
                        min="0" 
                        value={formData.quota}
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        placeholder="Sınırsız için boş bırakın"
                        onChange={handleChange}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Harici Kayıt Linki</label>
                   <input 
                        type="text" 
                        name="registration_link" 
                        value={formData.registration_link}
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        placeholder="Örn: Google Forms..."
                        onChange={handleChange}
                   />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Kısa Açıklama (Özet)</label>
                <textarea 
                    name="excerpt" 
                    required 
                    rows={2}
                    value={formData.excerpt}
                    className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors resize-none"
                    onChange={handleChange}
                />
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2 dark:text-neutral-200">Detaylı Açıklama</label>
                <div className="relative">
                     <FileText className="absolute top-3 left-3 text-neutral-400" size={20} />
                     <textarea 
                        name="description" 
                        required 
                        rows={6}
                        value={formData.description}
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] dark:focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] dark:hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        onChange={handleChange}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--primary-color)] text-white font-bold uppercase py-4 hover:bg-[var(--primary-color-hover)] transition-colors disabled:opacity-50"
            >
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
        </form>
    </div>
  );
}
