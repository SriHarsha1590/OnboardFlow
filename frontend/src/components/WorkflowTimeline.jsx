import React from 'react'
import { CheckCircle2, Circle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { MonoTag } from './UI'

const ACTIVITY_DEFS = [
  { key: 'initializeOnboarding',    label: 'Initialize Onboarding',     desc: 'Creates employee record, assigns employee ID' },
  { key: 'waitForManagerApproval',  label: 'Manager Approval',           desc: 'Waits for manager signal — durable pause' },
  { key: 'createEmailAccount',      label: 'Email & Credentials',        desc: 'Generates work email and sends credentials to personal mail' },
  { key: 'waitForITApproval',       label: 'IT Approval',                desc: 'Waits for IT approval for laptop provisioning' },
  { key: 'provisionLaptop',         label: 'Provision Laptop',           desc: 'Creates IT ticket, assigns device' },
  { key: 'waitForHRApproval',       label: 'HR Approval',                desc: 'Waits for HR approval for access and payroll' },
  { key: 'createAccessRights',      label: 'Create Access Rights',       desc: 'Sets up IAM groups, VPN, MFA' },
  { key: 'notifyPayroll',           label: 'Notify Payroll',             desc: 'Registers employee in payroll system' },
  { key: 'sendWelcomeEmail',        label: 'Onboarding Complete',        desc: 'Final confirmation and welcome to the organization' },
]

function getActivityStatus(def, stepIndex, workflowStatus, activities = []) {
  const recorded = activities.find(a => a.activity_name === def.key)
  if (recorded) return recorded.status

  const defIndex = ACTIVITY_DEFS.findIndex(d => d.key === def.key)

  if (workflowStatus === 'COMPLETED') return 'COMPLETED'
  if (workflowStatus === 'FAILED' || workflowStatus === 'REJECTED') {
    if (defIndex < stepIndex) return 'COMPLETED'
    if (defIndex === stepIndex) return 'FAILED'
    return 'PENDING'
  }
  if (defIndex < stepIndex) return 'COMPLETED'
  if (defIndex === stepIndex) return workflowStatus === 'WAITING_SIGNAL' ? 'WAITING_SIGNAL' : 'RUNNING'
  return 'PENDING'
}

function ActivityIcon({ status }) {
  const s = { width: 20, height: 20 }
  if (status === 'COMPLETED')      return <CheckCircle2 {...s} color="var(--green)" />
  if (status === 'RUNNING')        return <Loader2 {...s} color="var(--accent-1)" style={{ animation: 'spin 1s linear infinite' }} />
  if (status === 'WAITING_SIGNAL') return <Clock {...s} color="var(--amber)" />
  if (status === 'FAILED')         return <XCircle {...s} color="var(--red)" />
  if (status === 'REJECTED')       return <XCircle {...s} color="var(--pink)" />
  return <Circle {...s} color="var(--text-dim)" />
}

function lineColor(status) {
  if (status === 'COMPLETED') return 'var(--green)'
  return 'var(--border)'
}

function statusBg(status) {
  if (status === 'COMPLETED')      return 'rgba(16,185,129,0.06)'
  if (status === 'RUNNING')        return 'rgba(6,182,212,0.06)'
  if (status === 'WAITING_SIGNAL') return 'rgba(245,158,11,0.06)'
  if (status === 'FAILED' || status === 'REJECTED') return 'rgba(239,68,68,0.06)'
  return 'transparent'
}

function statusGlow(status) {
  if (status === 'COMPLETED')      return '0 0 8px rgba(16,185,129,0.1)'
  if (status === 'RUNNING')        return '0 0 12px rgba(6,182,212,0.15)'
  if (status === 'WAITING_SIGNAL') return '0 0 8px rgba(245,158,11,0.1)'
  return 'none'
}

export default function WorkflowTimeline({ stepIndex = 0, workflowStatus = 'PENDING', activities = [], compact = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {ACTIVITY_DEFS.map((def, i) => {
        const status = getActivityStatus(def, stepIndex, workflowStatus, activities)
        const recorded = activities.find(a => a.activity_name === def.key)
        const retries = recorded?.retry_count || 0
        const isLast = i === ACTIVITY_DEFS.length - 1
        const isActive = status === 'RUNNING' || status === 'WAITING_SIGNAL'

        return (
          <div key={def.key} style={{ display: 'flex', gap: 14 }}>
            {/* Line + icon column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                padding: '3px 0',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: -4,
                    borderRadius: '50%',
                    border: `2px solid ${status === 'RUNNING' ? 'var(--accent-1)' : 'var(--amber)'}`,
                    animation: 'pulseRing 2s ease-out infinite',
                    opacity: 0.4,
                  }} />
                )}
                <ActivityIcon status={status} />
              </div>
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: compact ? 12 : 18,
                  background: status === 'COMPLETED'
                    ? 'linear-gradient(180deg, var(--green), rgba(16,185,129,0.3))'
                    : 'var(--border)',
                  borderRadius: 1,
                  margin: '3px 0',
                  transition: 'background 0.5s ease',
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{
              flex: 1, paddingBottom: isLast ? 0 : compact ? 8 : 14,
              paddingTop: 1,
            }}>
              <div style={{
                background: statusBg(status),
                borderRadius: 'var(--radius-sm)',
                padding: compact ? '7px 12px' : '10px 14px',
                marginBottom: isLast ? 0 : 2,
                border: isActive ? `1px solid ${status === 'RUNNING' ? 'rgba(6,182,212,0.15)' : 'rgba(245,158,11,0.15)'}` : '1px solid transparent',
                boxShadow: statusGlow(status),
                transition: 'all 0.3s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: status === 'PENDING' ? 'var(--text-dim)' : 'var(--text)',
                  }}>{def.label}</span>

                  <MonoTag>{def.key}()</MonoTag>

                  {retries > 0 && (
                    <span style={{
                      fontSize: 10, background: 'var(--amber-dim)', color: 'var(--amber)',
                      border: '1px solid rgba(245,158,11,0.2)', padding: '2px 7px', borderRadius: 4,
                      fontFamily: 'var(--mono)', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <AlertCircle size={10} /> retry ×{retries}
                    </span>
                  )}
                </div>

                {!compact && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {def.desc}
                    {status === 'WAITING_SIGNAL' && (
                      <span style={{ marginLeft: 8, color: 'var(--amber)', fontWeight: 600 }}>
                        — Awaiting {def.key.includes('Manager') ? 'Manager' : def.key.includes('IT') ? 'IT' : 'HR'} Approval
                      </span>
                    )}
                  </div>
                )}

                {recorded?.result && !compact && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 6,
                    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    {JSON.stringify(JSON.parse(recorded.result || '{}'), null, 0).slice(0, 120)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
