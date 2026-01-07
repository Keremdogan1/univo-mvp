'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MetuLoginModal from './MetuLoginModal';
import { GraduationCap } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export default function MetuVerificationGuard({ children }: { children: React.ReactNode }) {
    const [isVerified, setIsVerified] = useState(true); // Default true to prevent flash
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkVerification = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                // Not logged in, no guard needed (Middleware handles auth protection)
                setLoading(false);
                return;
            }

            // Check if verified
            if (user.user_metadata?.is_metu_verified) {
                setIsVerified(true);
            } else {
                setIsVerified(false);
                setShowModal(true);
            }
            setLoading(false);
        };

        checkVerification();
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
             if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                 if (session?.user.user_metadata?.is_metu_verified) {
                     setIsVerified(true);
                     setShowModal(false);
                 } else {
                     setIsVerified(false);
                     setShowModal(true);
                 }
             }
             if (event === 'SIGNED_OUT') {
                 setIsVerified(true); // Let them go
             }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex items-center justify-center">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-[var(--primary-color)] rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-neutral-500 animate-pulse">Yükleniyor...</p>
                 </div>
            </div>
        );
    }

    if (!isVerified && !['/login', '/register', '/forgot-password', '/auth/callback'].includes(pathname)) {
        return (
            <div className="fixed inset-0 z-50 bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="max-w-md w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-xl">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-500">
                        <GraduationCap size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">Hesap Doğrulaması Gerekli</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                        Univo'yu kullanmaya devam etmek için lütfen ODTÜ hesabınla tekrar giriş yaparak öğrenci olduğunu doğrula.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                        >
                            ODTÜ İle Doğrula
                        </button>

                        <button 
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
                        >
                            Çıkış Yap / Farklı Hesap
                        </button>
                    </div>
                    {/* Closing Card Div */}
                </div>

                <MetuLoginModal 
                    isOpen={showModal} 
                    onClose={() => {}} // Cannot close without verifying
                    onSuccess={async () => {
                        setIsVerified(true);
                        setShowModal(false);
                        router.refresh(); 
                        toast.success('Hesabın doğrulandı!');
                    }} 
                />
            </div>
        );
    }

    return <>{children}</>;
}
