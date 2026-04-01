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
