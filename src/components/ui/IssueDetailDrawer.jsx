/**
 * IssueDetailDrawer
 * Full Jira-style right-side panel for any issue type:
 *   initiative · kr · okr · feature · bug · task · epic
 *
 * Sections: Description (RichEditor) | Comments (with inline replies) | Attachments (≤25MB)
 * On save: calls onSave(updates) so the parent can dispatch to app state.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  X, ChevronRight, MessageSquare, Paperclip, FileText,
  Image, Film, File, Send, Reply, CornerDownRight,
  Trash2, Download, Edit3, Check, Clock, User2,
  Star, Bug, BookOpen, CheckCircle2, AlertCircle,
  Target, TrendingUp, Calendar, Flag, Tag,
} from 'lucide-react'
import Avatar from './Avatar.jsx'
import RichEditor from './RichEditor.jsx'
import Btn from './Btn.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB

const ISSUE_TYPE_CFG = {
  initiative: { label: 'Initiative', icon: TrendingUp,  color: 'text-blue-400',   bg: 'bg-blue-500/10'    },
  kr:         { label: 'Key Result', icon: Target,       color: 'text-gold',       bg: 'bg-gold/10'        },
  okr:        { label: 'Objective',  icon: Flag,         color: 'text-purple-400', bg: 'bg-purple-500/10'  },
  feature:    { label: 'Feature',    icon: Star,         color: 'text-blue-400',   bg: 'bg-blue-500/10'    },
  bug:        { label: 'Bug',        icon: Bug,          color: 'text-red-400',    bg: 'bg-red-500/10'     },
  task:       { label: 'Task',       icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10'   },
  epic:       { label: 'Epic',       icon: BookOpen,     color: 'text-purple-400', bg: 'bg-purple-500/10'  },
}

const STATUS_CFG = {
  not_started: { label: 'To Do',       dot: 'bg-gray-400',    text: 'text-gray-300'    },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400',    text: 'text-blue-300'    },
  in_review:   { label: 'In Review',   dot: 'bg-purple-400',  text: 'text-purple-300'  },
  done:        { label: 'Shipped',     dot: 'bg-green-400',   text: 'text-green-300'   },
  blocked:     { label: 'Blocked',     dot: 'bg-red-400',     text: 'text-red-300'     },
  on_track:    { label: 'On Track',    dot: 'bg-green-400',   text: 'text-green-300'   },
  at_risk:     { label: 'At Risk',     dot: 'bg-amber-400',   text: 'text-amber-300'   },
  behind:      { label: 'Behind',      dot: 'bg-red-400',     text: 'text-red-300'     },
}

const PRIORITY_CFG = {
  p1: { label: 'P1 High',    color: 'text-red-400'    },
  p2: { label: 'P2 Medium',  color: 'text-amber-400'  },
  p3: { label: 'P3 Low',     color: 'text-gray-400'   },
}

// ── File icon ─────────────────────────────────────────────────────────────────
function FileIcon({ type, size = 20 }) {
  if (type?.startsWith('image/')) return <Image size={size} className="text-blue-400" />
  if (type?.startsWith('video/')) return <Film  size={size} className="text-purple-400" />
  if (type === 'application/pdf') return <FileText size={size} className="text-red-400" />
  return <File size={size} className="text-ink-muted" />
}

function fmtBytes(b) {
  if (b < 1024)         return `${b} B`
  if (b < 1024 * 1024)  return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString('en-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Comment component (with inline reply support) ─────────────────────────────
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
      {/* Main comment */}
      <div className="flex gap-3">
        <Avatar name={comment.author} size="sm" className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-ink">{comment.author}</span>
            <span className="text-[10px] text-ink-faint">{fmtTime(comment.ts)}</span>
          </div>
          <div className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap break-words">{comment.text}</div>
          <div className="flex items-center gap-3 mt-1.5">
            <button onClick={() => setReplying(r => !r)}
              className="flex items-center gap-1 text-[10px] text-ink-faint hover:text-gold transition-colors">
              <Reply size={11} /> Reply
            </button>
            {comment.author === currentUser && (
              <button onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-[10px] text-ink-faint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
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
                    <div className="text-xs text-ink-muted whitespace-pre-wrap break-words">{r.text}</div>
                    {r.author === currentUser && (
                      <button onClick={() => onDelete(r.id, comment.id)}
                        className="flex items-center gap-1 text-[10px] text-ink-faint hover:text-red-400 transition-colors mt-1 opacity-0 group-hover/reply:opacity-100">
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
                    <Btn size="xs" variant="ghost" onClick={() => { setReplying(false); setReplyText('') }}>Cancel</Btn>
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

// ── Main drawer ───────────────────────────────────────────────────────────────
export default function IssueDetailDrawer({ open, onClose, item, itemType = 'initiative', onSave, currentUser = 'You' }) {
  const [tab, setTab]               = useState('description')
  const [description, setDescription] = useState(item?.description || '')
  const [descDirty, setDescDirty]   = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft,  setTitleDraft]  = useState('')
  const [comments, setComments]     = useState(item?.comments || [])
  const [newComment, setNewComment] = useState('')
  const [attachments, setAttachments] = useState(item?.attachments || [])
  const fileInputRef = useRef(null)

  // Reset when item changes
  useEffect(() => {
    if (item) {
      setDescription(item.description || '')
      setDescDirty(false)
      setTitleDraft(item.title || '')
      setComments(item.comments || [])
      setAttachments(item.attachments || [])
      setTab('description')
    }
  }, [item?.id])

  const typeCfg = ISSUE_TYPE_CFG[itemType] || ISSUE_TYPE_CFG.feature
  const TypeIcon = typeCfg.icon
  const statusCfg = STATUS_CFG[item?.status] || STATUS_CFG.not_started

  // Save description
  const saveDescription = () => {
    onSave?.({ description })
    setDescDirty(false)
  }

  // Save title
  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== item?.title) {
      onSave?.({ title: titleDraft.trim() })
    }
    setEditingTitle(false)
  }

  // Comments
  const addComment = () => {
    if (!newComment.trim()) return
    setComments(prev => [...prev, {
      id: `c${Date.now()}`, author: currentUser,
      text: newComment.trim(), ts: Date.now(), replies: [],
    }])
    setNewComment('')
  }

  const addReply = (commentId, text) => {
    setComments(prev => prev.map(c => c.id !== commentId ? c : {
      ...c, replies: [...(c.replies || []), {
        id: `r${Date.now()}`, author: currentUser, text, ts: Date.now(),
      }]
    }))
  }

  const deleteComment = (id, parentId) => {
    if (parentId) {
      setComments(prev => prev.map(c => c.id !== parentId ? c : {
        ...c, replies: c.replies.filter(r => r.id !== id),
      }))
    } else {
      setComments(prev => prev.filter(c => c.id !== id))
    }
  }

  // Attachments
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.size > MAX_FILE_BYTES) {
        alert(`"${file.name}" exceeds the 25 MB limit and was not attached.`); return
      }
      const url = URL.createObjectURL(file)
      setAttachments(prev => [...prev, {
        id: `att${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: file.name, size: file.size, type: file.type, url,
      }])
    })
    e.target.value = ''
  }

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id)
      if (att?.url?.startsWith('blob:')) URL.revokeObjectURL(att.url)
      return prev.filter(a => a.id !== id)
    })
  }

  if (!open || !item) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-surface border-l border-border shadow-2xl"
           style={{ width: 'min(740px, 95vw)', maxHeight: '100vh' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-border shrink-0">
          {/* Type badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeCfg.bg} ${typeCfg.color} shrink-0`}>
            <TypeIcon size={12} />
            {typeCfg.label}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="ff-input flex-1 text-base font-semibold"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                />
                <button onClick={saveTitle} className="p-1.5 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"><Check size={14} /></button>
              </div>
            ) : (
              <button onClick={() => { setTitleDraft(item.title || ''); setEditingTitle(true) }}
                className="text-left w-full text-base font-semibold text-ink hover:text-gold transition-colors group flex items-center gap-2">
                <span className="truncate">{item.title || '(Untitled)'}</span>
                <Edit3 size={12} className="opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
              </button>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {/* Status */}
              {item.status && (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-dark border border-border ${statusCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              )}
              {/* Priority */}
              {item.priority && (
                <span className={`text-[10px] font-bold ${PRIORITY_CFG[item.priority]?.color || 'text-ink-muted'}`}>
                  {PRIORITY_CFG[item.priority]?.label}
                </span>
              )}
              {/* Owner */}
              {item.owner && (
                <div className="flex items-center gap-1 text-[10px] text-ink-faint">
                  <User2 size={10} />
                  <span>{item.owner}</span>
                </div>
              )}
              {/* Due date */}
              {item.dueDate && (
                <div className="flex items-center gap-1 text-[10px] text-ink-faint">
                  <Calendar size={10} />
                  <span>{new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                </div>
              )}
              {/* KR-specific: baseline→target */}
              {itemType === 'kr' && item.baseline != null && (
                <div className="flex items-center gap-1 text-[10px] text-ink-faint">
                  <TrendingUp size={10} />
                  <span>{item.baseline} → {item.target} {item.unit}</span>
                </div>
              )}
            </div>
          </div>

          {/* Close */}
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:bg-border hover:text-ink transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="flex gap-0.5 px-5 pt-3 border-b border-border shrink-0">
          {[
            { id: 'description', label: 'Description',  icon: FileText     },
            { id: 'comments',    label: `Comments ${comments.length > 0 ? `(${comments.length})` : ''}`, icon: MessageSquare },
            { id: 'attachments', label: `Attachments ${attachments.length > 0 ? `(${attachments.length})` : ''}`, icon: Paperclip     },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}>
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

          {/* DESCRIPTION TAB */}
          {tab === 'description' && (
            <div className="space-y-3">
              <RichEditor
                value={description}
                onChange={html => { setDescription(html); setDescDirty(true) }}
                placeholder="Add a detailed description… Paste tables from Excel or Word."
                minHeight={220}
              />
              {descDirty && (
                <div className="flex justify-end gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => { setDescription(item?.description || ''); setDescDirty(false) }}>
                    Discard
                  </Btn>
                  <Btn size="sm" variant="primary" onClick={saveDescription}>
                    <Check size={13} /> Save Description
                  </Btn>
                </div>
              )}

              {/* KR-specific progress info */}
              {itemType === 'kr' && (
                <div className="bg-dark rounded-xl p-4 border border-border">
                  <p className="text-xs font-semibold text-ink mb-3">Key Result Progress</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Baseline', value: item.baseline ?? '—', color: 'text-ink-muted' },
                      { label: 'Current',  value: item.current  ?? '—', color: 'text-gold' },
                      { label: 'Target',   value: item.target   ?? '—', color: 'text-green-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-surface rounded-lg p-3">
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-ink-muted mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {item.unit && <p className="text-[10px] text-ink-muted mt-2 text-center">Unit: {item.unit}</p>}
                </div>
              )}
            </div>
          )}

          {/* COMMENTS TAB */}
          {tab === 'comments' && (
            <div className="space-y-5">
              {/* New comment input */}
              <div className="flex gap-3 items-start">
                <Avatar name={currentUser} size="sm" className="shrink-0 mt-1" />
                <div className="flex-1">
                  <textarea
                    className="ff-input text-sm resize-none w-full"
                    rows={3}
                    placeholder="Add a comment… (Ctrl+Enter to submit)"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment() }}
                  />
                  <div className="flex justify-end mt-2">
                    <Btn size="sm" variant="primary" onClick={addComment} disabled={!newComment.trim()}>
                      <Send size={12} /> Comment
                    </Btn>
                  </div>
                </div>
              </div>

              {/* Comment list */}
              {comments.length === 0 ? (
                <div className="text-center py-10 text-ink-muted text-sm">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                  No comments yet. Be the first to add context.
                </div>
              ) : (
                <div className="space-y-5 divide-y divide-border/30">
                  {comments.map(c => (
                    <div key={c.id} className="pt-4 first:pt-0">
                      <CommentItem
                        comment={c}
                        currentUser={currentUser}
                        onDelete={deleteComment}
                        onReply={addReply}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ATTACHMENTS TAB */}
          {tab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload button */}
              <div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-gold/40 hover:bg-gold/5 transition-colors group">
                  <Paperclip size={22} className="text-ink-faint group-hover:text-gold transition-colors" />
                  <span className="text-sm text-ink-muted">Click to attach files</span>
                  <span className="text-[11px] text-ink-faint">Images, videos, documents — up to 25 MB each</span>
                </button>
              </div>

              {/* Attachment grid */}
              {attachments.length === 0 ? (
                <div className="text-center py-6 text-ink-muted text-sm">
                  <Paperclip size={24} className="mx-auto mb-2 opacity-30" />
                  No attachments yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {attachments.map(att => (
                    <div key={att.id}
                      className="group flex items-center gap-3 bg-dark rounded-xl p-3 border border-border hover:border-gold/30 transition-colors">
                      {/* Preview thumbnail for images */}
                      {att.type?.startsWith('image/') ? (
                        <img src={att.url} alt={att.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border">
                          <FileIcon type={att.type} size={22} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{att.name}</p>
                        <p className="text-[10px] text-ink-faint">{fmtBytes(att.size)}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={att.url} download={att.name} target="_blank" rel="noreferrer"
                          className="p-1.5 hover:bg-border rounded-lg text-ink-muted hover:text-ink transition-colors"
                          title="Download">
                          <Download size={12} />
                        </a>
                        <button onClick={() => removeAttachment(att.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-ink-muted hover:text-red-400 transition-colors"
                          title="Remove">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-ink-faint flex items-center gap-1">
            <Clock size={10} />
            {item.updatedAt
              ? `Updated ${fmtTime(item.updatedAt)}`
              : item.createdAt ? `Created ${fmtTime(item.createdAt)}` : 'No timestamps available'}
          </span>
          <Btn size="sm" variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </>
  )
}
