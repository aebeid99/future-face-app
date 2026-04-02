// ─── Navigation ───────────────────────────────────────────────
export const NAV          = 'NAV'
export const STEP         = 'STEP'

// ─── Auth ─────────────────────────────────────────────────────
export const LOGIN        = 'LOGIN'
export const LOGOUT       = 'LOGOUT'
export const SIGNUP       = 'SIGNUP'

// ─── Subscription ─────────────────────────────────────────────
export const SUB_UPDATE   = 'SUB_UPDATE'

// ─── Language / Theme / Accessibility ─────────────────────────
export const LANG         = 'LANG'
export const THEME        = 'THEME'        // { theme: 'light'|'dark'|'eyestrain'|'system' }
export const SET_FONT_SIZE = 'SET_FONT_SIZE' // { size: 'sm'|'md'|'lg'|'xl' }

// ─── Ticket Drawer (global) ────────────────────────────────────
export const OPEN_TICKET   = 'OPEN_TICKET'  // { id: 'ini_xxx' }
export const CLOSE_TICKET  = 'CLOSE_TICKET'

// ─── Ticket Comments ──────────────────────────────────────────
export const TICKET_COMMENT_ADD = 'TICKET_COMMENT_ADD'  // { iniId, okrId, text, mentions? }
export const TICKET_COMMENT_DEL = 'TICKET_COMMENT_DEL'  // { iniId, okrId, commentId }
export const TICKET_REPLY_ADD   = 'TICKET_REPLY_ADD'    // { iniId, okrId, commentId, text }

// ─── Sub-tickets (child issues within an initiative) ──────────
export const SUB_TICKET_CREATE = 'SUB_TICKET_CREATE'  // { okrId, iniId, title, issueType, ... }
export const SUB_TICKET_UPDATE = 'SUB_TICKET_UPDATE'  // { okrId, iniId, subId, updates }
export const SUB_TICKET_DELETE = 'SUB_TICKET_DELETE'  // { okrId, iniId, subId }

// ─── Permissions ──────────────────────────────────────────────
export const ORG_PERM_SET = 'ORG_PERM_SET'  // { permissions: { canEdit: bool, ... } }

// ─── Attendance Policy (Robox) ────────────────────────────────
export const ATTENDANCE_POLICY_SET = 'ATTENDANCE_POLICY_SET'  // { policy: { [title]: bool } }

// ─── OKR / Impactor ───────────────────────────────────────────
export const OKR_CREATE   = 'OKR_CREATE'
export const OKR_UPDATE   = 'OKR_UPDATE'
export const OKR_DELETE   = 'OKR_DELETE'
export const KR_CREATE    = 'KR_CREATE'
export const KR_UPDATE    = 'KR_UPDATE'
export const KR_DELETE    = 'KR_DELETE'
export const INITIATIVE_CREATE = 'INITIATIVE_CREATE'
export const INITIATIVE_UPDATE = 'INITIATIVE_UPDATE'
export const INITIATIVE_DELETE = 'INITIATIVE_DELETE'
export const CHECKIN_ADD       = 'CHECKIN_ADD'
export const CHECKIN_DELETE    = 'CHECKIN_DELETE'

// ─── AI Chat ──────────────────────────────────────────────────
export const CHAT_ADD          = 'CHAT_ADD'
export const CHAT_UPDATE_LAST  = 'CHAT_UPDATE_LAST'
export const CHAT_CLEAR        = 'CHAT_CLEAR'

// ─── Robox / Workforce ────────────────────────────────────────
export const MEMBER_ADD    = 'MEMBER_ADD'
export const MEMBER_UPDATE = 'MEMBER_UPDATE'
export const MEMBER_DELETE = 'MEMBER_DELETE'
export const CHECKIN_LOG   = 'CHECKIN_LOG'

// ─── Settings ─────────────────────────────────────────────────
export const ORG_UPDATE    = 'ORG_UPDATE'
export const STATUS_CONFIG = 'STATUS_CONFIG'

// ─── UI / Navigation helpers ──────────────────────────────────
export const HIGHLIGHT     = 'HIGHLIGHT'   // pulse-highlight an OKR/KR row

// ─── North Star ───────────────────────────────────────────────
export const NORTHSTAR_SET = 'NORTHSTAR_SET'

// ─── Drag / Reorder ───────────────────────────────────────────
export const OKR_REORDER         = 'OKR_REORDER'         // { fromIndex, toIndex }
export const KR_MOVE             = 'KR_MOVE'             // { krId, fromOkrId, toOkrId, toIndex }
export const INITIATIVE_MOVE     = 'INITIATIVE_MOVE'     // { iniId, fromOkrId, toOkrId, toKrId, toIndex }

