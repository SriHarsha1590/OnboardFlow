import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Monitor, ShieldCheck, Mail, Zap, Laptop, Terminal, Cpu, HardDrive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import { employeeApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Avatar, Spinner, EmptyState, PageHeader, StatusBadge, MonoTag } from '../components/UI'

export default function ITApprovals() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})
  const navigate = useNavigate()

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await employeeApi.list({})
      setEmployees(res.data || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Filter for IT pending: WAITING_SIGNAL and current_step_index === 3
  const itPending = employees.filter(emp => {
    return emp.workflow_status === 'WAITING_SIGNAL' && emp.current_step_index === 3
  })

  const handleITApprove = async (empId, approved) => {
    setProcessing(p => ({ ...p, [empId]: true }))
    try {
      await employeeApi.approveIT(empId, {
        approved,
        approverEmail: user?.email || 'harsha.ti.app',
        reason: approved ? 'IT Review Complete - Hardware Provisioned' : 'IT Requirements Not Met',
      })
      toast.success(approved
        ? '✅ IT Approval recorded. Laptop provisioning sequence triggered.'
        : '❌ IT Rejection recorded. Workflow halted.')
      
      // Optimistic update
      setEmployees(prev => prev.filter(e => e.id !== empId))
      
      // Refresh after a delay to catch state changes
      setTimeout(fetchEmployees, 2000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(p => ({ ...p, [empId]: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="IT Operations Dashboard"
        subtitle="Hardware provisioning and system access appraisals"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Card style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--purple-dim)', borderColor: 'rgba(139,92,246,0.2)' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', boxShadow: '0 0 8px var(--purple)' }} />
               <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--mono)' }}>QUEUE: IT_PROVISIONING</span>
            </Card>
          </div>
        }
      />

      {/* IT Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
            <Monitor size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hardware Pending</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{itPending.length}</div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>IAM Ready</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
               {employees.filter(e => e.current_step_index > 3).length}
            </div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Average Turnaround</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>1.2h</div>
          </div>
        </Card>
      </div>

      {itPending.length === 0 ? (
        <EmptyState
          icon={<Terminal size={40} />}
          title="IT Queue Clear"
          description="No employees are currently awaiting hardware appraisal or provisioning."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {itPending.map(emp => (
            <Card key={emp.id} style={{
              padding: 24,
              borderLeft: `4px solid var(--purple)`,
              animation: 'fadeIn 0.4s ease forwards',
            }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Profile */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                    <Avatar name={emp.name} size={48} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>{emp.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{emp.role} · {emp.department}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <StatusBadge status="WAITING_SIGNAL" size="sm" />
                        <MonoTag>{emp.workflow_id}</MonoTag>
                      </div>
                    </div>
                  </div>

                  {/* IT Specs Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={styles.specItem}>
                      <div style={styles.specLabel}><Laptop size={12} /> Requested Hardware</div>
                      <div style={styles.specValue}>{emp.laptop_model || 'Standard Issue'}</div>
                    </div>
                    <div style={styles.specItem}>
                      <div style={styles.specLabel}><Cpu size={12} /> OS Image</div>
                      <div style={styles.specValue}>Enterprise-v2.4 (Latest)</div>
                    </div>
                    <div style={styles.specItem}>
                      <div style={styles.specLabel}><HardDrive size={12} /> Storage</div>
                      <div style={styles.specValue}>512GB SSD / Encrypted</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> Requested {emp.workflow_started ? formatDistanceToNow(new Date(emp.workflow_started), { addSuffix: true }) : '—'}
                  </div>
                </div>

                {/* IT Actions */}
                <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Appraisal Action</div>
                   <Button
                    variant="primary"
                    size="lg"
                    loading={processing[emp.id]}
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => handleITApprove(emp.id, true)}
                    style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}
                  >
                    Approve & Provision
                  </Button>
                  <Button
                    variant="danger"
                    loading={processing[emp.id]}
                    icon={<XCircle size={14} />}
                    onClick={() => handleITApprove(emp.id, false)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Flag for Review
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={12} />}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View System Profile
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  specItem: {
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    border: '1px solid var(--border)',
    transition: 'border-color 0.2s',
  },
  specLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 6,
  },
  specValue: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
  },
}

function ExternalLink({ size, color }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function Clock({ size, color }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
