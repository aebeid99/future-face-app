import { useState, useRef, useCallback, useEffect } from 'react'
import {
  MousePointer2, Hand, Square, Circle, Triangle, Diamond,
  Pencil, ArrowRight, Type, StickyNote, Pin,
  Image, BarChart2, Link2, Sparkles, Frame, Group,
  Minus, Plus, Users, Share2, ChevronDown, X, Trash2,
  MessageSquare, ZoomIn, ZoomOut, Maximize2, LayoutGrid,
  Palette, Check, AlertCircle,
} from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { CANVAS_CREATE, CANVAS_OPEN, CANVAS_NODE_ADD, CANVAS_NODE_UPDATE, CANVAS_NODE_DELETE, NAV, NOTIF_ADD } from '../../state/actions.js'

// ── limits ────────────────────────────────────────────────────
const FREE_CANVAS_LIMIT = 3

// ── color palette ─────────────────────────────────────────────
const STICKY_COLORS = [
  { id: 'yellow', bg: '#2a2200', text: '#fde68a', border: 'rgba(253,230,138,.15)' },
  { id: 'violet', bg: '#1a1030', text: '#c4b5fd', border: 'rgba(196,181,253,.12)' },
  { id: 'teal',   bg: '#0a1f1c', text: '#5eead4', border: 'rgba(94,234,212,.12)'  },
  { id: 'rose',   bg: '#1f0a10', text: '#fda4af', border: 'rgba(253,164,175,.12)' },
  { id: 'gold',   bg: '#221500', text: '#fcd34d', border: 'rgba(252,211,77,.12)'  },
]

// ── templates ─────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'strategy_map',    emoji: '🗺️', name: 'Strategy Map',       desc: 'OKR tree visual'          },
  { id: 'user_journey',    emoji: '🔄', name: 'User Journey',        desc: 'Experience flow'          },
  { id: 'mind_map',        emoji: '🧠', name: 'Mind Map',            desc: 'Brainstorm ideas'         },
  { id: 'sprint_board',    emoji: '📋', name: 'Sprint Board',        desc: 'Kanban planning'          },
  { id: 'stakeholder_map', emoji: '👥', name: 'Stakeholder Map',     desc: 'Org chart & influence'    },
  { id: 'impact_map',      emoji: '🎯', name: 'Impact Map',          desc: 'Goal decomposition'       },
  { id: 'retrospective',   emoji: '🔁', name: 'Retrospective',       desc: 'Team retrospective'       },
  { id: 'risk_matrix',     emoji: '⚠️', name: 'Risk Matrix',         desc: '2×2 risk assessment'      },
  { id: 'business_model',  emoji: '📊', name: 'Business Model',      desc: 'Canvas framework'         },
  { id: 'okr_tree',        emoji: '🌳', name: 'OKR Tree',            desc: 'Linked OKR hierarchy'     },
]

