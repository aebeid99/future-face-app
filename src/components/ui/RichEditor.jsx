/**
 * RichEditor — Jira/Google-Docs style content-editable editor
 * Features: rich formatting, table insert, link insert, format painter (paint brush).
 * Format painter works like Microsoft Word: select text → click brush → select target → formatting applied.
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link2, Minus, Eraser, Grid, Paintbrush,
} from 'lucide-react'

// ── Inject editor styles once ─────────────────────────────────────────────────
let _stylesInjected = false
function injectEditorStyles() {
  if (_stylesInjected || typeof document === 'undefined') return
  _stylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .rich-editor:empty:before {
      content: attr(data-placeholder);
      color: #666;
      pointer-events: none;
    }
    .rich-editor:focus { outline: none; }
    .rich-editor h1 { font-size:1.6em; font-weight:700; margin:.5em 0 .25em; color:#e8e8e8; }
    .rich-editor h2 { font-size:1.35em; font-weight:700; margin:.5em 0 .25em; color:#e8e8e8; }
    .rich-editor h3 { font-size:1.15em; font-weight:600; margin:.5em 0 .25em; color:#e8e8e8; }
    .rich-editor h4 { font-size:1em; font-weight:600; margin:.4em 0 .2em; color:#e8e8e8; }
    .rich-editor p  { margin:.15em 0; }
    .rich-editor a  { color:#D4920E; text-decoration:underline; }
    .rich-editor blockquote {
      border-left: 3px solid #D4920E40;
      margin: .5em 0;
      padding: .25em .75em;
      color: #999;
      background: rgba(212,146,14,.05);
      border-radius: 0 6px 6px 0;
    }
    .rich-editor pre, .rich-editor code {
      font-family: 'Fira Code', 'Cascadia Code', monospace;
      background: rgba(0,0,0,.35);
      border: 1px solid #333;
      border-radius: 6px;
      padding: .2em .45em;
      font-size: .85em;
      color: #a8d8a8;
    }
    .rich-editor pre { display:block; padding:.6em .9em; overflow-x:auto; }
    .rich-editor ul { list-style:disc; padding-left:1.4em; margin:.25em 0; }
    .rich-editor ol { list-style:decimal; padding-left:1.4em; margin:.25em 0; }
    .rich-editor li { margin:.1em 0; }
    .rich-editor hr { border:none; border-top:1px solid #333; margin:.75em 0; }
    .rich-editor table.rich-table {
      border-collapse: collapse;
      width: 100%;
      margin: .5em 0;
      font-size: .85em;
      border-radius: 8px;
      overflow: hidden;
    }
    .rich-editor table.rich-table th,
    .rich-editor table.rich-table td {
      border: 1px solid #2a2a2a;
      padding: .4em .65em;
      text-align: left;
      min-width: 60px;
    }
    .rich-editor table.rich-table th {
      background: rgba(212,146,14,.12);
      color: #e8e8e8;
      font-weight: 600;
    }
    .rich-editor table.rich-table tr:nth-child(even) td { background: rgba(255,255,255,.025); }
    .rich-editor table.rich-table tr:hover td { background: rgba(255,255,255,.04); }
    .rich-editor.painting-mode { cursor: crosshair !important; }
    .rich-editor.painting-mode * { cursor: crosshair !important; }
  `
  document.head.appendChild(style)
}

// ── HTML sanitiser for paste ───────────────────────────────────────────────────
function sanitizeHtml(html) {
  const wrap = document.createElement('div')
  wrap.innerHTML = html
  wrap.querySelectorAll('script,style,iframe,object,embed,applet,form,input,button,select,textarea,meta,link').forEach(el => el.remove())
  wrap.querySelectorAll('table').forEach(table => {
    Array.from(table.attributes).forEach(a => table.removeAttribute(a.name))
    table.className = 'rich-table'
    table.querySelectorAll('td,th').forEach(cell => {
      const txt = cell.innerText || cell.textContent
      Array.from(cell.attributes).forEach(a => cell.removeAttribute(a.name))
      cell.textContent = txt
    })
  })
  wrap.querySelectorAll('*').forEach(el => {
    if (['TABLE','TD','TH','TR','THEAD','TBODY'].includes(el.tagName)) return
    const keep = el.tagName === 'A' ? ['href'] : el.tagName === 'IMG' ? ['src', 'alt'] : []
    Array.from(el.attributes).forEach(a => { if (!keep.includes(a.name)) el.removeAttribute(a.name) })
  })
  return wrap.innerHTML
}

// ── execCommand wrappers ───────────────────────────────────────────────────────
function exec(cmd, value = null) {
  document.execCommand(cmd, false, value)
}
function active(cmd) {
  try { return document.queryCommandState(cmd) } catch { return false }
}

// ── Table size picker ─────────────────────────────────────────────────────────
function TablePicker({ onInsert, onClose }) {
  const [hover, setHover] = useState({ r: 0, c: 0 })
  return (
    <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl p-3 shadow-xl z-[60] select-none"
         onMouseLeave={() => setHover({ r: 0, c: 0 })}>
      <p className="text-[10px] text-ink-muted text-center mb-2">
        {hover.r && hover.c ? `${hover.r} × ${hover.c} table` : 'Select table size'}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {Array.from({ length: 6 * 7 }, (_, i) => {
          const r = Math.floor(i / 7) + 1, c = (i % 7) + 1
          const on = r <= hover.r && c <= hover.c
          return (
            <div key={i}
              className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${on ? 'bg-gold/30 border-gold/50' : 'border-border hover:border-gold/30'}`}
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => { onInsert(r, c); onClose() }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Link popup ────────────────────────────────────────────────────────────────
function LinkPopup({ onInsert, onClose }) {
  const [url, setUrl] = useState('')
  return (
    <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl p-3 shadow-xl z-[60] flex gap-2 items-center"
         style={{ minWidth: 260 }}>
      <input autoFocus className="ff-input flex-1 text-xs" placeholder="https://…" value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onInsert(url); if (e.key === 'Escape') onClose() }} />
      <button className="px-2.5 py-1 bg-gold text-dark text-xs font-semibold rounded-lg"
        onClick={() => onInsert(url)}>Add</button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichEditor({
  value = '',
  onChange,
  placeholder = 'Add a description…',
  minHeight = 180,
  readOnly = false,
  className = '',
}) {
  const editorRef    = useRef(null)
  const [fmts, setFmts]     = useState({})
  const [popup, setPopup]   = useState(null) // 'table' | 'link' | null
  const savedRange   = useRef(null)

  // ── Format painter state ──────────────────────────────────────────────────
  const [isPainting, setIsPainting] = useState(false)
  const paintFormat  = useRef(null)   // captured formatting to apply

  useEffect(() => { injectEditorStyles() }, [])

  // Initialise HTML once on mount
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || ''
  }, []) // eslint-disable-line

  const refreshFmts = useCallback(() => {
    setFmts({
      bold:                active('bold'),
      italic:              active('italic'),
      underline:           active('underline'),
      strikeThrough:       active('strikeThrough'),
      insertOrderedList:   active('insertOrderedList'),
      insertUnorderedList: active('insertUnorderedList'),
      justifyLeft:         active('justifyLeft'),
      justifyCenter:       active('justifyCenter'),
      justifyRight:        active('justifyRight'),
    })
  }, [])

  const emitChange = useCallback(() => {
    onChange?.(editorRef.current?.innerHTML || '')
  }, [onChange])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const html  = e.clipboardData?.getData('text/html')
    const text  = e.clipboardData?.getData('text/plain')
    if (html) exec('insertHTML', sanitizeHtml(html))
    else      exec('insertText', text || '')
    emitChange()
  }, [emitChange])

  // Save selection before toolbar popups steal focus
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount) savedRange.current = sel.getRangeAt(0)
  }

  const restoreSelection = () => {
    if (!savedRange.current) return
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(savedRange.current)
  }

  const doCmd = (command, value = null) => {
    editorRef.current?.focus()
    exec(command, value)
    refreshFmts()
    emitChange()
  }

  const insertTable = (rows, cols) => {
    restoreSelection()
    editorRef.current?.focus()
    let html = '<table class="rich-table"><thead><tr>'
    for (let c = 0; c < cols; c++) html += '<th><br></th>'
    html += '</tr></thead><tbody>'
    for (let r = 1; r < rows; r++) {
      html += '<tr>'
      for (let c = 0; c < cols; c++) html += '<td><br></td>'
      html += '</tr>'
    }
    html += '</tbody></table><p><br></p>'
    exec('insertHTML', html)
    emitChange()
  }

  const insertLink = (url) => {
    if (!url) return
    restoreSelection()
    editorRef.current?.focus()
    if (url && !url.startsWith('http')) url = 'https://' + url
    exec('createLink', url)
    setPopup(null)
    emitChange()
  }

  // ── Format painter (paint brush) ──────────────────────────────────────────
  /**
   * Activate paint brush: capture the formatting at the current selection.
   * On next mouseUp in the editor, apply captured formatting to new selection.
   * Behaviour matches Microsoft Word: single-click activates for one use.
   */
  const activatePaintBrush = () => {
    if (isPainting) {
      // Toggle off if already active
      setIsPainting(false)
      paintFormat.current = null
      return
    }
    // Capture current formatting state
    const fmt = {
      bold:         active('bold'),
      italic:       active('italic'),
      underline:    active('underline'),
      strikeThrough: active('strikeThrough'),
      justifyLeft:  active('justifyLeft'),
      justifyCenter: active('justifyCenter'),
      justifyRight: active('justifyRight'),
      orderedList:  active('insertOrderedList'),
      unorderedList: active('insertUnorderedList'),
    }
    paintFormat.current = fmt
    setIsPainting(true)
  }

  /**
   * Apply captured format to current selection in the editor.
   * Called on mouseUp when paint brush is active.
   */
  const applyPaintFormat = useCallback(() => {
    const fmt = paintFormat.current
    if (!fmt) return

    editorRef.current?.focus()

    // Apply/remove bold
    if (fmt.bold !== active('bold')) exec('bold')
    // Apply/remove italic
    if (fmt.italic !== active('italic')) exec('italic')
    // Apply/remove underline
    if (fmt.underline !== active('underline')) exec('underline')
    // Apply/remove strikethrough
    if (fmt.strikeThrough !== active('strikeThrough')) exec('strikeThrough')

    // Apply alignment — pick the active one from captured state
    if (fmt.justifyCenter) exec('justifyCenter')
    else if (fmt.justifyRight) exec('justifyRight')
    else exec('justifyLeft')

    // Apply/remove list types
    if (fmt.orderedList && !active('insertOrderedList')) exec('insertOrderedList')
    else if (!fmt.orderedList && active('insertOrderedList')) exec('insertOrderedList')
    if (fmt.unorderedList && !active('insertUnorderedList')) exec('insertUnorderedList')
    else if (!fmt.unorderedList && active('insertUnorderedList')) exec('insertUnorderedList')

    // Deactivate paint brush after one use (like MS Word single-click)
    paintFormat.current = null
    setIsPainting(false)

    refreshFmts()
    emitChange()
  }, [emitChange, refreshFmts])

  const handleEditorMouseUp = useCallback(() => {
    if (isPainting && paintFormat.current) {
      // Check there's an actual selection (not just a click)
      const sel = window.getSelection()
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        applyPaintFormat()
        return
      }
      // Collapsed selection — still deactivate to avoid confusion
    }
    refreshFmts()
  }, [isPainting, applyPaintFormat, refreshFmts])

  // Cancel paint mode on Escape
  useEffect(() => {
    if (!isPainting) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        setIsPainting(false)
        paintFormat.current = null
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isPainting])

  // ── Toolbar button component ──────────────────────────────────────────────
  const ToolBtn = ({ command, value, Icon, title, activeKey, action, isActive: forceActive }) => {
    const isActive = forceActive !== undefined ? forceActive : (activeKey ? fmts[activeKey] : false)
    return (
      <button type="button" title={title}
        onMouseDown={e => {
          e.preventDefault()
          saveSelection()
          if (action) { action(); return }
          doCmd(command, value)
        }}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          isActive ? 'bg-gold/20 text-gold' : 'text-ink-muted hover:bg-border hover:text-ink'
        }`}>
        <Icon size={13} />
      </button>
    )
  }

  const Sep = () => <div className="w-px h-4 bg-border mx-0.5 self-center shrink-0" />

  return (
    <div
      className={`border border-border rounded-xl overflow-visible bg-dark/30 focus-within:border-gold/30 transition-colors relative ${className}`}
      onClick={() => setPopup(null)}
    >
      {/* ── Toolbar ────────────────────────────────────────────── */}
      {!readOnly && (
        <div
          className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-dark/50 flex-wrap"
          onClick={e => e.stopPropagation()}
        >
          {/* Block format dropdown */}
          <select
            className="text-[11px] bg-transparent text-ink-muted border-0 outline-none cursor-pointer pr-1 pl-1 py-0.5 rounded hover:bg-border h-7"
            onMouseDown={e => saveSelection()}
            onChange={e => { restoreSelection(); doCmd('formatBlock', e.target.value); e.target.value = '' }}
            defaultValue=""
          >
            <option value="" disabled>Style</option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="blockquote">Quote</option>
            <option value="pre">Code Block</option>
          </select>

          <Sep />

          {/* ── Paint brush (Format Painter) ──────────────────── */}
          <div className="relative">
            <button
              type="button"
              title={isPainting
                ? 'Format Painter active — select text to apply formatting (Esc to cancel)'
                : 'Format Painter — click to copy formatting, then select target text'}
              onMouseDown={e => {
                e.preventDefault()
                saveSelection()
                activatePaintBrush()
              }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                isPainting
                  ? 'bg-gold text-dark ring-2 ring-gold/60 ring-offset-1 ring-offset-dark animate-pulse'
                  : 'text-ink-muted hover:bg-border hover:text-ink'
              }`}
            >
              <Paintbrush size={13} />
            </button>
            {/* Tooltip when active */}
            {isPainting && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap text-[10px] bg-gold text-dark font-semibold px-2 py-1 rounded shadow-lg z-50 pointer-events-none">
                Select text to apply format
              </div>
            )}
          </div>

          <Sep />

          <ToolBtn command="bold"          activeKey="bold"                Icon={Bold}          title="Bold (Ctrl+B)" />
          <ToolBtn command="italic"        activeKey="italic"              Icon={Italic}        title="Italic (Ctrl+I)" />
          <ToolBtn command="underline"     activeKey="underline"           Icon={Underline}     title="Underline (Ctrl+U)" />
          <ToolBtn command="strikeThrough" activeKey="strikeThrough"       Icon={Strikethrough} title="Strikethrough" />

          <Sep />

          <ToolBtn command="justifyLeft"   activeKey="justifyLeft"         Icon={AlignLeft}     title="Align Left" />
          <ToolBtn command="justifyCenter" activeKey="justifyCenter"       Icon={AlignCenter}   title="Align Center" />
          <ToolBtn command="justifyRight"  activeKey="justifyRight"        Icon={AlignRight}    title="Align Right" />

          <Sep />

          <ToolBtn command="insertUnorderedList" activeKey="insertUnorderedList" Icon={List}         title="Bullet List" />
          <ToolBtn command="insertOrderedList"   activeKey="insertOrderedList"   Icon={ListOrdered}  title="Numbered List" />

          <Sep />

          {/* Table picker */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button type="button" title="Insert Table"
              onMouseDown={e => { e.preventDefault(); saveSelection(); setPopup(p => p === 'table' ? null : 'table') }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${popup === 'table' ? 'bg-gold/20 text-gold' : 'text-ink-muted hover:bg-border hover:text-ink'}`}>
              <Grid size={13} />
            </button>
            {popup === 'table' && (
              <TablePicker onInsert={insertTable} onClose={() => setPopup(null)} />
            )}
          </div>

          {/* Link picker */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button type="button" title="Insert Link"
              onMouseDown={e => { e.preventDefault(); saveSelection(); setPopup(p => p === 'link' ? null : 'link') }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${popup === 'link' ? 'bg-gold/20 text-gold' : 'text-ink-muted hover:bg-border hover:text-ink'}`}>
              <Link2 size={13} />
            </button>
            {popup === 'link' && (
              <LinkPopup onInsert={insertLink} onClose={() => setPopup(null)} />
            )}
          </div>

          <ToolBtn command="insertHorizontalRule" Icon={Minus}  title="Horizontal Rule" />
          <ToolBtn command="removeFormat"         Icon={Eraser} title="Clear Formatting" />
        </div>
      )}

      {/* ── Editable area ───────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={`rich-editor px-4 py-3 text-sm text-ink outline-none overflow-y-auto ${readOnly ? 'cursor-default' : ''} ${isPainting ? 'painting-mode' : ''}`}
        style={{ minHeight, maxHeight: 520 }}
        onInput={() => { if (!isPainting) { refreshFmts(); emitChange() } }}
        onKeyUp={() => { if (!isPainting) refreshFmts() }}
        onMouseUp={handleEditorMouseUp}
        onPaste={handlePaste}
        onClick={() => setPopup(null)}
        data-placeholder={placeholder}
      />

      {/* Painting mode overlay hint */}
      {isPainting && (
        <div className="absolute bottom-2 right-2 text-[10px] text-gold/70 pointer-events-none select-none">
          Esc to cancel
        </div>
      )}
    </div>
  )
}
