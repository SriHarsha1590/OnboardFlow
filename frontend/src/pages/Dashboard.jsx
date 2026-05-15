import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, CheckCircle2, Clock, Plus, ArrowRight, TrendingUp, Zap } from 'lucide-react'
import { useStats, useEmployees } from '../hooks/useData'
import { StatusBadge, ProgressBar, Card, Button, Avatar, PageHeader, Spinner, EmptyState } from '../components/UI'
import { formatDistanceToNow } from 'date-fns'

const STAT_CONFIGS = [
  { key: 'total',           label: 'Total Employees', icon: Users,        color: 'var(--accent-1)', gradFrom: 'rgba(6,182,212,0.15)',  gradTo: 'rgba(6,182,212,0.03)',   sub: 'All time' },
  { key: 'running',         label: 'Active Workflows', icon: Activity,    color: 'var(--blue)',      gradFrom: 'rgba(59,130,246,0.15)', gradTo: 'rgba(59,130,246,0.03)', sub: 'Currently running' },
  { key: 'completed',       label: 'Onboarded',        icon: CheckCircle2, color: 'var(--green)',    gradFrom: 'rgba(16,185,129,0.15)', gradTo: 'rgba(16,185,129,0.03)', sub: 'Workflow complete' },
  { key: 'waiting_approval', label: 'Pending Approval', icon: Clock,      color: 'var(--amber)',    gradFrom: 'rgba(245,158,11,0.15)', gradTo: 'rgba(245,158,11,0.03)', sub: 'Awaiting signal' },
]

function StatCard({ label, value, icon: Icon, color, gradFrom, gradTo, sub }) {
  return (
    <Card style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow background */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${gradFrom}, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-1.5px' }}>
            {value ?? <div className="skeleton" style={{ width: 48, height: 36 }} />}
          </div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, fontFamily: 'var(--mono)' }}>{sub}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}22`,
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useStats()
  const { data: employees, loading } = useEmployees()
  const navigate = useNavigate()

  const recent = employees.slice(0, 8)

  return (
    <div className="animate-in">
      <PageHeader
        title="Dashboard"
        subtitle="Live onboarding workflow visibility powered by Temporal"
        action={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/new')}>
            New Employee
          </Button>
        }
      />

      {/* Temporal info strip */}
      <div style={{
        background: 'rgba(6,182,212,0.06)',
        border: '1px solid rgba(6,182,212,0.12)',
        borderRadius: 10, padding: '10px 18px', marginBottom: 22,
        fontSize: 12, color: 'var(--accent-1)', fontFamily: 'var(--mono)',
        display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={12} /> Temporal: <strong>localhost:7233</strong>
        </span>
        <span>📋 Task Queue: <strong>onboarding-queue</strong></span>
        <span>🌐 Namespace: <strong>default</strong></span>
        <span>🔄 Worker: <strong>onboarding-worker-01</strong></span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {STAT_CONFIGS.map(cfg => (
          <StatCard key={cfg.key} {...cfg} value={stats?.[cfg.key] ?? '—'} />
        ))}
      </div>

      {/* Recent employees table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Recent Employees
          </div>
          <Button size="sm" onClick={() => navigate('/employees')} icon={<ArrowRight size={12} />}>
            View all
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: 50, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon="👋"
            title="No employees yet"
            description="Start by onboarding your first employee"
            action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/new')}>Add Employee</Button>}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employee', 'Department', 'Workflow ID', 'Current Step', 'Status', 'Progress', 'Started'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 16px',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.8px',
                    textTransform: 'uppercase', color: 'var(--text-dim)',
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.02)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((emp, idx) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                    animation: `fadeIn 0.3s ease ${idx * 0.04}s forwards`,
                    opacity: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={emp.name} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{emp.department}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>{emp.workflow_id || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-secondary)' }}>
                    {emp.current_step || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={emp.workflow_status} />
                  </td>
                  <td style={{ padding: '12px 16px', width: 120 }}>
                    <ProgressBar value={emp.current_step_index || 0} max={8} showLabel />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                    {emp.workflow_started ? formatDistanceToNow(new Date(emp.workflow_started), { addSuffix: true }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
