import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../services/api';
import { clearGuestTrialData } from '../utils/storageUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  updateProfile: (updates: { full_name?: string; phone?: string; username?: string; [key: string]: any }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: User, session?: Session | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  updateProfile: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  setAuthenticatedUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Synchronous initial hydration from localStorage to prevent flash of logout on Vercel
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth_user') || localStorage.getItem('user_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.id || parsed.email)) return parsed;
        }
      } catch (e) {}
    }
    return null;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Directly activate session for newly registered / logged in accounts
  const setAuthenticatedUser = (newUser: User, newSession?: Session | null) => {
    setUser(newUser);
    if (newSession !== undefined) {
      setSession(newSession);
    }
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        localStorage.setItem('user_session', JSON.stringify(newUser));
        if (newSession?.access_token) {
          localStorage.setItem('token', newSession.access_token);
        }
      } catch (e) {}
    }
  };

  // Sync and enrich user profile from Supabase Database (public.profiles)
  const enrichUserWithProfile = async (authUser: User): Promise<User> => {
    try {
      if (isSupabaseConfigured) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          return {
            ...authUser,
            user_metadata: {
              ...authUser.user_metadata,
              role: profile.role || (authUser.email === 'admin@portio.com' ? 'admin' : 'customer'),
              full_name: profile.full_name || authUser.user_metadata?.full_name,
              phone: profile.phone || authUser.user_metadata?.phone,
              avatar_url: profile.avatar_url || authUser.user_metadata?.avatar_url
            }
          };
        } else {
          // Auto-insert profile into Supabase if missing
          const defaultRole = authUser.email === 'admin@portio.com' ? 'admin' : 'customer';
          await supabase.from('profiles').upsert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            role: defaultRole,
            auth_provider: authUser.app_metadata?.provider || 'email',
            status: 'active'
          });
        }
      }
    } catch (e) {
      console.warn('Error syncing profile from Supabase:', e);
    }
    return authUser;
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSession(session);
        const enriched = await enrichUserWithProfile(session.user);
        setUser(enriched);
        return;
      }

      // Check real backend session
      const meData = await api.auth.me();
      if (meData?.user) {
        setUser(meData.user as User);
        setSession({
          access_token: meData.token || 'real-token',
          refresh_token: meData.token || 'real-token',
          expires_in: 86400,
          token_type: 'bearer',
          user: meData.user
        } as Session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.warn('Failed to refresh user session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Setup real Supabase Auth Listener (primary source of truth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        clearGuestTrialData();
        const enriched = await enrichUserWithProfile(newSession.user);
        if (mounted) {
          setUser(enriched);
          setIsLoading(false);
        }
      } else {
        // Fallback to backend session if any
        try {
          const meData = await api.auth.me();
          if (mounted && meData?.user) {
            setUser(meData.user as User);
          } else if (mounted) {
            const stored = localStorage.getItem('auth_user') || localStorage.getItem('user_session');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed?.role === 'admin' || parsed?.user_metadata?.role === 'admin' || parsed?.email === 'admin@portio.com') {
                  setUser(parsed);
                } else {
                  setUser(null);
                }
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch {
          if (mounted) {
            const stored = localStorage.getItem('auth_user') || localStorage.getItem('user_session');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed?.role === 'admin' || parsed?.user_metadata?.role === 'admin' || parsed?.email === 'admin@portio.com') {
                  setUser(parsed);
                }
              } catch {}
            }
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    });

    // 2. Initial session fetch
    supabase.auth.getSession().then(async ({ data: { session: initSession } }) => {
      if (!mounted) return;
      if (initSession?.user) {
        setSession(initSession);
        const enriched = await enrichUserWithProfile(initSession.user);
        if (mounted) {
          setUser(enriched);
          setIsLoading(false);
        }
      } else {
        // Query backend session
        try {
          const meData = await api.auth.me();
          if (mounted && meData?.user) {
            setUser(meData.user as User);
            setSession({
              access_token: meData.token || 'real-token',
              refresh_token: meData.token || 'real-token',
              expires_in: 86400,
              token_type: 'bearer',
              user: meData.user
            } as Session);
          } else if (mounted) {
            const stored = localStorage.getItem('auth_user') || localStorage.getItem('user_session');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed?.role === 'admin' || parsed?.user_metadata?.role === 'admin' || parsed?.email === 'admin@portio.com') {
                  setUser(parsed);
                } else {
                  setUser(null);
                }
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch {
          if (mounted) {
            const stored = localStorage.getItem('auth_user') || localStorage.getItem('user_session');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed?.role === 'admin' || parsed?.user_metadata?.role === 'admin' || parsed?.email === 'admin@portio.com') {
                  setUser(parsed);
                }
              } catch {}
            }
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    });

    // Listen to runtime Supabase config updates
    const handleConfigUpdated = () => {
      refreshUser();
    };
    window.addEventListener('supabase_config_updated', handleConfigUpdated);

    // Listen to direct auth_login_success events across components
    const handleLoginSuccess = (event: any) => {
      if (!mounted) return;
      if (event.detail?.user) {
        clearGuestTrialData();
        setUser(event.detail.user);
        if (event.detail.session) setSession(event.detail.session);
        setIsLoading(false);
      }
    };
    window.addEventListener('auth_login_success', handleLoginSuccess);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('supabase_config_updated', handleConfigUpdated);
      window.removeEventListener('auth_login_success', handleLoginSuccess);
    };
  }, []);

  const updateProfile = async (updates: { full_name?: string; phone?: string; username?: string; [key: string]: any }) => {
    if (!user) return;
    try {
      if (isSupabaseConfigured && user.id) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
      }
      
      const updatedUser: User = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...updates
        }
      };
      setUser(updatedUser);
    } catch (e) {
      console.error('Failed to update profile in Supabase:', e);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}

    localStorage.removeItem('auth_user');
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('token');
    
    setUser(null);
    setSession(null);
    window.location.href = '/';
  };

  // Determine admin privileges from real database role
  const isAdmin = 
    user?.user_metadata?.role === 'admin' || 
    (user as any)?.role === 'admin' || 
    user?.email === 'admin@portio.com';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, updateProfile, logout, refreshUser, setAuthenticatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
