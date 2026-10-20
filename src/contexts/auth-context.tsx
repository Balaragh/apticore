import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthState } from '@/types';
import { DEMO_USER, simulateDelay } from '@/lib/mock-data';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check session on mount
  useEffect(() => {
    checkSession();

    const handleUnauthorized = () => {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const checkSession = async () => {
    try {
      // 1. Try real backend session check
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const resData = await response.json();
        const user = resData.data || resData;
        setState({ user, isLoading: false, isAuthenticated: true });
        return;
      }
      
      // 2. Fallback to demo mode if backend unauthenticated but demo session stored
      if (IS_DEMO) {
        const demoLoggedIn = sessionStorage.getItem('apticore_demo_session');
        if (demoLoggedIn) {
          setState({ user: DEMO_USER, isLoading: false, isAuthenticated: true });
          return;
        }
      }
      setState({ user: null, isLoading: false, isAuthenticated: false });
    } catch {
      // Backend not running / network offline: fallback to demo mode
      if (IS_DEMO) {
        const demoLoggedIn = sessionStorage.getItem('apticore_demo_session');
        if (demoLoggedIn) {
          setState({ user: DEMO_USER, isLoading: false, isAuthenticated: true });
          return;
        }
      }
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  };

  const login = useCallback(async (email: string, _password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _password }),
      });

      if (response.ok) {
        const resData = await response.json();
        const user = resData.data || resData;
        sessionStorage.setItem('apticore_session_active', 'true');
        setState({ user, isLoading: false, isAuthenticated: true });
        return;
      }

      const data = await response.json().catch(() => ({}));
      const errorMsg = data.error?.message || data.message || 'Login failed';

      // If backend explicitly rejected credentials, don't fall back to fake success
      if (response.status === 401 || response.status === 400 || response.status === 403) {
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      // If network unreachable and in demo mode, allow demo login
      if (IS_DEMO) {
        await simulateDelay(600);
        sessionStorage.setItem('apticore_demo_session', 'true');
        setState({ user: DEMO_USER, isLoading: false, isAuthenticated: true });
        return;
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: _password }),
      });

      if (response.ok) {
        const resData = await response.json();
        const user = resData.data || resData;
        sessionStorage.setItem('apticore_session_active', 'true');
        setState({ user, isLoading: false, isAuthenticated: true });
        return;
      }

      const data = await response.json().catch(() => ({}));
      const errorMsg = data.error?.message || data.message || 'Registration failed';
      throw new Error(errorMsg);
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      if (IS_DEMO) {
        await simulateDelay(600);
        sessionStorage.setItem('apticore_demo_session', 'true');
        setState({
          user: { ...DEMO_USER, name, email },
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    }
    sessionStorage.removeItem('apticore_demo_session');
    sessionStorage.removeItem('apticore_session_active');
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const forgotPassword = useCallback(async (_email: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || data.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      if (IS_DEMO && err.message?.includes('fetch')) {
        await simulateDelay(600);
        return;
      }
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (_token: string, _password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: _token, password: _password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || data.message || 'Password reset failed');
      }
    } catch (err: any) {
      if (IS_DEMO && err.message?.includes('fetch')) {
        await simulateDelay(600);
        return;
      }
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const resData = await response.json();
        const user = resData.data || resData;
        setState((prev) => ({ ...prev, user }));
        return;
      }
    } catch {
      // Fallback
    }

    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...data } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, forgotPassword, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