// ─── Issues ───────────────────────────────────────────────────
export const ISSUE_CREATE        = 'ISSUE_CREATE'
export const ISSUE_UPDATE        = 'ISSUE_UPDATE'
export const ISSUE_DELETE        = 'ISSUE_DELETE'
export const WORKFLOW_CONFIG_SET = 'WORKFLOW_CONFIG_SET'

// ─── Demo ─────────────────────────────────────────────────────
export const DEMO_PLAN     = 'DEMO_PLAN'

// ─── Workspace (P1) ───────────────────────────────────────────
export const WS_CREATE          = 'WS_CREATE'
export const WS_UPDATE          = 'WS_UPDATE'
export const WS_DELETE          = 'WS_DELETE'
export const WS_SWITCH          = 'WS_SWITCH'
export const WS_MEMBER_ADD      = 'WS_MEMBER_ADD'
export const WS_MEMBER_REMOVE   = 'WS_MEMBER_REMOVE'
export const WS_MEMBER_ROLE     = 'WS_MEMBER_ROLE'
export const JOIN_REQUEST_SEND  = 'JOIN_REQUEST_SEND'
export const JOIN_REQUEST_DECIDE= 'JOIN_REQUEST_DECIDE'

// ─── Onboarding (P2) ──────────────────────────────────────────
export const ONBOARDING_SET     = 'ONBOARDING_SET'
export const ONBOARDING_COMPLETE= 'ONBOARDING_COMPLETE'

// ─── AI Credits / Billing ─────────────────────────────────────
export const AI_CREDIT_USE      = 'AI_CREDIT_USE'
export const AI_CREDIT_RESET    = 'AI_CREDIT_RESET'
export const AI_SESSION_USE     = 'AI_SESSION_USE'
export const BILLING_PLAN_SET   = 'BILLING_PLAN_SET'

// ─── Canvas (P9) ──────────────────────────────────────────────
export const CANVAS_CREATE      = 'CANVAS_CREATE'
export const CANVAS_UPDATE      = 'CANVAS_UPDATE'
export const CANVAS_DELETE      = 'CANVAS_DELETE'
export const CANVAS_NODE_ADD    = 'CANVAS_NODE_ADD'
export const CANVAS_NODE_UPDATE = 'CANVAS_NODE_UPDATE'
export const CANVAS_NODE_DELETE = 'CANVAS_NODE_DELETE'
export const CANVAS_OPEN        = 'CANVAS_OPEN'

// ─── Notifications (P6) ───────────────────────────────────────
export const NOTIF_ADD          = 'NOTIF_ADD'
export const NOTIF_READ         = 'NOTIF_READ'
export const NOTIF_READ_ALL     = 'NOTIF_READ_ALL'
export const NOTIF_CLEAR        = 'NOTIF_CLEAR'

// ─── Command Palette (P6) ─────────────────────────────────────
export const CMD_PALETTE_OPEN   = 'CMD_PALETTE_OPEN'
export const CMD_PALETTE_CLOSE  = 'CMD_PALETTE_CLOSE'

// ─── Terminology (P4) ─────────────────────────────────────────
export const TERM_OVERRIDE      = 'TERM_OVERRIDE'   // { wsId, terms: { okr, kr, ... } }

// ─── Owner System (P5) ────────────────────────────────────────
export const OWNER_SET          = 'OWNER_SET'       // { okrId, iniId, subId?, owner }

// ─── Discovery (P7) ───────────────────────────────────────────
export const DISCOVERY_LOAD     = 'DISCOVERY_LOAD'  // { cards: [...] }
export const DISCOVERY_DISMISS  = 'DISCOVERY_DISMISS' // { id }
export const DISCOVERY_PROMOTE  = 'DISCOVERY_PROMOTE' // { id } → turns into issue

// ─── Sprint (P8) ──────────────────────────────────────────────
export const SPRINT_CREATE      = 'SPRINT_CREATE'
export const SPRINT_UPDATE      = 'SPRINT_UPDATE'
export const SPRINT_DELETE      = 'SPRINT_DELETE'
export const SPRINT_START       = 'SPRINT_START'
export const SPRINT_COMPLETE    = 'SPRINT_COMPLETE'
export const SPRINT_ISSUE_ADD   = 'SPRINT_ISSUE_ADD'
export const SPRINT_ISSUE_REMOVE= 'SPRINT_ISSUE_REMOVE'
