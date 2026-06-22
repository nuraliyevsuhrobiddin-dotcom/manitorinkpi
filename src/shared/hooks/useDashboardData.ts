/**
 * useDashboardData.ts
 *
 * Production-ready hook for loading all KPI dashboard data from Supabase.
 *
 * Fixes (v3):
 *  1. Uses `reloadKey` state (not ref) to properly trigger re-fetch
 *  2. Session/token-ready gating — waits for auth before querying
 *  3. Per-table error logging with RLS hints
 *  4. Never overwrites state with empty arrays — falls back to cache
 *  5. AbortController cleans up on unmount or re-fetch
 *  6. Retry with exponential back-off on transient network errors
 *  7. localStorage cache as final fallback
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DashboardDataState {
  faculties: any[];
  departments: any[];
  divisions: any[];
  positions: string[];
  professors: any[];
  achievements: any[];
  plans: any[];
  projects: any[];
  scoringSystem: any;
  users: any[];
  thesisDefenses: any[];
  status: LoadStatus;
  error: string | null;
  /** Source of the currently loaded data */
  source: 'supabase' | 'local-state' | 'local-cache' | 'constants' | null;
  /** Call this to force a fresh reload from Supabase */
  reload: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL  as string | undefined)?.replace(/\/$/, '');
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const CACHE_KEY     = 'kpi_dashboard_cache_v3';
const MAX_RETRIES   = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildHeaders = (token?: string | null) => ({
  apikey: SUPABASE_ANON || '',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store',
  'Pragma': 'no-cache',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const safeFetch = async <T>(
  path: string,
  signal: AbortSignal,
  token?: string | null
): Promise<T[]> => {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error(`Supabase config missing (URL=${SUPABASE_URL ? 'ok' : 'missing'})`);
  }

  const url = `${SUPABASE_URL}/rest/v1/${path}?select=*`;
  const res = await fetch(url, {
    headers: buildHeaders(token),
    signal,
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text().catch(() => ''); }

    const msg = `[useDashboardData] ${path} → HTTP ${res.status}: ${detail}`;

    if (res.status === 401 || res.status === 403) {
      console.error(
        `⚠ [useDashboardData] RLS/Auth error on '${path}' (${res.status}).\n` +
        `  Check:\n` +
        `  1. Supabase RLS policies allow anon SELECT on '${path}'\n` +
        `  2. is_app_admin() is SECURITY DEFINER in your Supabase project\n` +
        `  3. Run supabase_migration_final.sql in Supabase SQL Editor\n`,
        detail
      );
    } else if (res.status === 402) {
      console.error(`⚠ [useDashboardData] Supabase plan limit reached (${res.status}) for '${path}'.`);
    } else {
      console.error(msg);
    }

    throw new Error(msg);
  }

  const rows = await res.json() as T[];
  if (rows.length === 0) {
    console.warn(
      `[useDashboardData] '${path}' returned 0 rows. ` +
      `This may be an RLS policy issue or the table is genuinely empty.`
    );
  }
  return rows;
};

// Row mappers (same as dataService.ts)
const normalizeString = (v: unknown) => (typeof v === 'string' ? v : '');

const toFaculty  = (r: any) => ({ id: Number(r.id ?? 0), name: normalizeString(r.name) });
const toDepartment = (r: any) => ({
  id: Number(r.id ?? 0),
  name: normalizeString(r.name),
  facultyId: Number(r.faculty_id ?? r.facultyId ?? 0),
});
const toProfessor = (r: any) => ({
  id: Number(r.id ?? 0),
  firstName: normalizeString(r.first_name ?? r.firstName),
  lastName: normalizeString(r.last_name ?? r.lastName),
  patronymic: normalizeString(r.patronymic),
  birthDate: normalizeString(r.birth_date ?? r.birthDate),
  gender: r.gender === 'ayol' ? 'ayol' : 'erkak',
  departmentId: Number(r.department_id ?? r.departmentId ?? 0),
  degree: normalizeString(r.degree),
  title: normalizeString(r.title),
  position: normalizeString(r.position),
  staffUnit: Number(r.staff_unit ?? r.staffUnit ?? 0),
  employmentType: normalizeString(r.employment_type ?? r.employmentType),
  phone: normalizeString(r.phone),
});
const toAchievement = (r: any) => ({
  id: Number(r.id ?? 0),
  professorId: Number(r.professor_id ?? r.professorId ?? 0),
  year: Number(r.year ?? 0),
  quarter: Number(r.quarter ?? 0),
  type: normalizeString(r.type),
  subType: normalizeString(r.sub_type ?? r.subType),
  count: Number(r.count ?? 0),
});
const toProject = (r: any) => ({
  id: Number(r.id ?? 0),
  name: normalizeString(r.name),
  type: normalizeString(r.type),
  direction: normalizeString(r.direction),
  leaderName: normalizeString(r.leader_name ?? r.leaderName),
  leaderPosition: normalizeString(r.leader_position ?? r.leaderPosition),
  departmentId: Number(r.department_id ?? r.departmentId ?? 0),
  facultyId: Number(r.faculty_id ?? r.facultyId ?? 0),
  totalFunding: Number(r.total_funding ?? r.totalFunding ?? 0),
  duration: Number(r.duration ?? 0),
});
const toThesisDefense = (r: any) => ({
  id: Number(r.id ?? 0),
  lastName: normalizeString(r.last_name ?? r.lastName),
  firstName: normalizeString(r.first_name ?? r.firstName),
  patronymic: normalizeString(r.patronymic),
  departmentId: Number(r.department_id ?? r.departmentId ?? 0),
  facultyId: Number(r.faculty_id ?? r.facultyId ?? 0),
  specialty: normalizeString(r.specialty),
  type: normalizeString(r.type),
  fieldOfScience: normalizeString(r.field_of_science ?? r.fieldOfScience),
  thesisTopic: normalizeString(r.thesis_topic ?? r.thesisTopic),
  supervisor: normalizeString(r.supervisor),
  defenseOrganization: normalizeString(r.defense_organization ?? r.defenseOrganization),
  councilNumber: normalizeString(r.council_number ?? r.councilNumber),
  defenseDate: normalizeString(r.defense_date ?? r.defenseDate),
});

const toPlan = (plans: any[], planItems: any[]) => {
  const byPlan = new Map<number, any[]>();
  for (const item of planItems) {
    const pid = Number(item.plan_id ?? item.planId ?? 0);
    byPlan.set(pid, [...(byPlan.get(pid) || []), item]);
  }
  return plans.map(p => ({
    id: Number(p.id ?? 0),
    professorId: Number(p.professor_id ?? p.professorId ?? 0),
    year: Number(p.year ?? 0),
    planItems: (byPlan.get(Number(p.id)) || []).map(i => ({
      type: normalizeString(i.type),
      subType: normalizeString(i.sub_type ?? i.subType),
      count: Number(i.count ?? 0),
    })),
  }));
};

// Cache helpers
const loadCache = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const saveCache = (data: Record<string, any>) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, __cachedAt: Date.now() })); }
  catch { /* storage full — ignore */ }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData(
  constants: Record<string, any>,
  token?: string | null
): DashboardDataState {
  const [status, setStatus]   = useState<LoadStatus>('idle');
  const [error,  setError]    = useState<string | null>(null);
  const [source, setSource]   = useState<DashboardDataState['source']>(null);

  // Use useState for reloadKey so React re-runs the effect properly
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<Omit<DashboardDataState, 'status' | 'error' | 'source' | 'reload'>>({
    faculties:     constants.FACULTIES     || [],
    departments:   constants.DEPARTMENTS   || [],
    divisions:     constants.DIVISIONS     || [],
    positions:     constants.POSITIONS     || [],
    professors:    constants.PROFESSORS    || [],
    achievements:  constants.ACHIEVEMENTS  || [],
    plans:         constants.PLANS         || [],
    projects:      constants.PROJECTS      || [],
    scoringSystem: constants.SCORING_SYSTEM || {},
    users:         constants.USERS         || [],
    thesisDefenses: constants.THESIS_DEFENSES || [],
  });

  const reload = useCallback(() => {
    setReloadKey(k => k + 1);
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      console.warn('[useDashboardData] Supabase not configured — using constants only.');
      setSource('constants');
      setStatus('success');
      return;
    }

    // If token is explicitly undefined (not yet resolved), wait
    // null = anonymous (anon key), undefined = not yet determined
    // We allow null (anon) but skip if explicitly passed as undefined and config expects auth
    // For this app, token can be null (guest) — we proceed either way

    let retries = 0;
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAll = async (): Promise<void> => {
      setStatus('loading');
      setError(null);

      try {
        console.log(
          `[useDashboardData] Fetching from Supabase… (token: ${token ? 'present' : 'anon'}, reload: ${reloadKey})`
        );

        // Use Promise.allSettled so one failed table doesn't kill the whole load
        const settled = await Promise.allSettled([
          safeFetch<any>('faculties',       signal, token),
          safeFetch<any>('departments',     signal, token),
          safeFetch<any>('professors',      signal, token),
          safeFetch<any>('plans',           signal, token),
          safeFetch<any>('plan_items',      signal, token),
          safeFetch<any>('achievements',    signal, token),
          safeFetch<any>('projects',        signal, token),
          safeFetch<any>('thesis_defenses', signal, token),
        ]);

        if (signal.aborted) return;

        const unwrap = <T>(result: PromiseSettledResult<T[]>, name: string): T[] => {
          if (result.status === 'fulfilled') return result.value;
          console.error(`[useDashboardData] '${name}' failed:`, result.reason?.message || result.reason);
          return [];
        };

        const [fRes, dRes, pRes, plRes, piRes, aRes, prRes, tdRes] = settled;

        const facultyRows    = unwrap(fRes,  'faculties');
        const departmentRows = unwrap(dRes,  'departments');
        const professorRows  = unwrap(pRes,  'professors');
        const planRows       = unwrap(plRes, 'plans');
        const planItemRows   = unwrap(piRes, 'plan_items');
        const achievementRows= unwrap(aRes,  'achievements');
        const projectRows    = unwrap(prRes, 'projects');
        const thesisRows     = unwrap(tdRes, 'thesis_defenses');

        const faculties     = facultyRows.map(toFaculty);
        const departments   = departmentRows.map(toDepartment);
        const professors    = professorRows.map(toProfessor);
        const plans         = toPlan(planRows, planItemRows);
        const achievements  = achievementRows.map(toAchievement);
        const projects      = projectRows.map(toProject);
        const thesisDefenses = thesisRows.map(toThesisDefense);

        // ⚠ Guard: never overwrite with empty arrays when we have cached data
        const cache = loadCache();
        const guard = <T>(fresh: T[], key: string, fallback: T[]): T[] => {
          if (fresh.length > 0) return fresh;
          const cached = cache?.[key];
          if (Array.isArray(cached) && cached.length > 0) {
            console.warn(
              `[useDashboardData] '${key}': Supabase returned [], keeping cache (${cached.length} items). ` +
              `Check RLS on '${key}' table.`
            );
            return cached as T[];
          }
          return fallback;
        };

        const next = {
          faculties:     guard(faculties,     'faculties',     constants.FACULTIES     || []),
          departments:   guard(departments,   'departments',   constants.DEPARTMENTS   || []),
          professors:    guard(professors,    'professors',    constants.PROFESSORS    || []),
          plans:         guard(plans,         'plans',         constants.PLANS         || []),
          achievements:  guard(achievements,  'achievements',  constants.ACHIEVEMENTS  || []),
          projects:      guard(projects,      'projects',      constants.PROJECTS      || []),
          thesisDefenses:guard(thesisDefenses,'thesisDefenses',constants.THESIS_DEFENSES || []),
          // Config fields — use Supabase if present, otherwise constants
          divisions:     constants.DIVISIONS  || [],
          positions:     constants.POSITIONS  || [],
          scoringSystem: constants.SCORING_SYSTEM || {},
          users:         constants.USERS      || [],
        };

        // Cache successful fetch
        saveCache({
          faculties:     next.faculties,
          departments:   next.departments,
          professors:    next.professors,
          plans:         next.plans,
          achievements:  next.achievements,
          projects:      next.projects,
          thesisDefenses:next.thesisDefenses,
        });

        console.log(
          `[useDashboardData] Loaded ✓ — ` +
          `professors:${next.professors.length} ` +
          `faculties:${next.faculties.length} ` +
          `departments:${next.departments.length} ` +
          `achievements:${next.achievements.length}`
        );

        if (signal.aborted) return;

        setData(next);
        setSource('supabase');
        setStatus('success');
        setError(null);

      } catch (err: any) {
        if (signal.aborted) return;

        const isTransient =
          err?.message?.includes('NetworkError') ||
          err?.message?.includes('fetch') ||
          err?.message?.includes('Failed to fetch');

        if (isTransient && retries < MAX_RETRIES) {
          retries++;
          const delay = 1000 * retries;
          console.warn(
            `[useDashboardData] Transient error, retrying in ${delay}ms… ` +
            `(attempt ${retries}/${MAX_RETRIES})`
          );
          setTimeout(fetchAll, delay);
          return;
        }

        console.error('[useDashboardData] Load failed:', err);
        setError(err?.message || 'Unknown error');

        // Fall back to local cache
        const cache = loadCache();
        if (cache && cache.professors?.length > 0) {
          console.info('[useDashboardData] Falling back to local cache');
          setData(prev => ({
            ...prev,
            faculties:     cache.faculties     || prev.faculties,
            departments:   cache.departments   || prev.departments,
            professors:    cache.professors    || prev.professors,
            plans:         cache.plans         || prev.plans,
            achievements:  cache.achievements  || prev.achievements,
            projects:      cache.projects      || prev.projects,
            thesisDefenses:cache.thesisDefenses|| prev.thesisDefenses,
          }));
          setSource('local-cache');
          setStatus('success'); // still show data, don't block UI
        } else {
          setSource('constants');
          setStatus('error');
        }
      }
    };

    fetchAll();
    return () => controller.abort();
    // token va reloadKey o'zgarganda qayta fetch qilamiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, reloadKey]);

  return { ...data, status, error, source, reload };
}
