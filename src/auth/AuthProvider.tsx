import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { friendlyAuthError } from '../lib/errors';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator';
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) return null;
    return data as Profile | null;
  }, []);

  const initialize = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setState({ session: null, user: null, profile: null, loading: false, error: null });
      return;
    }

    // Validate the access token before trusting it. A stale/invalid token
    // (e.g. after the refresh token expired server-side) would otherwise let
    // the user into the app only to have every authenticated request fail.
    const { error: tokenError } = await supabase.auth.getUser(session.access_token);
    if (tokenError) {
      await supabase.auth.signOut();
      setState({ session: null, user: null, profile: null, loading: false, error: null });
      return;
    }

    const profile = await loadProfile(session.user.id);
    setState({
      session,
      user: session.user,
      profile,
      loading: false,
      error: null,
    });
  }, [loadProfile]);

  useEffect(() => {
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session) {
          setState({ session: null, user: null, profile: null, loading: false, error: null });
          return;
        }

        const profile = await loadProfile(session.user.id);
        setState({
          session,
          user: session.user,
          profile,
          loading: false,
          error: null,
        });
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, loadProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const message = friendlyAuthError(error);
      setState((s) => ({ ...s, loading: false, error: message }));
      return { error: message };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    await supabase.auth.signOut();
    setState({ session: null, user: null, profile: null, loading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
