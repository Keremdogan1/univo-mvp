'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Type, FileText, Upload, X, Minus, Plus } from 'lucide-react';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'event', // event, announcement, workshop, talk
      description: '',
      excerpt: '',
      image_url: '',
      quota: '',
      registration_link: '',
      maps_url: ''
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `events/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setFormData({ ...formData, image_url: data.publicUrl });
    } catch (error) {
        console.error('Upload error:', error);
        alert('Resim yüklenirken hata oluştu!');
    } finally {
        setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: '' });
  };

  const updateQuota = (delta: number) => {
    const current = parseInt(formData.quota || '0', 10);
    const next = Math.max(0, current + delta);
    setFormData(prev => ({ ...prev, quota: next === 0 ? '' : next.toString() }));
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

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-colors">
            <div>
                <label className="block text-sm font-bold uppercase mb-2">Başlık</label>
                <div className="relative">
                    <Type className="absolute top-3 left-3 text-neutral-400" size={20} />
                    <input 
                        type="text" 
                        name="title" 
                        required 
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors font-bold placeholder:font-normal transition-colors"
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
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        onChange={handleChange}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold uppercase mb-2">Saat</label>
                   <input 
                        type="time" 
                        name="time" 
                        required 
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        onChange={handleChange}
                   />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Konum</label>
                <div className="relative mb-2">
                    <MapPin className="absolute top-3 left-3 text-neutral-400" size={20} />
                    <input 
                        type="text" 
                        name="location" 
                        required 
                        className="w-full pl-10 pr-32 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors"
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
                        className="absolute right-2 top-2 bottom-2 bg-neutral-100 hover:bg-[var(--primary-color)] hover:text-white border border-neutral-200 text-neutral-600 text-xs font-bold uppercase px-4 rounded transition-colors flex items-center gap-1"
                    >
                        <MapPin size={14} />
                        Haritada Bul
                    </button>
                </div>
                <input 
                    type="text" 
                    name="maps_url" 
                    required
                    className="w-full px-4 py-2 border-2 border-neutral-100 dark:border-neutral-800 text-sm focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none placeholder:italic bg-white dark:bg-black text-black dark:text-white transition-colors"
                    placeholder="Google Maps Linki (Zorunlu) - Haritada Bul'a tıklayıp doğrulayın."
                    onChange={handleChange}
                />
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Kategori</label>
                <select 
                    name="category" 
                    className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors bg-white"
                    onChange={handleChange}
                >
                    <option value="event">Etkinlik</option>
                    <option value="workshop">Atölye</option>
                    <option value="talk">Konuşma / Panel</option>
                    <option value="announcement">Toplantı</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Etkinlik Afişi</label>
                {formData.image_url ? (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden group border-2 border-neutral-200 dark:border-neutral-800">
                        <img src={formData.image_url} alt="Afiş Önizleme" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                type="button" 
                                onClick={removeImage}
                                className="bg-red-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-600 transition-colors"
                            >
                                <X size={20} /> Kaldır
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden" 
                            id="image-upload"
                        />
                        <label 
                            htmlFor="image-upload" 
                            className={`w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--primary-color)] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {uploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
                            ) : (
                                <>
                                    <Upload size={32} className="text-neutral-400 dark:text-neutral-500" />
                                    <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Afiş Yüklemek İçin Tıklayın</span>
                                    <span className="text-xs text-neutral-400">JPG, PNG, GIF (Max 5MB)</span>
                                </>
                            )}
                        </label>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-bold uppercase mb-2">Kontenjan</label>
                   <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => updateQuota(-10)}
                            className="w-12 h-12 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-[var(--primary-color)] hover:text-white rounded-lg transition-colors"
                        >
                            <Minus size={20} />
                        </button>
                        <input 
                                type="number" 
                                name="quota" 
                                min="0"
                                className="flex-1 px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors text-center font-bold text-lg"
                                placeholder="Sınırsız"
                                value={formData.quota}
                                onChange={handleChange}
                        />
                        <button 
                            type="button"
                            onClick={() => updateQuota(10)}
                            className="w-12 h-12 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-[var(--primary-color)] hover:text-white rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-bold uppercase mb-2">Harici Kayıt Linki</label>
                   <input 
                        type="text" 
                        name="registration_link" 
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        placeholder="Luma vb."
                        onChange={handleChange}
                   />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold uppercase mb-2">Kısa Açıklama (Özet)</label>
                <textarea 
                    name="excerpt" 
                    required 
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors resize-none"
                    placeholder="Listelenirken görünecek kısa açıklama (Maks. 180 karakter)..."
                    maxLength={180}
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
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white focus:border-[var(--primary-color)] hover:border-[var(--primary-color)] focus:outline-none transition-colors"
                        placeholder="Etkinliğin tüm detayları (Min. 100 karakter)..."
                        minLength={100}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--primary-color)] text-white font-bold uppercase py-4 hover:bg-[var(--primary-color-hover)] transition-colors disabled:opacity-50"
            >
                {loading ? 'Oluşturuluyor...' : 'Etkinliği Yayınla'}
            </button>
        </form>
    </div>
  );
}
