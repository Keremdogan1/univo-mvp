'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { METU_DEPARTMENTS, METU_CLASSES } from '@/lib/constants';
import MetuLoginModal from '@/components/auth/MetuLoginModal';
import { GraduationCap, ArrowRight, User, Mail, School, BookOpen } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [showMetuModal, setShowMetuModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    department: '',
    studentId: '',
    classYear: '',
  });
  
  // State to track if ODTÜ Verified
  const [isMetuVerified, setIsMetuVerified] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
     if (typeof window !== 'undefined') {
        const temp = sessionStorage.getItem('odtu_temp_auth');
        if (temp) {
            try {
                const data = JSON.parse(temp);
                handleMetuSuccess(data);
                sessionStorage.removeItem('odtu_temp_auth');
            } catch(e) { console.error(e) }
        }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMetuSuccess = (studentInfo: any) => {
    // Auto-fill form with scraped data
    setFormData(prev => ({
        ...prev,
        fullName: studentInfo.fullName,
        email: `${studentInfo.username}@metu.edu.tr`,
        studentId: studentInfo.username.replace('e', ''), // Attempt to parse ID
        // Try to infer class year from ID if possible (e.g. 23xxxxx -> 3. Sınıf approx)
        classYear: '', 
        department: '', // Scraping dept is hard, left empty for now or user fills
    }));
    setIsMetuVerified(true);
    setShowManualForm(true); // Reveal form to set password
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!formData.email.endsWith('@metu.edu.tr') && !formData.email.endsWith('@student.metu.edu.tr')) {
      setError('Sadece @metu.edu.tr veya @student.metu.edu.tr uzantılı e-posta adresleri kabul edilmektedir.');
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            department: formData.department || null,
            student_id: formData.studentId || null,
            class_year: formData.classYear || null,
            is_metu_verified: isMetuVerified // Assuming we add this field later
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      // Redirect based on whether verification is required
      if (authData.session) {
        // Confirmation is disabled, user is automatically logged in
        router.push('/');
      } else {
        // Confirmation is enabled, user needs to verify email
        router.push('/verify');
      }
    } catch (error: any) {
      setError(error.message || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4 py-12 transition-colors">
      <div className="max-w-md w-full">
        
        {/* Metu Modal */}
        <MetuLoginModal 
            isOpen={showMetuModal} 
            onClose={() => setShowMetuModal(false)}
            onSuccess={handleMetuSuccess}
        />

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 transition-colors relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-black font-serif mb-2 dark:text-white uppercase tracking-tight">Univo'ya Katıl</h1>
            <p className="text-neutral-600 dark:text-neutral-400">ODTÜ kimliğinle saniyeler içinde başla.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-bold">{error}</p>
            </div>
          )}

          {/* ODTÜ Connect Button (Primary) */}
          {!isMetuVerified && !showManualForm && (
              <div className="space-y-6">
                 <button 
                    onClick={() => setShowMetuModal(true)}
                    className="w-full relative group overflow-hidden bg-[var(--primary-color)] text-white p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-black dark:border-white"
                 >
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform">
                        <GraduationCap size={80} />
                    </div>
                    <div className="relative z-10 text-left">
                        <span className="block text-xs font-black uppercase tracking-wider opacity-90 mb-1">ÖNERİLEN</span>
                        <h3 className="text-2xl font-black font-serif uppercase leading-none mb-2">ODTÜ İle Bağlan</h3>
                        <p className="text-sm font-medium opacity-90 leading-tight">
                            Profilin otomatik oluşturulsun, rozetini kap, form doldurma derdinden kurtul.
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <ArrowRight size={20} />
                    </div>
                 </button>

                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500">veya</span>
                    </div>
                 </div>

                 <button 
                    onClick={() => setShowManualForm(true)}
                    className="w-full py-3 text-neutral-500 font-bold hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors text-sm"
                 >
                    Manuel Olarak Kayıt Ol
                 </button>

                 <div className="text-center text-xs text-neutral-400 mt-4">
                    Zaten hesabın var mı? <Link href="/login" className="font-bold text-primary hover:underline">Giriş Yap</Link>
                 </div>
              </div>
          )}

          {/* Registration Form (Hidden initially or shown after verify) */}
          {(showManualForm || isMetuVerified) && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
               {isMetuVerified && (
                   <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-6 flex items-center gap-3">
                       <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full shrink-0">
                           <GraduationCap size={20} className="text-green-700 dark:text-green-300" />
                       </div>
                       <div>
                           <h4 className="font-bold text-green-800 dark:text-green-300 text-sm">ODTÜ Hesabı Doğrulandı</h4>
                           <p className="text-xs text-green-600 dark:text-green-400">Bilgilerin otomatik dolduruldu. Sadece şifre belirle.</p>
                       </div>
                   </div>
               )}

              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Ad Soyad</label>
                    <div className="relative">
                        <input
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={isMetuVerified}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white outline-none transition-colors font-bold disabled:opacity-70"
                            placeholder="Ad Soyad"
                        />
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">E-Posta</label>
                    <div className="relative">
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isMetuVerified}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white outline-none transition-colors font-bold disabled:opacity-70"
                            placeholder="e123456@metu.edu.tr"
                        />
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </div>

                  {!isMetuVerified && (
                      <>
                        <div>
                            <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Sınıf</label>
                            <div className="relative">
                                <select
                                    name="classYear"
                                    value={formData.classYear}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white outline-none transition-colors font-bold appearance-none"
                                >
                                    <option value="">Seçiniz</option>
                                    {METU_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                </select>
                                <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">Bölüm</label>
                             <div className="relative">
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white outline-none transition-colors font-bold appearance-none"
                                >
                                    <option value="">Seçiniz</option>
                                    {METU_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                </select>
                                <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            </div>
                        </div>
                      </>
                  )}
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold uppercase text-neutral-500 mb-1 block">{isMetuVerified ? 'Univo Şifreni Belirle' : 'Şifre'}</label>
                <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white outline-none transition-colors mb-3"
                    placeholder="En az 6 karakter"
                />
                <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg focus:border-black dark:focus:border-white outline-none transition-colors"
                    placeholder="Şifreyi Tekrarla"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-wide py-4 rounded-lg hover:opacity-90 transition-opacity mt-6 shadow-md"
              >
                {loading ? 'Kayıt Yapılıyor...' : 'Kaydı Tamamla'}
              </button>
                
              {!isMetuVerified && (
                  <button 
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="w-full text-center text-xs text-neutral-400 font-bold hover:text-neutral-600 mt-4"
                  >
                      ← Geri Dön
                  </button>
              )}

            </form>
          )}

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[var(--primary-color)]"></div>

        </div>
      </div>
    </div>
  );
}
