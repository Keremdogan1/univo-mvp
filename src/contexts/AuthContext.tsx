'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  department?: string;
  student_id?: string;
  is_banned?: boolean;
  ban_reason?: string;
  ban_category?: string;
  banned_by?: string;
  university?: string;
  role?: string;
  is_admin?: boolean;
  notification_settings?: {
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    follows: boolean;
    friend_requests: boolean;
    email_subscription: boolean;
  };
}

interface UniversityLoginResult {
  success: boolean;
  studentInfo?: {
      fullName: string;
      username: string;
      department: string;
  };
  error?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signIn: (username: string, password: string, universityId: string) => Promise<UniversityLoginResult>;
  signInWithMetu: (username: string, password: string) => Promise<UniversityLoginResult>; // Keep for compatibility temporarily
  setViewLoading: (loading: boolean) => void;
  isGlobalLoading: boolean;
  authLoading: boolean;
  isBanned: boolean;
  banInfo: { category?: string; reason?: string; bannedBy?: string } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  signIn: async () => ({ success: false, error: 'Not implemented' }),
  signInWithMetu: async () => ({ success: false, error: 'Not implemented' }),
  setViewLoading: () => {},
  isGlobalLoading: true,
  authLoading: true,
  isBanned: false,
  banInfo: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isViewLoading, setIsViewLoading] = useState(true);
  const [forceLoading, setForceLoading] = useState(true);

  // setViewLoading helper for components to register their load state
  const setViewLoading = useCallback((loading: boolean) => {
    setIsViewLoading(loading);
  }, []);

  // Unified loading signal
  const isGlobalLoading = authLoading || isViewLoading || forceLoading;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      if (data.university === 'bilkent') {
          localStorage.setItem('themeColor', '#002D72');
          document.documentElement.style.setProperty('--primary-rgb', '0 45 114'); // #002D72
      } else if (data.university === 'metu' || !data.university) {
          localStorage.setItem('themeColor', '#C8102E');
          document.documentElement.style.setProperty('--primary-rgb', '200 16 46'); // #C8102E
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (username: string, password: string, universityId: string): Promise<UniversityLoginResult> => {
     try {
        const res = await fetch(`/api/auth/${universityId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            return { success: false, error: data.error || 'Giriş başarısız' };
        }
        
        if (data.session) {
            const { error: setSessionError } = await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            });
            
            if (setSessionError) {
                console.error('Set session error:', setSessionError);
                return { success: false, error: 'Oturum oluşturulamadı.' };
            }

            const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
            if (getSessionError || !session) {
                console.error('Session verify error:', getSessionError);
                return { success: false, error: 'Cihazınızda oturum açılamadı (Cookie sorunu).' };
            }
        }
        
        return { 
            success: true, 
            studentInfo: data.studentInfo
        };
     } catch (err: any) {
         return { success: false, error: err.message || 'Sunucu hatası' };
     }
  };

  const signInWithMetu = (username: string, password: string) => signIn(username, password, 'metu');

  useEffect(() => {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 300; // Minimum time to show skeleton (ms)

    // Force delay timer
    const forceTimer = setTimeout(() => setForceLoading(false), MIN_LOADING_TIME);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error && (error.message.includes('refresh_token') || error.message.includes('Refresh Token Not Found'))) {
        console.warn('Stale session detected, clearing...', error);
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      } else {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }
      
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle potential refresh token errors that might trigger this change
      if (event === 'SIGNED_OUT' || (event as any) === 'TOKEN_REFRESHED' && !session) {
          // If we're effectively signed out or a refresh failed, ensure local state is clean
          setUser(null);
          setProfile(null);
      } else if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });

    // Safety timeout: Ensure loading state is cleared after 2.5s regardless of Supabase response
    const timeout = setTimeout(() => {
        setAuthLoading(false);
        setForceLoading(false);
        setIsViewLoading(false);
    }, 3000); // 3s safety timeout


    return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
        clearTimeout(forceTimer);
    };
  }, []);

  const signOut = async () => {
    try {
      // Also clear admin session if it exists
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error('Admin logout failed during signout:', e);
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Compute ban status from profile
  const isBanned = profile?.is_banned ?? false;
  const banInfo = isBanned ? {
    category: profile?.ban_category,
    reason: profile?.ban_reason,
    bannedBy: profile?.banned_by
  } : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading: isGlobalLoading,
      isGlobalLoading,
      authLoading,
      signOut, 
      refreshProfile, 
      signIn,
      signInWithMetu,
      setViewLoading,
      isBanned,
      banInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
}
