import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  updateProfile: (updates: { full_name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  updateProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a demo session from local storage first (for prototyping without real DB)
    const isDemo = localStorage.getItem('demo_auth') === 'true';
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setSession({
          access_token: 'demo-token',
          refresh_token: 'demo-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: parsed
        } as Session);
        setIsLoading(false);
        return;
      } catch (e) {}
    }

    if (isDemo) {
      const demoUser = {
        id: 'demo-user-id',
        email: 'admin@portio.com',
        user_metadata: { full_name: 'Admin User', name: 'Admin User', role: 'admin' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(demoUser);
      localStorage.setItem('auth_user', JSON.stringify(demoUser));
      setSession({
        access_token: 'demo-token',
        refresh_token: 'demo-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: demoUser
      } as Session);
      setIsLoading(false);
      return;
    }

    // Basic auth listener setup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: { full_name?: string }) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        ...updates
      }
    };
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  // For architectural purposes, assume user with specific metadata is admin or demo session
  const isAdmin = user?.user_metadata?.role === 'admin' || localStorage.getItem('demo_auth') === 'true';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
