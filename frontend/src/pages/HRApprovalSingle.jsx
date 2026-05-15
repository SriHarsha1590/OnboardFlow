import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, ShieldCheck, User, Building2, Briefcase, Mail, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import { employeeApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Avatar, Spinner, PageHeader, StatusBadge, MonoTag } from '../components/UI'

export default function HRApprovalSingle() {
  const { employeeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true)
        const res = await employeeApi.get(employeeId)
        setEmp(res.data)
      } catch (err) {
        toast.error('Failed to load employee details for HR approval')
      } finally {
        setLoading(false)
      }
    }
    fetchEmployee()
  }, [employeeId])

  const handleHRApprove = async (approved) => {
    setProcessing(true)
    try {
      await employeeApi.approveHR(emp.id, {
        approved,
        approverEmail: user?.email || 'hr@company.com',
        reason: approved ? 'Approved by HR' : 'Rejected by HR',
      })
      toast.success(approved
        ? '✅ HR Final Approval completed! Welcome email will be sent.'
        : '❌ Rejected. Workflow terminated.')
      
      setEmp(prev => ({ ...prev, workflow_status: approved ? 'COMPLETED' : 'REJECTED' }))
      
      setTimeout(() => {
        navigate('/hr-approvals')
      }, 1500)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!emp) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <h2>Employee Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/hr-approvals')}>Back to Dashboard</Button>
      </div>
    )
  }

  const isPending = emp.workflow_status === 'WAITING_SIGNAL' && emp.current_step_index === 5

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(6,182,212,0.25)',
          }}>
            <ShieldCheck size={16} color="#fff" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            HR Final Review <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>| Approval</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/hr-approvals')}>All Approvals</Button>
        </div>
      </header>

      <div style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto' }} className="animate-in">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/hr-approvals')} style={{ marginBottom: 20 }}>
          Back to list
        </Button>

        <PageHeader
          title="Review Final HR Request"
          subtitle="Please review the employee details before giving final HR approval."
        />

        <Card style={{
          padding: 24,
          borderLeft: `3px solid var(--blue)`,
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                <Avatar name={emp.name} size={56} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{emp.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{emp.email}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <StatusBadge status={emp.workflow_status} size="sm" />
                    <MonoTag>{emp.workflow_id}</MonoTag>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { icon: Building2, label: 'Department', value: emp.department },
                  { icon: Briefcase, label: 'Role', value: emp.role },
                  { icon: User, label: 'Manager', value: emp.manager || 'Pending' },
                  { icon: Mail, label: 'Corporate Email', value: emp.work_email || 'TBD' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{
                    padding: '12px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8, border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: 6,
                    }}>
                      <Icon size={12} /> {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {isPending ? (
              <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(6,182,212,0.03)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>
                  Action Required
                </div>
                <Button
                  variant="success"
                  size="lg"
                  loading={processing}
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => handleHRApprove(true)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Approve Final HR
                </Button>
                <Button
                  variant="danger"
                  loading={processing}
                  icon={<XCircle size={14} />}
                  onClick={() => handleHRApprove(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Reject Request
                </Button>
              </div>
            ) : (
              <div style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 12, border: '1px dashed var(--border)' }}>
                <CheckCircle2 size={32} color="var(--text-dim)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', textAlign: 'center' }}>
                  No longer pending HR approval.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
