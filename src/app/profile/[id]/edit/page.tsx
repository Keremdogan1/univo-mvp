'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, User, BookOpen, Heart, Quote, Globe, Lock, Eye, EyeOff, Linkedin, Github, Twitter, Instagram } from 'lucide-react';

interface SocialLinks {
  linkedin?: string;
  github?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
}

interface PrivacySettings {
  show_email: boolean;
  show_interests: boolean;
  show_activities: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  department?: string;
  class_year?: string;
  bio?: string;
  interests?: string[];
  social_links?: SocialLinks;
  privacy_settings?: PrivacySettings;
}

// Predefined interest options
const INTEREST_OPTIONS = [
  'Teknoloji', 'Sanat', 'Müzik', 'Spor', 'Girişimcilik', 
  'Edebiyat', 'Sinema', 'Fotoğrafçılık', 'Gezi', 'Oyun'
];

// Class/Year options
const CLASS_OPTIONS = [
  'Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', 
  'Yüksek Lisans', 'Doktora', 'Mezun', 'Akademisyen'
];

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    id: '',
    full_name: '',
    department: '',
    class_year: '',
    bio: '',
    interests: [],
    social_links: { linkedin: '', github: '', website: '', twitter: '', instagram: '' },
    privacy_settings: { show_email: false, show_interests: true, show_activities: true }
  });

  useEffect(() => {
    // Security check: Only allow editing own profile
    if (user && user.id !== id) {
      router.push(`/profile/${id}`);
      return;
    }
    fetchProfile();
  }, [id, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          full_name: data.full_name || '',
          department: data.department || '',
          class_year: data.class_year || '',
          bio: data.bio || '',
          interests: data.interests || [],
          social_links: data.social_links || { linkedin: '', github: '', website: '', twitter: '', instagram: '' },
          privacy_settings: data.privacy_settings || { show_email: false, show_interests: true, show_activities: true }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social_')) {
        const socialKey = name.replace('social_', '');
        setFormData(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [socialKey]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePrivacyToggle = (key: keyof PrivacySettings) => {
      setFormData(prev => ({
          ...prev,
          privacy_settings: {
              ...prev.privacy_settings!,
              [key]: !prev.privacy_settings![key]
          }
      }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const currentInterests = prev.interests || [];
      const newInterests = currentInterests.includes(interest)
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: id,
          full_name: formData.full_name,
          department: formData.department,
          class_year: formData.class_year,
          bio: formData.bio,
          interests: formData.interests,
          social_links: formData.social_links,
          privacy_settings: formData.privacy_settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      router.push(`/profile/${id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', JSON.stringify(error, null, 2));
      alert(`Profil güncellenirken bir hata oluştu: ${(error as any).message}. (Veritabanı şeması güncel mi?)`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
            Profile Dön
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-200 bg-neutral-50 p-6">
            <h1 className="text-2xl font-bold text-neutral-900">Profili Düzenle</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Kampüs kimliğinizi oluşturun ve ilgi alanlarınızı belirtin.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-[#C8102E]">
                <User size={20} />
                Kişisel Bilgiler
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Bölüm</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Örn: Bilgisayar Mühendisliği"
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Sınıf / Ünvan</label>
                  <select
                    name="class_year"
                    value={formData.class_year}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Seçiniz</option>
                    {CLASS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Campus Identity */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-[#C8102E]">
                <Quote size={20} />
                Kampüs Kimliği
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Manşet (Hakkımda)
                </label>
                <div className="relative">
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    maxLength={160}
                    placeholder="Kendinizi kısaca tanıtın."
                    className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-neutral-400">
                    {(formData.bio?.length || 0)}/160
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
             <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[#C8102E]">
                    <Globe size={20} />
                    Sosyal Medya & Bağlantılar
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                            <Linkedin size={14} className="text-blue-700"/> LinkedIn
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">in/</span>
                            <input
                                type="text"
                                name="social_linkedin"
                                value={formData.social_links?.linkedin}
                                onChange={handleChange}
                                placeholder="kullaniciadi"
                                className="w-full pl-8 p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                             <Github size={14} className="text-neutral-900"/> GitHub
                        </label>
                         <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">@</span>
                            <input
                                type="text"
                                name="social_github"
                                value={formData.social_links?.github}
                                onChange={handleChange}
                                placeholder="username"
                                className="w-full pl-8 p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                             <Globe size={14} className="text-neutral-600"/> Web Sitesi
                        </label>
                        <input
                            type="url"
                            name="social_website"
                            value={formData.social_links?.website}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                             <Instagram size={14} className="text-pink-600"/> Instagram
                        </label>
                         <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">@</span>
                            <input
                                type="text"
                                name="social_instagram"
                                value={formData.social_links?.instagram}
                                onChange={handleChange}
                                placeholder="username"
                                className="w-full pl-8 p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[#C8102E]">
                    <Lock size={20} />
                    Gizlilik Ayarları
                </h2>
                <div className="space-y-3">
                     <label className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                        <div className="flex items-center gap-3">
                            {formData.privacy_settings?.show_interests ? <Eye size={20} className="text-green-600" /> : <EyeOff size={20} className="text-neutral-400" />}
                            <div>
                                <span className="font-medium text-neutral-900 block">İlgi Alanlarımı Göster</span>
                                <span className="text-xs text-neutral-500">Profilinizde seçtiğiniz ilgi alanları herkese açık olur.</span>
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={formData.privacy_settings?.show_interests} 
                            onChange={() => handlePrivacyToggle('show_interests')}
                            className="w-5 h-5 text-[#C8102E] rounded focus:ring-0 accent-[#C8102E]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                        <div className="flex items-center gap-3">
                            {formData.privacy_settings?.show_activities ? <Eye size={20} className="text-green-600" /> : <EyeOff size={20} className="text-neutral-400" />}
                            <div>
                                <span className="font-medium text-neutral-900 block">Aktivitelerimi Göster</span>
                                <span className="text-xs text-neutral-500">Katıldığınız etkinlikler ve paylaşımlarınız profilde görünür.</span>
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={formData.privacy_settings?.show_activities} 
                            onChange={() => handlePrivacyToggle('show_activities')}
                            className="w-5 h-5 text-[#C8102E] rounded focus:ring-0 accent-[#C8102E]"
                        />
                    </label>
                </div>
            </div>

            {/* Interests */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-[#C8102E]">
                <Heart size={20} />
                İlgi Alanları
              </h2>
              <p className="text-sm text-neutral-500 -mt-2">
                Haber akışınızı kişiselleştirmek için ilgi alanlarınızı seçin.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTEREST_OPTIONS.map(interest => (
                  <label 
                    key={interest}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                      ${(formData.interests || []).includes(interest) 
                        ? 'bg-red-50 border-[#C8102E] text-[#C8102E]' 
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}
                    `}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={(formData.interests || []).includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                    />
                    <div className={`
                      w-4 h-4 rounded-full border flex items-center justify-center
                      ${(formData.interests || []).includes(interest) ? 'border-[#C8102E] bg-[#C8102E]' : 'border-neutral-300'}
                    `}>
                      {(formData.interests || []).includes(interest) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-[#C8102E] text-white rounded-lg font-bold hover:bg-[#a60d26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Save size={20} />
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