// ── CanvasHub — list of canvases ──────────────────────────────
function CanvasHub({ workspace, onOpen, onCreate }) {
  const canvases = workspace?.canvases || []
  const atLimit  = canvases.length >= FREE_CANVAS_LIMIT
  const [showTemplates, setShowTemplates] = useState(false)
  const { dispatch } = useApp()

  function handleCreate(template = null) {
    if (atLimit) return
    onCreate(template)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-ink tracking-tight">Canvas</h2>
          <p className="text-xs text-ink-muted mt-0.5">Visual workspace · diagrams, flows, ideas</p>
        </div>
        <div className="flex items-center gap-3">
          {/* limit indicator */}
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>{canvases.length} of {FREE_CANVAS_LIMIT}</span>
            <div className="flex gap-1">
              {Array.from({ length: FREE_CANVAS_LIMIT }, (_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < canvases.length ? 'bg-gold' : 'bg-surface-hover border border-border'}`} />
              ))}
            </div>
          </div>
          {atLimit ? (
            <button
              onClick={() => dispatch({ type: NAV, page: 'billing' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-dark-400 text-xs font-bold"
            >
              Upgrade for unlimited
            </button>
          ) : (
            <button
              onClick={() => setShowTemplates(s => !s)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-dark-400 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Plus size={13} /> New Canvas
            </button>
          )}
        </div>
      </div>

      {/* template picker */}
      {showTemplates && !atLimit && (
        <div className="mb-6 bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-ink-muted">Start from a template or blank</p>
            <button onClick={() => setShowTemplates(false)} className="text-ink-faint hover:text-ink"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => { handleCreate(null); setShowTemplates(false) }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:border-gold/40 hover:bg-gold/[0.03] transition-all group"
            >
              <div className="text-2xl opacity-50 group-hover:opacity-100">+</div>
              <span className="text-[10px] text-ink-muted group-hover:text-ink">Blank</span>
            </button>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => { handleCreate(t); setShowTemplates(false) }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-gold/40 hover:bg-gold/[0.03] transition-all group"
              >
                <div className="text-xl">{t.emoji}</div>
                <span className="text-[10px] text-ink-muted group-hover:text-ink text-center leading-tight">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* canvas list */}
      {canvases.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-ink font-semibold mb-1">No canvases yet</p>
          <p className="text-xs text-ink-muted mb-4">Create your first canvas to start visualising ideas</p>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-5 py-2.5 rounded-xl bg-gold text-dark-400 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            + Create canvas
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {canvases.map(c => {
            const nodeCount = (c.nodes || []).length
            const tmpl = TEMPLATES.find(t => t.id === c.templateId)
            return (
              <button
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-border-hover hover:bg-surface-hover transition-all group text-left"
              >
                <div className="w-12 h-10 rounded-lg flex items-center justify-center text-2xl bg-gold/[0.07] border border-gold/10 flex-shrink-0">
                  {tmpl?.emoji || '🎨'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{c.name || 'Untitled Canvas'}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {nodeCount} node{nodeCount !== 1 ? 's' : ''} ·{' '}
                    {c.updatedAt ? `Edited ${new Date(c.updatedAt).toLocaleDateString()}` : 'Just created'}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gold font-semibold">Open →</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* limit reached banner */}
      {atLimit && (
        <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.05]">
          <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Canvas limit reached</p>
            <p className="text-xs text-ink-muted">Upgrade to Pro for unlimited canvases, or archive an existing one.</p>
          </div>
          <button onClick={() => dispatch({ type: NAV, page: 'billing' })} className="px-3 py-1.5 rounded-lg bg-gold text-dark-400 text-xs font-bold flex-shrink-0">
            Upgrade
          </button>
        </div>
      )}
    </div>
  )
}

// ── CanvasBoard — the actual board ────────────────────────────
function CanvasBoard({ canvas, wsId, onBack }) {
  const { state, dispatch } = useApp()
  const boardRef   = useRef(null)
  const [tool, setTool]       = useState('select')
  const [zoom, setZoom]       = useState(100)
  const [pan, setPan]         = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [panStart, setPanStart] = useState(null)
  const [selected, setSelected] = useState(null)
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0])
  const [propsPanelOpen, setPropsPanelOpen] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const nodes = canvas?.nodes || []
  const selectedNode = nodes.find(n => n.id === selected) || null

  // add a node at a position
  function addNode(type, x, y) {
    const base = { type, x, y }
    if (type === 'sticky') {
      dispatch({ type: CANVAS_NODE_ADD, wsId, canvasId: canvas.id, node: { ...base, text: 'New note', color: stickyColor.id, width: 160, height: 120 } })
    } else if (type === 'text') {
      dispatch({ type: CANVAS_NODE_ADD, wsId, canvasId: canvas.id, node: { ...base, text: 'Double-click to edit', fontSize: 14, color: '#eeeef4' } })
    } else if (type === 'shape') {
      dispatch({ type: CANVAS_NODE_ADD, wsId, canvasId: canvas.id, node: { ...base, shape: 'rect', text: '', width: 140, height: 60, bgColor: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.4)', textColor: '#c4b5fd' } })
    }
  }

  function handleBoardClick(e) {
    if (e.target !== boardRef.current && !e.target.classList.contains('canvas-bg')) return
    if (tool === 'sticky') {
      const rect = boardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top  - pan.y) / (zoom / 100)
      addNode('sticky', x, y)
      return
    }
    if (tool === 'text') {
      const rect = boardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top  - pan.y) / (zoom / 100)
      addNode('text', x, y)
      return
    }
    if (tool === 'shape') {
      const rect = boardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top  - pan.y) / (zoom / 100)
      addNode('shape', x, y)
      return
    }
    setSelected(null)
    setPropsPanelOpen(false)
  }

  const aiCreditsLeft = (state.aiCredits?.dailyLimit || 20) - (state.aiCredits?.dailyUsed || 0)
  const atCreditLimit = aiCreditsLeft <= 0

  // Tool config
  const TOOL_GROUPS = [
    {
      items: [
        { id: 'select', icon: MousePointer2, tip: 'Select (V)' },
        { id: 'hand',   icon: Hand,          tip: 'Pan (H)'    },
      ],
    },
    {
      items: [
        { id: 'shape',  icon: Square,        tip: 'Shape (R)'   },
        { id: 'ellipse',icon: Circle,        tip: 'Ellipse (O)' },
        { id: 'diamond',icon: Diamond,       tip: 'Diamond (D)' },
      ],
    },
    {
      items: [
        { id: 'draw',   icon: Pencil,        tip: 'Draw (P)'    },
        { id: 'arrow',  icon: ArrowRight,    tip: 'Arrow (A)'   },
        { id: 'link',   icon: Link2,         tip: 'Connect (C)' },
      ],
    },
    {
      items: [
        { id: 'text',   icon: Type,          tip: 'Text (T)'    },
        { id: 'sticky', icon: StickyNote,    tip: 'Sticky (S)'  },
        { id: 'pin',    icon: Pin,           tip: 'Pin comment' },
      ],
    },
    {
      items: [
        { id: 'image',  icon: Image,         tip: 'Image'       },
        { id: 'chart',  icon: BarChart2,     tip: 'Chart'       },
        { id: 'embed',  icon: Link2,         tip: 'Embed issue' },
      ],
    },
    {
      items: [
        { id: 'ai',     icon: Sparkles,      tip: `AI Generate (${aiCreditsLeft} credits)`, special: 'gold' },
      ],
    },
    {
      items: [
        { id: 'frame',  icon: Frame,         tip: 'Frame (F)'   },
        { id: 'group',  icon: Group,         tip: 'Group (G)'   },
      ],
    },
  ]

  const stickyColorMap = Object.fromEntries(STICKY_COLORS.map(c => [c.id, c]))

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-dark-400">
      {/* ── Canvas topbar ── */}
      <div className="h-12 bg-dark border-b border-border flex items-center px-3 gap-3 flex-shrink-0 z-10">
        {/* Left: back + canvas name */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors flex-shrink-0">
            <ChevronDown size={13} className="rotate-90" /> Back
          </button>
          <div className="h-4 border-l border-border" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate">{canvas?.name || 'Untitled Canvas'}</p>
            <p className="text-[10px] text-ink-faint">Saved</p>
          </div>
        </div>

        {/* Center: tool groups */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto">
          {TOOL_GROUPS.map((group, gi) => (
            <div key={gi} className="flex items-center gap-0.5 bg-surface border border-border rounded-lg p-0.5 flex-shrink-0">
              {group.items.map(t => {
                const Icon   = t.icon
                const active = tool === t.id
                return (
                  <Tooltip key={t.id} text={t.tip}>
                    <button
                      onClick={() => { setTool(t.id); if (t.id !== 'sticky') setShowColorPicker(false) }}
                      className={[
                        'w-7 h-7 rounded-md flex items-center justify-center transition-all',
                        active
                          ? t.special === 'gold' ? 'bg-gold/15 text-gold' : 'bg-gold/10 text-gold'
                          : t.special === 'gold' ? 'text-gold/60 hover:bg-gold/10 hover:text-gold' : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                      ].join(' ')}
                    >
                      <Icon size={13} />
                    </button>
                  </Tooltip>
                )
              })}
            </div>
          ))}

          {/* Sticky color picker (shows when sticky tool active) */}
          {tool === 'sticky' && (
            <div className="flex items-center gap-1 bg-surface border border-gold/30 rounded-lg p-1.5">
              {STICKY_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setStickyColor(c)}
                  className={`w-4 h-4 rounded-full border transition-all ${stickyColor.id === c.id ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                  style={{ background: c.text }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: zoom + share */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg px-2 py-1">
            <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="text-ink-faint hover:text-ink transition-colors"><Minus size={11} /></button>
            <span className="text-[11px] font-semibold text-ink w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-ink-faint hover:text-ink transition-colors"><Plus size={11} /></button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-dark-400 text-xs font-bold hover:opacity-90 transition-opacity">
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      {/* ── Board area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left tool rail */}
        <div className="w-10 bg-dark border-r border-border flex flex-col items-center py-2 gap-1 flex-shrink-0 z-10">
          {[
            { id: 'select', icon: MousePointer2 },
            null,
            { id: 'sticky', icon: StickyNote },
            { id: 'shape',  icon: Square },
            { id: 'text',   icon: Type },
            { id: 'arrow',  icon: ArrowRight },
            null,
            { id: 'zoom-in',  icon: ZoomIn,  action: () => setZoom(z => Math.min(200, z + 10)) },
            { id: 'zoom-out', icon: ZoomOut, action: () => setZoom(z => Math.max(25, z - 10)) },
          ].map((t, i) => {
            if (!t) return <div key={i} className="w-5 border-t border-border my-0.5" />
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={t.action || (() => setTool(t.id))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${tool === t.id ? 'bg-gold/10 text-gold' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'}`}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>

        {/* Canvas board */}
        <div
          ref={boardRef}
          className={`flex-1 relative overflow-hidden canvas-bg ${tool === 'hand' ? 'cursor-grab' : tool === 'sticky' || tool === 'text' || tool === 'shape' ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #141420 0%, #0a0a0f 100%)',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: `${24 * zoom / 100}px ${24 * zoom / 100}px`,
          }}
          onClick={handleBoardClick}
        >
          {/* Nodes */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`, transformOrigin: '0 0', position: 'absolute', inset: 0, width: '2000px', height: '2000px' }}>
            {nodes.map(node => (
              <NodeRenderer
                key={node.id}
                node={node}
                selected={selected === node.id}
                stickyColorMap={stickyColorMap}
                onSelect={() => { setSelected(node.id); setPropsPanelOpen(true) }}
                onUpdate={(updates) => dispatch({ type: CANVAS_NODE_UPDATE, wsId, canvasId: canvas.id, nodeId: node.id, updates })}
                onDelete={() => { dispatch({ type: CANVAS_NODE_DELETE, wsId, canvasId: canvas.id, nodeId: node.id }); setSelected(null) }}
              />
            ))}
          </div>

          {/* Empty state hint */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm font-semibold text-ink-faint mb-1">Canvas is empty</p>
                <p className="text-xs text-ink-faint">Click a tool above, then click on the canvas to add elements</p>
              </div>
            </div>
          )}

          {/* AI credits chip */}
          <div className="absolute bottom-4 left-14 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark/80 border border-border backdrop-blur-sm text-[11px]">
            <Sparkles size={11} className={atCreditLimit ? 'text-rose-400' : 'text-gold'} />
            {atCreditLimit ? (
              <span className="text-rose-400 font-semibold">Credits exhausted</span>
            ) : (
              <span className="text-gold">{aiCreditsLeft} AI credits today</span>
            )}
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 text-[10px] text-ink-faint bg-dark/80 border border-border px-2 py-1 rounded-lg backdrop-blur-sm">
            {zoom}%
          </div>
        </div>

        {/* Right properties panel */}
        {propsPanelOpen && selectedNode && (
          <div className="w-52 bg-dark border-l border-border flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Properties</span>
              <button onClick={() => { setPropsPanelOpen(false); setSelected(null) }} className="text-ink-faint hover:text-ink transition-colors"><X size={13} /></button>
            </div>

            <div className="p-3 space-y-4">
              {/* Node type label */}
              <div>
                <p className="text-[10px] text-ink-faint mb-1">Type</p>
                <span className="text-xs font-semibold text-ink capitalize">{selectedNode.type}</span>
              </div>

              {/* Color swatches for sticky */}
              {selectedNode.type === 'sticky' && (
                <div>
                  <p className="text-[10px] text-ink-faint mb-2">Color</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {STICKY_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => dispatch({ type: CANVAS_NODE_UPDATE, wsId, canvasId: canvas.id, nodeId: selectedNode.id, updates: { color: c.id } })}
                        className={`w-5 h-5 rounded-full border transition-all hover:scale-110 ${selectedNode.color === c.id ? 'scale-125 border-white' : 'border-transparent'}`}
                        style={{ background: c.text }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Link to OKR */}
              <div>
                <p className="text-[10px] text-ink-faint mb-1.5">Link to OKR</p>
                <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface border border-border hover:border-border-hover text-xs text-ink-muted transition-colors">
                  <Target size={11} className="text-teal-400" /> Attach to Objective…
                </button>
              </div>

              {/* Actions */}
              <div>
                <p className="text-[10px] text-ink-faint mb-1.5">Actions</p>
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface border border-border hover:border-border-hover text-xs text-ink-muted transition-colors">
                    <Link2 size={11} /> Promote to Issue
                  </button>
                  <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface border border-border hover:border-border-hover text-xs text-ink-muted transition-colors">
                    <MessageSquare size={11} /> Add comment
                  </button>
                  <button
                    onClick={() => { dispatch({ type: CANVAS_NODE_DELETE, wsId, canvasId: canvas.id, nodeId: selectedNode.id }); setSelected(null); setPropsPanelOpen(false) }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-rose-500/[0.06] border border-rose-500/15 hover:border-rose-500/30 text-xs text-rose-400 transition-colors"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── NodeRenderer ──────────────────────────────────────────────
function NodeRenderer({ node, selected, stickyColorMap, onSelect, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(node.text || '')
  const textRef = useRef(null)

  function commitEdit() {
    setEditing(false)
    if (text !== node.text) onUpdate({ text })
  }

  const color = stickyColorMap[node.color] || STICKY_COLORS[0]

  if (node.type === 'sticky') {
    return (
      <div
        onClick={onSelect}
        onDoubleClick={() => { setEditing(true); setTimeout(() => textRef.current?.focus(), 20) }}
        style={{
          position: 'absolute', left: node.x, top: node.y,
          width: node.width || 160, minHeight: node.height || 120,
          background: color.bg, color: color.text, border: `1px solid ${color.border}`,
          borderRadius: 10, padding: '10px 12px', fontSize: 12, lineHeight: 1.5,
          cursor: 'pointer', boxShadow: selected ? `0 0 0 2px ${color.text}` : '0 4px 16px rgba(0,0,0,0.4)',
          userSelect: editing ? 'auto' : 'none',
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Note</div>
        {editing ? (
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={commitEdit}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontSize: 12, width: '100%', resize: 'none', minHeight: 60, fontFamily: 'inherit' }}
          />
        ) : (
          <p>{node.text || 'Double-click to edit'}</p>
        )}
      </div>
    )
  }

  if (node.type === 'text') {
    return (
      <div
        onClick={onSelect}
        onDoubleClick={() => { setEditing(true); setTimeout(() => textRef.current?.focus(), 20) }}
        style={{
          position: 'absolute', left: node.x, top: node.y,
          color: node.color || '#eeeef4', fontSize: node.fontSize || 14,
          cursor: 'pointer', userSelect: editing ? 'auto' : 'none',
          outline: selected ? '1px dashed rgba(212,146,14,0.4)' : 'none',
          padding: '2px 4px', borderRadius: 4,
        }}
      >
        {editing ? (
          <input
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={commitEdit}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit' }}
          />
        ) : (
          node.text || 'Text'
        )}
      </div>
    )
  }

  if (node.type === 'shape') {
    return (
      <div
        onClick={onSelect}
        style={{
          position: 'absolute', left: node.x, top: node.y,
          width: node.width || 140, height: node.height || 60,
          background: node.bgColor || 'rgba(124,58,237,0.12)',
          border: `1.5px solid ${node.borderColor || 'rgba(124,58,237,0.4)'}`,
          color: node.textColor || '#c4b5fd',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          boxShadow: selected ? '0 0 0 2px rgba(212,146,14,0.4)' : 'none',
        }}
      >
        {node.text || 'Shape'}
      </div>
    )
  }

  return null
}

// ── tiny inline tooltip ───────────────────────────────────────
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark border border-border rounded-md text-[10px] text-ink whitespace-nowrap z-50 pointer-events-none shadow-lg">
          {text}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function CanvasPage() {
  const { state, dispatch } = useApp()
  const { workspaces = [], currentWorkspaceId } = state
  const currentWs = workspaces.find(w => w.id === currentWorkspaceId) || null
  const [openCanvasId, setOpenCanvasId] = useState(state.openCanvasId || null)

  const openCanvas = currentWs?.canvases?.find(c => c.id === openCanvasId) || null

  function handleCreate(template = null) {
    if (!currentWs) return
    const canvases = currentWs.canvases || []
    if (canvases.length >= FREE_CANVAS_LIMIT) return

    dispatch({
      type: CANVAS_CREATE,
      wsId: currentWs.id,
      canvas: {
        name: template ? template.name : 'Untitled Canvas',
        templateId: template?.id || null,
        description: template?.desc || '',
      },
    })
    dispatch({ type: NOTIF_ADD, notification: { title: 'Canvas created', body: `"${template?.name || 'Untitled Canvas'}" is ready.` } })
    // Open the new canvas (it will be last in the list)
    setTimeout(() => {
      const updated = (state.workspaces || []).find(w => w.id === currentWorkspaceId)
      const last = (updated?.canvases || []).slice(-1)[0]
      if (last) setOpenCanvasId(last.id)
    }, 50)
  }

  // when canvas_create action runs, canvases array updates → open latest
  useEffect(() => {
    if (!openCanvasId && currentWs) {
      const latest = (currentWs.canvases || []).slice(-1)[0]
      // don't auto-open — stay on hub
    }
  }, [currentWs])

  // sync openCanvasId from state after create
  useEffect(() => {
    const latest = (currentWs?.canvases || []).slice(-1)[0]
    if (state.openCanvasId && state.openCanvasId !== openCanvasId) {
      setOpenCanvasId(state.openCanvasId)
    }
  }, [state.openCanvasId])

  if (!currentWs) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-ink-muted text-sm">No workspace selected. <button className="text-gold hover:underline" onClick={() => dispatch({ type: NAV, page: 'workspace_select' })}>Choose workspace →</button></p>
      </div>
    )
  }

  if (openCanvas) {
    return (
      <CanvasBoard
        canvas={openCanvas}
        wsId={currentWs.id}
        onBack={() => setOpenCanvasId(null)}
      />
    )
  }

  return (
    <CanvasHub
      workspace={currentWs}
      onOpen={(id) => setOpenCanvasId(id)}
      onCreate={handleCreate}
    />
  )
}
