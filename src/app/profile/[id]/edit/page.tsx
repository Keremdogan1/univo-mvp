'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, User, BookOpen, Heart, Quote, Globe, Lock, Eye, EyeOff, Linkedin, Github, Twitter, Instagram, Camera, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { METU_DEPARTMENTS } from '@/lib/constants';
import Image from 'next/image';

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
  show_friends: boolean;
  show_polls: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  nickname?: string;
  avatar_url?: string;
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

const cleanDept = (dept?: string) => {
    if (!dept) return '';
    return dept
        .replace(/\.base/gi, '')
        .replace(/base/gi, '')
        .replace(/dbe/gi, '')
        .replace(/\.hazırlık/gi, '')
        .replace(/hazırlık/gi, '')
        .split('.')
        .filter(Boolean)
        .join(' ')
        .trim();
};

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    id: '',
    full_name: '',
    nickname: '',
    avatar_url: '',
    department: '',
    class_year: '',
    bio: '',
    interests: [],
    social_links: { linkedin: '', github: '', website: '', twitter: '', instagram: '' },
    privacy_settings: { show_email: false, show_interests: true, show_activities: true, show_friends: true, show_polls: true }
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [initialNickname, setInitialNickname] = useState<string | null>(null);

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
          nickname: data.nickname || '',
          avatar_url: data.avatar_url || '',
          department: cleanDept(data.department || ''),
          class_year: data.class_year || '',
          bio: data.bio || '',
          interests: data.interests || [],
          social_links: data.social_links || { linkedin: '', github: '', website: '', twitter: '', instagram: '' },
          privacy_settings: data.privacy_settings || { show_email: false, show_interests: true, show_activities: true, show_friends: true, show_polls: true }
        });
        setInitialNickname(data.nickname || '');
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
    setFormData(prev => {
        const currentVal = prev.privacy_settings?.[key] ?? true; // Defaults to true
        return {
            ...prev,
            privacy_settings: {
                ...prev.privacy_settings!,
                [key]: !currentVal
            }
        };
    });
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
      if (!avatarFile || !user) return null;

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
          throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

      return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    console.log('Starting profile update...', formData);

    try {
      let avatarUrl = formData.avatar_url;
      
      // Handle Avatar Upload
      if (avatarFile) {
          try {
              const uploadedUrl = await uploadAvatar();
              if (uploadedUrl) {
                  avatarUrl = uploadedUrl;
              }
          } catch (uploadError) {
              console.error('Avatar upload failed:', uploadError);
              toast.error('Profil fotoğrafı yüklenemedi, diğer bilgiler kaydediliyor...');
          }
      }

      // Convert empty string to null for DB if needed, though Supabase handles text columns fine.
      // But for avatar_url, we want NULL if removed.
      const updates = {
          full_name: formData.full_name,
          nickname: formData.nickname, // Ensure nickname is sent
          avatar_url: avatarUrl || null, // Convert empty string to null
          department: formData.department,
          class_year: formData.class_year,
          bio: formData.bio,
          interests: formData.interests,
          social_links: formData.social_links,
          privacy_settings: formData.privacy_settings,
          updated_at: new Date().toISOString()
      };

      console.log('Sending updates to Supabase:', updates);

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Check if Hidden Identity Badge should be awarded
      if (!initialNickname && formData.nickname && formData.nickname.trim().length > 0) {
          await supabase.from('notifications').insert({
              user_id: user.id,
              type: 'badge',
              message: "Tebrikler! Anonim bir kimlik oluşturarak 'Gizli Kimlik' rozetini kazandınız.",
              read: false
          });
      }

      toast.success('Profil başarıyla güncellendi.');
      
      // Update global context
      await refreshProfile();
      
      router.push(`/profile/${id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Hata: ${error.message || error.details || 'Güncelleme başarısız'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = () => {
      if(confirm('Profil fotoğrafını kaldırmak istediğinize emin misiniz?')) {
          setAvatarFile(null);
          setAvatarPreview(null);
          setFormData(prev => ({ ...prev, avatar_url: '' }));
      }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary-color, #C8102E)', borderTopColor: 'transparent' }}></div>
            <p className="text-neutral-600 dark:text-neutral-400">Yükleniyor...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] py-12 px-4 transition-colors">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
            Profile Dön
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-6">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Profili Düzenle</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
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
              
              {/* Added Email Field (Read Only) */}
              <div>
                 <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">E-Posta (ODTÜ)</label>
                 <input 
                    type="text" 
                    value={user?.email || ' - '} 
                    disabled 
                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                 />
              </div>
              
              {/* Avatar Upload */}
              <div className="flex justify-center items-center gap-6 mb-6">
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-md relative bg-neutral-100 dark:bg-neutral-800">
                    {(avatarPreview || formData.avatar_url) ? (
                        <Image
                            src={avatarPreview || formData.avatar_url || ''}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <User size={48} />
                        </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera size={24} />
                    </div>
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute bottom-0 right-0 bg-[#C8102E] text-white p-2 rounded-full shadow-sm">
                    <Upload size={16} />
                  </div>
                </div>

                {(avatarPreview || formData.avatar_url) && (
                    <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-neutral-200 dark:border-neutral-700"
                        title="Fotoğrafı Kaldır"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bölüm</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="">Seçiniz</option>
                    {METU_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Sınıf / Ünvan</label>
                  <select
                    name="class_year"
                    value={formData.class_year}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="">Seçiniz</option>
                    {CLASS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Quote size={14} className="text-neutral-500" /> Rumuz (Anonim Paylaşımlar İçin)
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="Kampüs Kedisi, ODTÜ'lü..."
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                  />
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
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                    className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none resize-none bg-white dark:bg-neutral-800 dark:text-white"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-neutral-400">
                    {(formData.bio?.length || 0)}/160
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
             <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[#C8102E]">
                    <Globe size={20} />
                    Sosyal Medya & Bağlantılar
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                            <Linkedin size={14} className="text-blue-700 dark:text-blue-500"/> LinkedIn
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">in/</span>
                            <input
                                type="text"
                                name="social_linkedin"
                                value={formData.social_links?.linkedin}
                                onChange={handleChange}
                                placeholder="kullaniciadi"
                                className="w-full pl-8 p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                             <Github size={14} className="text-neutral-900 dark:text-white"/> GitHub
                        </label>
                         <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">@</span>
                            <input
                                type="text"
                                name="social_github"
                                value={formData.social_links?.github}
                                onChange={handleChange}
                                placeholder="username"
                                className="w-full pl-8 p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                             <Globe size={14} className="text-neutral-600 dark:text-neutral-400"/> Web Sitesi
                        </label>
                        <input
                            type="url"
                            name="social_website"
                            value={formData.social_links?.website}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
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
                                className="w-full pl-8 p-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>



            {/* Interests */}
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
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
                        ? 'bg-red-50 dark:bg-red-900/20 border-[#C8102E] text-[#C8102E]' 
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'}
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
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
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
