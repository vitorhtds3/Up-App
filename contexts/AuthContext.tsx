import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { removePushToken } from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: 'Erro ao fazer login. Verifique sua conexão.' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: 'client' } },
      });
      if (error) return { error: error.message };

      if (data.user) {
        const { error: dbError } = await supabase
          .from('users')
          .upsert(
            {
              id: data.user.id,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              role: 'client',
              phone: null,
            },
            { onConflict: 'id' }
          );
        if (dbError) {
          console.error('[Auth] Error saving user to DB:', dbError.message);
        }
      }

      return { error: null };
    } catch {
      return { error: 'Erro ao criar conta. Verifique sua conexão.' };
    }
  };

  const signOut = async () => {
    await removePushToken().catch(() => {});
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
