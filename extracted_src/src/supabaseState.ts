type AppState = Record<string, unknown>;

const LOCAL_STATE_KEY = 'kpi_app_state_backup';
const SAVED_AT_KEY = '__savedAt';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const stateTable = import.meta.env.VITE_SUPABASE_STATE_TABLE || 'app_state';
const stateId = import.meta.env.VITE_SUPABASE_STATE_ID || 'kpi_constants';

const headers = (accessToken = supabaseAnonKey) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
});

export const SupabaseState = {
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  savedAtKey: SAVED_AT_KEY,

  getSavedAt(data: AppState | null): number {
    if (!data || typeof data[SAVED_AT_KEY] !== 'string') return 0;
    const time = Date.parse(data[SAVED_AT_KEY] as string);
    return Number.isNaN(time) ? 0 : time;
  },

  chooseNewest(remoteState: AppState | null, localState: AppState | null): { state: AppState | null; source: 'remote' | 'local' | 'none' } {
    if (!remoteState && !localState) return { state: null, source: 'none' };
    if (!remoteState) return { state: localState, source: 'local' };
    if (!localState) return { state: remoteState, source: 'remote' };

    return this.getSavedAt(localState) > this.getSavedAt(remoteState)
      ? { state: localState, source: 'local' }
      : { state: remoteState, source: 'remote' };
  },

  loadLocal(): AppState | null {
    try {
      const storedState = localStorage.getItem(LOCAL_STATE_KEY);
      return storedState ? (JSON.parse(storedState) as AppState) : null;
    } catch {
      return null;
    }
  },

  saveLocal(data: AppState): void {
    try {
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Local app state save failed:', error);
    }
  },

  async load(): Promise<AppState | null> {
    if (!this.isConfigured) return null;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${stateTable}?id=eq.${encodeURIComponent(stateId)}&select=data`,
      { 
        headers: headers(),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase load failed: ${response.status} ${response.statusText}`);
    }

    const rows = await response.json();
    return rows?.[0]?.data ?? null;
  },

  async save(data: AppState, accessToken?: string | null): Promise<void> {
    this.saveLocal(data);
    if (!this.isConfigured) return;
    if (!accessToken) {
      throw new Error('Supabase save skipped: admin session token is missing');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${stateTable}?on_conflict=id`,
      {
        method: 'POST',
        keepalive: true,
        headers: {
          ...headers(accessToken),
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({ id: stateId, data }),
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase save failed: ${response.status} ${response.statusText}`);
    }
  },
};
