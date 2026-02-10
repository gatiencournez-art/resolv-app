'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  AuthUser,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getValidAccessToken,
} from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  previewMode: boolean;
  isAdminView: boolean;
  togglePreviewMode: () => void;
  login: (email: string, password: string, organizationSlug: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;
  const isAdminView = user?.role === 'ADMIN' && !previewMode;

  const togglePreviewMode = useCallback(() => {
    setPreviewMode((prev) => !prev);
  }, []);

  // Refresh tokens (uses centralized lock)
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const token = await getValidAccessToken();
    return !!token;
  }, []);

  // Fetch current user (uses centralized token refresh)
  const fetchUser = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe(token) as AuthUser;
      setUser(userData);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Login
  const login = async (
    email: string,
    password: string,
    organizationSlug: string
  ) => {
    const response = await api.login({ email, password, organizationSlug }) as {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    };

    setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    setUser(response.user);
    router.push('/');
  };

  // Register
  const register = async (data: RegisterData) => {
    const response = await api.register(data) as {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    };

    setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    setUser(response.user);
    router.push('/');
  };

  // Logout
  const logout = async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken && refreshToken) {
      try {
        await api.logout(refreshToken, accessToken);
      } catch {
        // Ignore errors on logout
      }
    }

    clearTokens();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        previewMode,
        isAdminView,
        togglePreviewMode,
        login,
        register,
        logout,
        refreshAuth,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
