import React from 'react'

// ─── Status Badge ───────────────────────────────────────────────────────────
const STATUS_MAP = {
  COMPLETED:      { label: 'Completed',        bg: 'var(--green-dim)',  color: 'var(--green)',  dot: 'var(--green)',  glow: 'var(--green-glow)' },
  RUNNING:        { label: 'Running',           bg: 'var(--blue-dim)',   color: 'var(--blue)',   dot: 'var(--blue)',   glow: 'var(--blue-glow)' },
  WAITING_SIGNAL: { label: 'Awaiting Approval', bg: 'var(--amber-dim)',  color: 'var(--amber)',  dot: 'var(--amber)',  glow: 'var(--amber-glow)' },
  FAILED:         { label: 'Failed',            bg: 'var(--red-dim)',    color: 'var(--red)',    dot: 'var(--red)',    glow: 'var(--red-glow)' },
  PENDING:        { label: 'Pending',           bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', dot: 'var(--text-muted)', glow: 'transparent' },
  REJECTED:       { label: 'Rejected',          bg: 'var(--pink-dim)',   color: 'var(--pink)',   dot: 'var(--pink)',   glow: 'rgba(236,72,153,0.25)' },
}

export function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.PENDING
  const isRunning = status === 'RUNNING'
  const pad = size === 'sm' ? '3px 10px' : '5px 12px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: pad, borderRadius: 20, fontSize,
      fontWeight: 600, fontFamily: 'var(--mono)',
      background: cfg.bg, color: cfg.color,
      whiteSpace: 'nowrap',
      border: `1px solid ${cfg.bg}`,
      letterSpacing: '0.3px',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
        boxShadow: `0 0 6px ${cfg.glow}`,
        animation: isRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
        position: 'relative',
      }}>
        {isRunning && (
          <span style={{
            position: 'absolute', inset: -3,
            borderRadius: '50%',
            border: `2px solid ${cfg.dot}`,
            animation: 'pulseRing 1.5s ease-out infinite',
          }} />
        )}
      </span>
      {cfg.label}
    </span>
  )
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 7, showLabel = false, height = 6 }) {
  const pct = Math.round((value / max) * 100)

  return (
    <div>
      <div style={{
        height, background: 'rgba(255,255,255,0.06)', borderRadius: height,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct === 100
            ? 'linear-gradient(90deg, #10b981, #34d399)'
            : 'var(--gradient)',
          borderRadius: height,
          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            animation: 'shimmer 2s infinite',
            backgroundSize: '200% 100%',
          }} />
        </div>
      </div>
      {showLabel && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>
          {pct}%
        </div>
      )}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, className, onClick, glow }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      onMouseEnter={onClick ? e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      } : undefined}
      onMouseLeave={onClick ? e => {
        e.currentTarget.style.boxShadow = glow ? 'var(--shadow-glow)' : 'var(--shadow)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      } : undefined}
    >
      {children}
    </div>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────
const BTN_STYLES = {
  primary:   { bg: 'var(--gradient)', color: '#fff', border: 'transparent', hover: 'var(--gradient-2)', shadow: '0 4px 14px rgba(6,182,212,0.25)' },
  secondary: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: 'var(--border2)', hover: 'rgba(255,255,255,0.08)', shadow: 'none' },
  success:   { bg: 'var(--green-dim)', color: 'var(--green)', border: 'rgba(16,185,129,0.2)', hover: 'rgba(16,185,129,0.18)', shadow: 'none' },
  danger:    { bg: 'var(--red-dim)', color: 'var(--red)', border: 'rgba(239,68,68,0.2)', hover: 'rgba(239,68,68,0.18)', shadow: 'none' },
  ghost:     { bg: 'transparent', color: 'var(--text-secondary)', border: 'transparent', hover: 'rgba(255,255,255,0.06)', shadow: 'none' },
}

export function Button({ children, variant = 'secondary', size = 'md', onClick, disabled, loading, icon, style }) {
  const cfg = BTN_STYLES[variant]
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '12px 24px' : '9px 18px'
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 14 : 13

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: pad, borderRadius: 'var(--radius-sm)',
        border: `1px solid ${cfg.border}`,
        background: cfg.bg, color: cfg.color,
        fontSize, fontWeight: 600, fontFamily: 'var(--font)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        whiteSpace: 'nowrap',
        boxShadow: cfg.shadow,
        letterSpacing: '0.2px',
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = cfg.hover
          e.currentTarget.style.transform = 'translateY(-1px)'
          if (variant === 'primary') e.currentTarget.style.boxShadow = '0 6px 20px rgba(6,182,212,0.35)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = cfg.bg
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = cfg.shadow
      }}
    >
      {loading ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> : icon}
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, icon, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>}
        <input
          {...props}
          style={{
            width: '100%', padding: icon ? '10px 14px 10px 36px' : '10px 14px',
            border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 13, fontFamily: 'var(--font)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--text)',
            outline: 'none', transition: 'all 0.2s',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent-1)'
            e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)'
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--red)' : 'var(--border2)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        {...props}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: 13, fontFamily: 'var(--font)',
          background: 'rgba(255,255,255,0.04)',
          color: props.value ? 'var(--text)' : 'var(--text-muted)',
          outline: 'none', cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 32,
          transition: 'all 0.2s',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--accent-1)'
          e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)'
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? 'var(--red)' : 'var(--border2)'
          e.target.style.boxShadow = 'none'
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['var(--cyan-dim)', 'var(--cyan)'],
  ['var(--green-dim)', 'var(--green)'],
  ['var(--purple-dim)', 'var(--purple)'],
  ['var(--amber-dim)', 'var(--amber)'],
  ['var(--pink-dim)', 'var(--pink)'],
  ['var(--blue-dim)', 'var(--blue)'],
]

export function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const colorIdx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  const [bg, color] = AVATAR_COLORS[colorIdx]

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
      letterSpacing: '-0.5px',
      border: `2px solid ${color}33`,
    }}>
      {initials}
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.06)',
      borderTop: '2px solid var(--accent-1)',
      borderRight: '2px solid var(--accent-2)',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
    }} />
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 14, filter: 'grayscale(0.3)' }}>{icon}</div>}
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>{description}</div>}
      {action}
    </div>
  )
}

// ─── Mono Tag ────────────────────────────────────────────────────────────────
export function MonoTag({ children, color = 'var(--text-muted)' }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10,
      color, background: 'rgba(255,255,255,0.06)',
      padding: '3px 8px', borderRadius: 6,
      border: '1px solid var(--border)',
      letterSpacing: '0.3px',
    }}>
      {children}
    </span>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{
          fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
          background: 'var(--gradient-text)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.2,
        }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
