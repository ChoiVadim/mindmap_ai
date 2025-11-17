'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      const initialUser = session?.user ?? null;
      setUser(initialUser);
      userRef.current = initialUser;
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      const previousUser = userRef.current;
      const newUser = session?.user ?? null;
      
      setSession(session);
      setUser(newUser);
      userRef.current = newUser;
      setLoading(false);
      
      // Only refresh router on significant auth events (login, logout)
      // Not on every state change (like tab switches or token refreshes)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Only refresh if user actually changed (login/logout)
        if ((previousUser === null && newUser !== null) || (previousUser !== null && newUser === null)) {
          router.refresh();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear local state immediately
    setUser(null);
    setSession(null);
    setLoading(false);
    // Use window.location for a hard redirect to ensure clean state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

