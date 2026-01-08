import { Calendar, ChevronRight, Download, Search, Briefcase, Megaphone, Bookmark, Star, Filter, ArrowRight, Share2, Mail, CheckCircle, RotateCcw, X, Lock, Loader2, Trash2, GraduationCap } from 'lucide-react';
import * as React from 'react';
import Link from 'next/link';
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
  const [activeTab, setActiveTab] = React.useState<'agenda' | 'emails' | 'history' | 'starred' | 'odtuclass'>('agenda');
  const [followedSources, setFollowedSources] = React.useState<string[]>([]);
  const [starredIds, setStarredIds] = React.useState<string[]>([]);
  const [blockedSources, setBlockedSources] = React.useState<string[]>([]);
  const [subscribedSources, setSubscribedSources] = React.useState<string[]>([]);

  // Check Session & Auto-Connect
  React.useEffect(() => {
    async function checkSession() {
        try {
            // Load cache for immediate display
            const cached = localStorage.getItem('univo_cached_emails');
            const savedUser = localStorage.getItem('univo_email_user');
            const savedFollows = localStorage.getItem('univo_followed_sources');
            const savedStars = localStorage.getItem('univo_starred_ids');
            const savedBlocked = localStorage.getItem('univo_blocked_sources');
            const savedSubscribed = localStorage.getItem('univo_subscribed_sources');
            
            if (cached) setEmails(JSON.parse(cached));
            if (savedFollows) setFollowedSources(JSON.parse(savedFollows));
            if (savedStars) setStarredIds(JSON.parse(savedStars));
            if (savedBlocked) setBlockedSources(JSON.parse(savedBlocked));
            if (savedSubscribed) setSubscribedSources(JSON.parse(savedSubscribed));

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
                    link: `https://metumail.metu.edu.tr/`
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

  const handleStar = async (id: string, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    const idStr = String(id);
    setStarredIds(prev => {
        const isStarred = prev.includes(idStr);
        const newStars = isStarred ? prev.filter(i => i !== idStr) : [...prev, idStr];
        localStorage.setItem('univo_starred_ids', JSON.stringify(newStars));
        if (!isStarred) toast.success('Yıldızlılara eklendi.');
        return newStars;
    });
  };

  const handleBlockSource = (source: string) => {
    if (!confirm(`"${source}" kaynağından gelen gönderileri gizlemek istediğinize emin misiniz?`)) return;
    setBlockedSources(prev => {
        const newBlocked = [...prev, source];
        localStorage.setItem('univo_blocked_sources', JSON.stringify(newBlocked));
        toast.info(`"${source}" engellendi.`);
        return newBlocked;
    });
  };

  const handleSubscribeSource = (source: string) => {
    setSubscribedSources(prev => {
        const isSubscribed = prev.includes(source);
        const newSubs = isSubscribed ? prev.filter(s => s !== source) : [...prev, source];
        localStorage.setItem('univo_subscribed_sources', JSON.stringify(newSubs));
        if (!isSubscribed) toast.success(`"${source}" kaynağına abone olundu. Yeni içeriklerde bilgilendirileceksiniz.`);
        return newSubs;
    });
  };

  const handleClearHistory = async () => {
    if (!confirm('Tüm geçmişi silmek istediğinize emin misiniz?')) return;
    if (user) {
        await supabase.from('announcement_reads').delete().eq('user_id', user.id);
    }
    setReadIds([]);
    toast.success('Geçmiş temizlendi.');
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

  // ODTUClass Data (Real or Mock) - Only show if user is logged in
  const realCourses = user?.user_metadata?.odtu_courses;
  const odtuClassData = !user ? [] : ((realCourses && realCourses.length > 0) ? realCourses.map((c: any) => ({
      id: `oc-${c.url}`,
      title: c.name,
      source: 'ODTÜClass',
      type: 'grade', // Use 'grade' type styling (Violet) for courses
      course: c.name.split(' ')[0], // Heuristic for short code
      date: 'Güz 2025',
      summary: 'Ders sayfasına gitmek için tıklayınız.',
      link: c.url
  })) : [
    {
        id: 'oc1',
        title: 'PHYS105 - Midterm 2 Sonuçları',
        source: 'ODTÜClass',
        type: 'grade',
        course: 'PHYS105',
        date: 'Bugün, 14:30',
        summary: '2. Ara sınav sonuçları açıklanmıştır. Kağıtlarınızı 8 Ocak Çarşamba 13:30-15:30 arasında P-102 ofisinde görebilirsiniz.',
        link: 'https://odtuclass2025f.metu.edu.tr/my/'
    },
    {
        id: 'oc2',
        title: 'MATH119 - Yeni Ödev Eklendi',
        source: 'ODTÜClass',
        type: 'assignment',
        course: 'MATH119',
        date: 'Dün',
        summary: 'WebWork Assignment 5 sisteme yüklenmiştir. Son teslim tarihi: 12 Ocak 23:59.',
        link: 'https://odtuclass2025f.metu.edu.tr/my/'
    },
    {
        id: 'oc3',
        title: 'CENG140 - Lab 3 Duyurusu',
        source: 'ODTÜClass',
        type: 'announcement',
        course: 'CENG140',
        date: '3 gün önce',
        summary: 'Bu haftaki laboratuvar dersi online yapılacaktır. Zoom linki ders sayfasında paylaşılmıştır.',
        link: 'https://odtuclass2025f.metu.edu.tr/my/'
    }
  ]);

  // Filtered Lists
  // GÜNDEM: Unread Items AND NOT Emails (Announcements Only) AND Last 7 Days
  const filteredNews = allNews.filter(item => {
    // 1. Blocked sources filter
    if (blockedSources.includes(item.source)) return false;

    if (activeTab === 'agenda') return (item.type === 'announcement' || item.type === 'event');
    // Emails tab: only show emails if user is logged in
    if (activeTab === 'emails') return user && item.type === 'email';
    if (activeTab === 'odtuclass') return false; // Handled separately
    if (activeTab === 'starred') return starredIds.includes(String(item.id));
    if (activeTab === 'history') return readIds.includes(String(item.id));
    return true;
  });

  const displayedItems = activeTab === 'odtuclass' ? odtuClassData : filteredNews.filter(item => {
    if (activeTab === 'agenda' || activeTab === 'emails') {
        return !readIds.includes(String(item.id));
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Newspaper Header - Sticky on mobile */}
      <div className="border-b-4 border-black dark:border-white pb-4 mb-8 text-center transition-colors md:static sticky top-0 z-[9998] bg-neutral-50 dark:bg-[#0a0a0a] pt-4 -mt-4 -mx-4 px-4">
        <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tight mb-2 text-black dark:text-white">Resmi Gündem</h2>
        <div className="flex justify-between items-center text-sm font-medium border-t border-black dark:border-white pt-2 max-w-2xl mx-auto text-neutral-600 dark:text-neutral-400">
          <span>SAYI: {issueNumber}</span>
          <Link 
            href="/official/archive" 
            className="flex items-center gap-1 hover:underline decoration-2 underline-offset-4 cursor-pointer font-bold uppercase dark:text-neutral-300"
            style={{ color: 'var(--primary-color, #C8102E)' }}
          >
            <Briefcase size={14} />
            Belge Arşivi
          </Link>
          <span>{formattedDate.toUpperCase()}</span>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8 min-w-0 overflow-hidden">
            
            {/* Pinned Announcement */}
            {news[0] && (
                <div className="border-4 border-black dark:border-white p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] relative overflow-hidden">
                     <div className="absolute -top-3 left-6 bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider -rotate-1 shadow-sm">
                        Önemli Duyuru
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2 dark:text-white mt-2 break-words">
                        <Megaphone size={20} className="text-red-600" />
                        {news[0].title}
                    </h3>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
                        {news[0].summary}
                    </p>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                        <span>{news[0].source} · {news[0].date}</span>
                        <a href={news[0].link} className="flex items-center gap-1 hover:underline decoration-2 underline-offset-2 text-black dark:text-white">
                            Detaylar <ArrowRight size={12}/>
                        </a>
                    </div>
                </div>
            )}

            {/* Tab Navigation - Icons always visible, active tab shows label */}
            <div className="flex border-b-2 border-neutral-200 dark:border-neutral-800 mb-6 gap-1 sm:gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                    { id: 'agenda', label: 'GÜNDEM', count: allNews.filter(n => (!readIds.includes(String(n.id)) && (n.type === 'announcement' || n.type === 'event'))).length, icon: <Megaphone size={14} className="shrink-0"/> },
                    { id: 'emails', label: 'E-POSTA', count: user ? emails.filter(n => !readIds.includes(String(n.id))).length : 0, icon: <Mail size={14} className="shrink-0"/> },
                    { id: 'odtuclass', label: 'ODTÜCLASS', count: odtuClassData.length, icon: <GraduationCap size={14} className="shrink-0"/> },
                    { id: 'starred', label: '', count: starredIds.length, icon: <Star size={14} className="shrink-0"/> },
                    { id: 'history', label: '', icon: <Trash2 size={14} className="shrink-0"/>, count: readIds.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 pt-1 px-2 font-black text-xs tracking-wider uppercase transition-colors relative flex items-center gap-1 shrink-0 ${
                            activeTab === tab.id 
                            ? 'text-black dark:text-white' 
                            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`}
                        title={tab.id === 'history' ? 'Çöp Kutusu' : tab.label}
                    >
                        {tab.icon}
                        {/* Show label only for active tab on small screens, always on larger */}
                        {tab.label && (
                            <span className={activeTab === tab.id ? 'inline' : 'hidden sm:inline'}>{tab.label}</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                            activeTab === tab.id 
                            ? 'bg-black text-white dark:bg-white dark:text-black' 
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                        }`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-black dark:bg-white animate-in fade-in slide-in-from-left-2 duration-300" />
                        )}
                    </button>
                ))}

                {activeTab === 'history' && readIds.length > 0 && (
                    <button 
                        onClick={handleClearHistory}
                        className="ml-auto pb-3 text-[10px] font-black uppercase text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 shrink-0"
                    >
                        <X size={12}/> Sil
                    </button>
                )}
            </div>

            {/* Featured Post (Only show on Agenda for impact, or always? Let's hide on Archive) */}


            {/* News List */}
            <div className="grid gap-6">
                {displayedItems.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-800 transition-colors">
                        {/* Login prompt for protected tabs */}
                        {!user && (activeTab === 'emails' || activeTab === 'odtuclass') ? (
                            <div className="space-y-3">
                                <Lock size={32} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                                <p className="text-neutral-600 dark:text-neutral-400 font-medium max-w-xs mx-auto">
                                    {activeTab === 'emails' 
                                        ? 'ODTÜ e-posta hesabınızı bağlayarak kütüphane, öğrenci işleri ve bölüm duyurularını buradan takip edin.'
                                        : 'ODTÜClass derslerinizi ve ödevlerinizi takip etmek için giriş yapın.'
                                    }
                                </p>
                                <a 
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-4 py-2 font-bold text-sm uppercase rounded hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: 'var(--primary-color, #C8102E)', color: 'white' }}
                                >
                                    Giriş Yap
                                </a>
                            </div>
                        ) : (
                            <p className="text-neutral-400 dark:text-neutral-500 font-bold uppercase">Bu listede içerik bulunmuyor.</p>
                        )}
                    </div>
                ) : (
                    displayedItems.map((item: any, index: number) => {
                        // Reuse existing item logic
                        const isExpanded = expandedId === item.id;
                        const isRead = readIds.includes(String(item.id));
                        const isFollowing = followedSources.includes(item.source);

                        return (
                        <article 
                            key={index} 
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className={`flex flex-col sm:flex-row gap-2 sm:gap-4 items-start p-3 sm:p-4 transition-all duration-300 border-l-4 cursor-pointer relative bg-white dark:bg-neutral-900 shadow-sm group min-w-0 overflow-hidden
                                ${isExpanded ? 'bg-neutral-50 dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                                ${isRead && (activeTab !== 'history' && activeTab !== 'starred') ? 'hidden' : ''} 
                                ${isRead ? 'opacity-75 grayscale' : ''}
                            `}
                            style={{ 
                                borderLeftColor: isRead 
                                    ? 'transparent' 
                                    : (item.type === 'event' 
                                        ? '#2563eb' // Blue-600
                                        : item.type === 'email' 
                                            ? '#d97706' // Amber-600
                                            : (item.type === 'grade' || item.type === 'assignment')
                                                ? '#7c3aed' // Violet
                                                : '#059669' // Emerald-600
                                      )
                            }}
                        >   
                            {/* Star Indicator - Ribbon Style */}
                            {starredIds.includes(String(item.id)) && (
                                <div className="absolute -left-1 top-4 z-20 shadow-sm">
                                    <div className="bg-yellow-400 text-white p-1 rounded-r-md shadow-md animate-in slide-in-from-left-2">
                                        <Star size={12} className="fill-white" />
                                    </div>
                                    <div className="absolute top-full left-0 w-1 h-1 bg-yellow-600 rounded-bl-full brightness-75"></div>
                                </div>
                            )}

                            {/* Source Controls - Absolute positioned near expand button */}
                            {(activeTab !== 'history') && (
                                <div className="absolute right-12 top-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleSubscribeSource(item.source); }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded shadow-sm text-[9px] font-bold uppercase transition-all hover:scale-105 active:scale-95 border border-transparent
                                            ${subscribedSources.includes(item.source) 
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' 
                                                : 'bg-white dark:bg-neutral-800 text-emerald-600 border-neutral-200 dark:border-neutral-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                                        title={subscribedSources.includes(item.source) ? "Abonelikten Çık" : "Kaynağa Abone Ol"}
                                    >
                                        {subscribedSources.includes(item.source) ? <CheckCircle size={10} className="fill-current"/> : <Megaphone size={10}/>}
                                        {subscribedSources.includes(item.source) ? 'Abone' : 'Abone Ol'}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleBlockSource(item.source); }}
                                        className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shadow-sm text-[9px] font-bold uppercase transition-all hover:scale-105 active:scale-95 border border-neutral-200 dark:border-neutral-700 hover:border-red-200 dark:hover:border-red-800"
                                        title="Kaynağı Engelle"
                                    >
                                        <X size={10}/> Engelle
                                    </button>
                                </div>
                            )}

                            {/* Expand Icon Indicator */}
                            <div className="absolute right-4 top-4 flex items-center gap-3 z-10 text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white transition-colors">
                                <div className="font-bold ml-1 text-2xl leading-none select-none">
                                    {isExpanded ? '−' : '+'}
                                </div>
                            </div>

                            <div className="flex-1 pr-32">
                                <div className="flex items-center gap-2 mb-1">
                                    {item.type === 'event' ? (
                                        <Calendar size={16} className="text-blue-600"/>
                                    ) : item.type === 'email' ? (
                                        <Mail size={16} className="text-amber-600"/>
                                    ) : (item.type === 'grade' || item.type === 'assignment') ? (
                                        <GraduationCap size={16} className="text-violet-600"/>
                                    ) : (
                                        <Megaphone size={16} className="text-emerald-600"/>
                                    )}
                                    <span className={`text-xs font-bold uppercase ${item.type === 'event' ? 'text-blue-600' : item.type === 'email' ? 'text-amber-600' : (item.type === 'grade' || item.type === 'assignment') ? 'text-violet-600' : 'text-emerald-600'}`}>
                                        {item.type === 'event' ? 'Etkinlik' : item.type === 'email' ? 'E-POSTA' : (item.type === 'grade' || item.type === 'assignment') ? item.course : 'Duyuru'}
                                    </span>
                                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{item.source}</span>
                                    
                                    {subscribedSources.includes(item.source) && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-[8px] font-black text-emerald-700 dark:text-emerald-400 rounded uppercase">
                                            Abone
                                        </div>
                                    )}
                                </div>
                                
                                <h4 className={`text-base sm:text-lg font-bold font-serif mb-2 transition-colors break-words ${isExpanded ? (item.type === 'email' ? 'text-yellow-700 dark:text-yellow-500' : item.type === 'event' ? 'text-blue-700 dark:text-blue-500' : 'text-emerald-700 dark:text-emerald-500') : 'text-black dark:text-white'}`}>
                                    {item.title}
                                </h4>
                                
                                {/* Summary */}
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                        {item.summary || 'Detaylar için bağlantıya tıklayınız.'}
                                    </p>
                                    
                                    {/* Responsive Actions Area - Dynamic Colors */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2 mb-4">
                                        {/* Dynamic Theme Class Generator */}
                                        {(() => {
                                            // Always use colorful active classes, regardless of isRead
                                            // Violet for ODTUClass, Blue for Events, Amber for Email, Emerald for Announcement
                                            const activeColorClass = item.type === 'email' 
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-600 !text-amber-800 dark:!text-amber-400' 
                                                : item.type === 'event'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 !text-blue-800 dark:!text-blue-400'
                                                    : (item.type === 'grade' || item.type === 'assignment')
                                                        ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-600 !text-violet-800 dark:!text-violet-400' 
                                                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 !text-emerald-800 dark:!text-emerald-400';
                                            
                                            // Use hoverClass for better interactivity
                                            const hoverClass = item.type === 'email' ? 'hover:bg-amber-100 dark:hover:bg-amber-900/40' : item.type === 'event' ? 'hover:bg-blue-100 dark:hover:bg-blue-900/40' : (item.type === 'grade' || item.type === 'assignment') ? 'hover:bg-violet-100 dark:hover:bg-violet-900/40' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40';
                                            const shadowClass = 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]';

                                            return (
                                            <>
                                                <button
                                                    onClick={(e) => handleMarkRead(String(item.id), e)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${shadowClass} ${activeColorClass} ${hoverClass}`}
                                                >
                                                    {isRead ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border-2 border-current" />}
                                                    {isRead ? 'Okundu' : 'Okundu İşaretle'}
                                                </button>

                                                <button
                                                    onClick={(e) => handleStar(String(item.id), e)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${shadowClass} ${starredIds.includes(String(item.id)) ? activeColorClass : activeColorClass} ${hoverClass}`}
                                                >
                                                    <Star size={12} className={starredIds.includes(String(item.id)) ? 'fill-current' : ''} />
                                                    {starredIds.includes(String(item.id)) ? 'Yıldızlı' : 'Yıldızla'}
                                                </button>

                                                <a 
                                                    href={item.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider transition-all group/btn active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${shadowClass} ${activeColorClass} ${hoverClass}`}
                                                >
                                                    <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                    Kaynağa Git
                                                </a>
                                            </>
                                            );
                                        })()}

                                        {activeTab === 'history' && (
                                            <button
                                                onClick={(e) => handleUndoRead(String(item.id), e)}
                                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border-2 border-neutral-200 dark:border-neutral-700 text-[10px] font-black uppercase tracking-wider bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all shadow-sm"
                                            >
                                                <RotateCcw size={12} />
                                                Geri Al
                                            </button>
                                        )}
                                    </div> 

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

             {/* Teknokent Job */}
            {news[1] && (
                <article className="border-4 border-black dark:border-white p-6 bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] relative transition-colors group cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b-2 border-black dark:border-white pb-2 text-neutral-900 dark:text-white uppercase font-serif tracking-tight">
                        <Briefcase size={20} className="text-neutral-900 dark:text-white" />
                        Kariyer & Staj
                    </h3>
                    
                    <h4 className="font-bold text-lg mb-2 group-hover:underline decoration-2 underline-offset-2 dark:text-white">{news[1].title}</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                        {news[1].summary}
                    </p>
                    <div className="flex justify-between items-center text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                        <span>{news[1].source}</span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-black dark:text-white">
                            Başvur <ArrowRight size={12}/>
                        </span>
                    </div>
                </article>
            )}

            <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] transition-colors rounded-sm">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2 font-serif uppercase tracking-tight text-neutral-900 dark:text-white border-b-2 border-black dark:border-white pb-2">
                    Günün Menüsü
                </h4>
                
                {loadingMenu ? (
                    <div className="text-center text-sm text-neutral-500 py-4">Menü Yükleniyor...</div>
                ) : (
                    <div className="space-y-6">
                        {menu.breakfast?.length > 0 && (
                             <div>
                                <h5 className="font-bold text-neutral-900 dark:text-white text-sm uppercase mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}></span>
                                    Kahvaltı
                                </h5>
                                <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded border border-neutral-100 dark:border-neutral-700 transition-colors">
                                    {menu.breakfast.map((i: any) => i.name).join(', ')}
                                </div>
                            </div>
                        )}

                         {(menu.lunch?.length > 0) && (
                            <div>
                                <h5 className="font-bold text-sm uppercase mb-3 flex items-center gap-2 text-neutral-900 dark:text-white">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}></span>
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
                                <h5 className="font-bold text-sm uppercase mb-3 flex items-center gap-2 text-neutral-900 dark:text-white">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-color, #C8102E)' }}></span>
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
               <div className="bg-white dark:bg-neutral-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
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
                          className="w-full py-4 bg-primary text-white font-black text-sm uppercase hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
