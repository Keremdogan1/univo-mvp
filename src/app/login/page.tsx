'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle, ArrowRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// University configurations (expandable)
const UNIVERSITIES = [
  {
    id: 'metu',
    name: 'ODTÜ',
    fullName: 'Orta Doğu Teknik Üniversitesi',
    color: '#C8102E',
    logo: '/metu.png',
    enabled: true,
    moodleUrl: 'odtuclass2025f.metu.edu.tr'
  },
  {
    id: 'itu',
    name: 'İTÜ',
    fullName: 'İstanbul Teknik Üniversitesi',
    color: '#1D428A',
    logo: '/universities/itu.png',
    enabled: false,
    moodleUrl: ''
  },
  {
    id: 'bilkent',
    name: 'Bilkent',
    fullName: 'Bilkent Üniversitesi',
    color: '#002D72',
    logo: '/universities/bilkent.png',
    enabled: false,
    moodleUrl: ''
  },
  {
    id: 'hacettepe',
    name: 'Hacettepe',
    fullName: 'Hacettepe Üniversitesi',
    color: '#D4212C',
    logo: '/universities/hacettepe.png',
    enabled: false,
    moodleUrl: ''
  },
  {
    id: 'bogazici',
    name: 'Boğaziçi',
    fullName: 'Boğaziçi Üniversitesi',
    color: '#003366',
    logo: '/universities/bogazici.png',
    enabled: false,
    moodleUrl: ''
  }
];

export default function LoginPage() {
    const router = useRouter();
    const { signInWithMetu } = useAuth();
    
    // Step: 'select' or 'login'
    const [step, setStep] = useState<'select' | 'login'>('select');
    const [selectedUni, setSelectedUni] = useState<typeof UNIVERSITIES[0] | null>(null);
    
    // Login form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectUniversity = (uni: typeof UNIVERSITIES[0]) => {
        if (!uni.enabled) {
            toast.info(`${uni.name} yakında eklenecek!`);
            return;
        }
        setSelectedUni(uni);
        setStep('login');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!acceptedTerms) {
            setError('Devam etmek için aydınlatma metnini onaylamalısınız.');
            return;
        }

        setIsLoading(true);

        try {
            // For now, only ODTÜ is supported
            const result = await signInWithMetu(username, password);

            if (result.success) {
                toast.success(`Hoş geldin, ${result.studentInfo?.fullName || 'Öğrenci'}!`, { duration: 2000 });
                router.push('/');
                router.refresh();
            } else {
                throw new Error(result.error || 'Giriş başarısız.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
            setIsLoading(false);
        }
    };

    // University Selection Step
    if (step === 'select') {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-neutral-900 w-full max-w-md border-2 border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-8 text-center border-b border-neutral-100 dark:border-neutral-800">
                        <div className="w-16 h-16 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold font-serif text-neutral-900 dark:text-white">Univo'ya Giriş</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                            Üniversiteni seç ve hesabınla giriş yap
                        </p>
                    </div>

                    {/* University List */}
                    <div className="p-6 space-y-3">
                        {UNIVERSITIES.map((uni) => (
                            <button
                                key={uni.id}
                                onClick={() => handleSelectUniversity(uni)}
                                disabled={!uni.enabled}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                                    uni.enabled 
                                        ? 'border-neutral-200 dark:border-neutral-700 hover:border-[var(--primary-color)] hover:shadow-md cursor-pointer'
                                        : 'border-neutral-100 dark:border-neutral-800 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden"
                                    style={{ backgroundColor: uni.color }}
                                >
                                    {uni.logo ? (
                                        <img src={uni.logo} alt={uni.name} className="w-full h-full object-cover" />
                                    ) : (
                                        uni.name.charAt(0)
                                    )}
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="font-bold text-neutral-900 dark:text-white">{uni.name}</h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{uni.fullName}</p>
                                </div>
                                {uni.enabled ? (
                                    <ArrowRight size={20} className="text-neutral-400 group-hover:text-[var(--primary-color)] transition-colors" />
                                ) : (
                                    <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-1 rounded">Yakında</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                
                <p className="fixed bottom-4 text-xs text-neutral-400 dark:text-neutral-600 text-center w-full">
                    &copy; 2026 Univo. Öğrenciler tarafından geliştirilmiştir.
                </p>
            </div>
        );
    }

    // Login Form Step
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md border-2 border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl overflow-hidden">
                
                {/* Header with Back Button */}
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <button 
                        onClick={() => { setStep('select'); setError(null); }}
                        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-4 transition-colors"
                    >
                        <ChevronLeft size={18} />
                        <span>Üniversite Seçimine Dön</span>
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
                            style={{ backgroundColor: selectedUni?.color || 'var(--primary-color)' }}
                        >
                            {selectedUni?.name.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-serif text-neutral-900 dark:text-white">{selectedUni?.name} ile Giriş</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {selectedUni?.moodleUrl || 'Moodle'} hesabınızı kullanın
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm font-bold flex items-center gap-2 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-1.5 ml-1">Kullanıcı Adı (NetID)</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e123456"
                                        className="w-full p-3 pl-4 pr-32 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] focus:outline-none dark:text-white transition-all rounded-lg"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold pointer-events-none text-sm select-none">@metu.edu.tr</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500 mb-1.5 ml-1">Şifre</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        className="w-full p-3 pl-4 pr-12 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] focus:outline-none dark:text-white transition-all rounded-lg"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-3 p-3 border border-neutral-100 dark:border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors select-none group mt-2">
                            <div 
                                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${acceptedTerms ? 'border-transparent bg-[var(--primary-color)]' : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-400'}`}
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
                                Şifremin <strong>Univo'da asla kaydedilmediğini</strong>, sadece üniversite sistemlerinde anlık doğrulama için kullanıldığını anlıyorum.
                            </span>
                        </label>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 text-white font-bold text-sm uppercase tracking-wide rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2 mt-4"
                            style={{ backgroundColor: selectedUni?.color || 'var(--primary-color, #C8102E)' }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Bağlanılıyor...
                                </>
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <p className="fixed bottom-4 text-xs text-neutral-400 dark:text-neutral-600 text-center w-full">
                &copy; 2026 Univo. Öğrenciler tarafından geliştirilmiştir.
            </p>
        </div>
    );
}
