import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ExternalLink, Trash2 } from 'lucide-react'
import { employeeApi } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { useEmployees } from '../hooks/useData'
import { StatusBadge, ProgressBar, Card, Button, Avatar, PageHeader, Spinner, EmptyState } from '../components/UI'
import toast from 'react-hot-toast'

const DEPTS = [
  'All',
  'Executive Leadership',
  'Operations',
  'Delivery / Client Success',
  'Engineering / Product Development',
  'QA / Testing',
  'DevOps / Cloud / SRE',
  'Data / AI / Analytics',
  'Cybersecurity',
  'Product / Business Analysis / UX',
  'Sales / Business Development',
  'HR / Recruitment / L&D',
  'Finance / Legal / Procurement',
  'IT Support / Internal IT',
  'Admin / Facilities',
]
const STATUSES = ['All', 'RUNNING', 'WAITING_SIGNAL', 'COMPLETED', 'FAILED']

export default function Employees() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const { data, loading, refetch } = useEmployees({
    search: search || undefined,
    department: dept !== 'All' ? dept : undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
  })

  const handleDelete = async (e, id, name) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete ${name}? This will remove all their workflow data and history.`)) {
      return
    }

    try {
      await employeeApi.delete(id)
      toast.success(`${name} has been removed.`)
      refetch()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="Employees"
        subtitle={`${data.length} employee${data.length !== 1 ? 's' : ''} in the system`}
        action={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/new')}>
            New Employee
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employees..."
            style={{
              width: '100%', padding: '9px 14px 9px 34px',
              border: '1px solid var(--border2)', borderRadius: 8,
              fontSize: 13, fontFamily: 'var(--font)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
              outline: 'none', transition: 'all 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-1)'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {DEPTS.map(d => (
            <button key={d} onClick={() => setDept(d)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              fontFamily: 'var(--font)', cursor: 'pointer',
              border: '1px solid',
              background: dept === d ? 'var(--gradient)' : 'rgba(255,255,255,0.04)',
              color: dept === d ? '#fff' : 'var(--text-secondary)',
              borderColor: dept === d ? 'transparent' : 'var(--border)',
              transition: 'all 0.15s',
            }}>{d}</button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 32px 8px 12px', border: '1px solid var(--border2)',
            borderRadius: 8, fontSize: 12, fontFamily: 'var(--font)',
            background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
            cursor: 'pointer', outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 50, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : data.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No employees found"
            description={search ? `No results for "${search}"` : 'Start by adding your first employee'}
            action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/new')}>Add Employee</Button>}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employee', 'Department', 'Role', 'Workflow ID', 'Status', 'Progress', 'Manager', 'Started', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 14px',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.8px',
                    textTransform: 'uppercase', color: 'var(--text-dim)',
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.02)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((emp, idx) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  style={{
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'background 0.15s',
                    animation: `fadeIn 0.3s ease ${idx * 0.03}s forwards`,
                    opacity: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar name={emp.name} size={30} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{emp.department}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{emp.role}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>{emp.workflow_id || '—'}</td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={emp.workflow_status} size="sm" /></td>
                  <td style={{ padding: '11px 14px', width: 110 }}>
                    <ProgressBar value={emp.current_step_index || 0} max={7} showLabel />
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{emp.manager}</td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {emp.workflow_started ? formatDistanceToNow(new Date(emp.workflow_started), { addSuffix: true }) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ExternalLink size={13} color="var(--text-muted)" />
                    <button
                      onClick={(e) => handleDelete(e, emp.id, emp.name)}
                      style={{
                        border: 'none', background: 'none', padding: 4,
                        cursor: 'pointer', color: 'var(--text-muted)',
                        transition: 'color 0.2s', display: 'flex',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Delete Employee"
                    >
                      <Trash2 size={13} />
                    </button>
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
