type AppState = Record<string, unknown>;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const stateTable = import.meta.env.VITE_SUPABASE_STATE_TABLE || 'app_state';
const stateId = import.meta.env.VITE_SUPABASE_STATE_ID || 'kpi_constants';

const headers = () => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

export const SupabaseState = {
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),

  async load(): Promise<AppState | null> {
    if (!this.isConfigured) return null;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${stateTable}?id=eq.${encodeURIComponent(stateId)}&select=data`,
      { headers: headers() }
    );

    if (!response.ok) {
      throw new Error(`Supabase load failed: ${response.status} ${response.statusText}`);
    }

    const rows = await response.json();
    return rows?.[0]?.data ?? null;
  },

  async save(data: AppState): Promise<void> {
    if (!this.isConfigured) return;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${stateTable}?on_conflict=id`,
      {
        method: 'POST',
        headers: {
          ...headers(),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ id: stateId, data }),
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase save failed: ${response.status} ${response.statusText}`);
    }
  },
};
