import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import api from '../api/client'
import { Card, Button, Spinner, PageHeader, MonoTag } from '../components/UI'

const ACTION_COLORS = {
  EMPLOYEE_CREATED:     { bg: 'var(--cyan-dim)',   color: 'var(--cyan)' },
  WORKFLOW_INITIALIZED: { bg: 'var(--purple-dim)', color: 'var(--purple)' },
  APPROVED:             { bg: 'var(--green-dim)',  color: 'var(--green)' },
  REJECTED:             { bg: 'var(--pink-dim)',   color: 'var(--pink)' },
  EMAIL_CREATED:        { bg: 'var(--blue-dim)',   color: 'var(--blue)' },
  LAPTOP_PROVISIONED:   { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
  ACCESS_CREATED:       { bg: 'var(--blue-dim)',   color: 'var(--blue)' },
  PAYROLL_NOTIFIED:     { bg: 'var(--green-dim)',  color: 'var(--green)' },
  WELCOME_EMAIL_SENT:   { bg: 'var(--green-dim)',  color: 'var(--green)' },
  MANAGER_REMINDED:     { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
}

const DEFAULT_ACTION = { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const empsRes = await api.get('/employees')
      const employees = empsRes.data || []

      const allLogs = []
      for (const emp of employees.slice(0, 20)) {
        const logsRes = await api.get(`/employees/${emp.id}/logs`)
        const enriched = (logsRes.data || []).map(l => ({ ...l, employeeName: emp.name }))
        allLogs.push(...enriched)
      }
      allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setLogs(allLogs.slice(0, 100))
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  return (
    <div className="animate-in">
      <PageHeader
        title="Audit Logs"
        subtitle="Full activity log for all onboarding workflows"
        action={
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            icon={<RefreshCw size={13} />}
            onClick={() => fetchAll(true)}
          >
            Refresh
          </Button>
        }
      />

      <Card style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
            No audit logs yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time', 'Employee', 'Action', 'Actor', 'Details'].map(h => (
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
              {logs.map((log, idx) => {
                const ac = ACTION_COLORS[log.action] || DEFAULT_ACTION
                return (
                  <tr key={log.id} style={{
                    borderBottom: '1px solid var(--border)',
                    animation: `fadeIn 0.3s ease ${idx * 0.02}s forwards`,
                    opacity: 0,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {format(new Date(log.created_at), 'HH:mm:ss dd MMM')}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                      {log.employeeName || '—'}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px', borderRadius: 6,
                        fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)',
                        background: ac.bg, color: ac.color,
                        border: `1px solid ${ac.color}22`,
                        letterSpacing: '0.3px',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                      {log.actor}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)', maxWidth: 300 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
