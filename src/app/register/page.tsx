'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { METU_DEPARTMENTS, METU_CLASSES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    department: '',
    studentId: '',
    classYear: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 transition-colors">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2 dark:text-white">Univo'ya Katıl</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Kampüs etkinliklerine katılmaya başlayın</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Ad Soyad *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 transition-colors"
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                E-posta * <span className="text-xs font-normal text-neutral-500">(Sadece @metu.edu.tr)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 transition-colors"
                placeholder="ornek@metu.edu.tr"
              />
            </div>

            <div>
              <label htmlFor="classYear" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Sınıf *
              </label>
              <select
                id="classYear"
                name="classYear"
                value={formData.classYear}
                onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white transition-colors"
              >
                <option value="">Sınıf Seçin</option>
                {METU_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Bölüm *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white transition-colors"
              >
                <option value="">Bölüm Seçin</option>
                {METU_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Öğrenci Numarası
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 transition-colors"
                placeholder="2020123456"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Şifre *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 transition-colors"
                placeholder="En az 6 karakter"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Şifre Tekrar *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 transition-colors"
                placeholder="Şifrenizi tekrar girin"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: loading ? '#A00D25' : '#C8102E' }}
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" style={{ color: '#C8102E' }} className="font-semibold hover:underline">
                Giriş Yapın
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
