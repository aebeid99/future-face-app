/**
 * InitiativeView — Combined initiative drawer component
 *
 * Merges two existing designs into a dark-themed slide-in panel (from right, 680px wide).
 * Renders when state.openTicketId matches a top-level initiative.
 *
 * Features:
 * - Header with share, more, and close buttons
 * - Editable title with TypeChip
 * - Meta row: status, priority, owner, due date
 * - Tabbed interface: Overview | Description | Tickets | Comments | Attachments
 * - Overview: execution status, completion %, linked objective, budget utilization
 * - Description: rich text editor
 * - Tickets: sub-ticket management with linking to epics
 * - Comments & Attachments: full thread support
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  TrendingUp, X, Share2, MoreHorizontal, Edit3, Check, User2, Calendar,
  Flag, Target, Link2, Plus, ChevronDown, ChevronRight, Trash2,
  MessageSquare, Paperclip, FileText, History, Send, Reply, Download,
  File, Image, Film, Clock, Star, Bug, BookOpen, CheckCircle2, Users,
  Zap, AlertCircle, CornerDownRight,
} from 'lucide-react'

import { useApp } from '../../state/AppContext'
import {
  CLOSE_TICKET, INITIATIVE_UPDATE, SUB_TICKET_CREATE,
  SUB_TICKET_UPDATE, SUB_TICKET_DELETE, TICKET_COMMENT_ADD,
  TICKET_COMMENT_DEL, TICKET_REPLY_ADD,
} from '../../state/actions'
import Avatar from './Avatar'
import Btn from './Btn'
import RichEditor from './RichEditor'
import TypeChip from './TypeChip'
import ProgressBar from './ProgressBar'

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB

const STATUS_CFG = {
  not_started: { label: 'To Do',       dot: 'bg-gray-400',    text: 'text-gray-300'    },
  in_progress: { label: 'In Dev',      dot: 'bg-blue-400',    text: 'text-blue-300'    },
  in_review:   { label: 'In Review',   dot: 'bg-purple-400',  text: 'text-purple-300'  },
  done:        { label: 'Shipped',     dot: 'bg-green-400',   text: 'text-green-300'   },
  blocked:     { label: 'Blocked',     dot: 'bg-red-400',     text: 'text-red-300'     },
}

const PRIORITY_CFG = {
  p1: { label: 'P1 High',    color: 'text-red-400'    },
  p2: { label: 'P2 Medium',  color: 'text-amber-400'  },
  p3: { label: 'P3 Low',     color: 'text-gray-400'   },
}

const SUB_TYPE_CFG = {
  epic:        { label: 'Epic',        icon: BookOpen,     color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  user_story:  { label: 'User Story',  icon: Users,        color: 'text-pink-400',    bg: 'bg-pink-500/10'   },
  bug:         { label: 'Bug',         icon: Bug,          color: 'text-red-400',     bg: 'bg-red-500/10'    },
  task:        { label: 'Task',        icon: CheckCircle2, color: 'text-green-400',   bg: 'bg-green-500/10'  },
  feature:     { label: 'Feature',     icon: Star,         color: 'text-blue-400',    bg: 'bg-blue-500/10'   },
  enhancement: { label: 'Enhancement', icon: Zap,          color: 'text-amber-400',   bg: 'bg-amber-500/10'  },
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find a top-level initiative in the OKR tree
 * Returns { ini, okr, kr } or null
 */
function findInitiative(okrs, id) {
  for (const okr of okrs) {
    // Check KR-level initiatives
    for (const kr of okr.krs || okr.keyResults || []) {
      for (const ini of kr.initiatives || []) {
        if (ini.id === id) return { ini, okr, kr }
      }
    }
    // Check OKR-level initiatives
    for (const ini of okr.initiatives || []) {
      if (ini.id === id) return { ini, okr, kr: null }
    }
  }
  return null
}

