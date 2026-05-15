import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, ShieldCheck, Mail, Zap, UserCheck, Briefcase, FileText, ExternalLink, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import { employeeApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Avatar, Spinner, EmptyState, PageHeader, StatusBadge, MonoTag } from '../components/UI'

export default function HRApprovals() {
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

  // Filter for HR pending: WAITING_SIGNAL and current_step_index === 5
  const hrPending = employees.filter(emp => {
    return emp.workflow_status === 'WAITING_SIGNAL' && emp.current_step_index === 5
  })

  const handleHRApprove = async (empId, approved) => {
    setProcessing(p => ({ ...p, [empId]: true }))
    try {
      await employeeApi.approveHR(empId, {
        approved,
        approverEmail: user?.email || 'harsha.hr.ti@gmail.com',
        reason: approved ? 'HR Final Review Complete - Ready for Onboarding' : 'HR Policy Compliance Issue',
      })
      toast.success(approved
        ? '✅ HR Final Approval recorded. Welcome email and access rights triggered.'
        : '❌ HR Rejection recorded. Workflow halted.')
      
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
        title="HR Administrative Dashboard"
        subtitle="Final employee vetting and onboarding authorization"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Card style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue-dim)', borderColor: 'rgba(59,130,246,0.2)' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 8px var(--blue)' }} />
               <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>QUEUE: FINAL_HR_REVIEW</span>
            </Card>
          </div>
        }
      />

      {/* HR Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vetting Pending</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{hrPending.length}</div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
            <Briefcase size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Onboardings</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
               {employees.filter(e => e.workflow_status === 'RUNNING' || e.workflow_status === 'WAITING_SIGNAL').length}
            </div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ready for Welcome</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {employees.filter(e => e.current_step_index === 8).length}
            </div>
          </div>
        </Card>
      </div>

      {hrPending.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={40} />}
          title="HR Queue Clear"
          description="No employees are currently awaiting final HR vetting or authorization."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {hrPending.map(emp => (
            <Card key={emp.id} style={{
              padding: 24,
              borderLeft: `4px solid var(--blue)`,
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

                  {/* HR Review Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={styles.specItem}>
                      <div style={styles.specLabel}><Mail size={12} /> Work Email Created</div>
                      <div style={styles.specValue}>{emp.work_email || 'Awaiting IT Approval'}</div>
                    </div>
                    <div style={styles.specItem}>
                      <div style={styles.specLabel}><ShieldCheck size={12} /> Background Check</div>
                      <div style={styles.specValue}>Verified (System Auto)</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> Pending Final Approval for {emp.workflow_started ? formatDistanceToNow(new Date(emp.workflow_started), { addSuffix: true }) : '—'}
                  </div>
                </div>

                {/* HR Actions */}
                <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Administrative Action</div>
                   <Button
                    variant="primary"
                    size="lg"
                    loading={processing[emp.id]}
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => handleHRApprove(emp.id, true)}
                    style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                  >
                    Authorize Onboarding
                  </Button>
                  <Button
                    variant="danger"
                    loading={processing[emp.id]}
                    icon={<XCircle size={14} />}
                    onClick={() => handleHRApprove(emp.id, false)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Hold Onboarding
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={12} />}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Full Profile
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
