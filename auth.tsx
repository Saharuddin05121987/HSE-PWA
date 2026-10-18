'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './sync';

export type Role = 'super_admin' | 'project_manager' | 'hse_officer' | 'production_supervisor' | 'field_worker';
export type Profile = { id: string; full_name: string; role: Role; project_id: string | null };
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin', project_manager: 'Project Manager', hse_officer: 'HSE Officer',
  production_supervisor: 'Production Supervisor', field_worker: 'Field Worker',
};

const Ctx = createContext<{ user: User | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> }>(
  { user: null, profile: null, loading: true, signOut: async () => {} }
);
export const useAuth = () => useContext(Ctx);

const CACHE = 'prodhse:profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u: User | null) {
    setUser(u);
    if (!u) { localStorage.removeItem(CACHE); setProfile(null); return; }
    // Profil di-cache agar aplikasi tetap terbuka saat offline
    const cached = localStorage.getItem(CACHE);
    if (cached) { const c = JSON.parse(cached); if (c.id === u.id) setProfile(c); }
    if (!navigator.onLine) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (data) { setProfile(data as Profile); localStorage.setItem(CACHE, JSON.stringify(data)); }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => { await loadProfile(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { loadProfile(s?.user ?? null); });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ user, profile, loading, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</Ctx.Provider>;
}
