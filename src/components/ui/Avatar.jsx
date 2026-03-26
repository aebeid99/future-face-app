import { initials } from '../../utils/formatting.js'

const SIZES = {
  xs:  'w-6  h-6  text-[10px]',
  sm:  'w-7  h-7  text-xs',
  md:  'w-8  h-8  text-sm',
  lg:  'w-10 h-10 text-base',
  xl:  'w-12 h-12 text-lg',
  '2xl':'w-16 h-16 text-xl',
}

// Deterministic color from name
function avatarColor(name = '') {
  const colors = [
    '#D4920E', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    '#F59E0B', '#14B8A6', '#6366F1', '#F43F5E', '#0EA5E9',
  ]
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFFFF
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({
  name = '',
  src,
  size = 'md',
  className = '',
  online,
}) {
  const cls = [
    'relative inline-flex items-center justify-center rounded-full flex-shrink-0 font-semibold',
    SIZES[size] || SIZES.md,
    className,
  ].join(' ')

  const bg = avatarColor(name)

  return (
    <div className={cls} style={!src ? { backgroundColor: bg + '22', color: bg } : {}}>
      {src
        ? <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
        : <span className="leading-none select-none">{initials(name)}</span>
      }
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-dark-400 ${
            online ? 'bg-success' : 'bg-ink-faint'
          }`}
        />
      )}
    </div>
  )
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const shown = users.slice(0, max)
  const rest  = users.length - max

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((u, i) => (
        <Avatar key={i} name={u.name || u} src={u.avatar} size={size} className="ring-2 ring-dark-400" />
      ))}
      {rest > 0 && (
        <div className={`inline-flex items-center justify-center rounded-full bg-surface-hover text-ink-muted text-[10px] font-medium ring-2 ring-dark-400 ${SIZES[size]}`}>
          +{rest}
        </div>
      )}
    </div>
  )
}
