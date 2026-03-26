import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth helpers ──────────────────────────────────────────────────────────────
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUp = (email, password, meta = {}) =>
  supabase.auth.signUp({ email, password, options: { data: meta } })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export const onAuthChange = (cb) => supabase.auth.onAuthStateChange(cb)

// ── Org / members ─────────────────────────────────────────────────────────────
export const getOrgMembers = (orgId) =>
  supabase.from('members').select('*').eq('org_id', orgId).order('name')

export const upsertMember = (member) =>
  supabase.from('members').upsert(member, { onConflict: 'id' })

export const deleteMember = (id) =>
  supabase.from('members').delete().eq('id', id)

// ── OKRs ─────────────────────────────────────────────────────────────────────
export const getOKRs = (orgId) =>
  supabase.from('okrs').select('*, key_results(*)').eq('org_id', orgId)

export const upsertOKR = (okr) =>
  supabase.from('okrs').upsert(okr, { onConflict: 'id' })

export const deleteOKR = (id) =>
  supabase.from('okrs').delete().eq('id', id)

// ── Sales employees ───────────────────────────────────────────────────────────
export const getSalesEmployees = (orgId) =>
  supabase
    .from('sales_employees')
    .select('*')
    .eq('org_id', orgId)
    .order('name')

export const upsertSalesEmployee = (emp) =>
  supabase.from('sales_employees').upsert(emp, { onConflict: 'id' })

export const deleteSalesEmployee = (id) =>
  supabase.from('sales_employees').delete().eq('id', id)

// ── Calendar events ───────────────────────────────────────────────────────────
export const getCalendarEvents = (orgId, from, to) =>
  supabase
    .from('calendar_events')
    .select('*, sales_employees(name, avatar_url, territory)')
    .eq('org_id', orgId)
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time')

export const upsertCalendarEvent = (event) =>
  supabase.from('calendar_events').upsert(event, { onConflict: 'id' })

export const deleteCalendarEvent = (id) =>
  supabase.from('calendar_events').delete().eq('id', id)
