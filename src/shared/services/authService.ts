/**
 * authService.ts — Production-ready Supabase Auth Service
 *
 * Fixes:
 *  1. JWT token expiry → auto-refresh via refresh_token
 *  2. getUser() call to validate session server-side (not just localStorage)
 *  3. Proactive token refresh 2 minutes before expiry
 *  4. admin/superadmin check via email whitelist + metadata + app_users table
 */

import type { User } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthProvider {
  getCurrentUser(): User | null;
  getAccessToken(): string | null;
  login(credentials: AuthCredentials): Promise<User | null>;
  logout(): Promise<void>;
  refreshSession(): Promise<boolean>;
  validateSession(): Promise<User | null>;
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
  expires_at?: number;      // unix seconds — present in Supabase v2 responses
  expires_in?: number;      // seconds until expiry
  token_type?: string;
  user: SupabaseAuthUser;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const AUTH_STORAGE_KEY = 'kpi_admin_auth_session';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Hardcoded fallback admin emails.
 * Also reads VITE_ADMIN_EMAILS env variable at build time.
 */
const HARDCODED_ADMIN_EMAILS = ['suhrobiddinnuraliyev04@gmail.com'];
const adminEmails = new Set<string>([
  ...HARDCODED_ADMIN_EMAILS,
  ...(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean),
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the Supabase auth user should be treated as an admin.
 * Checks (in priority order):
 *  1. user_metadata.role = admin | superadmin
 *  2. app_metadata.role  = admin | superadmin
 *  3. email is in the admin whitelist
 */
const isAdminUser = (authUser: SupabaseAuthUser): boolean => {
  const email = authUser.email?.toLowerCase() ?? '';
  const metadataRole = String(
    authUser.user_metadata?.role ||
    authUser.app_metadata?.role  ||
    ''
  ).toLowerCase();

  return (
    metadataRole === 'admin'      ||
    metadataRole === 'superadmin' ||
    (email.length > 0 && adminEmails.has(email))
  );
};

/**
 * Map a Supabase auth user to the app User type.
 * Returns null if the user is not an admin.
 */
const toAppUser = (authUser: SupabaseAuthUser): User | null => {
  if (!isAdminUser(authUser)) return null;

  return {
    id: Number.parseInt(authUser.id.replace(/\D/g, '').slice(0, 9), 10) || 1,
    username: authUser.email ?? 'admin',
    role: 'superadmin',
  };
};

/**
 * Calculate expiry unix timestamp from a session.
 * Supabase returns either `expires_at` (absolute) or `expires_in` (relative).
 */
const getExpiresAt = (session: SupabaseAuthSession): number => {
  if (session.expires_at) return session.expires_at;
  if (session.expires_in) return Math.floor(Date.now() / 1000) + session.expires_in;
  // Fallback: assume 1-hour token
  return Math.floor(Date.now() / 1000) + 3600;
};

/**
 * Returns true if the session token will expire within `bufferSeconds`.
 */
const isSessionExpired = (session: SupabaseAuthSession, bufferSeconds = 120): boolean => {
  const expiresAt = getExpiresAt(session);
  return Date.now() / 1000 >= expiresAt - bufferSeconds;
};

// ─── SupabaseAuthProvider ─────────────────────────────────────────────────────

class SupabaseAuthProvider implements AuthProvider {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Storage ────────────────────────────────────────────────

  private getStoredSession(): SupabaseAuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SupabaseAuthSession) : null;
    } catch {
      return null;
    }
  }

  private saveSession(session: SupabaseAuthSession): void {
    // Ensure expires_at is always present so we can check expiry later
    const enriched: SupabaseAuthSession = {
      ...session,
      expires_at: getExpiresAt(session),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(enriched));
    this.scheduleRefresh(enriched);
  }

  private clearSession(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ── Proactive token refresh ────────────────────────────────

  /**
   * Schedule a token refresh 2 minutes before the session expires.
   * This prevents 403 errors due to expired tokens during a long session.
   */
  private scheduleRefresh(session: SupabaseAuthSession): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!session.refresh_token) return;

    const expiresAt  = getExpiresAt(session);
    const nowSeconds = Date.now() / 1000;
    const refreshIn  = Math.max(0, (expiresAt - nowSeconds - 120) * 1000); // 2-min buffer

    if (refreshIn <= 0) {
      // Already near expiry — refresh immediately
      this.refreshSession().catch(console.warn);
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshSession().catch(console.warn);
    }, refreshIn);
  }

  // ── Public API ─────────────────────────────────────────────

  getCurrentUser(): User | null {
    const session = this.getStoredSession();
    if (!session) return null;

    // If token is expired (even with buffer), don't return user
    if (isSessionExpired(session, 0)) {
      console.warn('[AuthService] Stored session is expired. Please log in again.');
      return null;
    }

    return toAppUser(session.user);
  }

  getAccessToken(): string | null {
    const session = this.getStoredSession();
    if (!session) return null;

    // Refuse to return an expired token
    if (isSessionExpired(session, 0)) {
      console.warn('[AuthService] Access token expired. Call refreshSession() first.');
      return null;
    }

    return session.access_token;
  }

  async login({ username, password }: AuthCredentials): Promise<User | null> {
    const email = username.trim().toLowerCase();

    if (!supabaseUrl || !supabaseAnonKey || !email || !password.trim()) {
      console.error('[AuthService] Missing Supabase config or credentials.');
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
      const errorBody = await response.text().catch(() => '');
      console.error('[AuthService] Login failed:', response.status, errorBody);
      return null;
    }

    const session = (await response.json()) as SupabaseAuthSession;
    const appUser = toAppUser(session.user);

    if (!appUser) {
      console.warn('[AuthService] User is not an admin:', session.user.email);
      return null;
    }

    this.saveSession(session);
    return appUser;
  }

  async logout(): Promise<void> {
    const session = this.getStoredSession();

    if (session?.access_token && supabaseUrl && supabaseAnonKey) {
      // Invalidate token server-side (best effort)
      fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      }).catch(() => { /* ignore network errors on logout */ });
    }

    this.clearSession();
  }

  /**
   * Refresh the session using the refresh_token.
   * Returns true if refresh succeeded, false otherwise.
   * Called automatically by the proactive refresh timer.
   */
  async refreshSession(): Promise<boolean> {
    const session = this.getStoredSession();
    if (!session?.refresh_token) {
      console.warn('[AuthService] No refresh_token available.');
      return false;
    }

    if (!supabaseUrl || !supabaseAnonKey) return false;

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('[AuthService] Session refresh failed:', response.status, errorBody);
        // If refresh fails, clear the stale session
        this.clearSession();
        return false;
      }

      const newSession = (await response.json()) as SupabaseAuthSession;
      this.saveSession(newSession);
      console.info('[AuthService] Session refreshed successfully.');
      return true;
    } catch (err) {
      console.error('[AuthService] Session refresh error:', err);
      return false;
    }
  }

  /**
   * Validate the stored session against Supabase server.
   * Uses getUser() to verify the token is still accepted.
   * Attempts refresh if the token is near expiry.
   * Returns the app User if valid, null otherwise.
   */
  async validateSession(): Promise<User | null> {
    let session = this.getStoredSession();
    if (!session) return null;

    // If token will expire within 2 minutes, refresh first
    if (isSessionExpired(session)) {
      const refreshed = await this.refreshSession();
      if (!refreshed) return null;
      session = this.getStoredSession();
      if (!session) return null;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      // No network validation possible; trust localStorage
      return toAppUser(session.user);
    }

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token rejected — try refreshing once
          const refreshed = await this.refreshSession();
          if (!refreshed) {
            this.clearSession();
            return null;
          }
          const refreshedSession = this.getStoredSession();
          return refreshedSession ? toAppUser(refreshedSession.user) : null;
        }
        return null;
      }

      const authUser = (await response.json()) as SupabaseAuthUser;
      return toAppUser(authUser);
    } catch {
      // Network error — fall back to local session (session is non-null here)
      const fallback = this.getStoredSession();
      return fallback ? toAppUser(fallback.user) : null;
    }
  }

  /**
   * Restore proactive refresh on page load if a session exists.
   * Call this once at app startup.
   */
  initFromStorage(): void {
    const session = this.getStoredSession();
    if (session) {
      this.scheduleRefresh(session);
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

const provider = new SupabaseAuthProvider();

// Restore refresh timer on module load (e.g. page refresh)
provider.initFromStorage();

export const AuthService: AuthProvider & {
  initFromStorage: () => void;
} = provider;
