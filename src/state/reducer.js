import * as A from './actions.js'
import { progressStatus } from '../utils/formatting.js'

// ── Derive OKR progress + status from its key results ──────────
function recalcOkr(okr, krs) {
  const progress = krs.length
    ? Math.round(krs.reduce((s, kr) => s + Math.min((kr.current / kr.target) * 100, 100), 0) / krs.length)
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
    case A.OKR_CREATE: {
      const newOKR = {
        id: `okr_${Date.now()}`,
        title: action.title,
        owner: action.owner || state.user?.name,
        quarter: action.quarter || 'Q2 2026',
        status: action.status || 'on_track',
        progress: 0,
        keyResults: [],
        initiatives: [],
        tags: action.tags || [],
        vision2030: action.vision2030 || null,
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        okrs: [...state.okrs, newOKR],
      }
    }

    case A.OKR_UPDATE: {
      return {
        ...state,
        okrs: state.okrs.map(o =>
          o.id === action.id ? { ...o, ...action.updates } : o
        ),
      }
    }

    case A.OKR_DELETE: {
      return {
        ...state,
        okrs: state.okrs.filter(o => o.id !== action.id),
      }
    }

    case A.KR_CREATE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          const newKr = {
            id: `kr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: action.title,
            current: Number(action.current) || 0,
            target: Number(action.target) || 100,
            unit: action.unit || '%',
            status: 'on_track',
          }
          return recalcOkr(o, [...(o.keyResults || []), newKr])
        }),
      }
    }

    case A.KR_UPDATE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          const krs = (o.keyResults || []).map(kr =>
            kr.id === action.krId ? { ...kr, ...action.updates } : kr
          )
          return recalcOkr(o, krs)
        }),
      }
    }

    case A.KR_DELETE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return recalcOkr(o, (o.keyResults || []).filter(kr => kr.id !== action.krId))
        }),
      }
    }

    // ─── Initiatives ──────────────────────────────────────────
    case A.INITIATIVE_CREATE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          const item = {
            id: `ini_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title:  action.title,
            owner:  action.owner  || '',
            dueDate: action.dueDate || '',
            status: 'not_started',
            krId:   action.krId   || null,
          }
          return { ...o, initiatives: [...(o.initiatives || []), item] }
        }),
      }
    }

    case A.INITIATIVE_UPDATE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return {
            ...o,
            initiatives: (o.initiatives || []).map(ini =>
              ini.id === action.initiativeId ? { ...ini, ...action.updates } : ini
            ),
          }
        }),
      }
    }

    case A.INITIATIVE_DELETE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          return { ...o, initiatives: (o.initiatives || []).filter(ini => ini.id !== action.initiativeId) }
        }),
      }
    }

    // ─── Check-ins ────────────────────────────────────────────
    case A.CHECKIN_ADD: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          const checkin = {
            id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            date:             new Date().toISOString(),
            author:           action.author || 'You',
            note:             action.note,
            progressSnapshot: o.progress,
            status:           action.status || 'on_track',
          }
          return { ...o, checkins: [checkin, ...(o.checkins || [])] }
        }),
      }
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
      return { ...state, members: [...state.members, member] }
    }

    case A.MEMBER_UPDATE:
      return {
        ...state,
        members: state.members.map(m =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      }

    case A.MEMBER_DELETE:
      return {
        ...state,
        members: state.members.filter(m => m.id !== action.id),
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
      status: 'on_track',
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
        { id: 'ini_d1a', title: 'Launch Q2 enterprise outbound campaign', owner: 'Ahmed', dueDate: '2026-05-15', status: 'in_progress', krId: 'kr_demo_1a' },
        { id: 'ini_d1b', title: 'Define ICP and account scoring model',   owner: 'Ahmed', dueDate: '2026-04-30', status: 'done',        krId: null },
        { id: 'ini_d1c', title: 'Build ROI calculator for prospects',     owner: 'Ahmed', dueDate: '2026-06-01', status: 'not_started', krId: 'kr_demo_1b' },
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
      status: 'at_risk',
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
        { id: 'ini_d2a', title: 'Redesign onboarding flow',       owner: 'Ahmed', dueDate: '2026-05-01', status: 'in_progress', krId: 'kr_demo_2b' },
        { id: 'ini_d2b', title: 'Run quarterly NPS survey',       owner: 'Ahmed', dueDate: '2026-04-20', status: 'blocked',     krId: 'kr_demo_2a' },
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
      status: 'on_track',
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
}
