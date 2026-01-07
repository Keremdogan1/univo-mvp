'use client';

import React, { useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface MetuLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export default function MetuLoginModal({ isOpen, onClose, onSuccess }: MetuLoginModalProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!acceptedTerms) {
            setError('Devam etmek için aydınlatma metnini onaylamalısınız.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/metu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Giriş başarısız.');
            }

            toast.success(`Hoş geldin, ${data.studentInfo.fullName}!`);
            
            // Redirect to the Magic Link URL to start session
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
                // Keep loading true while redirecting...
            } else {
                 onSuccess(data.studentInfo);
                 onClose();
                 setIsLoading(false);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
            toast.error('Giriş başarısız oldu.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md relative border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                
                {/* Header */}
                <div className="bg-[var(--primary-color)] text-white p-6 relative overflow-hidden">

                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center">
                            <GraduationCap size={72} className="text-white drop-shadow-md" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white">ODTÜ İle Bağlan</h2>
                        <p className="text-white/90 text-sm mt-2 font-medium">
                            Tek tıkla profilini oluştur ve doğrulanmış hesap rozetini kap.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm font-bold flex items-center gap-2 border border-red-200 dark:border-red-800 rounded">
                                <AlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-black uppercase text-neutral-500 mb-1.5 ml-1">Kullanıcı Adı (NetID)</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    required
                                    placeholder="e123456"
                                    className="w-full p-3 pl-4 pr-32 border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-lg focus:border-primary focus:outline-none dark:text-white transition-colors rounded-lg"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold pointer-events-none text-sm select-none">@metu.edu.tr</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-neutral-500 mb-1.5 ml-1">Şifre</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full p-3 pl-10 pr-12 border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-lg focus:border-primary focus:outline-none dark:text-white transition-colors rounded-lg"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors select-none group">
                            <div 
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${acceptedTerms ? 'text-white' : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-400'}`}
                                style={acceptedTerms ? { backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' } : {}}
                            >
                                {acceptedTerms && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={acceptedTerms} 
                                onChange={e => setAcceptedTerms(e.target.checked)} 
                            />
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                Şifremin <strong>Univo sunucularına kaydedilmediğini</strong>, sadece ODTÜ sistemlerinde anlık kimlik doğrulama işlemi için kullanıldığını kabul ediyorum.
                            </span>
                        </label>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[var(--primary-color)] text-white font-black text-lg uppercase tracking-wide rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Bağlanılıyor...
                                </>
                            ) : (
                                <>
                                    Giriş Yap ve Bağlan
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
