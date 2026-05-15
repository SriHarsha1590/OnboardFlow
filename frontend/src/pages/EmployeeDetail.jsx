import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CheckCircle2, XCircle, Calendar, Building2, Monitor, MapPin, User, Clock, Trash2, Mail, Key, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { useEmployee } from '../hooks/useData'
import { employeeApi } from '../api/client'
import { StatusBadge, ProgressBar, Card, Button, Avatar, Spinner, MonoTag, PageHeader } from '../components/UI'
import WorkflowTimeline from '../components/WorkflowTimeline'

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 130, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: 'var(--text-dim)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {Icon && <Icon size={12} />} {label}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{value || '—'}</div>
    </div>
  )
}

function ApprovalCard({ title, approval, accentColor }) {
  if (!approval) return null
  const statusColors = {
    APPROVED: { bg: 'var(--green-dim)', color: 'var(--green)' },
    REJECTED: { bg: 'var(--pink-dim)', color: 'var(--pink)' },
    PENDING: { bg: 'var(--amber-dim)', color: 'var(--amber)' },
  }
  const sc = statusColors[approval.status] || statusColors.PENDING

  return (
    <div style={{
      padding: 14, background: 'rgba(255,255,255,0.02)',
      borderRadius: 10, border: `1px solid var(--border)`,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Clock size={14} color={accentColor} />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: sc.bg, color: sc.color,
        }}>
          {approval.status}
        </div>
      </div>
      {approval.approver_name && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {approval.approver_name}</div>
      )}
      {approval.reason && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{approval.reason}</div>
      )}
    </div>
  )
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: emp, loading, refetch } = useEmployee(id)
  const [approving, setApproving] = useState(false)
  
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${emp.name}? This action cannot be undone.`)) return
    
    setApproving(true)
    try {
      await employeeApi.delete(id)
      toast.success('Employee deleted successfully')
      navigate('/employees')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setApproving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>
  )

  if (!emp) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Employee not found</div>
  )

  const stepIndex = emp.current_step_index || 0
  const pct = emp.workflow_status === 'COMPLETED' ? 100 : Math.round((stepIndex / 8) * 100)

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar name={emp.name} size={56} />
          <div>
            <h1 style={{
              fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{emp.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{emp.role} · {emp.department}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <StatusBadge status={emp.workflow_status} />
              <MonoTag>{emp.workflow_id}</MonoTag>
              {emp.employee_id && <MonoTag color="var(--accent-1)">{emp.employee_id}</MonoTag>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            icon={<RefreshCw size={14} />}
            onClick={() => {
              refetch();
              toast.success('Refreshing data...');
            }}
          >
            Refresh
          </Button>
          {emp.workflow_status === 'COMPLETED' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Mail size={14} />}
              onClick={() => navigate(`/onboarding-portal/${id}`)}
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              Onboarding Portal
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            loading={approving}
            icon={<Trash2 size={14} />}
            onClick={handleDelete}
          >
            Delete Employee
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card style={{ padding: '18px 22px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Onboarding Progress</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{pct}% complete</span>
        </div>
        <ProgressBar value={stepIndex} max={8} height={8} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--mono)' }}>
          Current step: {emp.current_step || 'Not started'}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Employee info + Approval + Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>Employee Details</div>
            <InfoRow label="Full Name" value={emp.name} icon={User} />
            <InfoRow label="Personal Email" value={emp.email} icon={Mail} />
            <InfoRow label="Work Email" value={emp.work_email} icon={Mail} />
            <InfoRow label="Temp Password" value={emp.temporary_password} icon={Key} />
            <InfoRow label="Department" value={emp.department} icon={Building2} />
            <InfoRow label="Role" value={emp.role} />
            <InfoRow label="Manager" value={emp.manager} icon={User} />
            <InfoRow label="Joining Date" value={emp.joining_date ? format(new Date(emp.joining_date), 'dd MMM yyyy') : '—'} icon={Calendar} />
            <InfoRow label="Laptop" value={emp.laptop_model} icon={Monitor} />
            <InfoRow label="Office" value={emp.office_location} icon={MapPin} />
            <InfoRow label="Employee ID" value={emp.employee_id} />
          </Card>

          {/* Approval Status */}
          {emp.approvalStatus && (emp.approvalStatus.managerApproval || emp.approvalStatus.itApproval || emp.approvalStatus.hrApproval) && (
            <Card style={{ padding: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>Approvals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ApprovalCard title="Manager Approval" approval={emp.approvalStatus.managerApproval} accentColor="var(--amber)" />
                <ApprovalCard title="IT Approval" approval={emp.approvalStatus.itApproval} accentColor="var(--purple)" />
                <ApprovalCard title="HR Approval" approval={emp.approvalStatus.hrApproval} accentColor="var(--blue)" />
              </div>
            </Card>
          )}

          {/* Audit Logs */}
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>Audit Log</div>
            {(emp.auditLogs || []).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>No logs yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(emp.auditLogs || []).map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--gradient)', marginTop: 4, flexShrink: 0,
                      boxShadow: '0 0 6px rgba(6,182,212,0.3)',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{log.action}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>by {log.actor} · {format(new Date(log.created_at), 'HH:mm:ss dd MMM')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Workflow Timeline */}
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 16 }}>
            Workflow Timeline
          </div>
          <div style={{
            marginBottom: 14, padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            run-id: {emp.run_id || 'pending'}<br />
            task-queue: onboarding-queue
          </div>
          <WorkflowTimeline
            stepIndex={stepIndex}
            workflowStatus={emp.workflow_status}
            activities={emp.activities || []}
          />
        </Card>
      </div>
    </div>
  )
}
