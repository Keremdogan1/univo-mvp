'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get user email from session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    });
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setMessage('Doğrulama e-postası tekrar gönderildi! Lütfen gelen kutunuzu kontrol edin.');
    } catch (error: any) {
      setMessage('E-posta gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          {/* Icon */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#C8102E20' }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: '#C8102E' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold font-serif mb-3">E-postanızı Doğrulayın</h1>
          <p className="text-neutral-600 mb-6">
            Kayıt işleminizi tamamlamak için <strong>{email}</strong> adresine gönderilen doğrulama linkine tıklayın.
          </p>

          {/* Instructions */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-neutral-700 mb-2">
              <strong>E-posta gelmediyse:</strong>
            </p>
            <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
              <li>Spam/gereksiz klasörünü kontrol edin</li>
              <li>E-posta adresinizi doğru yazdığınızdan emin olun</li>
              <li>Birkaç dakika bekleyin</li>
            </ul>
          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">{message}</p>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={resending || !email}
            style={{ 
              backgroundColor: resending ? '#A00D25' : '#C8102E',
              opacity: (!email) ? 0.5 : 1
            }}
            className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mb-4"
          >
            {resending ? 'Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
          </button>

          {/* Back to Login */}
          <Link href="/login" className="text-neutral-600 text-sm hover:text-neutral-800">
            ← Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
