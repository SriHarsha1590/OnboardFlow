import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, User, Building2, Briefcase, Monitor, ExternalLink, Users, ShieldCheck, Mail, Zap } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { employeeApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Avatar, Spinner, EmptyState, PageHeader, StatusBadge, MonoTag } from '../components/UI'

export default function Approvals() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
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
    fetchEmployees()
  }, [])

  const managerPending = employees.filter(emp => {
    return emp.workflow_status === 'WAITING_SIGNAL' && emp.current_step_index === 1
  })

  const itPending = employees.filter(emp => {
    return emp.workflow_status === 'WAITING_SIGNAL' && emp.current_step_index === 3
  })

  const hrPending = employees.filter(emp => {
    return emp.workflow_status === 'WAITING_SIGNAL' && emp.current_step_index === 5
  })

  const handleManagerApprove = async (empId, approved) => {
    setProcessing(p => ({ ...p, [empId]: true }))
    try {
      await employeeApi.approveManager(empId, {
        approved,
        approverEmail: user?.email || 'sriharshanandiraju@gmail.com',
        reason: approved ? 'Approved' : 'Rejected',
      })
      toast.success(approved
        ? '✅ Approved! Work email will be created, then IT approval will be awaited.'
        : '❌ Rejected. Workflow terminated.')
      
      setEmployees(prev => prev.filter(e => e.id !== empId))

      setTimeout(async () => {
        const res = await employeeApi.list({})
        setEmployees(res.data || [])
      }, 2000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(p => ({ ...p, [empId]: false }))
    }
  }

  const handleITApprove = async (empId, approved) => {
    setProcessing(p => ({ ...p, [`it-${empId}`]: true }))
    try {
      await employeeApi.approveIT(empId, {
        approved,
        approverEmail: user?.email || 'it@company.com',
        reason: approved ? 'Approved' : 'Rejected',
      })
      toast.success(approved
        ? '✅ Approved! Laptop provisioning will continue and HR approval will be requested.'
        : '❌ Rejected. Workflow terminated.')
      
      setEmployees(prev => prev.filter(e => e.id !== empId))

      setTimeout(async () => {
        const res = await employeeApi.list({})
        setEmployees(res.data || [])
      }, 2000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(p => ({ ...p, [`it-${empId}`]: false }))
    }
  }

  const handleHRApprove = async (empId, approved) => {
    setProcessing(p => ({ ...p, [`hr-${empId}`]: true }))
    try {
      await employeeApi.approveHR(empId, {
        approved,
        approverEmail: user?.email || 'hr@company.com',
        reason: approved ? 'Approved' : 'Rejected',
      })
      toast.success(approved
        ? '✅ Approved! Access, payroll, and final credentials email will continue.'
        : '❌ Rejected. Workflow terminated.')
      
      setEmployees(prev => prev.filter(e => e.id !== empId))

      setTimeout(async () => {
        const res = await employeeApi.list({})
        setEmployees(res.data || [])
      }, 2000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(p => ({ ...p, [`hr-${empId}`]: false }))
    }
  }

  const ACCENT_COLORS = {
    manager: 'var(--amber)',
    it: 'var(--purple)',
    hr: 'var(--blue)',
  }

  const renderApprovalCard = (emp, approvalType) => {
    const isIT = approvalType === 'it'
    const isHR = approvalType === 'hr'
    const isPending = isIT
      ? itPending.some(e => e.id === emp.id)
      : isHR
        ? hrPending.some(e => e.id === emp.id)
        : managerPending.some(e => e.id === emp.id)

    if (!isPending) return null

    const accent = ACCENT_COLORS[approvalType]

    return (
      <Card key={emp.id} style={{
        padding: 24,
        borderLeft: `3px solid ${accent}`,
        animation: 'fadeIn 0.4s ease forwards',
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Left: employee info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <Avatar name={emp.name} size={44} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{emp.email}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <StatusBadge status={emp.workflow_status} size="sm" />
                  <MonoTag>{emp.workflow_id}</MonoTag>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: Building2, label: 'Department', value: emp.department },
                { icon: Briefcase, label: 'Role', value: emp.role },
                { icon: User, label: 'Manager', value: emp.manager || 'Pending' },
                { icon: Monitor, label: 'Laptop', value: emp.laptop_model || 'TBD' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8, border: '1px solid var(--border)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: 4,
                  }}>
                    <Icon size={10} /> {label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
              Waiting for {isIT ? 'IT approval' : isHR ? 'HR approval' : 'manager approval'} {emp.workflow_started ? formatDistanceToNow(new Date(emp.workflow_started), { addSuffix: true }) : '—'}
            </div>

            {/* Email Preview (Manager only) */}
            {!isIT && !isHR && (
              <div style={{
                marginTop: 18, padding: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 12, fontSize: 13, color: 'var(--text-secondary)',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--accent-1)',
                  textTransform: 'uppercase', marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Mail size={12} /> Email Notification Preview
                </div>
                <div>
                  <p>Dear <strong style={{ color: 'var(--text)' }}>{emp.name}</strong>,</p>
                  <p>We are pleased to inform you that your joining request has been reviewed and approved by management.</p>
                  <p>Welcome to the team. We are excited to have you onboard...</p>
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--border2)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>Best Regards,</div>
                    <div style={{ color: 'var(--accent-1)', fontWeight: 600 }}>{user?.full_name || emp.manager}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.role || 'Reporting Manager'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            <Button
              variant="success"
              size="lg"
              loading={processing[isIT ? `it-${emp.id}` : isHR ? `hr-${emp.id}` : emp.id]}
              icon={<CheckCircle2 size={16} />}
              onClick={() => isIT ? handleITApprove(emp.id, true) : isHR ? handleHRApprove(emp.id, true) : handleManagerApprove(emp.id, true)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              loading={processing[isIT ? `it-${emp.id}` : isHR ? `hr-${emp.id}` : emp.id]}
              icon={<XCircle size={14} />}
              onClick={() => isIT ? handleITApprove(emp.id, false) : isHR ? handleHRApprove(emp.id, false) : handleManagerApprove(emp.id, false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Reject
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink size={12} />}
              onClick={() => navigate(`/employees/${emp.id}`)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <Spinner size={32} />
      </div>
    )
  }

  const isManager = user?.email === 'sriharshanandiraju@gmail.com' || user?.email?.includes('manager');
  const isPublic = !user;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Gradient accent strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--gradient)', opacity: 0.5,
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(6,182,212,0.25)',
          }}>
            <Zap size={16} color="#fff" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            OnboardFlow <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>| Approvals</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {!isPublic && !isManager && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>Dashboard</Button>
          )}
          {isPublic ? (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user.full_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <Avatar name={user.full_name} size={32} />
            </div>
          )}
        </div>
      </header>

      <div style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }} className="animate-in">
        <PageHeader
          title="Approvals Dashboard"
          subtitle={
            managerPending.length + itPending.length + hrPending.length > 0
              ? `${managerPending.length} manager · ${itPending.length} IT · ${hrPending.length} HR pending`
              : 'No pending approvals'
          }
        />

        {/* Tabs */}
        {!isManager && !isPublic && (
          <div style={{
            display: 'flex', gap: 4, marginBottom: 24, paddingBottom: 12,
            borderBottom: '1px solid var(--border)',
          }}>
            {[
              { id: 'all', label: `All (${managerPending.length + itPending.length + hrPending.length})`, icon: Clock },
              { id: 'manager', label: `Manager (${managerPending.length})`, icon: User },
              { id: 'it', label: `IT (${itPending.length})`, icon: Users },
              { id: 'hr', label: `HR (${hrPending.length})`, icon: ShieldCheck },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid transparent' : '2px solid transparent',
                  backgroundImage: activeTab === tab.id ? 'var(--gradient)' : 'none',
                  WebkitBackgroundClip: activeTab === tab.id ? 'text' : 'unset',
                  WebkitTextFillColor: activeTab === tab.id ? 'transparent' : 'unset',
                  backgroundClip: activeTab === tab.id ? 'text' : 'unset',
                  color: activeTab === tab.id ? 'var(--accent-1)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font)',
                  position: 'relative',
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div style={{
                    position: 'absolute', bottom: -14, left: 0, right: 0, height: 2,
                    background: 'var(--gradient)', borderRadius: 1,
                  }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {managerPending.length === 0 && (itPending.length === 0 || isManager || isPublic) && (hrPending.length === 0 || isManager || isPublic) ? (
          <EmptyState
            icon="✅"
            title="All clear!"
            description="No workflows are currently awaiting your approval."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(activeTab === 'all' || activeTab === 'manager' || isManager || isPublic) && (
              <>
                {managerPending.length > 0 && (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      color: 'var(--text-dim)', letterSpacing: '1px', marginTop: 8, marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--amber)' }} />
                      Manager Approvals
                    </div>
                    {managerPending.map(emp => renderApprovalCard(emp, 'manager'))}
                  </>
                )}
              </>
            )}

            {!isManager && !isPublic && (activeTab === 'all' || activeTab === 'it') && (
              <>
                {itPending.length > 0 && (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      color: 'var(--text-dim)', letterSpacing: '1px', marginTop: 16, marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--purple)' }} />
                      IT Approvals
                    </div>
                    {itPending.map(emp => renderApprovalCard(emp, 'it'))}
                  </>
                )}
              </>
            )}

            {!isManager && !isPublic && (activeTab === 'all' || activeTab === 'hr') && (
              <>
                {hrPending.length > 0 && (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      color: 'var(--text-dim)', letterSpacing: '1px', marginTop: 16, marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--blue)' }} />
                      HR Approvals
                    </div>
                    {hrPending.map(emp => renderApprovalCard(emp, 'hr'))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
