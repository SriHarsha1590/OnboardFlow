import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, GitBranch, Activity, LogOut, UserCircle, ChevronLeft, ChevronRight, Plus, Zap, Monitor } from 'lucide-react'
import { useStats } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import Chatbot from './Chatbot'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users,           label: 'Employees' },
  { to: '/it-approvals', icon: Monitor,      label: 'IT Approvals', isIT: true },
  { to: '/hr-approvals', icon: UserCircle,   label: 'HR Approvals', isHR: true },
  { to: '/new',       icon: Plus,            label: 'New Employee',  accent: true },
  { to: '/workflows', icon: GitBranch,       label: 'Workflows' },
  { to: '/audit',     icon: Activity,        label: 'Audit Logs' },
]

export default function Layout({ children }) {
  const { data: stats } = useStats()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 72 : 250

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: sidebarWidth, 
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100, flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 12px 16px' : '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10, minHeight: 64,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(6,182,212,0.3)',
            flexShrink: 0,
          }}>
            <Zap size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', color: 'var(--text)' }}>OnboardFlow</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.5px' }}>TEMPORAL ENGINE</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
          {!collapsed && (
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text-dim)', padding: '0 10px', marginBottom: 8, textTransform: 'uppercase' }}>
              Navigation
            </div>
          )}
          {NAV.map(({ to, icon: Icon, label, badge, accent, isManager, isIT, isHR }) => {
            const isUserAManager = user?.email === 'sriharshanandiraju@gmail.com' || user?.email?.includes('manager');
            const isITAdmin = user?.email === 'harsha.ti.app' || user?.email === 'harsha.ti.app@gmail.com';
            const isHRAdmin = user?.email === 'harsha.hr.ti@gmail.com';
            
            if (isUserAManager && !isManager && !isIT && !isHR) return null;
            if (!isUserAManager && isManager) return null;
            if (isIT && !isITAdmin) return null;
            if (isHR && !isHRAdmin) return null;

            const pendingCount = badge === 'approvals' ? (stats?.waiting_approval || 0) : 0
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <NavLink
                key={to}
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px' : '9px 12px',
                  borderRadius: 8,
                  textDecoration: 'none', marginBottom: 2,
                  fontSize: 13, fontWeight: 500,
                  color: active ? 'var(--text)' : 'var(--text-secondary)',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderLeft: active ? '3px solid transparent' : '3px solid transparent',
                  backgroundImage: active ? 'none' : 'none',
                  position: 'relative',
                  transition: 'all 0.2s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  overflow: 'hidden',
                  ...(accent && !active ? { color: 'var(--accent-1)' } : {}),
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = accent ? 'var(--accent-1)' : 'var(--text-secondary)'
                  }
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3,
                    background: 'var(--gradient)', borderRadius: '0 2px 2px 0',
                  }} />
                )}
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                {!collapsed && pendingCount > 0 && (
                  <span style={{
                    background: 'var(--gradient)', color: '#fff',
                    borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                  }}>{pendingCount}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, width: '100%', padding: '8px',
              borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-muted)', fontSize: 12,
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
          </button>
        </div>

        {/* User Profile + Logout */}
        <div style={{
          padding: collapsed ? '12px 8px' : '12px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {user && !collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--border2)' }} />
              ) : (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--gradient)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                }}>
                  {user.full_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: '8px 10px', borderRadius: 8,
              border: 'none', background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'all 0.15s', width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <LogOut size={14} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <main style={{
        marginLeft: sidebarWidth, flex: 1,
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
        transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Topbar */}
        <header style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 28px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Gradient accent strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'var(--gradient)',
            opacity: 0.4,
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{
              fontFamily: 'var(--mono)',
              background: 'var(--green-dim)',
              color: 'var(--green)',
              padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
                boxShadow: '0 0 6px var(--green-glow)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              LIVE
            </span>
            <span style={{ color: 'var(--text-dim)' }}>Auto-refreshes every 5s</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)' }}>
            {stats && !user?.email?.includes('manager') && user?.email !== 'sriharshanandiraju@gmail.com' && <>
              <span><strong style={{ color: 'var(--text)' }}>{stats.total}</strong> total</span>
              <span><strong style={{ color: 'var(--blue)' }}>{stats.running}</strong> running</span>
              <span><strong style={{ color: 'var(--amber)' }}>{stats.waiting_approval}</strong> pending</span>
              <span><strong style={{ color: 'var(--green)' }}>{stats.completed}</strong> done</span>
            </>}
          </div>
        </header>

        <div style={{ flex: 1, padding: '28px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <Chatbot />
    </div>
  )
}
