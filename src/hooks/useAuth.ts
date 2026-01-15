import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'supervisor' | 'inspector';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
  });

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });

      if (error) {
        console.error('Error fetching role:', error);
        return null;
      }

      return data as UserRole | null;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  };

  const fetchUserRoleWithTimeout = async (userId: string, timeoutMs = 5000) => {
    try {
      const timeout = new Promise<null>((resolve) => {
        const t = setTimeout(() => {
          clearTimeout(t);
          resolve(null);
        }, timeoutMs);
      });

      return await Promise.race([fetchUserRole(userId), timeout]);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Check if this is a new browser session (sessionStorage is cleared when browser closes)
    const isNewBrowserSession = !sessionStorage.getItem('app_session_active');
    
    if (isNewBrowserSession) {
      // Force logout to clear any persisted session from localStorage
      supabase.auth.signOut({ scope: 'local' }).then(() => {
        sessionStorage.setItem('app_session_active', 'true');
      });
    } else {
      sessionStorage.setItem('app_session_active', 'true');
    }

    // Failsafe: if the auth SDK hangs for any reason, never keep the UI stuck on loading.
    const failSafeTimer = window.setTimeout(() => {
      if (!isMounted) return;
      setAuthState((prev) => (prev.isLoading ? { ...prev, isLoading: false } : prev));
    }, 7000);

    const updateRoleAsync = async (userId: string) => {
      const role = await fetchUserRoleWithTimeout(userId);
      if (!isMounted) return;
      setAuthState((prev) => (prev.user?.id === userId ? { ...prev, role } : prev));
    };

    // Set up auth state listener BEFORE getting session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (!isMounted) return;
      clearTimeout(failSafeTimer);

      if (session?.user) {
        // IMPORTANT: never block UI waiting for role; fetch it in background.
        setAuthState({
          user: session.user,
          session,
          role: null,
          isLoading: false,
        });
        void updateRoleAsync(session.user.id);
      } else {
        setAuthState({
          user: null,
          session: null,
          role: null,
          isLoading: false,
        });
      }
    });

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        clearTimeout(failSafeTimer);

        if (session?.user) {
          setAuthState({
            user: session.user,
            session,
            role: null,
            isLoading: false,
          });
          void updateRoleAsync(session.user.id);
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      })
      .catch((error) => {
        console.error('getSession error:', error);
        if (!isMounted) return;
        clearTimeout(failSafeTimer);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      });

    return () => {
      isMounted = false;
      clearTimeout(failSafeTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      return { data, error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erro ao fazer login');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Clear state immediately for responsive UI
      setAuthState({
        user: null,
        session: null,
        role: null,
        isLoading: false,
      });
      
      // Sign out from Supabase with global scope to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Erro ao fazer logout');
      
      // Even on error, ensure user is logged out locally
      setAuthState({
        user: null,
        session: null,
        role: null,
        isLoading: false,
      });
    }
  };

  return {
    user: authState.user,
    session: authState.session,
    role: authState.role,
    isLoading: authState.isLoading,
    isAuthenticated: !!authState.session,
    signUp,
    signIn,
    signOut,
  };
};
