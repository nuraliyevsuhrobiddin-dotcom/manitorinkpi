import type { User } from '../types';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthProvider {
  getCurrentUser(): User | null;
  getAccessToken(): string | null;
  login(credentials: AuthCredentials): Promise<User | null>;
  logout(): Promise<void>;
}

interface SupabaseAuthUser {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

interface SupabaseAuthSession {
  access_token: string;
  refresh_token?: string;
  user: SupabaseAuthUser;
}

const AUTH_STORAGE_KEY = 'kpi_admin_auth_session';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

const isAdminUser = (authUser: SupabaseAuthUser) => {
  const email = authUser.email?.toLowerCase();
  const metadataRole = String(
    authUser.user_metadata?.role || authUser.app_metadata?.role || ''
  ).toLowerCase();

  return (
    metadataRole === 'admin' ||
    metadataRole === 'superadmin' ||
    Boolean(email && adminEmails.includes(email))
  );
};

const toAppUser = (authUser: SupabaseAuthUser): User | null => {
  if (!isAdminUser(authUser)) return null;

  return {
    id: Number.parseInt(authUser.id.replace(/\D/g, '').slice(0, 9), 10) || 1,
    username: authUser.email || 'admin',
    role: 'superadmin',
  };
};

class SupabaseAuthProvider implements AuthProvider {
  private getStoredSession(): SupabaseAuthSession | null {
    try {
      const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
      return storedSession
        ? (JSON.parse(storedSession) as SupabaseAuthSession)
        : null;
    } catch {
      return null;
    }
  }

  getCurrentUser(): User | null {
    const session = this.getStoredSession();
    return session ? toAppUser(session.user) : null;
  }

  getAccessToken(): string | null {
    return this.getStoredSession()?.access_token || null;
  }

  async login({ username, password }: AuthCredentials): Promise<User | null> {
    const email = username.trim();

    if (!supabaseUrl || !supabaseAnonKey || !email || !password.trim()) {
      return null;
    }

    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const session = (await response.json()) as SupabaseAuthSession;
    const appUser = toAppUser(session.user);

    if (!appUser) {
      return null;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return appUser;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return undefined;
  }
}

export const AuthService: AuthProvider = new SupabaseAuthProvider();
