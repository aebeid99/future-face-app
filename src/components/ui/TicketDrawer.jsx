import React, { useState, useRef, useEffect } from 'react';
import {
  Star, Bug, CheckCircle2, BookOpen, Users, Zap, TrendingUp,
  X, Link2, Edit3, Check, ChevronDown, ChevronRight, Plus, Trash2,
  Paperclip, MessageSquare, History, Download, Send, Reply,
  File, FileText, Image, Film, User2, Calendar, Tag, Flag, Clock, AlertTriangle
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import {
  CLOSE_TICKET, INITIATIVE_UPDATE, TICKET_COMMENT_ADD, TICKET_COMMENT_DEL,
  TICKET_REPLY_ADD, SUB_TICKET_CREATE, SUB_TICKET_UPDATE, SUB_TICKET_DELETE, OPEN_TICKET
} from '../../state/actions';
import Avatar from './Avatar';
import Btn from './Btn';
import RichEditor from './RichEditor';
import TypeChip from './TypeChip';

const ISSUE_TYPE_CFG = {
  feature:     { label: 'Feature',     icon: Star,         color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  bug:         { label: 'Bug',         icon: Bug,          color: 'text-red-400',     bg: 'bg-red-500/10' },
  task:        { label: 'Task',        icon: CheckCircle2, color: 'text-green-400',   bg: 'bg-green-500/10' },
  epic:        { label: 'Epic',        icon: BookOpen,     color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  user_story:  { label: 'User Story',  icon: Users,        color: 'text-pink-400',    bg: 'bg-pink-500/10' },
  enhancement: { label: 'Enhancement', icon: Zap,          color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  initiative:  { label: 'Initiative',  icon: TrendingUp,   color: 'text-sky-400',     bg: 'bg-sky-500/10' },
};

const STATUS_CFG = {
  not_started: { label: 'To Do',       dot: 'bg-gray-400',    ring: 'bg-gray-400/15 text-gray-300' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400',    ring: 'bg-blue-400/15 text-blue-300' },
  in_review:   { label: 'In Review',   dot: 'bg-purple-400',  ring: 'bg-purple-400/15 text-purple-300' },
  done:        { label: 'Done',        dot: 'bg-green-400',   ring: 'bg-green-400/15 text-green-300' },
  blocked:     { label: 'Blocked',     dot: 'bg-red-400',     ring: 'bg-red-400/15 text-red-300' },
};

const PRIORITY_CFG = {
  p1: { label: 'P1', color: 'text-red-400', bg: 'bg-red-500/10' },
  p2: { label: 'P2', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  p3: { label: 'P3', color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

function findTicket(okrs, ticketId) {
  for (const okr of okrs) {
    for (const kr of okr.krs || []) {
      for (const ini of kr.initiatives || []) {
        if (ini.id === ticketId) {
          return { ini, okr, kr, parent: null };
        }
        for (const sub of ini.subTickets || []) {
          if (sub.id === ticketId) {
            return { ini: sub, okr, kr, parent: ini };
          }
        }
      }
    }
  }
  return null;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function TypeBadge({ type }) {
  const cfg = ISSUE_TYPE_CFG[type] || ISSUE_TYPE_CFG.task;
  const IconComp = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <IconComp size={14} />
      {cfg.label}
    </div>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.not_started;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${cfg.ring}`}>
      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
}

function TitleSection({ ini, canEdit, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(ini.title);

  const handleSave = () => {
    if (value.trim() && value !== ini.title) {
      onUpdate({ title: value });
    }
    setIsEditing(false);
    setValue(ini.title);
  };

  return (
    <div className="mb-6">
      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="ff-input w-full text-2xl font-bold"
        />
      ) : (
        <div
          className="group flex items-center gap-2 cursor-pointer"
          onClick={() => canEdit && setIsEditing(true)}
        >
          <h1 className="text-2xl font-bold text-ink">{ini.title}</h1>
          {canEdit && <Edit3 size={16} className="opacity-0 group-hover:opacity-100 text-ink-muted transition" />}
        </div>
      )}
    </div>
  );
}

function DescriptionSection({ ini, canEdit, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [value, setValue] = useState(ini.description || '');

  const handleSave = () => {
    onUpdate({ description: value });
    setIsEditing(false);
    setDirty(false);
  };

  const handleDiscard = () => {
    setValue(ini.description || '');
    setIsEditing(false);
    setDirty(false);
  };

  return (
    <div className="mb-8 pb-8 border-b border-border">
      <h3 className="text-sm font-semibold text-ink mb-3">Description</h3>
      {isEditing ? (
        <div>
          <RichEditor
            value={value}
            onChange={(v) => {
              setValue(v);
              setDirty(v !== ini.description);
            }}
            placeholder="Add a description..."
          />
          <div className="flex gap-2 mt-3">
            <Btn onClick={handleSave} variant="primary" size="sm">
              <Check size={14} /> Save
            </Btn>
            <Btn onClick={handleDiscard} variant="ghost" size="sm">
              Discard
            </Btn>
          </div>
        </div>
      ) : (
        <div
          className="group p-3 rounded bg-surface border border-border cursor-pointer hover:border-gold/30 transition"
          onClick={() => canEdit && setIsEditing(true)}
        >
          {ini.description ? (
            <div
              className="prose prose-invert prose-sm max-w-none text-ink text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: ini.description }}
            />
          ) : (
            <p className="text-ink-muted italic">{canEdit ? 'Click to add description' : 'No description'}</p>
          )}
          {canEdit && <Edit3 size={14} className="inline ml-2 opacity-0 group-hover:opacity-100 text-ink-muted transition" />}
        </div>
      )}
    </div>
  );
}

function SubTicketsSection({ ini, canEdit, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', issueType: 'task', priority: 'p2' });
  const { state, dispatch } = useApp();

  const handleAddSubTicket = () => {
    if (formData.title.trim()) {
      dispatch({
        type: SUB_TICKET_CREATE,
        payload: { initiativeId: ini.id, ...formData, status: 'not_started' }
      });
      setFormData({ title: '', issueType: 'task', priority: 'p2' });
      setShowAddForm(false);
    }
  };

  const subTickets = ini.subTickets || [];
  const selectedSub = subTickets.find(s => s.id === selectedSubId);

  return (
    <div className="mb-8 pb-8 border-b border-border">
      <div
        className="flex items-center gap-2 cursor-pointer mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight size={16} className={`transition ${expanded ? 'rotate-90' : ''}`} />
        <h3 className="text-sm font-semibold text-ink">Sub-tasks ({subTickets.length})</h3>
      </div>

      {expanded && (
        <div>
          {selectedSub ? (
            <div className="p-3 rounded bg-surface border border-border mb-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setSelectedSubId(null)} className="text-ink-muted hover:text-ink">
                  <ChevronRight size={16} className="rotate-90" />
                </button>
                <TypeBadge type={selectedSub.issueType} />
                <StatusPill status={selectedSub.status} />
              </div>
              <h4 className="font-semibold text-ink mb-2">
                <TypeChip type="initiative" short className="mr-2" />
                {selectedSub.title}
              </h4>
              {selectedSub.description && (
                <p className="text-ink-muted text-sm mb-2">{selectedSub.description}</p>
              )}
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <Btn
                    onClick={() => dispatch({ type: SUB_TICKET_DELETE, payload: { initiativeId: ini.id, subTicketId: selectedSub.id } })}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 size={14} /> Delete
                  </Btn>
                </div>
              )}
            </div>
          ) : null}

          <div className="space-y-2 mb-3">
            {subTickets.map(sub => (
              <div
                key={sub.id}
                className="p-3 rounded bg-surface/50 border border-border/30 hover:border-border cursor-pointer transition"
                onClick={() => setSelectedSubId(sub.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TypeBadge type={sub.issueType} />
                      <StatusPill status={sub.status} />
                    </div>
                    <p className="text-ink font-medium text-sm">
                      <TypeChip type="initiative" short className="mr-2" />
                      {sub.title}
                    </p>
                  </div>
                  {sub.owner && <Avatar id={sub.owner} size="sm" />}
                </div>
              </div>
            ))}
          </div>

          {showAddForm ? (
            <div className="p-3 rounded bg-surface border border-gold/30">
              <input
                autoFocus
                type="text"
                placeholder="Sub-task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="ff-input w-full mb-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="ff-input text-sm"
                >
                  {Object.entries(ISSUE_TYPE_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="ff-input text-sm"
                >
                  {Object.entries(PRIORITY_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Btn onClick={handleAddSubTicket} variant="primary" size="sm">
                  <Plus size={14} /> Add
                </Btn>
                <Btn onClick={() => setShowAddForm(false)} variant="ghost" size="sm">
                  Cancel
                </Btn>
              </div>
            </div>
          ) : (
            canEdit && (
              <Btn onClick={() => setShowAddForm(true)} variant="ghost" size="sm">
                <Plus size={14} /> Add child issue
              </Btn>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AttachmentsSection({ ini, canEdit, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef();

  const handleFileUpload = (files) => {
    const attachments = ini.attachments || [];
    Array.from(files).forEach(file => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`${file.name} exceeds 25MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAttachment = {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result,
        };
        onUpdate({ attachments: [...attachments, newAttachment] });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (attId) => {
    onUpdate({ attachments: (ini.attachments || []).filter(a => a.id !== attId) });
  };

  const attachments = ini.attachments || [];

  return (
    <div className="mb-8 pb-8 border-b border-border">
      <div
        className="flex items-center gap-2 cursor-pointer mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight size={16} className={`transition ${expanded ? 'rotate-90' : ''}`} />
        <h3 className="text-sm font-semibold text-ink">Attachments ({attachments.length})</h3>
      </div>

      {expanded && (
        <div>
          {canEdit && (
            <div
              className="p-4 rounded border-2 border-dashed border-border hover:border-gold/50 bg-surface/30 cursor-pointer transition mb-3"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <p className="text-center text-ink-muted text-sm">Click or drag files to upload (max 25MB)</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {attachments.map(att => (
              <div key={att.id} className="p-2 rounded bg-surface/50 border border-border/30 group">
                <div className="flex items-start justify-between mb-1">
                  <File size={16} className="text-ink-muted" />
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(att.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink truncate font-medium">{att.name}</p>
                <p className="text-xs text-ink-muted">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                <a
                  href={att.url}
                  download={att.name}
                  className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 mt-1"
                >
                  <Download size={12} /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentsSection({ ini, canEdit }) {
  const { state, dispatch } = useApp();
  const [commentText, setCommentText] = useState('');
  const [mentions, setMentions] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const detectMentions = (text) => {
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    if (lastWord.startsWith('@')) {
      setMentionFilter(lastWord.slice(1));
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      dispatch({
        type: TICKET_COMMENT_ADD,
        payload: { initiativeId: ini.id, text: commentText, mentions }
      });
      setCommentText('');
      setMentions([]);
    }
  };

  const filteredMembers = state.members?.filter(m =>
    m.name.toLowerCase().includes(mentionFilter.toLowerCase())
  ) || [];

  const comments = ini.comments || [];

  return (
    <div className="pb-8 border-b border-border">
      <h3 className="text-sm font-semibold text-ink mb-4">Comments</h3>

      {canEdit && (
        <div className="mb-6 p-3 rounded bg-surface border border-border/50 relative">
          <textarea
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              detectMentions(e.target.value);
            }}
            placeholder="Add a comment... (Ctrl+Enter to submit)"
            className="ff-input w-full text-sm mb-2 resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleAddComment();
              }
            }}
          />

          {showMentionList && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-dark border border-border rounded shadow-lg z-50 max-h-40 overflow-y-auto">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    const words = commentText.split(/\s+/);
                    words[words.length - 1] = `@${member.name}`;
                    setCommentText(words.join(' ') + ' ');
                    setMentions([...mentions, member.id]);
                    setShowMentionList(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2"
                >
                  <Avatar id={member.id} size="xs" />
                  <span className="text-ink">{member.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Btn onClick={handleAddComment} variant="primary" size="sm">
              <Send size={14} /> Comment
            </Btn>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="p-3 rounded bg-surface/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Avatar id={comment.author} size="sm" />
              <span className="text-sm font-semibold text-ink">{comment.author}</span>
              <span className="text-xs text-ink-muted">{formatRelativeTime(comment.ts)}</span>
              {canEdit && (
                <button
                  onClick={() => dispatch({ type: TICKET_COMMENT_DEL, payload: { initiativeId: ini.id, commentId: comment.id } })}
                  className="ml-auto text-ink-muted hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-ink mb-2">{comment.text}</p>
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 pl-3 border-l border-border/50 space-y-2">
                {comment.replies.map(reply => (
                  <div key={reply.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar id={reply.author} size="xs" />
                      <span className="font-semibold text-ink-muted text-xs">{reply.author}</span>
                    </div>
                    <p className="text-ink-muted text-sm">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistorySection({ ini }) {
  const history = ini.history || [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-4">History</h3>
      <div className="space-y-3">
        {history.map(entry => (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Avatar id={entry.user} size="sm" />
              <div className="w-0.5 h-6 bg-border/30 mt-1" />
            </div>
            <div className="pt-1 pb-3 flex-1">
              <p className="text-sm font-medium text-ink">{entry.user}</p>
              <p className="text-xs text-ink-muted">{formatRelativeTime(entry.time)}</p>
              {entry.changes && entry.changes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="text-xs text-ink-muted">
                      <span className="font-medium">{change.field}</span>: {change.from} → {change.to}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightSidebar({ ini, okr, kr, canEdit, onUpdate }) {
  const { state } = useApp();

  const handleFieldChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const allMembers = state.members || [];
  const ownerMember = allMembers.find(m => m.id === ini.owner);

  const isPastDue = ini.dueDate && new Date(ini.dueDate) < new Date();

  return (
    <div className="w-80 border-l border-border bg-surface/40 overflow-y-auto p-6 space-y-6">
      {/* Type */}
      <div>
        <label className="ff-label block mb-2">Type</label>
        {canEdit ? (
          <select
            value={ini.issueType || 'task'}
            onChange={(e) => handleFieldChange('issueType', e.target.value)}
            className="ff-input w-full text-sm"
          >
            {Object.entries(ISSUE_TYPE_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        ) : (
          <div className="text-sm"><TypeBadge type={ini.issueType} /></div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="ff-label block mb-2">Status</label>
        {canEdit ? (
          <select
            value={ini.status || 'not_started'}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            className="ff-input w-full text-sm"
          >
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        ) : (
          <StatusPill status={ini.status} />
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="ff-label block mb-2">Priority</label>
        {canEdit ? (
          <select
            value={ini.priority || 'p2'}
            onChange={(e) => handleFieldChange('priority', e.target.value)}
            className="ff-input w-full text-sm"
          >
            {Object.entries(PRIORITY_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-ink-muted">{PRIORITY_CFG[ini.priority]?.label || 'P2'}</div>
        )}
      </div>

      {/* Assignee */}
      <div>
        <label className="ff-label block mb-2">Assignee</label>
        {canEdit ? (
          <select
            value={ini.owner || ''}
            onChange={(e) => handleFieldChange('owner', e.target.value || null)}
            className="ff-input w-full text-sm"
          >
            <option value="">Unassigned</option>
            {allMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2">
            {ownerMember ? (
              <>
                <Avatar id={ini.owner} size="sm" />
                <span className="text-sm text-ink">{ownerMember.name}</span>
              </>
            ) : (
              <span className="text-sm text-ink-muted">Unassigned</span>
            )}
          </div>
        )}
      </div>

      {/* Reporter */}
      <div>
        <label className="ff-label block mb-2">Reporter</label>
        <div className="text-sm text-ink-muted">{state.currentUser?.name || 'Unknown'}</div>
      </div>

      {/* Labels */}
      <div>
        <label className="ff-label block mb-2">Labels</label>
        {canEdit ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {(ini.labels || []).map(label => (
                <button
                  key={label}
                  onClick={() => handleFieldChange('labels', (ini.labels || []).filter(l => l !== label))}
                  className="px-2 py-1 rounded text-xs bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-1"
                >
                  {label} <X size={12} />
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add label and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newLabel = e.target.value.trim();
                  if (!(ini.labels || []).includes(newLabel)) {
                    handleFieldChange('labels', [...(ini.labels || []), newLabel]);
                  }
                  e.target.value = '';
                }
              }}
              className="ff-input text-sm"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(ini.labels || []).map(label => (
              <span key={label} className="px-2 py-1 rounded text-xs bg-gold/20 text-gold">{label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div>
        <label className="ff-label block mb-2">Start Date</label>
        {canEdit ? (
          <input
            type="date"
            value={ini.startDate ? new Date(ini.startDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="ff-input w-full text-sm"
          />
        ) : (
          <div className="text-sm text-ink-muted">
            {ini.startDate ? new Date(ini.startDate).toLocaleDateString() : 'Not set'}
          </div>
        )}
      </div>

      <div>
        <label className={`ff-label block mb-2 ${isPastDue ? 'text-red-400' : ''}`}>
          Due Date {isPastDue && <AlertTriangle size={14} className="inline ml-1" />}
        </label>
        {canEdit ? (
          <input
            type="date"
            value={ini.dueDate ? new Date(ini.dueDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
            className={`ff-input w-full text-sm ${isPastDue ? 'border-red-400' : ''}`}
          />
        ) : (
          <div className={`text-sm ${isPastDue ? 'text-red-400 font-semibold' : 'text-ink-muted'}`}>
            {ini.dueDate ? new Date(ini.dueDate).toLocaleDateString() : 'Not set'}
          </div>
        )}
      </div>

      {/* Budget */}
      <div>
        <label className="ff-label block mb-2">Budget</label>
        {canEdit ? (
          <input
            type="number"
            value={ini.budget || ''}
            onChange={(e) => handleFieldChange('budget', e.target.value ? parseFloat(e.target.value) : null)}
            className="ff-input w-full text-sm"
          />
        ) : (
          <div className="text-sm text-ink-muted">
            {ini.budget ? `$${ini.budget.toLocaleString()}` : 'Not set'}
          </div>
        )}
      </div>

      {/* Parent links */}
      <div className="pt-4 border-t border-border">
        <label className="ff-label block mb-2">Parent</label>
        <div className="space-y-1 text-sm">
          {okr && (
            <button className="text-gold hover:text-gold/80 block">
              <TypeChip type="objective" short className="mr-2" />
              {okr.title}
            </button>
          )}
          {kr && (
            <button className="text-gold hover:text-gold/80 block">
              <TypeChip type="keyresult" short className="mr-2" />
              {kr.title}
            </button>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="pt-4 border-t border-border text-xs text-ink-muted space-y-1">
        <div>Created {formatRelativeTime(ini.createdAt)}</div>
        <div>Updated {formatRelativeTime(ini.updatedAt)}</div>
      </div>
    </div>
  );
}

export default function TicketDrawer() {
  const { state, dispatch } = useApp();
  const ticketId = state.openTicketId;
  const [activeTab, setActiveTab] = useState('comments');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && ticketId) {
        dispatch({ type: CLOSE_TICKET });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticketId, dispatch]);

  useEffect(() => {
    if (ticketId) {
      window.history.replaceState(null, '', `#ticket=${ticketId}`);
    }
  }, [ticketId]);

  if (!ticketId) return null;

  const ticket = findTicket(state.okrs, ticketId);
  if (!ticket) return null;

  const { ini, okr, kr, parent } = ticket;

  // InitiativeView handles top-level initiatives; TicketDrawer only handles sub-tickets
  if (parent === null) return null;
  const canEdit = state.org?.permissions?.canEdit ?? true;

  const handleUpdate = (updates) => {
    dispatch({
      type: INITIATIVE_UPDATE,
      payload: { id: ini.id, ...updates }
    });
  };

  const handleClose = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    dispatch({ type: CLOSE_TICKET });
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#ticket=${ticketId}`;
    navigator.clipboard.writeText(url);
    // Brief visual feedback could be added here
  };

  const ticketIdDisplay = `FF-${ini.id.slice(-6).toUpperCase()}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
      />

      {/* Drawer */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>

      <div className="animate-slide-in-right fixed right-0 top-0 bottom-0 w-[78vw] max-w-[1100px] bg-[#141726] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          {!canEdit && (
            <div className="mb-3 p-2 rounded bg-amber-500/10 border border-amber-400/30 text-xs text-amber-300">
              Viewing in read-only mode
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <TypeChip type="objective" short />
              <button className="hover:text-gold" onClick={() => {/* navigate to OKR */}}>
                {okr?.title || 'OKR'}
              </button>
              <span>/</span>
              <TypeChip type="keyresult" short />
              <button className="hover:text-gold" onClick={() => {/* navigate to KR */}}>
                {kr?.title || 'KR'}
              </button>
              <span>/</span>
              <span className="text-ink">{ini.title}</span>
            </div>

            <button onClick={handleClose} className="text-ink-muted hover:text-ink">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded bg-surface border border-border text-xs font-mono text-gold">
                {ticketIdDisplay}
              </div>
              <TypeBadge type={ini.issueType} />
              <StatusPill status={ini.status} />
            </div>

            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-3 py-1 rounded text-xs text-ink-muted hover:text-gold bg-surface/50 hover:bg-surface transition"
            >
              <Link2 size={14} /> Copy Link
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <TitleSection ini={ini} canEdit={canEdit} onUpdate={handleUpdate} />
            <DescriptionSection ini={ini} canEdit={canEdit} onUpdate={handleUpdate} />
            <SubTicketsSection ini={ini} canEdit={canEdit} onUpdate={handleUpdate} />
            <AttachmentsSection ini={ini} canEdit={canEdit} onUpdate={handleUpdate} />

            {/* Activity tabs */}
            <div className="mb-6">
              <div className="flex gap-4 border-b border-border mb-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2 text-sm font-semibold transition ${
                    activeTab === 'comments'
                      ? 'text-gold border-b-2 border-gold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <MessageSquare size={14} className="inline mr-1" /> Comments
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-2 text-sm font-semibold transition ${
                    activeTab === 'history'
                      ? 'text-gold border-b-2 border-gold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <History size={14} className="inline mr-1" /> History
                </button>
              </div>

              {activeTab === 'comments' && <CommentsSection ini={ini} canEdit={canEdit} />}
              {activeTab === 'history' && <HistorySection ini={ini} />}
            </div>
          </div>

          {/* Right sidebar */}
          <RightSidebar ini={ini} okr={okr} kr={kr} canEdit={canEdit} onUpdate={handleUpdate} />
        </div>
      </div>
    </>
  );
}
