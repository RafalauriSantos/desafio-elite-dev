import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type UserRole = 'organizer' | 'client' | 'gatekeeper';
export interface Profile { id: string; email: string; name: string; role: UserRole; }

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    const syncSession = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      if (!nextSession) { setProfile(null); setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('id,email,name,role').eq('id', nextSession.user.id).maybeSingle();
      if (mounted) { setProfile((data as Profile | null) ?? null); setLoading(false); }
    };
    void supabase.auth.getSession().then(({ data }) => syncSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { void syncSession(nextSession); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session, profile, loading, isDemoMode: !isSupabaseConfigured,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signOut: async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); },
  }), [loading, profile, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}
