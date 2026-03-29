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
        id: `m_${Date.now()}`,
        ...action.member,
        joinedAt: new Date().toISOString(),
      }
      return {
        ...state,
        members: [...state.members, member],
      }
    }

    case A.MEMBER_UPDATE:
      return {
        ...state,
        members: state.members.map(m =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
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
      initiatives: [],
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
      initiatives: [],
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
    },
  ],
  members: [],
  chatHistory: [],
}
