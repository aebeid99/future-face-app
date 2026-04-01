import * as A from './actions.js'
import { progressStatus } from '../utils/formatting.js'
import { calcKrProgress } from '../utils/krMetrics.js'

// ── Audit log helpers ───────────────────────────────────────────
function al(state, action, target, module = 'impactor') {
  return {
    id:     `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user:   state.user?.name || 'System',
    action,
    target,
    module,
    time:   new Date().toISOString(),
  }
}
function withAudit(state, entry) {
  return { ...state, auditLog: [entry, ...(state.auditLog || [])].slice(0, 500) }
}

// ── Derive OKR progress + status from its key results ──────────
// Uses calcKrProgress() which handles Boolean / Numeric / Milestone types
function recalcOkr(okr, krs) {
  const progress = krs.length
    ? Math.round(krs.reduce((s, kr) => s + calcKrProgress(kr), 0) / krs.length)
    : okr.progress   // preserve original progress when no KRs yet
  const allDone = krs.length > 0 && krs.every(kr => kr.status === 'completed')
  const status  = allDone ? 'completed' : progressStatus(progress)
  return { ...okr, keyResults: krs, progress, status }
}

export function reducer(state, action) {
  switch (action.type) {

    // ─── Navigation ───────────────────────────────────────────
    case A.NAV:
      return { ...state, page: action.page }

    case A.STEP:
      return { ...state, step: action.step }

    // ─── Auth ─────────────────────────────────────────────────
    case A.LOGIN:
      return {
        ...state,
        user: action.user,
        org: action.org || state.org,
        page: 'dashboard',
      }

    case A.LOGOUT:
      return {
        ...INIT_STATE,
        lang: state.lang,
      }

    case A.SIGNUP:
      return {
        ...state,
        user: action.user,
        org: {
          ...state.org,
          ...action.org,
          id: action.org?.domain || state.org.id,
        },
        page: action.nextPage || 'dashboard',
      }

    // ─── Subscription ─────────────────────────────────────────
    case A.SUB_UPDATE: {
      const { product, plan } = action
      return {
        ...state,
        org: {
          ...state.org,
          subs: { ...state.org.subs, [product]: plan },
        },
      }
    }

    // ─── Language ─────────────────────────────────────────────
    case A.LANG:
      return { ...state, lang: action.lang }

    // ─── OKR ──────────────────────────────────────────────────
    case A.NORTHSTAR_SET:
      return { ...state, northStar: { ...state.northStar, ...action.updates } }

    case A.OKR_REORDER: {
      const { fromIndex, toIndex } = action
      if (fromIndex === toIndex) return state
      const arr = [...state.okrs]
      const [moved] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, moved)
      return { ...state, okrs: arr }
    }

    case A.KR_MOVE: {
      const { krId, fromOkrId, toOkrId, toIndex } = action
      if (fromOkrId === toOkrId) {
        // Reorder within same OKR
        return {
          ...state,
          okrs: state.okrs.map(o => {
            if (o.id !== fromOkrId) return o
            const krs = [...(o.keyResults || [])]
            const fromIdx = krs.findIndex(k => k.id === krId)
            if (fromIdx === -1) return o
            const [moved] = krs.splice(fromIdx, 1)
            krs.splice(toIndex ?? krs.length, 0, moved)
            return recalcOkr(o, krs)
          }),
        }
      }
      // Move to different OKR
      let movedKr = null
      const updated = state.okrs.map(o => {
        if (o.id === fromOkrId) {
          const krs = (o.keyResults || []).filter(k => { if (k.id === krId) { movedKr = k; return false } return true })
          return recalcOkr(o, krs)
        }
        return o
      })
      if (!movedKr) return state
      return {
        ...state,
        okrs: updated.map(o => {
          if (o.id !== toOkrId) return o
          const krs = [...(o.keyResults || []), movedKr]
          return recalcOkr(o, krs)
        }),
      }
    }

    case A.INITIATIVE_MOVE: {
      const { iniId, fromOkrId, toOkrId, toKrId } = action
      let movedIni = null
      const updated = state.okrs.map(o => {
        if (o.id === fromOkrId) {
          const inis = (o.initiatives || []).filter(i => { if (i.id === iniId) { movedIni = i; return false } return true })
          return { ...o, initiatives: inis }
        }
        return o
      })
      if (!movedIni) return state
      const reparented = { ...movedIni, krId: toKrId ?? movedIni.krId }
      return {
        ...state,
        okrs: updated.map(o => {
          if (o.id !== toOkrId) return o
          return { ...o, initiatives: [...(o.initiatives || []), reparented] }
        }),
      }
    }

    case A.OKR_CREATE: {
      const newOKR = {
        id: `okr_${Date.now()}`,
        title: action.title,
        owner: action.owner || state.user?.name,
        quarter: action.quarter || 'Q2 2026',
        cadence: action.cadence || 'Quarterly',
        status: action.status || 'not_started',
        confidence: action.confidence ?? 60,
        summary: action.summary || '',
        progress: 0,
        keyResults: [],
        initiatives: [],
        tags: action.tags || [],
        vision2030: action.vision2030 || null,
        createdAt: new Date().toISOString(),
      }
      return withAudit(
        { ...state, okrs: [...state.okrs, newOKR] },
        al(state, 'Created Objective', action.title, 'impactor')
      )
    }

    case A.OKR_UPDATE: {
      const target = state.okrs.find(o => o.id === action.id)?.title || action.id
      return withAudit(
        { ...state, okrs: state.okrs.map(o => o.id === action.id ? { ...o, ...action.updates } : o) },
        al(state, 'Updated Objective', target, 'impactor')
      )
    }

    case A.OKR_DELETE: {
      const target = state.okrs.find(o => o.id === action.id)?.title || action.id
      return withAudit(
        { ...state, okrs: state.okrs.filter(o => o.id !== action.id) },
        al(state, 'Deleted Objective', target, 'impactor')
      )
    }

    case A.KR_CREATE: {
      const okrTitle = state.okrs.find(o => o.id === action.okrId)?.title || ''
      const newKr = {
        id: `kr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title:    action.title,
        type:     action.krType   || action.type || 'numeric',
        baseline: action.baseline ?? 0,
        current:  Number(action.current) || 0,
        target:   Number(action.target)  || 100,
        unit:     action.unit     || '%',
        done:     action.done     ?? false,
        startDate:        action.startDate        || '',
        dueDate:          action.dueDate          || '',
        progressOverride: action.progressOverride ?? undefined,
        tags:   action.tags   || [],
        status: 'on_track',
      }
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => o.id !== action.okrId ? o : recalcOkr(o, [...(o.keyResults || []), newKr])),
      }
      return withAudit(nextState, al(state, 'Created Key Result', `${action.title} → ${okrTitle}`, 'impactor'))
    }

    case A.KR_UPDATE: {
      const kr = state.okrs.find(o => o.id === action.okrId)?.keyResults?.find(k => k.id === action.krId)
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return recalcOkr(o, (o.keyResults || []).map(k => k.id === action.krId ? { ...k, ...action.updates } : k))
        }),
      }
      return withAudit(nextState, al(state, 'Updated Key Result', kr?.title || action.krId, 'impactor'))
    }

    case A.KR_DELETE: {
      const kr = state.okrs.find(o => o.id === action.okrId)?.keyResults?.find(k => k.id === action.krId)
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => o.id !== action.okrId ? o : recalcOkr(o, (o.keyResults || []).filter(k => k.id !== action.krId))),
      }
      return withAudit(nextState, al(state, 'Deleted Key Result', kr?.title || action.krId, 'impactor'))
    }

    // ─── Initiatives ──────────────────────────────────────────
    case A.INITIATIVE_CREATE: {
      const okrTitle = state.okrs.find(o => o.id === action.okrId)?.title || ''
      const item = {
        id: `ini_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title:     action.title,
        owner:     action.owner     || '',
        startDate: action.startDate || '',
        dueDate:   action.dueDate   || '',
        budget:    action.budget    || 0,
        status:    action.status    || 'not_started',
        krId:      action.krId      || null,
        priority:  action.priority  || 'p2',
        issueType: action.issueType || 'feature',
        description: action.description || '',
        comments:  [],
        auditLog:  [],
      }
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => o.id !== action.okrId ? o : { ...o, initiatives: [...(o.initiatives || []), item] }),
      }
      return withAudit(nextState, al(state, 'Created Initiative', `${action.title} → ${okrTitle}`, 'issues'))
    }

    case A.INITIATIVE_UPDATE: {
      const ini = state.okrs.find(o => o.id === action.okrId)?.initiatives?.find(i => i.id === action.initiativeId)
      const changed = Object.keys(action.updates).filter(k => k !== '_lastComment')
      const actionLabel = action.updates.status ? `Changed status to "${action.updates.status}"` : `Updated ${changed.join(', ')}`
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return {
            ...o,
            initiatives: (o.initiatives || []).map(i =>
              i.id === action.initiativeId ? { ...i, ...action.updates } : i
            ),
          }
        }),
      }
      return withAudit(nextState, al(state, actionLabel, ini?.title || action.initiativeId, 'issues'))
    }

    case A.INITIATIVE_DELETE: {
      const ini = state.okrs.find(o => o.id === action.okrId)?.initiatives?.find(i => i.id === action.initiativeId)
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return { ...o, initiatives: (o.initiatives || []).filter(i => i.id !== action.initiativeId) }
        }),
      }
      return withAudit(nextState, al(state, 'Deleted Initiative', ini?.title || action.initiativeId, 'issues'))
    }

    // ─── Check-ins ────────────────────────────────────────────
    case A.CHECKIN_ADD: {
      const okrTitle = state.okrs.find(o => o.id === action.okrId)?.title || ''
      const nextState = {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          const checkin = {
            id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            date:             new Date().toISOString(),
            author:           action.author || state.user?.name || 'You',
            note:             action.note,
            progressSnapshot: o.progress,
            status:           action.status || 'on_track',
          }
          return { ...o, checkins: [checkin, ...(o.checkins || [])] }
        }),
      }
      return withAudit(nextState, al(state, `Check-in (${action.status || 'on_track'})`, okrTitle, 'impactor'))
    }

    case A.CHECKIN_DELETE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return { ...o, checkins: (o.checkins || []).filter(c => c.id !== action.checkinId) }
        }),
      }
    }

    // ─── AI Chat ──────────────────────────────────────────────
    case A.CHAT_ADD:
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.message],
      }

    case A.CHAT_UPDATE_LAST: {
      const msgs = [...state.chatHistory]
      const last = msgs[msgs.length - 1]
      if (last) msgs[msgs.length - 1] = { ...last, ...action.updates }
      return { ...state, chatHistory: msgs }
    }

    case A.CHAT_CLEAR:
      return { ...state, chatHistory: [] }

    // ─── Org / Settings ───────────────────────────────────────
    case A.ORG_UPDATE:
      return {
        ...state,
        org: { ...state.org, ...action.updates },
      }

    case A.STATUS_CONFIG:
      return {
        ...state,
        org: {
          ...state.org,
          statusLabels: { ...state.org.statusLabels, ...action.labels },
        },
      }

    // ─── Robox ────────────────────────────────────────────────
    case A.MEMBER_ADD: {
      const member = {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name:       action.member.name       || '',
        role:       action.member.role       || '',
        dept:       action.member.dept       || '',
        email:      action.member.email      || '',
        phone:      action.member.phone      || '',
        managerId:  action.member.managerId  || null,
        startDate:  action.member.startDate  || new Date().toISOString().split('T')[0],
        status:     'checked_in',
        attendance: 100,
        checkins:   [],
      }
      return withAudit(
        { ...state, members: [...state.members, member] },
        al(state, 'Added Team Member', member.name, 'robox')
      )
    }

    case A.MEMBER_UPDATE: {
      const m = state.members.find(m => m.id === action.id)
      return withAudit(
        { ...state, members: state.members.map(m => m.id === action.id ? { ...m, ...action.updates } : m) },
        al(state, 'Updated Team Member', m?.name || action.id, 'robox')
      )
    }

    case A.MEMBER_DELETE: {
      const m = state.members.find(m => m.id === action.id)
      return withAudit(
        { ...state, members: state.members.filter(m => m.id !== action.id) },
        al(state, 'Removed Team Member', m?.name || action.id, 'robox')
      )
    }

    case A.CHECKIN_LOG: {
      // Log a daily attendance check-in for a member
      return {
        ...state,
        members: state.members.map(m => {
          if (m.id !== action.memberId) return m
          const entry = {
            id:     `cl_${Date.now()}`,
            date:   new Date().toISOString(),
            status: action.status || 'checked_in',
            note:   action.note   || '',
          }
          const checkins = [entry, ...(m.checkins || [])].slice(0, 90) // keep 90 days
          // Recalc attendance rate from last 30 entries
          const recent = checkins.slice(0, 30)
          const present = recent.filter(c => c.status === 'checked_in' || c.status === 'late').length
          const attendance = recent.length ? Math.round((present / recent.length) * 100) : m.attendance
          return { ...m, checkins, attendance, status: action.status || m.status }
        }),
      }
    }

    // ─── UI helpers ───────────────────────────────────────────
    // HIGHLIGHT: pulse-highlight an OKR, KR, or initiative row
    // { id, okrId? } — cleared after 3 s by the component
    case A.HIGHLIGHT:
      return { ...state, highlight: { id: action.id, okrId: action.okrId || null, ts: Date.now() } }

    // ─── Workflow config ───────────────────────────────────────
    case A.WORKFLOW_CONFIG_SET:
      return { ...state, workflowConfig: { ...state.workflowConfig, ...action.updates } }

    // ─── Demo ─────────────────────────────────────────────────
    case A.DEMO_PLAN:
      return { ...state, demoVariant: action.variant }

    default:
      return state
  }
}

// ─── Initial State ────────────────────────────────────────────
export const INIT_STATE = {
  page: 'landing',
  step: 0,
  lang: 'en',
  demoVariant: 'A',
  highlight: null,   // { id, okrId, ts } — set by HIGHLIGHT action, cleared by component

  northStar: {
    title: 'Weekly Active Paying Workspaces',
    metricLabel: 'WAW',
    target: 1500,
    current: 124,
  },

  workflowConfig: {
    stages: ['To Do', 'In Progress', 'In Review', 'Shipped', 'Blocked'],
    issueTypes: ['Feature', 'Bug', 'Task', 'Epic'],
  },

  user: null,
  org: {
    id: null,
    name: '',
    domain: '',
    country: 'SA',
    currency: 'SAR',
    dataResidency: null,
    subs: {
      impactor: 'free',   // free | pro | enterprise
      robox: 'free',
      aiPilot: false,
    },
    statusLabels: {
      on_track:  'On Track',
      at_risk:   'At Risk',
      off_track: 'Off Track',
      completed: 'Completed',
      paused:    'Paused',
    },
    yearlyDiscount: 20,
    userCount: 1,
  },

  okrs: [
    {
      id: 'okr_demo_1',
      title: 'Grow enterprise customer base in KSA',
      owner: 'Ahmed',
      quarter: 'Q2 2026',
      cadence: 'Quarterly',
      status: 'on_track',
      confidence: 78,
      summary: 'Drive outbound sales and enterprise pipeline to hit ARR targets in the KSA market.',
      progress: 42,
      tags: ['growth', 'enterprise'],
      vision2030: null,
      createdAt: '2026-04-01T08:00:00.000Z',
      keyResults: [
        {
          id: 'kr_demo_1a',
          title: 'Close 12 new enterprise accounts',
          current: 5,
          target: 12,
          unit: 'deals',
          status: 'on_track',
        },
        {
          id: 'kr_demo_1b',
          title: 'Achieve SAR 2.4M in new ARR',
          current: 840000,
          target: 2400000,
          unit: 'SAR',
          status: 'at_risk',
        },
        {
          id: 'kr_demo_1c',
          title: 'Increase pipeline coverage to 3×',
          current: 2.1,
          target: 3,
          unit: 'score',
          status: 'on_track',
        },
      ],
      initiatives: [
        { id: 'ini_d1a', title: 'Launch Q2 enterprise outbound campaign', owner: 'Ahmed', startDate: '2026-04-01', dueDate: '2026-05-15', status: 'in_progress', krId: 'kr_demo_1a', priority: 'p1', budget: 45000, comments: [], auditLog: [] },
        { id: 'ini_d1b', title: 'Define ICP and account scoring model',   owner: 'Sara',  startDate: '2026-04-01', dueDate: '2026-04-30', status: 'done',        krId: 'kr_demo_1a', priority: 'p2', budget: 8000,  comments: [], auditLog: [] },
        { id: 'ini_d1c', title: 'Build ROI calculator for prospects',     owner: 'Ahmed', startDate: '2026-05-01', dueDate: '2026-06-01', status: 'not_started', krId: 'kr_demo_1b', priority: 'p2', budget: 12000, comments: [], auditLog: [] },
      ],
      checkins: [
        { id: 'ci_d1a', date: '2026-04-14T09:00:00.000Z', author: 'Ahmed', note: 'Closed 2 new accounts this week. Pipeline looks strong heading into month-end.', progressSnapshot: 42, status: 'on_track' },
        { id: 'ci_d1b', date: '2026-04-07T09:00:00.000Z', author: 'Ahmed', note: 'Good momentum on outbound. ARR target at risk — need to revisit deal sizes.', progressSnapshot: 31, status: 'at_risk' },
      ],
    },
    {
      id: 'okr_demo_2',
      title: 'Deliver world-class product experience',
      owner: 'Ahmed',
      quarter: 'Q2 2026',
      cadence: 'Quarterly',
      status: 'at_risk',
      confidence: 45,
      summary: 'Reduce friction in onboarding and increase NPS to drive long-term retention.',
      progress: 28,
      tags: ['product', 'cx'],
      vision2030: null,
      createdAt: '2026-04-01T08:00:00.000Z',
      keyResults: [
        {
          id: 'kr_demo_2a',
          title: 'Reach NPS score of 65+',
          current: 48,
          target: 65,
          unit: 'NPS',
          status: 'at_risk',
        },
        {
          id: 'kr_demo_2b',
          title: 'Reduce time-to-value to under 3 days',
          current: 7,
          target: 3,
          unit: 'days',
          status: 'off_track',
        },
      ],
      initiatives: [
        { id: 'ini_d2a', title: 'Redesign onboarding flow',       owner: 'Ali',   startDate: '2026-04-05', dueDate: '2026-05-01', status: 'in_progress', krId: 'kr_demo_2b', priority: 'p1', budget: 18000, comments: [], auditLog: [] },
        { id: 'ini_d2b', title: 'Run quarterly NPS survey',       owner: 'Nora',  startDate: '2026-04-01', dueDate: '2026-04-20', status: 'blocked',     krId: 'kr_demo_2a', priority: 'p1', budget: 5000,  comments: [], auditLog: [] },
      ],
      checkins: [
        { id: 'ci_d2a', date: '2026-04-14T09:00:00.000Z', author: 'Ahmed', note: 'NPS survey delayed — engineering bandwidth constrained. Escalating.', progressSnapshot: 28, status: 'at_risk' },
      ],
    },
    {
      id: 'okr_demo_3',
      title: 'Build a high-performance sales team',
      owner: 'Ahmed',
      quarter: 'Q2 2026',
      cadence: 'Quarterly',
      status: 'on_track',
      confidence: 65,
      summary: 'Hire, onboard, and enable a sales team that consistently hits quota and shortens deal cycles.',
      progress: 0,
      tags: ['people'],
      vision2030: null,
      createdAt: '2026-04-01T08:00:00.000Z',
      keyResults: [],
      initiatives: [],
      checkins: [],
    },
  ],
  members: [
    { id: 'm_seed_1', name: 'Ahmed Al-Rashidi', role: 'Chief Executive Officer', dept: 'Executive', email: 'ahmed@futureface.io',  phone: '+966 50 123 4567', managerId: null,       startDate: '2023-01-10', status: 'checked_in', attendance: 96, checkins: [] },
    { id: 'm_seed_2', name: 'Sara Mahmoud',     role: 'Strategy Lead',           dept: 'Strategy',  email: 'sara@futureface.io',   phone: '+966 50 234 5678', managerId: 'm_seed_1', startDate: '2023-03-01', status: 'checked_in', attendance: 91, checkins: [] },
    { id: 'm_seed_3', name: 'Ali Hassan',       role: 'Engineering Lead',        dept: 'Tech',      email: 'ali@futureface.io',    phone: '+966 50 345 6789', managerId: 'm_seed_1', startDate: '2023-02-15', status: 'absent',     attendance: 88, checkins: [] },
    { id: 'm_seed_4', name: 'Nora Al-Ghamdi',   role: 'Data Analyst',            dept: 'Analytics', email: 'nora@futureface.io',   phone: '+966 50 456 7890', managerId: 'm_seed_2', startDate: '2024-01-20', status: 'checked_in', attendance: 94, checkins: [] },
    { id: 'm_seed_5', name: 'Khalid Al-Harbi',  role: 'Sales Lead',              dept: 'Sales',     email: 'khalid@futureface.io', phone: '+966 50 567 8901', managerId: 'm_seed_1', startDate: '2023-08-01', status: 'late',       attendance: 79, checkins: [] },
  ],
  chatHistory: [],

  auditLog: [
    { id:'al_seed_1', user:'Ahmed Al-Rashidi', action:'Check-in (on_track)',     target:'Grow enterprise customer base in KSA',    module:'impactor', time:'2026-04-14T09:00:00.000Z' },
    { id:'al_seed_2', user:'Ahmed Al-Rashidi', action:'Updated Key Result',      target:'Achieve SAR 2.4M in new ARR',             module:'impactor', time:'2026-04-13T14:22:00.000Z' },
    { id:'al_seed_3', user:'Nora Al-Ghamdi',   action:'Generated AI Briefing',   target:'Sunday Briefing',                         module:'ai_pilot', time:'2026-04-13T19:00:00.000Z' },
    { id:'al_seed_4', user:'Sara Mahmoud',      action:'Check-in (at_risk)',      target:'Deliver world-class product experience',  module:'impactor', time:'2026-04-13T10:00:00.000Z' },
    { id:'al_seed_5', user:'Ahmed Al-Rashidi', action:'Changed status to "blocked"', target:'Run quarterly NPS survey',            module:'issues',   time:'2026-04-12T15:30:00.000Z' },
    { id:'al_seed_6', user:'Ali Hassan',        action:'Added Team Member',      target:'Yusuf Ibrahim',                           module:'robox',    time:'2026-04-10T11:00:00.000Z' },
    { id:'al_seed_7', user:'Ahmed Al-Rashidi', action:'Created Objective',       target:'Build a high-performance sales team',     module:'impactor', time:'2026-04-01T08:00:00.000Z' },
    { id:'al_seed_8', user:'Sara Mahmoud',      action:'Created Initiative',     target:'Redesign onboarding flow',               module:'issues',   time:'2026-04-05T09:30:00.000Z' },
  ],
}
