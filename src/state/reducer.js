import * as A from './actions.js'

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

    case A.KR_UPDATE: {
      return {
        ...state,
        okrs: state.okrs.map(o => {
          if (o.id !== action.okrId) return o
          const krs = o.keyResults.map(kr =>
            kr.id === action.krId ? { ...kr, ...action.updates } : kr
          )
          const progress = krs.length
            ? Math.round(krs.reduce((s, kr) => s + (kr.current / kr.target * 100), 0) / krs.length)
            : 0
          return { ...o, keyResults: krs, progress }
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

  okrs: [],
  members: [],
  chatHistory: [],
}