function fmtBytes(b) {
  if (b < 1024)         return `${b} B`
  if (b < 1024 * 1024)  return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString('en-SA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function FileIcon({ type, size = 20 }) {
  if (type?.startsWith('image/')) return <Image size={size} className="text-blue-400" />
  if (type?.startsWith('video/')) return <Film size={size} className="text-purple-400" />
  if (type === 'application/pdf') return <FileText size={size} className="text-red-400" />
  return <File size={size} className="text-ink-muted" />
}

// ── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({ comment, currentUser, onDelete, onReply }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  const submitReply = () => {
    if (!replyText.trim()) return
    onReply(comment.id, replyText.trim())
    setReplyText('')
    setReplying(false)
  }

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar name={comment.author} size="sm" className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-ink">{comment.author}</span>
            <span className="text-[10px] text-ink-faint">{fmtTime(comment.ts)}</span>
          </div>
          <div className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap break-words">
            {comment.text}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={() => setReplying(r => !r)}
              className="flex items-center gap-1 text-[10px] text-ink-faint hover:text-gold transition-colors"
            >
              <Reply size={11} /> Reply
            </button>
            {comment.author === currentUser && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-[10px] text-ink-faint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={11} /> Delete
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-3 space-y-3 pl-3 border-l border-border/50">
              {comment.replies.map(r => (
                <div key={r.id} className="flex gap-2.5 group/reply">
                  <Avatar name={r.author} size="xs" className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-ink">{r.author}</span>
                      <span className="text-[10px] text-ink-faint">{fmtTime(r.ts)}</span>
                    </div>
                    <div className="text-xs text-ink-muted whitespace-pre-wrap break-words">
                      {r.text}
                    </div>
                    {r.author === currentUser && (
                      <button
                        onClick={() => onDelete(r.id, comment.id)}
                        className="flex items-center gap-1 text-[10px] text-ink-faint hover:text-red-400 transition-colors mt-1 opacity-0 group-hover/reply:opacity-100"
                      >
                        <Trash2 size={9} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline reply box */}
          {replying && (
            <div className="mt-3 pl-3 border-l border-gold/30">
              <div className="flex gap-2 items-start">
                <Avatar name={currentUser} size="xs" className="shrink-0 mt-1" />
                <div className="flex-1">
                  <textarea
                    autoFocus
                    className="ff-input text-xs resize-none w-full"
                    rows={2}
                    placeholder={`Reply to ${comment.author}…`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply()
                      if (e.key === 'Escape') { setReplying(false); setReplyText('') }
                    }}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <Btn size="xs" variant="primary" onClick={submitReply} disabled={!replyText.trim()}>
                      <Send size={10} /> Reply
                    </Btn>
                    <Btn size="xs" variant="ghost" onClick={() => { setReplying(false); setReplyText('') }}>
                      Cancel
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SubTicketItem ────────────────────────────────────────────────────────────

function SubTicketItem({
  subTicket, initiativeId, okrId, allSubTickets,
  onStatusChange, onLinkEpic, onDelete, onOpen, isExpanded,
}) {
  const typeCfg = SUB_TYPE_CFG[subTicket.issueType] || SUB_TYPE_CFG.task
  const TypeIcon = typeCfg.icon
  const isEpic = subTicket.issueType === 'epic'
  const linkedEpic = isEpic ? null : allSubTickets.find(st => st.id === subTicket.linkedEpicId)
  const epicChildren = isEpic ? allSubTickets.filter(st => st.linkedEpicId === subTicket.id) : []

  return (
    <div className="space-y-2">
      <div
        className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-surface hover:border-border/80 transition-all cursor-pointer"
        onClick={() => onOpen(subTicket.id)}
      >
        {/* Type icon + badge */}
        <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded ${typeCfg.bg}`}>
          <TypeIcon size={14} className={typeCfg.color} />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-ink truncate">
            {subTicket.title}
          </h4>
          <div className="text-[11px] text-ink-faint mt-0.5 flex items-center gap-2">
            {isEpic && <span className="text-purple-300">Parent Epic</span>}
            {!isEpic && linkedEpic && (
              <span className="text-teal-300">
                Linked to: {linkedEpic.title}
              </span>
            )}
            {!isEpic && !linkedEpic && <span className="text-gray-400">(unlinked)</span>}
          </div>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          <select
            value={subTicket.status || 'not_started'}
            onChange={(e) => {
              e.stopPropagation()
              onStatusChange(subTicket.id, e.target.value)
            }}
            className="ff-input text-[11px] px-2 py-1 rounded"
          >
            <option value="not_started">To Do</option>
            <option value="in_progress">In Dev</option>
            <option value="in_review">Review</option>
            <option value="done">Shipped</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEpic && !linkedEpic && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLinkEpic(subTicket.id)
              }}
              className="p-1.5 text-ink-faint hover:text-gold transition-colors rounded hover:bg-gold/10"
              title="Link to epic"
            >
              <Link2 size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(subTicket.id)
            }}
            className="p-1.5 text-ink-faint hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Epic children */}
      {isEpic && epicChildren.length > 0 && isExpanded && (
        <div className="ml-4 space-y-2 pl-3 border-l border-border/30">
          {epicChildren.map(child => (
            <div key={child.id} className="text-sm text-ink-faint py-2 px-2 rounded border border-border/30 bg-surface/50">
              <div className="flex items-center gap-2">
                {SUB_TYPE_CFG[child.issueType]?.icon && (
                  React.createElement(SUB_TYPE_CFG[child.issueType].icon, { size: 12 })
                )}
                <span className="flex-1 truncate">{child.title}</span>
                <span className="text-[10px] opacity-60">{STATUS_CFG[child.status]?.label || 'To Do'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AddSubTicketButton ───────────────────────────────────────────────────────

function AddSubTicketButton({ onAdd }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
      >
        <Plus size={14} /> Add Ticket
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-40 overflow-hidden">
            {Object.entries(SUB_TYPE_CFG).map(([type, cfg]) => {
              const Icon = cfg.icon
              return (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-surface-hover transition-colors ${cfg.color}`}
                >
                  <Icon size={14} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function InitiativeView() {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState('overview')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [description, setDescription] = useState('')
  const [descDirty, setDescDirty] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [attachments, setAttachments] = useState([])
  const [expandedEpics, setExpandedEpics] = useState(new Set())
  const fileInputRef = useRef(null)

  // Find the current initiative
  const found = findInitiative(state.okrs || [], state.openTicketId)
  const { ini, okr, kr } = found || {}

  // Reset state when initiative changes
  useEffect(() => {
    if (ini) {
      setTitleDraft(ini.title || '')
      setDescription(ini.description || '')
      setDescDirty(false)
      setComments(ini.comments || [])
      setAttachments(ini.attachments || [])
      setTab('overview')
      setEditingTitle(false)
      setExpandedEpics(new Set())
      // Set shareable URL
      window.location.hash = '#ticket=' + ini.id
    }
  }, [ini?.id])

  if (!ini || !okr) return null

  const canEdit = state.org?.permissions?.canEdit ?? false
  const currentUser = state.user?.name || 'You'
  const statusCfg = STATUS_CFG[ini.status] || STATUS_CFG.not_started
  const priorityCfg = PRIORITY_CFG[ini.priority] || PRIORITY_CFG.p2

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleClose = () => {
    dispatch({ type: CLOSE_TICKET })
    window.location.hash = ''
  }

  const handleSaveTitle = () => {
    if (titleDraft.trim() && titleDraft !== ini.title) {
      dispatch({
        type: INITIATIVE_UPDATE,
        okrId: okr.id,
        initiativeId: ini.id,
        updates: { title: titleDraft.trim() },
      })
    }
    setEditingTitle(false)
  }

  const handleSaveDescription = () => {
    dispatch({
      type: INITIATIVE_UPDATE,
      okrId: okr.id,
      initiativeId: ini.id,
      updates: { description },
    })
    setDescDirty(false)
  }

  const handleStatusChange = (newStatus) => {
    dispatch({
      type: INITIATIVE_UPDATE,
      okrId: okr.id,
      initiativeId: ini.id,
      updates: { status: newStatus },
    })
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    dispatch({
      type: TICKET_COMMENT_ADD,
      okrId: okr.id,
      iniId: ini.id,
      text: newComment.trim(),
    })
    setNewComment('')
    setComments(prev => [...prev, {
      id: `c${Date.now()}`,
      author: currentUser,
      text: newComment.trim(),
      ts: Date.now(),
      replies: [],
    }])
  }

  const handleAddReply = (commentId, text) => {
    dispatch({
      type: TICKET_REPLY_ADD,
      okrId: okr.id,
      iniId: ini.id,
      commentId,
      text,
    })
    setComments(prev => prev.map(c => c.id !== commentId ? c : {
      ...c,
      replies: [...(c.replies || []), {
        id: `r${Date.now()}`,
        author: currentUser,
        text,
        ts: Date.now(),
      }]
    }))
  }

  const handleDeleteComment = (id, parentId) => {
    dispatch({
      type: TICKET_COMMENT_DEL,
      okrId: okr.id,
      iniId: ini.id,
      commentId: parentId || id,
    })
    if (parentId) {
      setComments(prev => prev.map(c => c.id !== parentId ? c : {
        ...c,
        replies: c.replies.filter(r => r.id !== id),
      }))
    } else {
      setComments(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.size > MAX_FILE_BYTES) {
        alert(`"${file.name}" exceeds 25 MB and was not attached.`)
        return
      }
      const url = URL.createObjectURL(file)
      setAttachments(prev => [...prev, {
        id: `att${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      }])
    })
    e.target.value = ''
  }

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id)
      if (att?.url?.startsWith('blob:')) URL.revokeObjectURL(att.url)
      return prev.filter(a => a.id !== id)
    })
  }

  const handleAddSubTicket = (issueType) => {
    dispatch({
      type: SUB_TICKET_CREATE,
      okrId: okr.id,
      iniId: ini.id,
      subTicket: {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        title: `New ${SUB_TYPE_CFG[issueType].label}`,
        issueType,
        status: 'not_started',
        linkedEpicId: null,
      },
    })
  }

  const handleSubTicketStatusChange = (subId, newStatus) => {
    dispatch({
      type: SUB_TICKET_UPDATE,
      okrId: okr.id,
      iniId: ini.id,
      subId,
      updates: { status: newStatus },
    })
  }

  const handleDeleteSubTicket = (subId) => {
    dispatch({
      type: SUB_TICKET_DELETE,
      okrId: okr.id,
      iniId: ini.id,
      subId,
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose()
  }

  // Calculate completion % from sub-tickets
  const subTickets = ini.subTickets || []
  const completedCount = subTickets.filter(st => st.status === 'done').length
  const completionPercent = subTickets.length > 0 ? Math.round((completedCount / subTickets.length) * 100) : 0

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      {state.openTicketId && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-dark border-l border-border shadow-2xl animate-slide-in-right"
        style={{ width: 'min(680px, 96vw)', maxHeight: '100vh' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <div className="text-[10px] font-bold text-ink-faint uppercase tracking-widest mb-2">
              Initiative Detail
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                // Share logic
                const url = `${window.location.origin}${window.location.pathname}#ticket=${ini.id}`
                navigator.clipboard.writeText(url)
              }}
              className="p-1.5 text-ink-faint hover:text-gold transition-colors rounded hover:bg-gold/10"
              title="Share link"
            >
              <Share2 size={16} />
            </button>
            <button
              className="p-1.5 text-ink-faint hover:text-gold transition-colors rounded hover:bg-gold/10"
              title="More options"
            >
              <MoreHorizontal size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-ink-faint hover:text-gold transition-colors rounded hover:bg-gold/10"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Title section ──────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="mb-3">
            <TypeChip type="initiative" short={false} />
          </div>

          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="ff-input flex-1 text-2xl font-bold"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setTitleDraft(ini.title || ''); setEditingTitle(true) }}
              className="text-left w-full text-2xl font-bold text-ink hover:text-gold transition-colors group flex items-center gap-2"
            >
              <span className="truncate">{ini.title || '(Untitled)'}</span>
              {canEdit && <Edit3 size={16} className="opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />}
            </button>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-4 flex-wrap text-sm">
            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              <select
                value={ini.status || 'not_started'}
                onChange={e => handleStatusChange(e.target.value)}
                className={`ff-input text-xs px-2 py-1 rounded ${statusCfg.text}`}
              >
                <option value="not_started">To Do</option>
                <option value="in_progress">In Dev</option>
                <option value="in_review">In Review</option>
                <option value="done">Shipped</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-1.5">
              <Flag size={14} className={priorityCfg.color} />
              <select
                value={ini.priority || 'p2'}
                onChange={e => dispatch({
                  type: INITIATIVE_UPDATE,
                  okrId: okr.id,
                  initiativeId: ini.id,
                  updates: { priority: e.target.value },
                })}
                className="ff-input text-xs px-2 py-1 rounded"
              >
                <option value="p1">P1 High</option>
                <option value="p2">P2 Medium</option>
                <option value="p3">P3 Low</option>
              </select>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-1.5">
              <User2 size={14} className="text-ink-faint" />
              <span className="text-ink-muted">{ini.owner || 'Unassigned'}</span>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-ink-faint" />
              <span className="text-ink-muted">{fmtDate(ini.dueDate) || 'No due date'}</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 px-5 pt-4 border-b border-border shrink-0 overflow-x-auto">
          {['overview', 'description', 'tickets', 'comments', 'attachments'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize shrink-0 ${
                tab === t
                  ? 'text-gold border-gold'
                  : 'text-ink-faint border-transparent hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Content area ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-6 p-5">
              {/* EXECUTION STATUS */}
              <div>
                <h3 className="text-xs font-bold text-ink-faint uppercase tracking-widest mb-3">
                  Execution Status
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {['not_started', 'in_progress', 'done', 'blocked'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        ini.status === st
                          ? 'bg-gold/30 text-gold border border-gold'
                          : 'bg-surface border border-border/50 text-ink-muted hover:border-border'
                      }`}
                    >
                      {STATUS_CFG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OVERALL COMPLETION */}
              <div>
                <h3 className="text-xs font-bold text-ink-faint uppercase tracking-widest mb-3">
                  Overall Completion
                </h3>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-bold text-gold">{completionPercent}%</div>
                    {ini.dueDate && (
                      <div className="text-xs text-ink-faint">Target: {fmtDate(ini.dueDate)}</div>
                    )}
                  </div>
                  <ProgressBar value={completionPercent} className="h-1.5 bg-gold/30 rounded-full" />
                </div>
              </div>

              {/* LINKED OBJECTIVE */}
              {okr && (
                <div>
                  <h3 className="text-xs font-bold text-ink-faint uppercase tracking-widest mb-3">
                    Linked Objective
                  </h3>
                  <div className="rounded-lg border border-border/50 bg-surface p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <TypeChip type="objective" short={true} />
                      <span className="text-sm font-medium text-ink">{okr.title}</span>
                    </div>
                    {kr && (
                      <div className="flex items-start gap-2 pl-2 border-l border-border/50">
                        <ChevronRight size={14} className="text-ink-faint shrink-0 mt-0.5" />
                        <div>
                          <TypeChip type="keyresult" short={true} />
                          <p className="text-sm text-ink-muted mt-1">{kr.title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BUDGET UTILIZATION */}
              {ini.budgetAllocated !== undefined && (
                <div>
                  <h3 className="text-xs font-bold text-ink-faint uppercase tracking-widest mb-3">
                    Budget Utilization
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-surface border border-border/50 p-3 text-center">
                      <div className="text-xs text-ink-faint mb-1">Allocated</div>
                      <div className="text-lg font-bold text-gold">${ini.budgetAllocated}</div>
                    </div>
                    <div className="rounded-lg bg-surface border border-border/50 p-3 text-center">
                      <div className="text-xs text-ink-faint mb-1">Actual Spend</div>
                      <div className="text-lg font-bold text-ink">${ini.budgetSpent || 0}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint mb-2">Efficiency</div>
                    <ProgressBar
                      value={Math.min(100, ((ini.budgetSpent || 0) / (ini.budgetAllocated || 1)) * 100)}
                      className="h-1.5 bg-gold/30 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DESCRIPTION TAB */}
          {tab === 'description' && (
            <div className="p-5 space-y-3">
              <RichEditor
                value={description}
                onChange={setDescription}
                onSave={handleSaveDescription}
                readOnly={!canEdit}
                placeholder="Add initiative description…"
              />
              {canEdit && descDirty && (
                <Btn size="sm" variant="primary" onClick={handleSaveDescription}>
                  <Check size={12} /> Save Description
                </Btn>
              )}
            </div>
          )}

          {/* TICKETS TAB */}
          {tab === 'tickets' && (
            <div className="p-5 space-y-4">
              {canEdit && <AddSubTicketButton onAdd={handleAddSubTicket} />}

              <div className="space-y-3">
                {subTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle size={32} className="text-ink-faint mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-ink-faint">No tickets yet. Add one to get started.</p>
                  </div>
                ) : (
                  subTickets.map(sub => (
                    <SubTicketItem
                      key={sub.id}
                      subTicket={sub}
                      initiativeId={ini.id}
                      okrId={okr.id}
                      allSubTickets={subTickets}
                      isExpanded={expandedEpics.has(sub.id)}
                      onStatusChange={handleSubTicketStatusChange}
                      onLinkEpic={() => {
                        // Show epic selector modal or dropdown
                      }}
                      onDelete={handleDeleteSubTicket}
                      onOpen={() => {
                        if (sub.issueType === 'epic') {
                          setExpandedEpics(prev => {
                            const next = new Set(prev)
                            if (next.has(sub.id)) next.delete(sub.id)
                            else next.add(sub.id)
                            return next
                          })
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* COMMENTS TAB */}
          {tab === 'comments' && (
            <div className="p-5 space-y-4">
              {/* New comment input */}
              <div className="flex gap-3">
                <Avatar name={currentUser} size="sm" className="shrink-0 mt-1" />
                <div className="flex-1">
                  <textarea
                    className="ff-input w-full resize-none text-sm"
                    rows={3}
                    placeholder="Add a comment…"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment()
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Btn size="xs" variant="primary" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send size={10} /> Comment
                    </Btn>
                  </div>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-4 divide-y divide-border/30">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={32} className="text-ink-faint mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-ink-faint">No comments yet.</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="pt-4 first:pt-0">
                      <CommentItem
                        comment={comment}
                        currentUser={currentUser}
                        onDelete={handleDeleteComment}
                        onReply={handleAddReply}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ATTACHMENTS TAB */}
          {tab === 'attachments' && (
            <div className="p-5 space-y-4">
              {/* Upload zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-gold/50 transition-colors group"
              >
                <Paperclip size={32} className="text-ink-faint mx-auto mb-2 group-hover:text-gold transition-colors" />
                <p className="text-sm font-medium text-ink mb-1">Drop files or click to upload</p>
                <p className="text-xs text-ink-faint">Max 25 MB per file</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Attachments list */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-center py-8">
                    <Paperclip size={32} className="text-ink-faint mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-ink-faint">No attachments.</p>
                  </div>
                ) : (
                  attachments.map(att => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-surface hover:border-border/80 transition-all group"
                    >
                      <FileIcon type={att.type} size={18} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{att.name}</p>
                        <p className="text-xs text-ink-faint">{fmtBytes(att.size)}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1.5 text-ink-faint hover:text-gold transition-colors rounded hover:bg-gold/10"
                          title="Download"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 text-ink-faint hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
