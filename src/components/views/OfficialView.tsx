import { Calendar, ChevronRight, Download, Search, Briefcase, Megaphone, Bookmark, Star, Filter, ArrowRight, Share2, Mail, CheckCircle, RotateCcw, X, Lock, Loader2 } from 'lucide-react';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function OfficialView() {
  const { user } = useAuth();
  const news = [
    {
      id: 1,
      type: 'announcement',
      title: '2025-2026 Akademik Takvim Güncellemesi',
      source: 'Rektörlük',
      date: '30 Aralık 2025',
      summary: 'Senato kararıyla bahar dönemi başlangıç tarihi 1 hafta ileriye alınmıştır. Yeni akademik takvime öğrenci işleri sayfasından ulaşabilirsiniz.',
      link: '#'
    },
    {
      id: 2,
      type: 'job',
      title: 'Junior Frontend Developer (Part-time)',
      source: 'Teknokent - SoftTech A.Ş.',
      date: '2 gün önce',
      summary: 'React ve TypeScript bilen, haftada en az 20 saat çalışabilecek 3. veya 4. sınıf öğrencileri aranıyor.',
      link: '#'
    }
  ];

  // Dynamic Date and Issue Number
  const today = new Date();
  const start = new Date(2025, 11, 29); 
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = current.getTime() - start.getTime();
  const issueNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Menu, Announcements & Real Emails State
  const [menu, setMenu] = React.useState<{
    breakfast: any[];
    lunch: any[];
    dinner: any[];
  }>({ breakfast: [], lunch: [], dinner: [] });
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | number | null>(null);

  // Fetch Campus News (Library, Sports, OIDB)
  const [campusNews, setCampusNews] = React.useState<any[]>([]);
  
  // Read Status & Preferences
  const [readIds, setReadIds] = React.useState<string[]>([]);
  const [userDepartment, setUserDepartment] = React.useState<string | null>(null);
  
  // ODTÜ IMAP Integration
  const [isEmailConnected, setIsEmailConnected] = React.useState(false);
  const [emails, setEmails] = React.useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [loginForm, setLoginForm] = React.useState({ username: '', password: '' });
  const [loginError, setLoginError] = React.useState('');

  // Tab State
  const [activeTab, setActiveTab] = React.useState<'agenda' | 'emails' | 'history'>('agenda');
  const [followedSources, setFollowedSources] = React.useState<string[]>([]);

  // Check Session & Auto-Connect
  React.useEffect(() => {
    async function checkSession() {
        try {
            // Load cache for immediate display
            const cached = localStorage.getItem('univo_cached_emails');
            const savedUser = localStorage.getItem('univo_email_user');
            const savedFollows = localStorage.getItem('univo_followed_sources');
            
            if (cached) setEmails(JSON.parse(cached));
            if (savedFollows) setFollowedSources(JSON.parse(savedFollows));
            if (savedUser) {
                setLoginForm(prev => ({ ...prev, username: savedUser }));
                setIsEmailConnected(true); // Optimistically show connected if user exists
            }

            // Verify with server (Cookie check)
            const res = await fetch('/api/auth/imap');
            if (res.ok) {
                const data = await res.json();
                
                // Map raw IMAP data
                const mappedEmails = (data.emails || []).map((msg: any) => ({
                    id: `email-${msg.id}`,
                    type: 'email',
                    title: msg.subject,
                    source: 'ODTÜ E-Posta', 
                    date: new Date(msg.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
                    summary: `Gönderen: ${msg.from}`,
                    link: `https://mail.metu.edu.tr`
                }));

                setEmails(mappedEmails);
                setIsEmailConnected(true);
                if (data.username) setLoginForm(prev => ({ ...prev, username: data.username }));
                
                // Update Cache
                localStorage.setItem('univo_cached_emails', JSON.stringify(mappedEmails));
                localStorage.setItem('univo_email_user', data.username || savedUser);
            } else if (res.status === 401) {
                // Session expired or invalid
                // Optional: Clear connected state if strict
                // setIsEmailConnected(false); 
            }
        } catch (e) {
            console.error('Session check failed', e);
        }
    }
    checkSession();
  }, []);

  const handleImapLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingEmails(true);
      setLoginError('');

      try {
          const res = await fetch('/api/auth/imap', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loginForm)
          });
          const data = await res.json();

          if (!res.ok) {
             throw new Error(data.error || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı olabilir.');
          }

          const mappedEmails = (data.emails || []).map((msg: any) => ({
                  id: `email-${msg.id}`,
                  type: 'email',
                  title: msg.subject,
                  source: 'ODTÜ E-Posta', 
                  date: new Date(msg.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
                  summary: `Gönderen: ${msg.from}`,
                  link: `https://mail.metu.edu.tr`
          }));

          setEmails(mappedEmails);
          setIsEmailConnected(true);
          setShowLoginModal(false);
          
          // Persist data
          localStorage.setItem('univo_cached_emails', JSON.stringify(mappedEmails));
          localStorage.setItem('univo_email_user', loginForm.username);

      } catch (err: any) {
          setLoginError(err.message);
      } finally {
          setLoadingEmails(false);
      }
  };

  React.useEffect(() => {
    async function fetchData() {
        try {
            // Parallel Fetch
            const [menuRes, annRes] = await Promise.all([
                fetch('/api/menu', { cache: 'no-store' }),
                fetch('/api/announcements', { cache: 'no-store' })
            ]);
            
            const menuData = await menuRes.json();
            if (menuData.menu) setMenu(menuData.menu);
            if (menuData.announcements) setAnnouncements(menuData.announcements);

            const annData = await annRes.json();
            if (annData.announcements) setCampusNews(annData.announcements);
            
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('department').eq('id', user.id).single();
                if (profile) setUserDepartment(profile.department);

                const { data: reads } = await supabase.from('announcement_reads').select('announcement_id').eq('user_id', user.id);
                if (reads) setReadIds(reads.map(r => r.announcement_id));
            }

        } catch (e) {
            console.error('Data loading failed', e);
        } finally {
            setLoadingMenu(false);
        }
    }
    fetchData();
  }, [user]);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
      if(e) {
          e.preventDefault();
          e.stopPropagation();
      }
      if (!user) return;
      const idStr = String(id);
      if (readIds.includes(idStr)) return;

      setReadIds(prev => [...prev, idStr]);
      await supabase.from('announcement_reads').insert({ user_id: user.id, announcement_id: idStr });
  };

  const handleUndoRead = async (id: string, e?: React.MouseEvent) => {
      if(e) { e.preventDefault(); e.stopPropagation(); }
      if (!user) return;
      const idStr = String(id);
      
      // Remove from local state
      setReadIds(prev => prev.filter(r => r !== idStr));
      
      // Remove from DB
      await supabase.from('announcement_reads').delete().match({ user_id: user.id, announcement_id: idStr });
  };

  const handleFollow = async (topic: string, e?: React.MouseEvent) => {
      if(e) {
          e.preventDefault();
          e.stopPropagation();
      }
      
      setFollowedSources(prev => {
          const isFollowing = prev.includes(topic);
          const newFollows = isFollowing ? prev.filter(s => s !== topic) : [...prev, topic];
          localStorage.setItem('univo_followed_sources', JSON.stringify(newFollows));
          if (!isFollowing) toast.success(`"${topic}" favorilere eklendi.`);
          return newFollows;
      });
  };

  // Helper to parse date string for sorting
  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const now = new Date();
    
    // Relative dates
    if (dateStr.toLowerCase().includes('bugün')) return now.getTime();
    if (dateStr.toLowerCase().includes('dün')) return now.getTime() - 86400000;
    if (dateStr.includes('gün önce')) {
        const days = parseInt(dateStr.split(' ')[0]);
        return now.getTime() - (days * 86400000);
    } else if (dateStr.includes('güncel')) {
        return now.getTime() - 1000; 
    }
    
    const months: Record<string, string> = {
        'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
        'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
    };
    
    let cleanDate = dateStr;
    Object.keys(months).forEach(m => {
        if (cleanDate.includes(m)) {
            const parts = cleanDate.split(' '); 
            if (parts.length >= 3) {
                 cleanDate = `${parts[0]}.${months[parts[1]]}.${parts[2]}`;
            }
        }
    });

    const parts = cleanDate.replace(/\//g, '.').split('.');
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    
    return Date.parse(dateStr) || 0;
  };

  const allNews = [
    ...news.filter(n => n.id !== 1 && n.type !== 'job'), 
    ...emails, 
    ...announcements.map(a => ({
        id: `kaf-${a.title}`,
        type: 'announcement',
        title: a.title,
        source: 'Kafeterya Müdürlüğü',
        date: a.date,
        summary: a.summary || 'Yemekhane duyurusu',
        link: a.link
    })),
    ...campusNews.map(a => ({
        id: a.id,
        type: 'announcement',
        title: a.title,
        source: a.source, 
        date: a.date,
        summary: a.summary || `${a.source} Duyurusu`,
        link: a.link
    }))
  ].sort((a, b) => {
      // FORCE EMAILS TO TOP
      if (a.type === 'email' && b.type !== 'email') return -1;
      if (b.type === 'email' && a.type !== 'email') return 1;

      let scoreA = parseDate(a.date);
      let scoreB = parseDate(b.date);
    
      // ... rest of sorting logic

      // Boost Unread
      const isReadA = readIds.includes(String(a.id));
      const isReadB = readIds.includes(String(b.id));

      if (!isReadA) scoreA += 5000000000; 
      if (!isReadB) scoreB += 5000000000;

      return scoreB - scoreA;
  });

  // Filtered Lists
  // GÜNDEM: Unread Items AND NOT Emails (Announcements Only)
  const agendaItems = allNews.filter(n => !readIds.includes(String(n.id)) && n.type !== 'email');
  
  const emailItems = allNews.filter(n => n.type === 'email');
  const historyItems = allNews.filter(n => readIds.includes(String(n.id)));

  let displayedItems = agendaItems;
  if (activeTab === 'emails') displayedItems = emailItems;
  if (activeTab === 'history') displayedItems = historyItems;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Newspaper Header */}
      <div className="border-b-2 border-black dark:border-neutral-700 pb-2 mb-2 flex justify-between items-end transition-colors">
         <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            ANKARA, {formattedDate.toUpperCase()}
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">HAVA DURUMU</div>
                <div className="font-bold text-sm dark:text-white">6°C, Parçalı Bulutlu</div>
            </div>
         </div>
      </div>
      <div className="border-b-4 border-black dark:border-neutral-700 pb-4 mb-8 text-center transition-colors">
        <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tight mb-2 text-black dark:text-white">Resmi Gündem</h2>
        <div className="flex justify-between items-center text-sm font-medium border-t border-black dark:border-neutral-700 pt-2 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400">
          <span>SAYI: {issueNumber}</span>
          <a href="/official/archive" className="flex items-center gap-1 hover:text-[#C8102E] transition-colors font-bold uppercase hover:underline decoration-2 underline-offset-4 cursor-pointer dark:text-neutral-300 dark:hover:text-[#C8102E]">
              <Briefcase size={16} />
              Belge Arşivi
          </a>
          <span>{formattedDate.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Tab Navigation */}
            <div className="flex border-b-2 border-neutral-200 dark:border-neutral-800 mb-6 gap-6 relative">
                {[
                    { id: 'agenda', label: 'GÜNDEM', count: agendaItems.length },
                    { id: 'emails', label: 'E-POSTALAR', count: emailItems.length },
                    { id: 'history', label: 'GEÇMİŞ', count: historyItems.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 font-black text-sm tracking-wider uppercase transition-colors relative flex items-center gap-2 ${
                            activeTab === tab.id 
                            ? 'text-black dark:text-white' 
                            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`}
                    >
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                            activeTab === tab.id ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                        }`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-black dark:bg-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* Featured Post (Only show on Agenda for impact, or always? Let's hide on Archive) */}
            {activeTab !== 'history' && news.length > 0 && (
                <article className="bg-neutral-50 dark:bg-neutral-900 p-6 border border-neutral-200 dark:border-neutral-800 rounded-sm mb-6 transition-colors">
                    <span className="inline-block bg-[#C8102E] text-white text-xs px-2 py-1 font-bold mb-3">ÖNEMLİ DUYURU</span>
                    <h4 className="text-2xl font-bold font-serif mb-3 leading-tight hover:underline cursor-pointer dark:text-white">
                        {news[0].title}
                    </h4>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                        {news[0].summary}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{news[0].source}</span>
                        <span className="text-neutral-500 dark:text-neutral-400">{news[0].date}</span>
                    </div>
                </article>
            )}

            {/* News List */}
            <div className="grid gap-6">
                {displayedItems.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-800 transition-colors">
                        <p className="text-neutral-400 dark:text-neutral-500 font-bold uppercase">Bu listede içerik bulunmuyor.</p>
                    </div>
                ) : (
                    displayedItems.map((item, index) => {
                        // Reuse existing item logic
                        const isExpanded = expandedId === item.id;
                        const isRead = readIds.includes(String(item.id));
                        const isFollowing = followedSources.includes(item.source);

                        return (
                        <article 
                            key={index} 
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className={`flex gap-4 items-start p-4 transition-all duration-300 border-l-4 cursor-pointer relative bg-white dark:bg-neutral-900 shadow-sm group
                                ${isExpanded ? 'bg-neutral-50 dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border-[#C8102E]'}
                                ${isRead && activeTab !== 'history' ? 'hidden' : ''} 
                                ${isRead ? 'opacity-75 grayscale border-neutral-300 dark:border-neutral-700' : ''}
                            `}
                        >   
                            {/* Expand Icon Indicator & Actions */}
                            <div className="absolute right-4 top-4 flex items-center gap-3 z-20">
                                {/* Action Buttons Group */}
                                {user && activeTab !== 'history' && (
                                    <div className="flex items-center gap-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm p-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm transition-opacity">
                                        <button
                                            onClick={(e) => handleMarkRead(String(item.id), e)}
                                            title={isRead ? "Okundu" : "Okundu olarak işaretle"}
                                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${isRead ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 dark:bg-neutral-800'}`}
                                        >
                                            <CheckCircle size={20} className={isRead ? 'fill-green-100 dark:fill-green-900/50' : ''} />
                                        </button>
                                        <div className="w-px h-5 bg-neutral-200 mx-1"></div>
                                        <button
                                            onClick={(e) => handleFollow(item.source, e)}
                                            title={isFollowing ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${isFollowing ? 'text-[#C8102E] bg-red-50 dark:bg-red-900/30' : 'text-neutral-400 hover:text-[#C8102E] hover:bg-red-50 dark:hover:bg-red-900/30 dark:bg-neutral-800'}`}
                                        >
                                            <Bookmark size={20} className={isFollowing ? 'fill-[#C8102E]' : ''} />
                                        </button>
                                    </div>
                                )}

                                {user && activeTab === 'history' && (
                                     <button
                                        onClick={(e) => handleUndoRead(String(item.id), e)}
                                        title="Geri Al (Tekrar Gündeme Taşı)"
                                        className="flex items-center gap-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all hover:scale-105 active:scale-95"
                                    >
                                        <RotateCcw size={14} />
                                        Geri Al
                                    </button>
                                )}
                                
                                <div className="text-neutral-300 group-hover:text-[#C8102E] transition-colors font-bold ml-1 text-2xl leading-none select-none">
                                    {isExpanded ? '−' : '+'}
                                </div>
                            </div>

                            <div className="flex-1 pr-32">
                                <div className="flex items-center gap-2 mb-1">
                                    {item.type === 'event' ? (
                                        <Calendar size={16} className="text-[#C8102E]"/>
                                    ) : item.type === 'email' ? (
                                        <Mail size={16} className="text-yellow-600"/>
                                    ) : (
                                        <Megaphone size={16} className="text-[#C8102E]"/>
                                    )}
                                    <span className={`text-xs font-bold uppercase ${item.type === 'email' ? 'text-yellow-600' : 'text-[#C8102E]'}`}>
                                        {item.type === 'event' ? 'Etkinlik' : item.type === 'email' ? 'E-POSTA' : 'Duyuru'}
                                    </span>
                                </div>
                                
                                <h4 className={`text-lg font-bold font-serif mb-2 transition-colors ${isExpanded ? (item.type === 'email' ? 'text-yellow-700 dark:text-yellow-500' : 'text-[#C8102E]') : 'text-black dark:text-white'}`}>
                                    {item.title}
                                </h4>
                                
                                {/* Summary */}
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                        {item.summary || 'Detaylar için bağlantıya tıklayınız.'}
                                    </p>
                                    <a 
                                        href={item.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`mt-3 inline-flex items-center gap-2 px-4 py-2 border-2 text-xs font-black uppercase tracking-wider transition-all group/btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] hover:translate-x-[2px] hover:translate-y-[2px]
                                            ${item.type === 'email' 
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-700 text-amber-800 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30' 
                                                : 'bg-white dark:bg-neutral-800 border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                            }
                                        `}
                                        onClick={(e) => e.stopPropagation()} 
                                    >
                                        Kaynağa Git 
                                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                    </a>
                                </div>

                                <span className="text-xs text-neutral-500 block mt-2">{item.source} · {item.date}</span>
                            </div>
                        </article>
                        );
                    })
                )}
            </div>
        </div>

        {/* Sidebar / Teknokent */}
        <div className="space-y-6">
            {/* Email Integration Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-6 relative overflow-hidden transition-colors">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-neutral-900 dark:text-white">
                    <Mail size={20} className="text-neutral-900 dark:text-white" />
                    E-Posta Entegrasyonu
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    ODTÜ e-posta hesabınızı bağlayarak kütüphane, öğrenci işleri ve bölüm duyurularını buradan takip edin.
                </p>
                {isEmailConnected ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800 border-2 border-black dark:border-white p-4 relative transition-colors">
                        <div className="flex items-center gap-2 font-black uppercase text-sm mb-1 dark:text-white">
                            <CheckCircle size={18} className="text-black dark:text-white fill-white dark:fill-black" />
                            BAĞLANTI AKTİF
                        </div>
                        <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mb-3 pl-6">
                             {loginForm.username}@metu.edu.tr
                        </div>
                        <div className="pl-6 flex gap-2">
                             <button 
                                onClick={() => setShowLoginModal(true)}
                                className="text-[10px] font-bold uppercase underline decoration-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-1 transition-colors dark:text-white"
                             >
                                YENİLE / GÜNCELLE
                             </button>
                             <button 
                                onClick={() => {
                                    setIsEmailConnected(false);
                                    setEmails([]);
                                    localStorage.removeItem('univo_cached_emails');
                                    localStorage.removeItem('univo_email_user');
                                }}
                                className="text-[10px] font-bold uppercase text-red-600 hover:bg-red-600 hover:text-white px-1 transition-all"
                             >
                                BAĞLANTIYI KES
                             </button>
                        </div>
                        {/* Status bar */}
                        {loadingEmails && <span className="text-xs ml-6 text-neutral-500 dark:text-neutral-400 animate-pulse block mt-1">E-postalar güncelleniyor...</span>}
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowLoginModal(true)}
                        className="w-full py-2.5 bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200 font-bold text-sm uppercase rounded hover:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                    >
                         ODTÜ Hesabını Bağla
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-6 relative overflow-hidden group hover:border-[#C8102E]/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C8102E]/5 to-[#C8102E]/10 dark:from-[#C8102E]/10 dark:to-[#C8102E]/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 relative z-10 text-neutral-900 dark:text-white">
                    <Briefcase size={20} className="text-[#C8102E]" />
                    Teknokent Fırsatları
                </h3>
                {/* Static sidebar jobs */}
                <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all cursor-pointer border border-neutral-100 dark:border-neutral-800 group/item">
                        <h5 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 group-hover/item:text-[#C8102E] transition-colors">{news[1].title}</h5>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">{news[1].summary}</p>
                        <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                            <span>{news[1].source}</span>
                            <span>{news[1].date}</span>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all cursor-pointer border border-neutral-100 dark:border-neutral-800 group/item">
                        <h5 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 group-hover/item:text-[#C8102E] transition-colors">Stajyer (Marketing)</h5>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">GameDev Stüdyomuz için sosyal medya yönetebilecek stajyerler...</p>
                        <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                            <span>Pixel Games</span>
                            <span>Bugün</span>
                        </div>
                    </div>
                </div>
                <button className="w-full mt-4 py-2.5 bg-[#C8102E] text-white font-bold text-sm uppercase rounded hover:bg-[#a60d26] transition-colors relative z-10 shadow-sm">
                    Tüm İlanları Gör
                </button>
            </div>

            <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm rounded-lg transition-colors">
                <h4 className="font-bold text-lg mb-4 text-center font-serif text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Günün Menüsü</h4>
                
                {loadingMenu ? (
                    <div className="text-center text-sm text-neutral-500 py-4">Menü Yükleniyor...</div>
                ) : (
                    <div className="space-y-6">
                        {menu.breakfast?.length > 0 && (
                             <div>
                                <h5 className="font-bold text-neutral-500 dark:text-neutral-400 text-sm uppercase mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                                    Kahvaltı
                                </h5>
                                <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded border border-neutral-100 dark:border-neutral-700 transition-colors">
                                    {menu.breakfast.map((i: any) => i.name).join(', ')}
                                </div>
                            </div>
                        )}

                        {(menu.lunch?.length > 0) && (
                            <div>
                                <h5 className="font-bold text-[#C8102E] text-sm uppercase mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E]"></span>
                                    Öğle Yemeği
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                    {(menu.lunch).map((item: any, index: number) => (
                                        <div key={index} className="group relative overflow-hidden rounded-lg aspect-square border border-neutral-200 dark:border-neutral-700">
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                                <span className="text-white text-[10px] font-bold leading-tight line-clamp-2">{item.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {menu.dinner?.length > 0 && (
                            <div>
                                <h5 className="font-bold text-[#C8102E] text-sm uppercase mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E]"></span>
                                    Akşam Yemeği
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                    {menu.dinner.map((item: any, index: number) => (
                                        <div key={index} className="group relative overflow-hidden rounded-lg aspect-square border border-neutral-200 dark:border-neutral-700">
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                                <span className="text-white text-[10px] font-bold leading-tight line-clamp-2">{item.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!menu.lunch?.length && !menu.breakfast?.length && !menu.dinner?.length) && (
                            <div className="text-center text-sm text-neutral-500 italic pb-2">Bugün için menü bilgisi bulunamadı.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* LOGIN MODAL */}
       {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-white/10 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="absolute right-4 top-4 text-black dark:text-white hover:rotate-90 transition-transform"
                  >
                      <X size={24} strokeWidth={3}/>
                  </button>
                  
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto mb-4 border-2 border-transparent">
                          <Lock size={32} />
                      </div>
                      <h3 className="text-2xl font-black font-serif uppercase tracking-tight dark:text-white">ODTÜ Giriş</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 font-medium">
                          E-postalarınıza erişmek için ODTÜ kullanıcı kodunuzu kullanın.
                      </p>
                  </div>

                  <form onSubmit={handleImapLogin} className="space-y-6">
                      <div>
                          <label className="block text-xs font-black uppercase text-black dark:text-white mb-2">Kullanıcı Kodu</label>
                          <div className="relative group">
                              <input 
                                  type="text"
                                  required
                                  placeholder="e123456 (Sadece kod)"
                                  className="w-full p-3 border-2 border-black dark:border-white font-mono text-sm placeholder:text-neutral-400 focus:outline-none focus:bg-neutral-50 dark:focus:bg-neutral-800 dark:text-white transition-colors dark:bg-neutral-900"
                                  value={loginForm.username}
                                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                              />
                              <span className="absolute right-3 top-3.5 text-neutral-500 font-bold pointer-events-none bg-white dark:bg-neutral-900 px-1 text-xs">@metu.edu.tr</span>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-black uppercase text-black dark:text-white mb-2">Şifre</label>
                          <input 
                              type="password"
                              required
                              placeholder="ODTÜ Şifreniz"
                              className="w-full p-3 border-2 border-black dark:border-white font-mono text-sm placeholder:text-neutral-400 focus:outline-none focus:bg-neutral-50 dark:focus:bg-neutral-800 dark:text-white transition-colors dark:bg-neutral-900"
                              value={loginForm.password}
                              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                          />
                      </div>

                      {loginError && (
                          <div className="p-3 bg-red-50 text-red-600 text-sm font-bold border-2 border-red-100 flex items-center gap-2">
                              <span className="uppercase">Hata:</span> {loginError}
                          </div>
                      )}

                      <div className="bg-neutral-100 dark:bg-neutral-800 p-4 border-2 border-black dark:border-white text-xs text-black dark:text-neutral-300 relative">
                          <p className="font-black mb-1 uppercase flex items-center gap-1 dark:text-white">
                             <Lock size={12}/> Güvenlik Notu
                          </p>
                          Şifreniz yalnızca şifreli bağlantı kurmak için anlık olarak kullanılır ve sunucularımıza <u>asla kaydedilmez</u>.
                      </div>

                      <button 
                          type="submit"
                          disabled={loadingEmails}
                          className="w-full py-4 bg-[#C8102E] text-white font-black text-sm uppercase hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {loadingEmails ? (
                              <>
                                <Loader2 size={18} className="animate-spin"/>
                                BAĞLANIYOR...
                              </>
                          ) : (
                              'GİRİŞ YAP VE BAĞLA'
                          )}
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
}
