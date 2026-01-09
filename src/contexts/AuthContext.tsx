'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  department?: string;
  student_id?: string;
}

interface MetuLoginResult {
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
  signInWithMetu: (username: string, password: string) => Promise<MetuLoginResult>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  signInWithMetu: async () => ({ success: false, error: 'Not implemented' }),
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
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

  const signInWithMetu = async (username: string, password: string): Promise<MetuLoginResult> => {
     try {
        const res = await fetch('/api/auth/metu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            return { success: false, error: data.error || 'Giriş başarısız' };
        }
        
        // If we received session tokens, set the session directly
        if (data.session) {
            const { error: setSessionError } = await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            });
            
            if (setSessionError) {
                console.error('Set session error:', setSessionError);
                return { success: false, error: 'Oturum oluşturulamadı.' };
            }

            // Explicitly verify session existence (Crucial for Mobile)
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, signInWithMetu }}>
      {children}
    </AuthContext.Provider>
  );
}
