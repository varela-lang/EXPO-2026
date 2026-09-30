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
        // Create demo profile on the fly if needed
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
        // Profile not created yet by trigger, fallback to temporary profile
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
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
          // If no active Supabase session, check if there was a mock user session
          const mockUser = mockStore.getCurrentUser();
          if (mockUser) {
            setUser({ id: mockUser.id, email: mockUser.email });
            setProfile(mockUser);
          } else {
            // Provide a default visitor account with $10,000 so any visitor arriving at the Expo
            // can immediately interact and invest in student projects!
            const defaultVisitor = mockStore.getState().profiles.find((p) => p.role === 'visitor') || {
              id: 'visitor-default-id',
              full_name: 'Inversionista Invitado',
              email: 'invitado@expo.com',
              role: 'visitor',
              balance: 10000.0,
              created_at: new Date().toISOString(),
            };
            if (!mockStore.getState().profiles.some((p) => p.id === defaultVisitor.id)) {
              mockStore.getState().profiles.push(defaultVisitor);
            }
            setUser({ id: defaultVisitor.id, email: defaultVisitor.email });
            setProfile(defaultVisitor);
          }
        }

        // Listen for Supabase auth state changes
        if (isSupabaseConfigured && supabase) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id);
            } else {
              const mockUser = mockStore.getCurrentUser();
              if (mockUser) {
                setUser({ id: mockUser.id, email: mockUser.email });
                setProfile(mockUser);
              } else {
                setUser(null);
                setProfile(null);
              }
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
  }, [fetchProfile]);

  // Register
  const register = async ({ full_name, email, password, role = 'visitor' }) => {
    setError(null);

    // Always create in mockStore for instant availability
    let localResult = null;
    try {
      localResult = mockStore.registerUser({
        full_name,
        email,
        password,
        role,
      });
    } catch {
      // User might already exist in mockStore
    }

    if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
      if (localResult) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return localResult;
      }
      const existing = mockStore.loginUser({ email, password });
      setUser(existing.user);
      setProfile(existing.profile);
      return existing;
    }

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role,
          },
        },
      });

      if (signUpErr) {
        if (isSchemaMissingError(signUpErr)) {
          markSupabaseSchemaMissing('signUp: ' + signUpErr.message);
          if (localResult) {
            setUser(localResult.user);
            setProfile(localResult.profile);
            return localResult;
          }
        }
        throw signUpErr;
      }

      // If email confirmation is disabled on Supabase, attempt immediate login
      if (data.user && !data.session) {
        try {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInData?.session) {
            setUser(signInData.user);
            const prof = await fetchProfile(signInData.user.id);
            return { user: signInData.user, profile: prof || localResult?.profile };
          }
        } catch {
          // Email confirmation is on, continue with local session sync
        }
      }

      if (data.user) {
        setUser(data.user);
        await new Promise((r) => setTimeout(r, 600));
        const prof = await fetchProfile(data.user.id);
        return { user: data.user, profile: prof || localResult?.profile };
      }

      if (localResult) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return localResult;
      }

      return data;
    } catch (err) {
      if (localResult) {
        console.warn('Supabase signup notice, proceeding with active local profile:', err.message);
        setUser(localResult.user);
        setProfile(localResult.profile);
        return localResult;
      }
      setError(err.message || 'Error en el registro');
      throw err;
    }
  };

  // Login
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
        // If credentials failed on Supabase, test if it matches demo credentials
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
    setUser({ id: targetProfile.id, email: targetProfile.email });
    setProfile(targetProfile);
  };

  const value = {
    user,
    profile,
    loading,
    error,
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
