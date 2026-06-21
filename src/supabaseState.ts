/**
 * supabaseState.ts — Production-ready Supabase state save/load
 *
 * Fixes:
 *  1. Retries with refreshed token on 401/403
 *  2. Better error messages for 403 debugging
 *  3. Correct Prefer header for upsert
 */

import { AuthService } from './shared/services/authService';

type AppState = Record<string, unknown>;

const LOCAL_STATE_KEY = 'kpi_app_state_backup';
const SAVED_AT_KEY = '__savedAt';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const stateTable = import.meta.env.VITE_SUPABASE_STATE_TABLE || 'app_state';
const stateId = import.meta.env.VITE_SUPABASE_STATE_ID || 'kpi_constants';

const buildHeaders = (accessToken?: string | null): Record<string, string> => ({
  apikey: supabaseAnonKey || '',
  ...(accessToken?.trim()
    ? { Authorization: `Bearer ${accessToken.trim()}` }
    : {}),
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
});

/**
 * Parse HTTP error body for debugging.
 */
const parseErrorDetail = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    return body?.message || body?.hint || body?.code || JSON.stringify(body);
  } catch {
    return await response.text().catch(() => '(no body)');
  }
};

export const SupabaseState = {
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  savedAtKey: SAVED_AT_KEY,

  getSavedAt(data: AppState | null): number {
    if (!data || typeof data[SAVED_AT_KEY] !== 'string') return 0;
    const time = Date.parse(data[SAVED_AT_KEY] as string);
    return Number.isNaN(time) ? 0 : time;
  },

  chooseNewest(
    remoteState: AppState | null,
    localState: AppState | null
  ): { state: AppState | null; source: 'remote' | 'local' | 'none' } {
    if (!remoteState && !localState) return { state: null, source: 'none' };
    if (!remoteState) return { state: localState, source: 'local' };
    if (!localState) return { state: remoteState, source: 'remote' };

    return this.getSavedAt(localState) > this.getSavedAt(remoteState)
      ? { state: localState, source: 'local' }
      : { state: remoteState, source: 'remote' };
  },

  loadLocal(): AppState | null {
    try {
      const raw = localStorage.getItem(LOCAL_STATE_KEY);
      return raw ? (JSON.parse(raw) as AppState) : null;
    } catch {
      return null;
    }
  },

  saveLocal(data: AppState): void {
    try {
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[SupabaseState] Local save failed:', error);
    }
  },

  async load(): Promise<AppState | null> {
    if (!this.isConfigured) return null;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${stateTable}?id=eq.${encodeURIComponent(stateId)}&select=data`,
      {
        headers: buildHeaders(),   // anon read — no auth token needed
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const detail = await parseErrorDetail(response);
      throw new Error(
        `[SupabaseState] Load failed: ${response.status} ${response.statusText} — ${detail}`
      );
    }

    const rows = await response.json();
    return rows?.[0]?.data ?? null;
  },

  /**
   * Save app state to Supabase.
   * If a 401/403 is received, attempts a token refresh and retries once.
   */
  async save(data: AppState, accessToken?: string | null): Promise<void> {
    // Always persist locally first — so data is never lost on network failure
    this.saveLocal(data);
    if (!this.isConfigured) return;

    let token = accessToken?.trim() || null;
    if (!token) {
      throw new Error(
        '[SupabaseState] Save skipped: admin access token is missing. ' +
        'Please log in as admin before saving.'
      );
    }

    const doRequest = async (t: string) =>
      fetch(`${supabaseUrl}/rest/v1/${stateTable}?on_conflict=id`, {
        method: 'POST',
        headers: {
          ...buildHeaders(t),
          // resolution=merge-duplicates → upsert by conflict column (id)
          // return=minimal         → don't return the full row (faster)
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({ id: stateId, data }),
      });

    let response = await doRequest(token);

    // If 401 / 403 → try refreshing the token once and retry
    if (response.status === 401 || response.status === 403) {
      console.warn(
        `[SupabaseState] Got ${response.status} on save — attempting token refresh...`
      );

      const refreshed = await AuthService.refreshSession();
      if (refreshed) {
        const newToken = AuthService.getAccessToken();
        if (newToken) {
          token = newToken;
          response = await doRequest(token);
        }
      }
    }

    if (!response.ok) {
      const detail = await parseErrorDetail(response);
      let hint = '';
      if (response.status === 403) {
        hint =
          ' HINT: Check that is_app_admin() is SECURITY DEFINER and the ' +
          'admin user exists in public.app_users with role=superadmin. ' +
          'Run supabase_migration_final.sql in the Supabase SQL Editor.';
      }
      throw new Error(
        `[SupabaseState] Save failed: ${response.status} ${response.statusText} — ${detail}${hint}`
      );
    }
  },
};
