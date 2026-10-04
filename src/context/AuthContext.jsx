import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  isSchemaMissingError,
  getSupabaseSchemaStatus,
  markSupabaseSchemaMissing,
  subscribeToSchemaStatus,
} from '../lib/supabase';
import { mockStore } from '../lib/mockStore';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schemaStatus, setSchemaStatus] = useState(getSupabaseSchemaStatus());

  useEffect(() => {
    return subscribeToSchemaStatus((status) => {
      setSchemaStatus(status);
    });
  }, []);

  // Load user profile from Supabase profiles table or fallback
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
      const state = mockStore.getState();
      let mockProf = state.profiles.find((p) => p.id === userId);
      if (!mockProf) {
        mockProf = {
          id: userId,
          full_name: 'Visitante Expo',
          email: 'visitante@expo.com',
          role: 'visitor',
          balance: 10000.0,
          created_at: new Date().toISOString(),
        };
        state.profiles.push(mockProf);
      }
      setProfile(mockProf);
      return mockProf;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (isSchemaMissingError(error)) {
          markSupabaseSchemaMissing('fetchProfile: ' + error.message);
        }
        const mockProf = mockStore.getState().profiles.find((p) => p.id === userId) || {
          id: userId,
          full_name: 'Visitante Expo',
          email: 'visitante@expo.com',
          role: 'visitor',
          balance: 10000.0,
          created_at: new Date().toISOString(),
        };
        setProfile(mockProf);
        return mockProf;
      }

      if (!data) {
        const mockProf = mockStore.getState().profiles.find((p) => p.id === userId) || {
          id: userId,
          full_name: 'Inversionista',
          role: 'visitor',
          balance: 10000.0,
          created_at: new Date().toISOString(),
        };
        setProfile(mockProf);
        return mockProf;
      }

      setProfile(data);
      return data;
    } catch (err) {
      if (isSchemaMissingError(err)) {
        markSupabaseSchemaMissing('fetchProfile exception');
      }
      const mockProf = mockStore.getState().profiles.find((p) => p.id === userId) || null;
      if (mockProf) setProfile(mockProf);
      return mockProf;
    }
  }, []);

  // Single-field login by Visitor Name
  const loginByName = useCallback(async (fullName) => {
    if (!fullName || !fullName.trim()) {
      const err = new Error('Por favor ingresa tu nombre para continuar.');
      setError(err.message);
      throw err;
    }

    setError(null);
    const cleanName = fullName.trim();
    const slug =
      cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 30) || 'visitante';
    const internalEmail = `visitante_${slug}@expo.internal`;
    const internalPassword = `ExpoVisitor2026!${slug}`;

    // 1. Immediately create or retrieve local mock profile for zero latency
    let localResult = null;
    try {
      localResult = mockStore.loginByName(cleanName);
    } catch (e) {
      console.warn('mockStore loginByName warning:', e);
    }

    // Persist visitor name in localStorage for permanent auto-session
    try {
      localStorage.setItem('expo_current_visitor_name', cleanName);
    } catch (e) {
      // ignore
    }

    // 2. If Supabase is not ready, return local profile immediately
    if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
      if (localResult) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return localResult;
      }
    }

    // 3. Connect with Supabase
    try {
      let supaUser = null;

      // Try signIn first
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: internalPassword,
      });

      if (signInData?.user) {
        supaUser = signInData.user;
      } else {
        // Try signUp
        const { data: signUpData } = await supabase.auth.signUp({
          email: internalEmail,
          password: internalPassword,
          options: {
            data: {
              full_name: cleanName,
              role: 'visitor',
            },
          },
        });

        if (signUpData?.user) {
          supaUser = signUpData.user;
        }
      }

      if (supaUser) {
        setUser(supaUser);
        try {
          await supabase.from('profiles').upsert(
            {
              id: supaUser.id,
              full_name: cleanName,
              email: internalEmail,
              role: 'visitor',
              balance: 10000.0,
            },
            { onConflict: 'id' }
          );
        } catch (upsertErr) {
          console.warn('profiles upsert note:', upsertErr);
        }

        const prof = await fetchProfile(supaUser.id);
        const finalProf = prof || localResult?.profile || {
          id: supaUser.id,
          full_name: cleanName,
          email: internalEmail,
          role: 'visitor',
          balance: 10000.0,
        };
        setProfile(finalProf);
        return { user: supaUser, profile: finalProf };
      }

      if (localResult) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return localResult;
      }
    } catch (supaErr) {
      console.warn('Supabase auth check note, using active local profile:', supaErr);
      if (localResult) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return localResult;
      }
      throw supaErr;
    }
  }, [fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const savedVisitorName =
          typeof window !== 'undefined' ? localStorage.getItem('expo_current_visitor_name') : null;

        if (savedVisitorName && savedVisitorName.trim()) {
          try {
            await loginByName(savedVisitorName.trim());
            if (mounted) setLoading(false);
            return;
          } catch (e) {
            console.warn('Auto login error:', e);
          }
        }

        let supabaseUser = null;
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (!sessionErr && session?.user) {
              supabaseUser = session.user;
            }
          } catch (e) {
            console.warn('Supabase getSession check failed:', e);
          }
        }

        if (supabaseUser && mounted) {
          setUser(supabaseUser);
          await fetchProfile(supabaseUser.id);
        } else if (mounted) {
          const mockUser = mockStore.getCurrentUser();
          if (mockUser) {
            setUser({ id: mockUser.id, email: mockUser.email });
            setProfile(mockUser);
          }
        }

        // Listen for Supabase auth state changes
        if (isSupabaseConfigured && supabase) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id);
            }
            setLoading(false);
          });

          return () => {
            subscription?.unsubscribe();
          };
        }
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfile, loginByName]);

  // Register (legacy fallback if needed)
  const register = async ({ full_name, email, password, role = 'visitor' }) => {
    return loginByName(full_name);
  };

  // Login (email & password fallback for admin/teams)
  const login = async ({ email, password }) => {
    setError(null);

    if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
      try {
        const { user: loggedUser, profile: loggedProf } = mockStore.loginUser({
          email,
          password,
        });
        setUser(loggedUser);
        setProfile(loggedProf);
        return { user: loggedUser, profile: loggedProf };
      } catch (err) {
        setError(err.message);
        throw err;
      }
    }

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        try {
          const demoResult = mockStore.loginUser({ email, password });
          setUser(demoResult.user);
          setProfile(demoResult.profile);
          return demoResult;
        } catch {
          throw signInErr;
        }
      }

      if (data.user) {
        setUser(data.user);
        const prof = await fetchProfile(data.user.id);
        return { user: data.user, profile: prof };
      }
      return data;
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    setError(null);
    mockStore.logoutUser();

    try {
      localStorage.removeItem('expo_current_visitor_name');
    } catch (e) {
      // ignore
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }

    setUser(null);
    setProfile(null);
  };

  // Refresh profile balance & data
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // Demo Switcher for fast testing in preview mode
  const switchDemoRole = (role) => {
    const state = mockStore.getState();

    let targetProfile = state.profiles.find((p) => p.role === role);
    if (!targetProfile) {
      const id = role === 'admin' ? 'admin-demo-id' : role === 'team' ? 'team-demo-id' : 'visitor-demo-id';
      targetProfile = {
        id,
        full_name: role === 'admin' ? 'Administrador Expo' : role === 'team' ? 'Líder EcoTech' : 'Visitante Ejemplo',
        email: `${role}@expo.com`,
        role,
        balance: 10000.0,
        project_id: role === 'team' ? '00000000-0000-0000-0000-000000000001' : undefined,
        created_at: new Date().toISOString(),
      };
      state.profiles.push(targetProfile);
    }

    state.currentUser = { id: targetProfile.id, email: targetProfile.email, role: targetProfile.role };
    localStorage.setItem('expo_investment_mock_db_v1', JSON.stringify(state));
    localStorage.setItem('expo_current_visitor_name', targetProfile.full_name);
    setUser({ id: targetProfile.id, email: targetProfile.email });
    setProfile(targetProfile);
  };

  const value = {
    user,
    profile,
    loading,
    error,
    loginByName,
    login,
    register,
    logout,
    refreshProfile,
    switchDemoRole,
    isSupabaseConfigured,
    schemaStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
